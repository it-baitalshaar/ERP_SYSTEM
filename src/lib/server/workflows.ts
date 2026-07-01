import { isAdminRole } from "@/lib/permissions";
import {
  mergeProcurementWorkflowSteps,
  PROCUREMENT_WORKFLOW,
} from "@/lib/workflows/procurement";
import type {
  CompanyWorkflowSettings,
  WorkflowApproverMode,
  WorkflowModule,
  WorkflowStepOverride,
} from "@/lib/workflows/types";
import { createAdminClientOrNull } from "@/utils/supabase/admin";

type Db = NonNullable<ReturnType<typeof createAdminClientOrNull>>;

const MODULE_DEFINITIONS = {
  procurement: PROCUREMENT_WORKFLOW,
} as const;

export function getWorkflowDefinition(module: WorkflowModule) {
  const def = MODULE_DEFINITIONS[module as keyof typeof MODULE_DEFINITIONS];
  if (!def) throw new Error(`Unknown workflow module: ${module}`);
  return def;
}

function parseOverrides(raw: unknown): WorkflowStepOverride[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((row): row is Record<string, unknown> => !!row && typeof row === "object")
    .map((row) => ({
      step_key: String(row.step_key ?? ""),
      enabled: row.enabled !== undefined ? Boolean(row.enabled) : undefined,
      requires_approval:
        row.requires_approval !== undefined ? Boolean(row.requires_approval) : undefined,
      approver_mode:
        row.approver_mode === "admin" ||
        row.approver_mode === "role" ||
        row.approver_mode === "user" ||
        row.approver_mode === "none"
          ? (row.approver_mode as WorkflowApproverMode)
          : undefined,
      approver_role_id: row.approver_role_id ? String(row.approver_role_id) : null,
      approver_user_id: row.approver_user_id ? String(row.approver_user_id) : null,
    }))
    .filter((o) => o.step_key);
}

export async function getCompanyWorkflowSettings(
  companyId: string,
  module: WorkflowModule
): Promise<CompanyWorkflowSettings> {
  const def = getWorkflowDefinition(module);
  const db = createAdminClientOrNull();

  if (!db) {
    return {
      company_id: companyId,
      module,
      steps:
        module === "procurement"
          ? mergeProcurementWorkflowSteps([])
          : def.steps.map((s) => ({ ...s })),
    };
  }

  const { data } = await db
    .from("company_workflow_settings")
    .select("steps, updated_at")
    .eq("company_id", companyId)
    .eq("module", module)
    .maybeSingle();

  const overrides = parseOverrides(data?.steps);
  const steps =
    module === "procurement"
      ? mergeProcurementWorkflowSteps(overrides)
      : def.steps.map((s) => ({ ...s }));

  return {
    company_id: companyId,
    module,
    steps,
    updated_at: data?.updated_at ? String(data.updated_at) : undefined,
  };
}

export async function saveCompanyWorkflowSettings(
  companyId: string,
  module: WorkflowModule,
  overrides: WorkflowStepOverride[]
): Promise<CompanyWorkflowSettings> {
  const db = createAdminClientOrNull();
  if (!db) throw new Error("Database not configured");

  const def = getWorkflowDefinition(module);
  const validKeys = new Set(def.steps.map((s) => s.step_key));
  const sanitized = overrides
    .filter((o) => validKeys.has(o.step_key))
    .map((o) => ({
      step_key: o.step_key,
      ...(o.enabled !== undefined ? { enabled: o.enabled } : {}),
      ...(o.requires_approval !== undefined
        ? { requires_approval: o.requires_approval }
        : {}),
      ...(o.approver_mode ? { approver_mode: o.approver_mode } : {}),
      approver_role_id: o.approver_role_id ?? null,
      approver_user_id: o.approver_user_id ?? null,
    }));

  const { error } = await db.from("company_workflow_settings").upsert(
    {
      company_id: companyId,
      module,
      steps: sanitized,
    },
    { onConflict: "company_id,module" }
  );

  if (error) throw new Error(error.message);

  return getCompanyWorkflowSettings(companyId, module);
}

export async function assertWorkflowApprover(
  db: Db,
  companyId: string,
  module: WorkflowModule,
  stepKey: string,
  userId: string,
  userRoleId: string
): Promise<void> {
  if (userRoleId === "role-super") return;

  const settings = await getCompanyWorkflowSettings(companyId, module);
  const step = settings.steps.find((s) => s.step_key === stepKey);
  if (!step || !step.enabled || !step.requires_approval) return;

  if (step.approver_mode === "none") return;

  if (isAdminRole(userRoleId) && step.approver_mode === "admin") return;

  if (step.approver_mode === "role" && step.approver_role_id === userRoleId) return;

  if (step.approver_mode === "user" && step.approver_user_id === userId) return;

  if (step.approver_mode === "admin" && isAdminRole(userRoleId)) return;

  throw new Error(`You are not authorized to approve: ${step.label}`);
}

export function resolveSubmitStatus(
  steps: CompanyWorkflowSettings["steps"],
  approveStepKey: string
): "pending_approval" | "approved" {
  const approveStep = steps.find((s) => s.step_key === approveStepKey);
  if (!approveStep?.enabled || !approveStep.requires_approval) {
    return "approved";
  }
  return "pending_approval";
}
