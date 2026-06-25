import type { Branch, Company, OrgWarehouse, SiteKind } from "@/lib/types";

export interface DocumentContextInput {
  currentCompanyId: string;
  currentBranchId: string;
  currentWarehouseId: string;
  currentSiteKind: SiteKind;
  currentOrganizationId: string;
  companies: Company[];
  branches: Branch[];
  warehouses: OrgWarehouse[];
}

export interface DocumentContext {
  /** Legal entity for documents (shop company owning the branch). */
  companyId: string;
  /** Branch used for numbering and site context. */
  branchId: string;
  /** Department filter when Shop/Dept is a department row (not stored on documents). */
  departmentId?: string;
}

function indexById<T extends { id: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]));
}

function branchesForCompany(branches: Branch[], companyId: string): Branch[] {
  return branches.filter((b) => b.company_id === companyId);
}

/** Prefer selected branch, then head office, then first branch for a company. */
function resolveCompanyBranch(
  branches: Branch[],
  companyId: string,
  preferredBranchId?: string
): Branch | undefined {
  const companyBranches = branchesForCompany(branches, companyId);
  if (companyBranches.length === 0) return undefined;

  if (preferredBranchId) {
    const preferred = companyBranches.find((b) => b.id === preferredBranchId);
    if (preferred) return preferred;
  }

  return companyBranches.find((b) => b.is_head_office) ?? companyBranches[0];
}

/** Branches available in the top bar for the current Shop/Dept selection. */
export function getOperationalBranches(input: DocumentContextInput): Branch[] {
  const companiesById = indexById(input.companies);
  const company = companiesById.get(input.currentCompanyId);
  if (!company) return [];

  if (company.unit_type === "shop") {
    return branchesForCompany(input.branches, company.id);
  }

  const shopIds = new Set(
    input.companies
      .filter(
        (c) =>
          c.organization_id === input.currentOrganizationId && c.unit_type === "shop"
      )
      .map((c) => c.id)
  );
  const shopBranches = input.branches.filter((b) => shopIds.has(b.company_id));
  if (shopBranches.length > 0) return shopBranches;

  return branchesForCompany(input.branches, input.currentCompanyId);
}

/** Resolve company + branch used when creating or listing transactional documents. */
export function resolveDocumentContext(input: DocumentContextInput): DocumentContext {
  const companiesById = indexById(input.companies);
  const branchesById = indexById(input.branches);
  const warehousesById = indexById(input.warehouses);

  const company = companiesById.get(input.currentCompanyId);
  const branch = branchesById.get(input.currentBranchId);
  const warehouse = warehousesById.get(input.currentWarehouseId);
  const departmentId = company?.unit_type === "department" ? company.id : undefined;

  if (input.currentSiteKind === "branch" && branch) {
    return {
      companyId: branch.company_id,
      branchId: branch.id,
      departmentId,
    };
  }

  if (input.currentSiteKind === "warehouse" && warehouse) {
    const whBranch = resolveCompanyBranch(input.branches, warehouse.company_id);
    return {
      companyId: warehouse.company_id,
      branchId: whBranch?.id ?? input.currentBranchId,
      departmentId,
    };
  }

  if (company?.unit_type === "shop") {
    const shopBranch = resolveCompanyBranch(
      input.branches,
      company.id,
      branch?.company_id === company.id ? branch.id : undefined
    );
    return {
      companyId: company.id,
      branchId: shopBranch?.id ?? input.currentBranchId,
      departmentId,
    };
  }

  return {
    companyId: input.currentCompanyId,
    branchId: input.currentBranchId,
    departmentId,
  };
}
