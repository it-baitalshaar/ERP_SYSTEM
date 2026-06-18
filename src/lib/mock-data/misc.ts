import type { Account, AuditLogEntry, Employee, ExpiryDocument } from "@/lib/types";

export const accounts: Account[] = [
  {
    id: "acc-1",
    company_id: "co-1",
    code: "1000",
    name: "Assets",
    type: "asset",
    children: [
      { id: "acc-11", company_id: "co-1", code: "1100", name: "Cash & Bank", type: "asset", parent_id: "acc-1" },
      { id: "acc-12", company_id: "co-1", code: "1200", name: "Accounts Receivable", type: "asset", parent_id: "acc-1" },
      { id: "acc-13", company_id: "co-1", code: "1300", name: "Inventory", type: "asset", parent_id: "acc-1" },
    ],
  },
  {
    id: "acc-2",
    company_id: "co-1",
    code: "2000",
    name: "Liabilities",
    type: "liability",
    children: [
      { id: "acc-21", company_id: "co-1", code: "2100", name: "Accounts Payable", type: "liability", parent_id: "acc-2" },
      { id: "acc-22", company_id: "co-1", code: "2200", name: "VAT Payable", type: "liability", parent_id: "acc-2" },
    ],
  },
  {
    id: "acc-3",
    company_id: "co-1",
    code: "4000",
    name: "Revenue",
    type: "revenue",
    children: [
      { id: "acc-31", company_id: "co-1", code: "4100", name: "Sales Revenue", type: "revenue", parent_id: "acc-3" },
    ],
  },
];

export const employees: Employee[] = [
  {
    id: "emp-1",
    company_id: "co-1",
    full_name: "Mohammed Ali",
    department: "Operations",
    emirates_id: "784-1985-1234567-1",
    visa_status: "Valid",
    visa_expiry: "2026-12-15",
    labor_card_expiry: "2026-12-15",
    insurance_expiry: "2026-09-01",
    salary: 8500,
  },
  {
    id: "emp-2",
    company_id: "co-1",
    full_name: "Priya Sharma",
    department: "Finance",
    emirates_id: "784-1990-7654321-2",
    visa_status: "Expiring Soon",
    visa_expiry: "2026-07-20",
    labor_card_expiry: "2026-07-20",
    insurance_expiry: "2026-11-30",
    salary: 12000,
  },
];

export const expiryDocuments: ExpiryDocument[] = [
  {
    id: "doc-1",
    company_id: "co-1",
    entity_type: "company",
    entity_name: "Bait Al Shaar Trading LLC",
    doc_type: "Trade License",
    expiry_date: "2026-08-30",
    days_remaining: 76,
  },
  {
    id: "doc-2",
    company_id: "co-1",
    entity_type: "employee",
    entity_name: "Priya Sharma",
    doc_type: "Visa",
    expiry_date: "2026-07-20",
    days_remaining: 35,
  },
  {
    id: "doc-3",
    company_id: "co-1",
    entity_type: "employee",
    entity_name: "Mohammed Ali",
    doc_type: "Emirates ID",
    expiry_date: "2026-06-25",
    days_remaining: 10,
  },
];

export const auditLogs: AuditLogEntry[] = [
  {
    id: "log-1",
    company_id: "co-1",
    user_id: "user-1",
    user_name: "Ahmed Al Mansoori",
    timestamp: "2026-06-14T10:30:00Z",
    module: "sales",
    action: "create",
    entity_id: "inv-2",
    after: '{"number":"INV-DXB-2026-00099","total":1155}',
  },
  {
    id: "log-2",
    company_id: "co-1",
    user_id: "user-2",
    user_name: "Fatima Hassan",
    timestamp: "2026-06-12T14:15:00Z",
    module: "sales",
    action: "update",
    entity_id: "so-2",
    before: '{"status":"draft"}',
    after: '{"status":"pending_approval"}',
  },
  {
    id: "log-3",
    company_id: "co-1",
    user_id: "user-1",
    user_name: "Ahmed Al Mansoori",
    timestamp: "2026-06-10T09:00:00Z",
    module: "admin",
    action: "update",
    entity_id: "feat_e_invoicing",
    before: '{"enabled":false}',
    after: '{"enabled":true}',
  },
];
