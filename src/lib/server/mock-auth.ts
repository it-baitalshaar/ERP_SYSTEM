import type { SessionContext, SessionPayload } from "@/lib/server/users";
import { mergeEffectivePermissions } from "@/lib/role-permissions";
import { users as mockUsers } from "@/lib/mock-data/users";
import {
  companies as mockCompanies,
  branches as mockBranches,
  warehouses as mockWarehouses,
} from "@/lib/mock-data/companies";
import { organizations as mockOrganizations } from "@/lib/mock-data/organizations";

/** Dev fallback when Supabase service role is not configured */
export function buildMockSessionForUserId(
  userId: string,
  context?: SessionContext
): SessionPayload | null {
  const user = mockUsers.find((u) => u.id === userId && u.is_active);
  if (!user) return null;

  const organizationId =
    context?.organizationId && user.organization_ids.includes(context.organizationId)
      ? context.organizationId
      : user.organization_ids[0];

  const orgCompanies = mockCompanies.filter(
    (c) => c.organization_id === organizationId && user.company_ids.includes(c.id)
  );

  const companyId =
    context?.companyId && user.company_ids.includes(context.companyId)
      ? context.companyId
      : orgCompanies[0]?.id ?? user.company_ids[0];

  const companyBranches = mockBranches.filter(
    (b) => b.company_id === companyId && user.branch_ids.includes(b.id)
  );
  const companyWarehouses = mockWarehouses.filter(
    (w) => w.company_id === companyId && user.warehouse_ids.includes(w.id)
  );

  const branchId =
    context?.branchId && user.branch_ids.includes(context.branchId)
      ? context.branchId
      : companyBranches[0]?.id ?? user.branch_ids[0];

  const warehouseId =
    context?.warehouseId && user.warehouse_ids.includes(context.warehouseId)
      ? context.warehouseId
      : companyWarehouses[0]?.id;

  const siteKind =
    context?.siteKind ?? (companyBranches.length ? "branch" : "warehouse");

  return {
    user,
    permissions: mergeEffectivePermissions(user.role_id, []),
    organizations: mockOrganizations.filter((o) => user.organization_ids.includes(o.id)),
    companies: mockCompanies.filter((c) => user.company_ids.includes(c.id)),
    branches: mockBranches.filter((b) => user.branch_ids.includes(b.id)),
    warehouses: mockWarehouses.filter((w) => user.warehouse_ids.includes(w.id)),
    organizationId,
    companyId,
    branchId,
    warehouseId,
    siteKind,
  };
}

export function mockAuthenticate(email: string, password: string): SessionPayload | null {
  if (!password) return null;
  const user = mockUsers.find((u) => u.email === email.toLowerCase().trim() && u.is_active);
  if (!user) return null;
  return buildMockSessionForUserId(user.id);
}
