import type { CompanyWorkflowSettings, WorkflowModule, WorkflowStepOverride } from "@/lib/workflows/types";
import { PROCUREMENT_WORKFLOW } from "@/lib/workflows/procurement";

export async function fetchWorkflowSettings(
  companyId: string,
  module: WorkflowModule
): Promise<CompanyWorkflowSettings | null> {
  const res = await fetch(
    `/api/admin/workflows?companyId=${companyId}&module=${module}`
  );
  if (!res.ok) return null;
  const json = (await res.json()) as {
    data?: CompanyWorkflowSettings;
    definition?: typeof PROCUREMENT_WORKFLOW;
  };
  return json.data ?? null;
}

export async function fetchWorkflowBundle(
  companyId: string,
  module: WorkflowModule
): Promise<{
  data: CompanyWorkflowSettings | null;
  definition: typeof PROCUREMENT_WORKFLOW | null;
}> {
  const res = await fetch(
    `/api/admin/workflows?companyId=${companyId}&module=${module}`
  );
  if (!res.ok) return { data: null, definition: null };
  const json = (await res.json()) as {
    data?: CompanyWorkflowSettings;
    definition?: typeof PROCUREMENT_WORKFLOW;
  };
  return { data: json.data ?? null, definition: json.definition ?? null };
}

export async function saveWorkflowSettings(
  companyId: string,
  module: WorkflowModule,
  overrides: WorkflowStepOverride[]
): Promise<{ data?: CompanyWorkflowSettings; error?: string }> {
  const res = await fetch("/api/admin/workflows", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ company_id: companyId, module, steps: overrides }),
  });
  const json = (await res.json()) as { data?: CompanyWorkflowSettings; error?: string };
  if (!res.ok) return { error: json.error ?? "Save failed" };
  return { data: json.data };
}
