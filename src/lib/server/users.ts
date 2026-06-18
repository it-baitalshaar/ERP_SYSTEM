import type { Branch, Company, Organization, OrgWarehouse, SiteKind, User } from "@/lib/types";
import { createAdminClientOrNull } from "@/utils/supabase/admin";
import {
  branches as mockBranches,
  companies as mockCompanies,
  warehouses as mockWarehouses,
  COMPANY_AL_SAQIYA,
  BRANCH_AL_SAQIYA_HQ,
  ORG_AL_SAQIYA,
} from "@/lib/mock-data/companies";
import { organizations as mockOrganizations } from "@/lib/mock-data/organizations";
import type { BusinessLine } from "@/lib/types";

function mapOrganization(row: {
  id: string;
  name: string;
  trade_license_no: string | null;
  address: string | null;
  currency: string;
  vat_trn: string | null;
}): Organization {
  return {
    id: row.id,
    name: row.name,
    trade_license_no: row.trade_license_no ?? "",
    address: row.address ?? "",
    currency: row.currency,
    vat_trn: row.vat_trn ?? "",
  };
}

function mapCompany(row: {
  id: string;
  organization_id: string | null;
  unit_type: string | null;
  name: string;
  trade_license_no: string | null;
  logo_url: string | null;
  address: string | null;
  currency: string;
  vat_trn: string | null;
  fiscal_year_start: string;
  business_lines: string[];
}): Company {
  return {
    id: row.id,
    organization_id: row.organization_id ?? "",
    unit_type: (row.unit_type === "shop" ? "shop" : "department") as Company["unit_type"],
    name: row.name,
    trade_license_no: row.trade_license_no ?? "",
    logo_url: row.logo_url ?? undefined,
    address: row.address ?? "",
    currency: row.currency,
    vat_trn: row.vat_trn ?? "",
    fiscal_year_start: row.fiscal_year_start,
    business_lines: row.business_lines as BusinessLine[],
  };
}

function mapBranch(row: {
  id: string;
  company_id: string;
  name: string;
  code: string;
  address: string | null;
  trade_license_no: string | null;
  is_head_office: boolean;
}): Branch {
  return {
    id: row.id,
    company_id: row.company_id,
    name: row.name,
    code: row.code,
    address: row.address ?? "",
    trade_license_no: row.trade_license_no ?? "",
    is_head_office: row.is_head_office,
  };
}

function mapWarehouse(row: {
  id: string;
  company_id: string;
  name: string;
  code: string;
  address: string | null;
  trade_license_no: string | null;
}): OrgWarehouse {
  return {
    id: row.id,
    company_id: row.company_id,
    name: row.name,
    code: row.code,
    address: row.address ?? "",
    trade_license_no: row.trade_license_no ?? "",
  };
}

export interface SessionPayload {
  user: User;
  organizations: Organization[];
  companies: Company[];
  branches: Branch[];
  warehouses: OrgWarehouse[];
  organizationId: string;
  companyId: string;
  branchId?: string;
  warehouseId?: string;
  siteKind: SiteKind;
}

import { buildMockSessionForUserId } from "@/lib/server/mock-auth";

export interface SessionContext {
  organizationId?: string;
  companyId?: string;
  branchId?: string;
  warehouseId?: string;
  siteKind?: SiteKind;
}

export async function buildSessionForUserId(
  userId: string,
  context?: SessionContext
): Promise<SessionPayload | null> {
  const db = createAdminClientOrNull();
  if (!db) return buildMockSessionForUserId(userId, context);

  const { data: profile } = await db.from("profiles").select("*").eq("id", userId).single();
  if (!profile || !profile.is_active) return buildMockSessionForUserId(userId, context);

  const { data: userOrgs } = await db
    .from("user_organizations")
    .select("organization_id")
    .eq("user_id", userId);

  const { data: userCompanies } = await db
    .from("user_companies")
    .select("company_id")
    .eq("user_id", userId);

  const { data: userBranches } = await db
    .from("user_branches")
    .select("branch_id")
    .eq("user_id", userId);

  const { data: userWarehouses } = await db
    .from("user_warehouses")
    .select("warehouse_id")
    .eq("user_id", userId);

  const organizationIds = userOrgs?.map((r) => r.organization_id) ?? [];
  const companyIds = userCompanies?.map((r) => r.company_id) ?? [];
  const branchIds = userBranches?.map((r) => r.branch_id) ?? [];
  const warehouseIds = userWarehouses?.map((r) => r.warehouse_id) ?? [];

  const { data: orgRows } = organizationIds.length
    ? await db.from("organizations").select("*").in("id", organizationIds)
    : { data: [] };

  const { data: companyRows } = companyIds.length
    ? await db.from("companies").select("*").in("id", companyIds)
    : { data: [] };

  const { data: branchRows } = branchIds.length
    ? await db.from("branches").select("*").in("id", branchIds)
    : { data: [] };

  const { data: warehouseRows } = warehouseIds.length
    ? await db.from("warehouses").select("*").in("id", warehouseIds)
    : { data: [] };

  const organizations = (orgRows ?? []).map(mapOrganization);
  const companies = (companyRows ?? []).map(mapCompany);
  const branches = (branchRows ?? []).map(mapBranch);
  const warehouses = (warehouseRows ?? []).map(mapWarehouse);

  const user: User = {
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    role_id: profile.role_id,
    organization_ids: organizationIds,
    company_ids: companyIds,
    branch_ids: branchIds,
    warehouse_ids: warehouseIds,
    is_active: profile.is_active,
    avatar_url: profile.avatar_url ?? undefined,
  };

  const organizationId =
    context?.organizationId && organizationIds.includes(context.organizationId)
      ? context.organizationId
      : organizationIds[0] ?? ORG_AL_SAQIYA;

  const orgCompanies = companies.filter(
    (c) => c.organization_id === organizationId || !c.organization_id
  );

  const companyId =
    context?.companyId && companyIds.includes(context.companyId)
      ? context.companyId
      : orgCompanies[0]?.id ?? companyIds[0] ?? COMPANY_AL_SAQIYA;

  const companyBranches = branches.filter((b) => b.company_id === companyId);
  const companyWarehouses = warehouses.filter((w) => w.company_id === companyId);

  const branchId =
    context?.branchId && branchIds.includes(context.branchId)
      ? context.branchId
      : companyBranches[0]?.id ??
        branchIds.find((id) => branches.find((b) => b.id === id && b.company_id === companyId)) ??
        branchIds[0] ??
        BRANCH_AL_SAQIYA_HQ;

  const warehouseId =
    context?.warehouseId && warehouseIds.includes(context.warehouseId)
      ? context.warehouseId
      : companyWarehouses[0]?.id;

  const siteKind: SiteKind =
    context?.siteKind ??
    (context?.warehouseId && warehouseIds.includes(context.warehouseId)
      ? "warehouse"
      : companyBranches.length
        ? "branch"
        : "warehouse");

  return {
    user,
    organizations: organizations.length
      ? organizations
      : mockOrganizations.filter((o) => organizationIds.includes(o.id)),
    companies: companies.length
      ? companies
      : mockCompanies.filter((c) => companyIds.includes(c.id)),
    branches: branches.length
      ? branches
      : mockBranches.filter((b) => branchIds.includes(b.id)),
    warehouses: warehouses.length
      ? warehouses
      : mockWarehouses.filter((w) => warehouseIds.includes(w.id)),
    organizationId,
    companyId,
    branchId: siteKind === "branch" ? branchId : branchId,
    warehouseId: siteKind === "warehouse" ? warehouseId : warehouseId,
    siteKind,
  };
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<SessionPayload | null> {
  const db = createAdminClientOrNull();
  if (!db) return null;

  const { data: profile } = await db
    .from("profiles")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .single();

  if (!profile?.password_hash || !profile.is_active) return null;

  const { verifyPassword } = await import("@/lib/auth/password");
  const valid = await verifyPassword(password, profile.password_hash);
  if (!valid) return null;

  return buildSessionForUserId(profile.id);
}

export function isAdminRole(roleId: string) {
  return roleId === "role-super" || roleId === "role-company-admin";
}
