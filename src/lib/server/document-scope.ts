export interface DocumentScope {
  companyId: string;
  branchId: string | null;
}

export type DocumentScopeQueryResult =
  | { ok: true; scope: DocumentScope }
  | { ok: false; error: string; status: 400 };

/** Parse companyId + optional branchId from API query params. */
export function parseDocumentScopeQuery(
  searchParams: URLSearchParams
): DocumentScopeQueryResult {
  const companyId = searchParams.get("companyId");
  if (!companyId) {
    return { ok: false, error: "companyId required", status: 400 };
  }
  return {
    ok: true,
    scope: { companyId, branchId: searchParams.get("branchId") },
  };
}

/** Supabase filter for company-scoped transactional documents. */
export function documentScopeFilter(
  companyId: string,
  branchId: string | null | undefined
): { company_id: string; branch_id?: string } {
  if (branchId) {
    return { company_id: companyId, branch_id: branchId };
  }
  return { company_id: companyId };
}
