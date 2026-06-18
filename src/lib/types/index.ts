export type BusinessLine = "trading" | "construction" | "logistics" | "real_estate";
export type PermissionAction = "view" | "create" | "edit" | "delete" | "approve";
export type UnitType = "shop" | "department";
export type SiteKind = "branch" | "warehouse";

export interface Organization {
  id: string;
  name: string;
  trade_license_no: string;
  address: string;
  currency: string;
  vat_trn: string;
}

export interface Company {
  id: string;
  organization_id: string;
  unit_type: UnitType;
  name: string;
  trade_license_no: string;
  logo_url?: string;
  address: string;
  currency: string;
  vat_trn: string;
  fiscal_year_start: string;
  business_lines: BusinessLine[];
}

export interface Branch {
  id: string;
  company_id: string;
  name: string;
  code: string;
  address: string;
  trade_license_no: string;
  is_head_office: boolean;
}

export interface OrgWarehouse {
  id: string;
  company_id: string;
  name: string;
  code: string;
  address: string;
  trade_license_no: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  is_system: boolean;
}

export interface Permission {
  role_id: string;
  module_key: string;
  actions: PermissionAction[];
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role_id: string;
  organization_ids: string[];
  company_ids: string[];
  branch_ids: string[];
  warehouse_ids: string[];
  is_active: boolean;
  avatar_url?: string;
}

export interface FeatureFlag {
  key: string;
  label: string;
  description: string;
  category: string;
  enabled: boolean;
  company_id: string;
}

export interface Customer {
  id: string;
  company_id: string;
  name: string;
  email: string;
  phone: string;
  classification: "vip" | "wholesale" | "retail";
  credit_limit: number;
  outstanding_balance: number;
  is_blocked: boolean;
}

export interface Supplier {
  id: string;
  company_id: string;
  name: string;
  email: string;
  phone: string;
  payment_terms: string;
  classification: string;
}

export interface UomConversion {
  uom: string;
  factor: number;
}

export interface Item {
  id: string;
  company_id: string;
  sku: string;
  name: string;
  category_id: string;
  base_uom: string;
  uom_conversions: UomConversion[];
  is_batch_managed: boolean;
  reorder_level: number;
  unit_price: number;
  image_url?: string;
}

export interface Warehouse {
  id: string;
  branch_id: string;
  name: string;
  code: string;
}

export interface StockLevel {
  item_id: string;
  warehouse_id: string;
  qty_on_hand: number;
  qty_reserved: number;
  reorder_level: number;
}

export type DocumentStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "posted"
  | "cancelled";

export interface LineItem {
  item_id: string;
  item_name: string;
  qty: number;
  uom: string;
  unit_price: number;
  discount_pct: number;
  vat_pct: number;
  warehouse_id?: string;
}

export interface Quotation {
  id: string;
  company_id: string;
  branch_id: string;
  customer_id: string;
  customer_name: string;
  number: string;
  date: string;
  valid_until: string;
  status: DocumentStatus;
  lines: LineItem[];
  total: number;
}

export interface SalesOrder {
  id: string;
  company_id: string;
  branch_id: string;
  customer_id: string;
  customer_name: string;
  number: string;
  date: string;
  status: DocumentStatus;
  lines: LineItem[];
  total: number;
  salesperson_id: string;
}

export interface TaxInvoice {
  id: string;
  company_id: string;
  branch_id: string;
  customer_id: string;
  customer_name: string;
  sales_order_id?: string;
  number: string;
  date: string;
  status: DocumentStatus;
  lines: LineItem[];
  subtotal: number;
  vat_amount: number;
  total: number;
  is_paid: boolean;
  e_invoice_status?: "pending" | "submitted" | "accepted";
}

export interface DeliveryNote {
  id: string;
  company_id: string;
  branch_id: string;
  invoice_id: string;
  number: string;
  date: string;
  status: DocumentStatus;
  lines: LineItem[];
}

export interface PurchaseRequisition {
  id: string;
  company_id: string;
  branch_id: string;
  number: string;
  date: string;
  requested_by: string;
  status: DocumentStatus;
  lines: LineItem[];
  total: number;
}

export interface PurchaseOrder {
  id: string;
  company_id: string;
  branch_id: string;
  supplier_id: string;
  supplier_name: string;
  number: string;
  date: string;
  currency: string;
  status: DocumentStatus;
  lines: LineItem[];
  total: number;
}

export interface GoodsReceipt {
  id: string;
  company_id: string;
  branch_id: string;
  po_id: string;
  number: string;
  date: string;
  status: DocumentStatus;
  lines: LineItem[];
}

export interface SupplierInvoice {
  id: string;
  company_id: string;
  branch_id: string;
  supplier_id: string;
  supplier_name: string;
  gr_id: string;
  number: string;
  date: string;
  status: DocumentStatus;
  total: number;
}

export interface Account {
  id: string;
  company_id: string;
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  parent_id?: string;
  children?: Account[];
}

export interface JournalLine {
  account_id: string;
  account_name: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface JournalEntry {
  id: string;
  company_id: string;
  branch_id: string;
  number: string;
  date: string;
  description: string;
  status: DocumentStatus;
  lines: JournalLine[];
}

export interface Project {
  id: string;
  company_id: string;
  name: string;
  status: "planning" | "active" | "on_hold" | "completed";
  budget: number;
  actual_cost: number;
  completion_pct: number;
}

export interface Property {
  id: string;
  company_id: string;
  name: string;
  location: string;
  size_sqm: number;
  status: "leased" | "owned" | "vacant";
  monthly_rent?: number;
}

export interface Vehicle {
  id: string;
  company_id: string;
  plate_no: string;
  make: string;
  model: string;
  mulkiya_expiry: string;
  insurance_expiry: string;
  status: "active" | "maintenance" | "retired";
}

export interface Driver {
  id: string;
  company_id: string;
  full_name: string;
  emirates_id: string;
  license_no: string;
  visa_expiry: string;
  performance_score: number;
}

export interface Trip {
  id: string;
  company_id: string;
  vehicle_id: string;
  driver_id: string;
  origin: string;
  destination: string;
  planned_date: string;
  status: "planned" | "in_transit" | "completed" | "cancelled";
  revenue: number;
  cost: number;
}

export interface Employee {
  id: string;
  company_id: string;
  full_name: string;
  department: string;
  emirates_id: string;
  visa_status: string;
  visa_expiry: string;
  labor_card_expiry: string;
  insurance_expiry: string;
  salary?: number;
}

export interface ExpiryDocument {
  id: string;
  company_id: string;
  entity_type: string;
  entity_name: string;
  doc_type: string;
  expiry_date: string;
  days_remaining: number;
}

export interface AuditLogEntry {
  id: string;
  company_id: string;
  user_id: string;
  user_name: string;
  timestamp: string;
  module: string;
  action: string;
  entity_id: string;
  before?: string;
  after?: string;
}

export interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: string;
  feature_flag?: string;
  business_line?: BusinessLine;
  module_key: string;
  coming_soon?: boolean;
}

export interface NavGroup {
  key: string;
  label: string;
  items: NavItem[];
}
