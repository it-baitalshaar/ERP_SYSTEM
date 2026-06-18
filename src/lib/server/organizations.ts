import { randomUUID } from "crypto";
import { hashPassword } from "@/lib/auth/password";
import { getEnabledFlagKeysForBusinessLines } from "@/lib/feature-flags";
import { roles } from "@/lib/mock-data/roles";
import type { BusinessLine, UnitType } from "@/lib/types";
import { createAdminClientOrNull } from "@/utils/supabase/admin";
import { buildSessionForUserId, type SessionPayload } from "@/lib/server/users";

export async function countProfiles(): Promise<number | null> {
  const db = createAdminClientOrNull();
  if (!db) return null;

  const { count, error } = await db
    .from("profiles")
    .select("*", { count: "exact", head: true });

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export interface SiteInput {
  name: string;
  code: string;
  trade_license_no: string;
  address?: string;
}

export interface OrgUnitInput {
  name: string;
  unit_type: UnitType;
  trade_license_no: string;
  business_lines?: BusinessLine[];
  branches?: SiteInput[];
  warehouses?: SiteInput[];
}

export interface OrganizationInput {
  name: string;
  trade_license_no: string;
  address?: string;
  currency?: string;
  vat_trn?: string;
}

export interface AdminAccountInput {
  email: string;
  password: string;
  full_name: string;
}

export interface CreateOrganizationPayload {
  organization: OrganizationInput;
  units: OrgUnitInput[];
  admin?: AdminAccountInput;
  link_user_id?: string;
  /** When true, only allowed if no profiles exist (first-time setup). */
  bootstrap?: boolean;
}

async function ensureSystemRoles(db: NonNullable<ReturnType<typeof createAdminClientOrNull>>) {
  const { error } = await db.from("roles").upsert(
    roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      is_system: r.is_system,
    })),
    { onConflict: "id" }
  );
  if (error) throw new Error(error.message);
}

function validatePayload(payload: CreateOrganizationPayload) {
  const orgName = payload.organization.name.trim();
  const orgLicense = payload.organization.trade_license_no.trim();

  if (!orgName || !orgLicense) {
    throw new Error("Organization name and trade license are required");
  }
  if (!payload.units.length) {
    throw new Error("Add at least one shop or department");
  }

  for (const unit of payload.units) {
    if (!unit.name.trim() || !unit.trade_license_no.trim()) {
      throw new Error("Each shop/department needs a name and trade license");
    }
    const branches = unit.branches ?? [];
    const warehouses = unit.warehouses ?? [];
    if (!branches.length && !warehouses.length) {
      throw new Error(`"${unit.name}" needs at least one branch or warehouse`);
    }
    for (const site of [...branches, ...warehouses]) {
      if (!site.name.trim() || !site.code.trim() || !site.trade_license_no.trim()) {
        throw new Error("Each branch/warehouse needs a name, code, and trade license");
      }
    }
  }

  if (!payload.link_user_id) {
    const admin = payload.admin;
    if (!admin?.email?.trim() || !admin.full_name?.trim()) {
      throw new Error("Administrator name and email are required");
    }
    if (!admin.password || admin.password.length < 6) {
      throw new Error("Administrator password must be at least 6 characters");
    }
  }
}

export async function createOrganization(
  payload: CreateOrganizationPayload
): Promise<{ session: SessionPayload; organization_id: string }> {
  const db = createAdminClientOrNull();
  if (!db) {
    throw new Error("Database not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env.local");
  }

  validatePayload(payload);

  if (payload.bootstrap) {
    const { count } = await db.from("profiles").select("*", { count: "exact", head: true });
    if ((count ?? 0) > 0) {
      throw new Error("Initial setup already completed. Sign in to register another organization.");
    }
  }

  await ensureSystemRoles(db);

  const organizationId = randomUUID();
  const currency = payload.organization.currency?.trim() || "AED";

  const { error: orgError } = await db.from("organizations").insert({
    id: organizationId,
    name: payload.organization.name.trim(),
    trade_license_no: payload.organization.trade_license_no.trim(),
    address: payload.organization.address?.trim() ?? "",
    currency,
    vat_trn: payload.organization.vat_trn?.trim() ?? "",
  });
  if (orgError) throw new Error(orgError.message);

  let userId = payload.link_user_id;
  const branchIds: string[] = [];
  const warehouseIds: string[] = [];
  const companyIds: string[] = [];

  if (!userId) {
    const admin = payload.admin!;
    const email = admin.email.toLowerCase().trim();
    userId = randomUUID();
    const password_hash = await hashPassword(admin.password);

    const { error: profileError } = await db.from("profiles").insert({
      id: userId,
      email,
      full_name: admin.full_name.trim(),
      role_id: "role-super",
      password_hash,
      is_active: true,
    });
    if (profileError) throw new Error(profileError.message);
  }

  const { error: uoError } = await db
    .from("user_organizations")
    .insert({ user_id: userId, organization_id: organizationId });
  if (uoError) throw new Error(uoError.message);

  for (const unit of payload.units) {
    const companyId = randomUUID();
    companyIds.push(companyId);

    const businessLines: BusinessLine[] =
      unit.business_lines?.length ? unit.business_lines : ["trading"];

    const { error: companyError } = await db.from("companies").insert({
      id: companyId,
      organization_id: organizationId,
      unit_type: unit.unit_type,
      name: unit.name.trim(),
      trade_license_no: unit.trade_license_no.trim(),
      currency,
      fiscal_year_start: "01-01",
      business_lines: businessLines,
      address: "",
    });
    if (companyError) throw new Error(companyError.message);

    const { error: ucError } = await db
      .from("user_companies")
      .insert({ user_id: userId, company_id: companyId });
    if (ucError) throw new Error(ucError.message);

    const flagKeys = getEnabledFlagKeysForBusinessLines(businessLines);
    const { error: flagsError } = await db.from("feature_flags").insert(
      Array.from(flagKeys).map((flag_key) => ({
        company_id: companyId,
        flag_key,
        enabled: true,
      }))
    );
    if (flagsError) throw new Error(flagsError.message);

    let branchIndex = 0;
    for (const branch of unit.branches ?? []) {
      const branchId = randomUUID();
      branchIds.push(branchId);
      const { error: branchError } = await db.from("branches").insert({
        id: branchId,
        company_id: companyId,
        name: branch.name.trim(),
        code: branch.code.trim().toUpperCase(),
        trade_license_no: branch.trade_license_no.trim(),
        address: branch.address?.trim() ?? "",
        is_head_office: branchIndex === 0,
      });
      if (branchError) throw new Error(branchError.message);
      branchIndex += 1;

      const { error: ubError } = await db
        .from("user_branches")
        .insert({ user_id: userId, branch_id: branchId });
      if (ubError) throw new Error(ubError.message);
    }

    for (const warehouse of unit.warehouses ?? []) {
      const warehouseId = randomUUID();
      warehouseIds.push(warehouseId);
      const { error: whError } = await db.from("warehouses").insert({
        id: warehouseId,
        company_id: companyId,
        name: warehouse.name.trim(),
        code: warehouse.code.trim().toUpperCase(),
        trade_license_no: warehouse.trade_license_no.trim(),
        address: warehouse.address?.trim() ?? "",
      });
      if (whError) throw new Error(whError.message);

      const { error: uwError } = await db
        .from("user_warehouses")
        .insert({ user_id: userId, warehouse_id: warehouseId });
      if (uwError) throw new Error(uwError.message);
    }
  }

  const session = await buildSessionForUserId(userId, {
    organizationId,
    companyId: companyIds[0],
    branchId: branchIds[0],
    warehouseId: warehouseIds[0],
    siteKind: branchIds.length ? "branch" : "warehouse",
  });

  if (!session) {
    throw new Error("Organization created but session could not be started");
  }

  return { session, organization_id: organizationId };
}
