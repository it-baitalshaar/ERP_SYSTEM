export type WorkflowModule = "procurement" | "sales" | "inventory";

export type WorkflowStepKind = "document" | "approval" | "gate" | "validation";

export type WorkflowApproverMode = "none" | "admin" | "role" | "user";

export interface WorkflowStepDefinition {
  step_key: string;
  label: string;
  description: string;
  kind: WorkflowStepKind;
  document_type?: string;
  sort_order: number;
  /** Default: step is part of the chain */
  enabled: boolean;
  /** For approval/gate steps */
  requires_approval: boolean;
  approver_mode: WorkflowApproverMode;
  approver_role_id?: string | null;
  approver_user_id?: string | null;
}

export interface WorkflowEdge {
  from: string;
  to: string;
}

export interface WorkflowDefinition {
  module: WorkflowModule;
  title: string;
  description: string;
  steps: WorkflowStepDefinition[];
  edges: WorkflowEdge[];
}

export type WorkflowStepOverride = Partial<
  Pick<
    WorkflowStepDefinition,
    | "enabled"
    | "requires_approval"
    | "approver_mode"
    | "approver_role_id"
    | "approver_user_id"
  >
> & { step_key: string };

export interface CompanyWorkflowSettings {
  company_id: string;
  module: WorkflowModule;
  steps: WorkflowStepDefinition[];
  updated_at?: string;
}
