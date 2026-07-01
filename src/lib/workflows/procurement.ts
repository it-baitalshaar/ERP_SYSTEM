import type { WorkflowDefinition, WorkflowStepDefinition, WorkflowStepOverride } from "./types";

export const PROCUREMENT_WORKFLOW_FLAG = "feat_procurement_workflow";

const defaultSteps: WorkflowStepDefinition[] = [
  {
    step_key: "mr_create",
    label: "Material request",
    description: "User raises MR for materials needed",
    kind: "document",
    document_type: "material_request",
    sort_order: 1,
    enabled: true,
    requires_approval: false,
    approver_mode: "none",
  },
  {
    step_key: "mr_submit",
    label: "Submit MR",
    description: "Requester submits MR for review",
    kind: "gate",
    sort_order: 2,
    enabled: true,
    requires_approval: false,
    approver_mode: "none",
  },
  {
    step_key: "mr_approve",
    label: "MR approval",
    description: "Manager or admin approves material request",
    kind: "approval",
    document_type: "material_request",
    sort_order: 3,
    enabled: true,
    requires_approval: true,
    approver_mode: "admin",
  },
  {
    step_key: "lpo_create",
    label: "Create LPO",
    description: "Convert approved MR to local purchase order",
    kind: "document",
    document_type: "purchase_order",
    sort_order: 4,
    enabled: true,
    requires_approval: false,
    approver_mode: "none",
  },
  {
    step_key: "lpo_approve",
    label: "LPO approval",
    description: "Authorize purchase order before sending to supplier",
    kind: "approval",
    document_type: "purchase_order",
    sort_order: 5,
    enabled: true,
    requires_approval: true,
    approver_mode: "admin",
  },
  {
    step_key: "lpo_send_supplier",
    label: "Send to supplier",
    description: "LPO issued / sent to vendor",
    kind: "gate",
    document_type: "purchase_order",
    sort_order: 6,
    enabled: true,
    requires_approval: false,
    approver_mode: "none",
  },
  {
    step_key: "supplier_ack",
    label: "Supplier acknowledgement",
    description: "Supplier confirms order (optional gate)",
    kind: "approval",
    sort_order: 7,
    enabled: false,
    requires_approval: true,
    approver_mode: "none",
  },
  {
    step_key: "proforma",
    label: "Proforma invoice",
    description: "Supplier proforma linked to LPO",
    kind: "document",
    document_type: "proforma_invoice",
    sort_order: 8,
    enabled: true,
    requires_approval: false,
    approver_mode: "none",
  },
  {
    step_key: "delivery_note",
    label: "Supplier delivery",
    description: "Inbound delivery note from supplier",
    kind: "document",
    document_type: "supplier_delivery_note",
    sort_order: 9,
    enabled: true,
    requires_approval: false,
    approver_mode: "none",
  },
  {
    step_key: "mrn",
    label: "MRN (goods receipt)",
    description: "Warehouse receipt and stock update",
    kind: "document",
    document_type: "material_receipt_note",
    sort_order: 10,
    enabled: true,
    requires_approval: false,
    approver_mode: "none",
  },
  {
    step_key: "mrn_variance",
    label: "MRN price variance",
    description: "Admin approves when received price differs from LPO",
    kind: "approval",
    document_type: "material_receipt_note",
    sort_order: 11,
    enabled: true,
    requires_approval: true,
    approver_mode: "admin",
  },
  {
    step_key: "supplier_invoice",
    label: "Supplier tax invoice",
    description: "Payable supplier invoice",
    kind: "document",
    document_type: "supplier_invoice",
    sort_order: 12,
    enabled: true,
    requires_approval: false,
    approver_mode: "none",
  },
  {
    step_key: "three_way_match",
    label: "3-way match",
    description: "LPO vs MRN vs supplier invoice validation",
    kind: "validation",
    sort_order: 13,
    enabled: true,
    requires_approval: false,
    approver_mode: "none",
  },
  {
    step_key: "payment",
    label: "Purchase payment",
    description: "Advance, partial, or final payment to supplier",
    kind: "document",
    document_type: "purchase_payment",
    sort_order: 14,
    enabled: true,
    requires_approval: false,
    approver_mode: "none",
  },
];

const edges = [
  { from: "mr_create", to: "mr_submit" },
  { from: "mr_submit", to: "mr_approve" },
  { from: "mr_approve", to: "lpo_create" },
  { from: "lpo_create", to: "lpo_approve" },
  { from: "lpo_approve", to: "lpo_send_supplier" },
  { from: "lpo_send_supplier", to: "supplier_ack" },
  { from: "supplier_ack", to: "proforma" },
  { from: "proforma", to: "delivery_note" },
  { from: "delivery_note", to: "mrn" },
  { from: "mrn", to: "mrn_variance" },
  { from: "mrn_variance", to: "supplier_invoice" },
  { from: "supplier_invoice", to: "three_way_match" },
  { from: "three_way_match", to: "payment" },
];

export const PROCUREMENT_WORKFLOW: WorkflowDefinition = {
  module: "procurement",
  title: "Procurement purchase cycle",
  description:
    "Material request through payment — configure which approval gates are active and who can approve.",
  steps: defaultSteps,
  edges,
};

export function mergeProcurementWorkflowSteps(
  overrides: WorkflowStepOverride[] | null | undefined
): WorkflowStepDefinition[] {
  if (!overrides?.length) return defaultSteps.map((s) => ({ ...s }));

  const overrideMap = new Map(overrides.map((o) => [o.step_key, o]));
  return defaultSteps.map((step) => {
    const patch = overrideMap.get(step.step_key);
    if (!patch) return { ...step };
    return {
      ...step,
      ...patch,
      step_key: step.step_key,
      label: step.label,
      description: step.description,
      kind: step.kind,
      sort_order: step.sort_order,
      document_type: step.document_type,
    };
  });
}

export function getProcurementStep(
  steps: WorkflowStepDefinition[],
  stepKey: string
): WorkflowStepDefinition | undefined {
  return steps.find((s) => s.step_key === stepKey);
}

export function isProcurementStepActive(
  steps: WorkflowStepDefinition[],
  stepKey: string
): boolean {
  const step = getProcurementStep(steps, stepKey);
  return step?.enabled ?? true;
}
