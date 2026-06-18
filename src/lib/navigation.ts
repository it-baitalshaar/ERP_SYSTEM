import type { NavGroup } from "@/lib/types";

export const navigation: NavGroup[] = [
  {
    key: "sales",
    label: "Sales & CRM",
    items: [
      { key: "sales-dashboard", label: "Dashboard", href: "/sales", icon: "LayoutDashboard", feature_flag: "mod_sales", module_key: "sales" },
      { key: "quotations", label: "Quotations", href: "/sales/quotations", icon: "FileText", feature_flag: "mod_sales", module_key: "sales" },
      { key: "sales-orders", label: "Sales Orders", href: "/sales/orders", icon: "ShoppingCart", feature_flag: "mod_sales", module_key: "sales" },
      { key: "tax-invoices", label: "Tax Invoices", href: "/sales/invoices", icon: "Receipt", feature_flag: "mod_sales", module_key: "sales" },
      { key: "delivery-notes", label: "Delivery Notes", href: "/sales/delivery-notes", icon: "Truck", feature_flag: "mod_sales", module_key: "sales" },
      { key: "customers", label: "Customers", href: "/sales/customers", icon: "Users", feature_flag: "mod_sales", module_key: "sales" },
      { key: "leads", label: "Leads & Pipeline", href: "/sales/leads", icon: "Kanban", feature_flag: "mod_sales", module_key: "sales" },
      { key: "customer-portal", label: "Customer Portal", href: "/sales/customer-portal", icon: "Globe", feature_flag: "feat_customer_portal", module_key: "sales", coming_soon: true },
      { key: "marketing", label: "Marketing Campaigns", href: "/sales/marketing", icon: "Megaphone", feature_flag: "mod_sales", module_key: "sales", coming_soon: true },
      { key: "seasonal-discounts", label: "Seasonal Discounts", href: "/sales/seasonal-discounts", icon: "Percent", feature_flag: "mod_sales", module_key: "sales" },
    ],
  },
  {
    key: "procurement",
    label: "Procurement",
    items: [
      { key: "suppliers", label: "Suppliers", href: "/procurement/suppliers", icon: "Building2", feature_flag: "mod_procurement", module_key: "procurement" },
      { key: "mr", label: "Material Requests", href: "/procurement/requisitions", icon: "ClipboardList", feature_flag: "mod_procurement", module_key: "procurement" },
      { key: "po", label: "Purchase Orders (LPO)", href: "/procurement/orders", icon: "Package", feature_flag: "mod_procurement", module_key: "procurement" },
      { key: "proforma", label: "Proforma Invoices", href: "/procurement/proforma", icon: "FileText", feature_flag: "mod_procurement", module_key: "procurement" },
      { key: "sdn", label: "Delivery Notes", href: "/procurement/delivery-notes", icon: "Truck", feature_flag: "mod_procurement", module_key: "procurement" },
      { key: "mrn", label: "MRN (Goods Receipt)", href: "/procurement/goods-receipt", icon: "PackageCheck", feature_flag: "mod_procurement", module_key: "procurement" },
      { key: "supplier-invoices", label: "Supplier Invoices", href: "/procurement/supplier-invoices", icon: "FileInput", feature_flag: "mod_procurement", module_key: "procurement" },
      { key: "payments", label: "Purchase Payments", href: "/procurement/payments", icon: "Banknote", feature_flag: "mod_procurement", module_key: "procurement" },
      { key: "rfq", label: "Vendor Comparison / RFQ", href: "/procurement/rfq", icon: "GitCompare", feature_flag: "mod_procurement", module_key: "procurement", coming_soon: true },
    ],
  },
  {
    key: "inventory",
    label: "Inventory",
    items: [
      { key: "inv-dashboard", label: "Dashboard", href: "/inventory", icon: "LayoutDashboard", feature_flag: "mod_inventory", module_key: "inventory" },
      { key: "items", label: "Items / Products", href: "/inventory/items", icon: "Box", feature_flag: "mod_inventory", module_key: "inventory" },
      { key: "stock-levels", label: "Stock Levels", href: "/inventory/stock-levels", icon: "Layers", feature_flag: "mod_inventory", module_key: "inventory" },
      { key: "transfers", label: "Warehouse Transfers", href: "/inventory/transfers", icon: "ArrowLeftRight", feature_flag: "mod_inventory", module_key: "inventory" },
      { key: "adjustments", label: "Stock Adjustments", href: "/inventory/adjustments", icon: "SlidersHorizontal", feature_flag: "mod_inventory", module_key: "inventory" },
      { key: "batch", label: "Batch/Lot Tracking", href: "/inventory/batch", icon: "Tags", feature_flag: "feat_batch_tracking", module_key: "inventory" },
      { key: "transformation", label: "Product Transformation", href: "/inventory/transformation", icon: "Shuffle", feature_flag: "mod_inventory", module_key: "inventory", coming_soon: true },
      { key: "barcode", label: "Barcode / QR", href: "/inventory/barcode", icon: "QrCode", feature_flag: "mod_inventory", module_key: "inventory" },
      { key: "daily-report", label: "Daily Stock Report", href: "/inventory/daily-report", icon: "FileBarChart", feature_flag: "mod_inventory", module_key: "inventory" },
    ],
  },
  {
    key: "finance",
    label: "Accounts & Finance",
    items: [
      { key: "coa", label: "Chart of Accounts", href: "/finance/chart-of-accounts", icon: "Network", feature_flag: "mod_finance", module_key: "finance" },
      { key: "gl", label: "General Ledger", href: "/finance/general-ledger", icon: "BookOpen", feature_flag: "mod_finance", module_key: "finance" },
      { key: "sub-ledgers", label: "Sub-Ledgers", href: "/finance/sub-ledgers", icon: "BookMarked", feature_flag: "mod_finance", module_key: "finance" },
      { key: "journals", label: "Journal Entries", href: "/finance/journal-entries", icon: "PenLine", feature_flag: "mod_finance", module_key: "finance" },
      { key: "ar-ap", label: "Receivables & Payables", href: "/finance/ar-ap", icon: "Wallet", feature_flag: "mod_finance", module_key: "finance" },
      { key: "cost-centers", label: "Cost Centers", href: "/finance/cost-centers", icon: "PieChart", feature_flag: "mod_finance", module_key: "finance" },
      { key: "budgeting", label: "Budgeting", href: "/finance/budgeting", icon: "Target", feature_flag: "mod_finance", module_key: "finance", coming_soon: true },
      { key: "payroll-link", label: "Payroll Link", href: "/finance/payroll-link", icon: "Banknote", feature_flag: "mod_finance", module_key: "finance", coming_soon: true },
      { key: "bank-cash", label: "Bank / Cash", href: "/finance/bank-cash", icon: "Landmark", feature_flag: "mod_finance", module_key: "finance" },
    ],
  },
  {
    key: "compliance",
    label: "UAE Compliance",
    items: [
      { key: "vat", label: "VAT Dashboard", href: "/compliance/vat", icon: "Calculator", feature_flag: "mod_compliance", module_key: "compliance" },
      { key: "e-invoicing", label: "E-Invoicing (FTA)", href: "/compliance/e-invoicing", icon: "FileCheck", feature_flag: "feat_e_invoicing", module_key: "compliance", coming_soon: true },
      { key: "doc-expiry", label: "Document Expiry Center", href: "/compliance/document-expiry", icon: "CalendarClock", feature_flag: "mod_compliance", module_key: "compliance" },
    ],
  },
  {
    key: "hr",
    label: "HR & PRO",
    items: [
      { key: "employees", label: "Employees", href: "/hr/employees", icon: "UserCircle", feature_flag: "mod_hr", module_key: "hr" },
      { key: "visa-tracker", label: "Visa & Document Tracker", href: "/hr/visa-tracker", icon: "FileBadge", feature_flag: "mod_hr", module_key: "hr" },
      { key: "trade-license", label: "Trade License Mgmt", href: "/hr/trade-license", icon: "ScrollText", feature_flag: "mod_hr", module_key: "hr" },
      { key: "gov-fees", label: "Government Fees Log", href: "/hr/government-fees", icon: "Coins", feature_flag: "mod_hr", module_key: "hr" },
      { key: "pro-dashboard", label: "PRO Dashboard", href: "/hr/pro-dashboard", icon: "LayoutDashboard", feature_flag: "mod_hr", module_key: "hr" },
    ],
  },
  {
    key: "logistics",
    label: "Logistics & Fleet",
    items: [
      { key: "fleet", label: "Fleet Registry", href: "/logistics/fleet", icon: "Car", feature_flag: "mod_logistics", module_key: "logistics", business_line: "logistics" },
      { key: "drivers", label: "Drivers", href: "/logistics/drivers", icon: "User", feature_flag: "mod_logistics", module_key: "logistics", business_line: "logistics" },
      { key: "trips", label: "Trips", href: "/logistics/trips", icon: "Route", feature_flag: "mod_logistics", module_key: "logistics", business_line: "logistics" },
      { key: "loading-bay", label: "Loading Bay Scheduler", href: "/logistics/loading-bay", icon: "Calendar", feature_flag: "mod_logistics", module_key: "logistics", business_line: "logistics", coming_soon: true },
      { key: "trip-costing", label: "Trip Costing", href: "/logistics/trip-costing", icon: "TrendingUp", feature_flag: "mod_logistics", module_key: "logistics", business_line: "logistics" },
      { key: "route-opt", label: "Route Optimization", href: "/logistics/route-optimization", icon: "Map", feature_flag: "mod_logistics", module_key: "logistics", business_line: "logistics", coming_soon: true },
      { key: "pod", label: "Proof of Delivery", href: "/logistics/proof-of-delivery", icon: "Camera", feature_flag: "mod_logistics", module_key: "logistics", business_line: "logistics", coming_soon: true },
      { key: "log-reports", label: "Logistics Reports", href: "/logistics/reports", icon: "BarChart3", feature_flag: "mod_logistics", module_key: "logistics", business_line: "logistics" },
    ],
  },
  {
    key: "real_estate",
    label: "Real Estate",
    items: [
      { key: "properties", label: "Property Registry", href: "/real-estate/properties", icon: "Building", feature_flag: "mod_real_estate", module_key: "real_estate", business_line: "real_estate" },
      { key: "leases", label: "Lease Management", href: "/real-estate/leases", icon: "Key", feature_flag: "mod_real_estate", module_key: "real_estate", business_line: "real_estate" },
      { key: "utilities", label: "Utility Tracking", href: "/real-estate/utilities", icon: "Zap", feature_flag: "mod_real_estate", module_key: "real_estate", business_line: "real_estate" },
      { key: "maintenance", label: "Maintenance", href: "/real-estate/maintenance", icon: "Wrench", feature_flag: "mod_real_estate", module_key: "real_estate", business_line: "real_estate" },
      { key: "tenant-portal", label: "Tenant Portal", href: "/real-estate/tenant-portal", icon: "Globe", feature_flag: "mod_real_estate", module_key: "real_estate", business_line: "real_estate", coming_soon: true },
      { key: "rental-income", label: "Rental Income", href: "/real-estate/rental-income", icon: "CircleDollarSign", feature_flag: "mod_real_estate", module_key: "real_estate", business_line: "real_estate", coming_soon: true },
    ],
  },
  {
    key: "construction",
    label: "Construction",
    items: [
      { key: "projects", label: "Projects", href: "/construction/projects", icon: "HardHat", feature_flag: "mod_construction", module_key: "construction", business_line: "construction" },
      { key: "boq", label: "BOQ", href: "/construction/boq", icon: "ListOrdered", feature_flag: "mod_construction", module_key: "construction", business_line: "construction", coming_soon: true },
      { key: "progress-billing", label: "Progress Billing", href: "/construction/progress-billing", icon: "CircleDot", feature_flag: "mod_construction", module_key: "construction", business_line: "construction", coming_soon: true },
      { key: "subcontractors", label: "Subcontractors", href: "/construction/subcontractors", icon: "Users", feature_flag: "mod_construction", module_key: "construction", business_line: "construction" },
    ],
  },
  {
    key: "ecommerce",
    label: "E-Commerce & API",
    items: [
      { key: "integration-dash", label: "Integration Dashboard", href: "/ecommerce", icon: "Plug", feature_flag: "mod_ecommerce", module_key: "ecommerce", coming_soon: true },
      { key: "order-pull", label: "Order Pull Queue", href: "/ecommerce/order-pull", icon: "Download", feature_flag: "mod_ecommerce", module_key: "ecommerce" },
      { key: "payment-log", label: "Payment Gateway Log", href: "/ecommerce/payment-log", icon: "CreditCard", feature_flag: "mod_ecommerce", module_key: "ecommerce", coming_soon: true },
      { key: "shipping-log", label: "Shipping / Carrier Log", href: "/ecommerce/shipping-log", icon: "Ship", feature_flag: "mod_ecommerce", module_key: "ecommerce", coming_soon: true },
      { key: "returns", label: "Returns / Refunds", href: "/ecommerce/returns", icon: "RotateCcw", feature_flag: "mod_ecommerce", module_key: "ecommerce" },
    ],
  },
  {
    key: "bi",
    label: "Business Intelligence",
    items: [
      { key: "executive", label: "Executive Dashboard", href: "/dashboard", icon: "LayoutDashboard", feature_flag: "mod_bi", module_key: "bi" },
      { key: "report-builder", label: "Custom Report Builder", href: "/bi/report-builder", icon: "FileSpreadsheet", feature_flag: "mod_bi", module_key: "bi", coming_soon: true },
    ],
  },
  {
    key: "documents",
    label: "Compliance & Documents",
    items: [
      { key: "doc-mgmt", label: "Document Management", href: "/documents", icon: "FolderOpen", feature_flag: "mod_documents", module_key: "documents", coming_soon: true },
      { key: "audit-trail", label: "System Audit Trail", href: "/documents/audit-trail", icon: "History", feature_flag: "mod_documents", module_key: "documents" },
    ],
  },
  {
    key: "admin",
    label: "Administration",
    items: [
      { key: "admin-companies", label: "Organization Structure", href: "/admin/org-structure", icon: "Building2", module_key: "admin" },
      { key: "admin-users", label: "User Management", href: "/admin/users", icon: "Users", module_key: "admin" },
      { key: "admin-roles", label: "Roles & Permissions", href: "/admin/roles", icon: "Shield", module_key: "admin" },
      { key: "admin-features", label: "Feature Management", href: "/admin/features", icon: "ToggleLeft", module_key: "admin" },
      { key: "admin-ui", label: "UI Customization", href: "/admin/ui-customization", icon: "Palette", module_key: "admin" },
      { key: "admin-sequences", label: "Numbering & Sequences", href: "/admin/sequences", icon: "Hash", module_key: "admin" },
      { key: "admin-tax", label: "Tax & Compliance", href: "/admin/tax-compliance", icon: "Scale", module_key: "admin" },
      { key: "admin-audit", label: "Audit Log Viewer", href: "/admin/audit-log", icon: "ScrollText", module_key: "admin" },
      { key: "admin-backup", label: "Backup & System Health", href: "/admin/backup", icon: "HeartPulse", module_key: "admin" },
      { key: "admin-integrations", label: "Integrations Hub", href: "/admin/integrations", icon: "Blocks", module_key: "admin" },
    ],
  },
];

export function getBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  const crumbs: { label: string; href?: string }[] = [{ label: "Home", href: "/dashboard" }];
  for (const group of navigation) {
    for (const item of group.items) {
      if (item.href === pathname) {
        crumbs.push({ label: group.label });
        crumbs.push({ label: item.label });
        return crumbs;
      }
    }
  }
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0) {
    crumbs.push({ label: segments.map((s) => s.replace(/-/g, " ")).join(" / ") });
  }
  return crumbs;
}

export function findNavItem(pathname: string) {
  for (const group of navigation) {
    for (const item of group.items) {
      if (item.href === pathname) return { group, item };
    }
  }
  return null;
}
