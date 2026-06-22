export interface DeleteBlocker {
  kind: string;
  id: string;
  number: string;
  status?: string;
  href: string;
  hint: string;
  priority: number;
}

export interface DeleteCheckResult {
  allowed: boolean;
  blockers: DeleteBlocker[];
  warnings: string[];
  document_number: string;
  document_status: string;
  delete_order_hint?: string;
}

export type DocumentModule = "procurement" | "sales";
