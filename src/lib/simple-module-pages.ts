import type { ModulePageConfig } from "@/components/modules/module-page";

const sample = (rows: Record<string, unknown>[]) => rows;

export const simpleModulePages: Record<string, ModulePageConfig> = {
  "/sales/customer-portal": {
    title: "Customer Portal",
    description: "External customer self-service portal",
    comingSoon: true,
  },
  "/sales/marketing": {
    title: "Marketing Campaigns",
    description: "Campaign list and results reporting",
    comingSoon: true,
    columns: [
      { accessorKey: "name", header: "Campaign" },
      { accessorKey: "channel", header: "Channel" },
      { accessorKey: "status", header: "Status" },
    ],
    data: sample([
      { name: "Ramadan Sale 2026", channel: "Email", status: "Completed" },
      { name: "Summer Tiles Promo", channel: "SMS", status: "Active" },
    ]),
    searchKey: "name",
  },
  "/sales/seasonal-discounts": {
    title: "Seasonal Discounts",
    description: "Date-range discount rules by product or category",
    columns: [
      { accessorKey: "name", header: "Rule" },
      { accessorKey: "discount", header: "Discount" },
      { accessorKey: "period", header: "Period" },
    ],
    data: sample([
      { name: "Eid Tiles 10%", discount: "10%", period: "Jun 1 – Jun 15" },
      { name: "Cement Bulk 5%", discount: "5%", period: "Jul 1 – Jul 31" },
    ]),
  },
  "/procurement/requisitions": {
    title: "Purchase Requisitions",
    description: "Request → Approval → PO workflow",
    columns: [
      { accessorKey: "number", header: "PR Number" },
      { accessorKey: "requested_by", header: "Requested By" },
      { accessorKey: "status", header: "Status" },
      { accessorKey: "total", header: "Total" },
    ],
    data: sample([
      { number: "PR-DXB-2026-00034", requested_by: "Warehouse Team", status: "pending_approval", total: "AED 12,500" },
      { number: "PR-DXB-2026-00035", requested_by: "Sales", status: "approved", total: "AED 8,200" },
    ]),
    searchKey: "number",
  },
  "/procurement/orders": {
    title: "Purchase Orders (LPO)",
    description: "Electronic purchase orders with multi-currency support",
    columns: [
      { accessorKey: "number", header: "PO Number" },
      { accessorKey: "supplier", header: "Supplier" },
      { accessorKey: "currency", header: "Currency" },
      { accessorKey: "total", header: "Total" },
    ],
    data: sample([
      { number: "PO-DXB-2026-00078", supplier: "Gulf Cement Co.", currency: "AED", total: "AED 45,000" },
      { number: "PO-DXB-2026-00079", supplier: "China Tiles Ltd", currency: "USD", total: "USD 28,500" },
    ]),
  },
  "/procurement/rfq": {
    title: "Vendor Comparison / RFQ",
    description: "Compare supplier quotes per item",
    comingSoon: true,
    columns: [
      { accessorKey: "item", header: "Item" },
      { accessorKey: "supplier_a", header: "Supplier A" },
      { accessorKey: "supplier_b", header: "Supplier B" },
    ],
    data: sample([{ item: "Ceramic Tiles", supplier_a: "AED 82", supplier_b: "AED 79" }]),
  },
  "/procurement/goods-receipt": {
    title: "Goods Receipt",
    description: "Inbound delivery — triggers inventory increase",
    columns: [
      { accessorKey: "number", header: "GR Number" },
      { accessorKey: "po", header: "PO Ref" },
      { accessorKey: "date", header: "Date" },
      { accessorKey: "status", header: "Status" },
    ],
    data: sample([{ number: "GR-DXB-2026-00045", po: "PO-DXB-2026-00078", date: "2026-06-10", status: "posted" }]),
  },
  "/procurement/supplier-invoices": {
    title: "Supplier Invoices",
    description: "Generated from goods receipts",
    columns: [
      { accessorKey: "number", header: "Invoice" },
      { accessorKey: "supplier", header: "Supplier" },
      { accessorKey: "total", header: "Total" },
    ],
    data: sample([{ number: "SINV-2026-0012", supplier: "Gulf Cement Co.", total: "AED 45,000" }]),
  },
  "/procurement/suppliers": {
    title: "Suppliers",
    description: "Supplier directory with payment terms",
    columns: [
      { accessorKey: "name", header: "Supplier" },
      { accessorKey: "terms", header: "Payment Terms" },
      { accessorKey: "classification", header: "Class" },
    ],
    data: sample([
      { name: "Gulf Cement Co.", terms: "Net 30", classification: "Local" },
      { name: "China Tiles Ltd", terms: "LC 60 days", classification: "Import" },
    ]),
    searchKey: "name",
  },
  "/inventory/items": {
    title: "Items / Products",
    description: "Product catalog with SKU, multi-UOM, categories",
    columns: [
      { accessorKey: "sku", header: "SKU" },
      { accessorKey: "name", header: "Name" },
      { accessorKey: "uom", header: "Base UOM" },
      { accessorKey: "price", header: "Unit Price" },
    ],
    data: sample([
      { sku: "TILE-6060-WHT", name: "Ceramic Tiles 60x60", uom: "box", price: "AED 85" },
      { sku: "CEM-PORT-50", name: "Portland Cement 50kg", uom: "bag", price: "AED 22" },
    ]),
    searchKey: "name",
  },
  "/inventory/stock-levels": {
    title: "Stock Levels",
    description: "Per-warehouse stock with reorder levels",
    columns: [
      { accessorKey: "item", header: "Item" },
      { accessorKey: "warehouse", header: "Warehouse" },
      { accessorKey: "on_hand", header: "On Hand" },
      { accessorKey: "reserved", header: "Reserved" },
    ],
    data: sample([
      { item: "Ceramic Tiles 60x60", warehouse: "DXB Main", on_hand: 850, reserved: 200 },
      { item: "Portland Cement 50kg", warehouse: "DXB Main", on_hand: 320, reserved: 50 },
    ]),
  },
  "/inventory/transfers": {
    title: "Warehouse Transfers",
    description: "Request → approval workflow",
    columns: [
      { accessorKey: "number", header: "Transfer #" },
      { accessorKey: "from", header: "From" },
      { accessorKey: "to", header: "To" },
      { accessorKey: "status", header: "Status" },
    ],
    data: sample([{ number: "TRF-2026-0012", from: "DXB Main", to: "AUH WH", status: "pending_approval" }]),
  },
  "/inventory/adjustments": {
    title: "Stock Adjustments",
    description: "Cycle count and variance reports",
    columns: [
      { accessorKey: "number", header: "Sheet #" },
      { accessorKey: "warehouse", header: "Warehouse" },
      { accessorKey: "variance", header: "Variance" },
    ],
    data: sample([{ number: "ADJ-2026-0008", warehouse: "DXB Main", variance: "-12 units" }]),
  },
  "/inventory/batch": {
    title: "Batch / Lot Tracking",
    description: "Batch-managed item lots",
    columns: [
      { accessorKey: "batch", header: "Batch" },
      { accessorKey: "item", header: "Item" },
      { accessorKey: "qty", header: "Qty" },
      { accessorKey: "expiry", header: "Expiry" },
    ],
    data: sample([{ batch: "BT-2026-045", item: "Ceramic Tiles 60x60", qty: 200, expiry: "2028-12-31" }]),
  },
  "/inventory/transformation": {
    title: "Product Transformation",
    description: "Convert source items to output items",
    comingSoon: true,
  },
  "/inventory/barcode": {
    title: "Barcode / QR",
    description: "Item card print preview",
  },
  "/inventory/daily-report": {
    title: "Daily Stock Report",
    description: "Auto-generated daily snapshot",
    columns: [
      { accessorKey: "date", header: "Date" },
      { accessorKey: "warehouse", header: "Warehouse" },
      { accessorKey: "value", header: "Stock Value" },
    ],
    data: sample([{ date: "2026-06-14", warehouse: "DXB Main", value: "AED 1.8M" }]),
  },
  "/finance/chart-of-accounts": {
    title: "Chart of Accounts",
    description: "Account tree structure",
    columns: [
      { accessorKey: "code", header: "Code" },
      { accessorKey: "name", header: "Account" },
      { accessorKey: "type", header: "Type" },
    ],
    data: sample([
      { code: "1100", name: "Cash & Bank", type: "Asset" },
      { code: "1200", name: "Accounts Receivable", type: "Asset" },
      { code: "4100", name: "Sales Revenue", type: "Revenue" },
    ]),
  },
  "/finance/general-ledger": {
    title: "General Ledger",
    description: "Multi-branch consolidated ledger",
    columns: [
      { accessorKey: "date", header: "Date" },
      { accessorKey: "account", header: "Account" },
      { accessorKey: "debit", header: "Debit" },
      { accessorKey: "credit", header: "Credit" },
    ],
    data: sample([{ date: "2026-06-06", account: "Sales Revenue", debit: "", credit: "AED 40,375" }]),
  },
  "/finance/sub-ledgers": {
    title: "Sub-Ledgers",
    description: "Customers, suppliers, bank/cash sub-ledgers",
  },
  "/finance/journal-entries": {
    title: "Journal Entries",
    description: "Manual entries — debits must equal credits",
    columns: [
      { accessorKey: "number", header: "JE #" },
      { accessorKey: "date", header: "Date" },
      { accessorKey: "description", header: "Description" },
      { accessorKey: "status", header: "Status" },
    ],
    data: sample([{ number: "JE-2026-0045", date: "2026-06-01", description: "Month-end accrual", status: "posted" }]),
  },
  "/finance/ar-ap": {
    title: "Receivables & Payables",
    description: "Aging reports 30/60/90 days",
    columns: [
      { accessorKey: "party", header: "Party" },
      { accessorKey: "current", header: "Current" },
      { accessorKey: "days_30", header: "30 Days" },
      { accessorKey: "days_60", header: "60 Days" },
    ],
    data: sample([{ party: "Emirates Building Materials", current: "AED 50,000", days_30: "AED 75,000", days_60: "—" }]),
  },
  "/finance/cost-centers": {
    title: "Cost Centers & Profit Centers",
    description: "Tag transactions by business line",
    columns: [
      { accessorKey: "code", header: "Code" },
      { accessorKey: "name", header: "Center" },
      { accessorKey: "type", header: "Type" },
    ],
    data: sample([
      { code: "CC-TRD", name: "Trading", type: "Cost Center" },
      { code: "PC-LOG", name: "Logistics", type: "Profit Center" },
    ]),
  },
  "/finance/budgeting": {
    title: "Budgeting",
    description: "Budget vs actual by department",
    comingSoon: true,
  },
  "/finance/payroll-link": {
    title: "Payroll Link",
    description: "Expense postings from payroll",
    comingSoon: true,
  },
  "/finance/bank-cash": {
    title: "Bank / Cash Accounts",
    description: "Transactions and reconciliation",
    columns: [
      { accessorKey: "account", header: "Account" },
      { accessorKey: "balance", header: "Balance" },
      { accessorKey: "reconciled", header: "Reconciled" },
    ],
    data: sample([{ account: "Emirates NBD — Current", balance: "AED 1,250,000", reconciled: "Yes" }]),
  },
  "/compliance/vat": {
    title: "VAT Dashboard",
    description: "Output/input VAT summary — UAE 5%",
    columns: [
      { accessorKey: "period", header: "Period" },
      { accessorKey: "output_vat", header: "Output VAT" },
      { accessorKey: "input_vat", header: "Input VAT" },
      { accessorKey: "net", header: "Net Payable" },
    ],
    data: sample([{ period: "Q2 2026", output_vat: "AED 28,500", input_vat: "AED 12,200", net: "AED 16,300" }]),
  },
  "/compliance/e-invoicing": {
    title: "E-Invoicing (UAE FTA)",
    description: "Mandatory rollout 2026/2027 — ASP connection config",
    comingSoon: true,
  },
  "/compliance/document-expiry": {
    title: "Document Expiry Center",
    description: "Trade licenses, visas, Emirates IDs, labor cards",
    columns: [
      { accessorKey: "entity", header: "Entity" },
      { accessorKey: "doc_type", header: "Document" },
      { accessorKey: "expiry", header: "Expiry" },
      { accessorKey: "days", header: "Days Left" },
    ],
    data: sample([
      { entity: "Mohammed Ali", doc_type: "Emirates ID", expiry: "2026-06-25", days: "10" },
      { entity: "Priya Sharma", doc_type: "Visa", expiry: "2026-07-20", days: "35" },
    ]),
  },
  "/hr/employees": {
    title: "Employees",
    description: "HR directory — restricted salary fields",
    columns: [
      { accessorKey: "name", header: "Name" },
      { accessorKey: "department", header: "Department" },
      { accessorKey: "visa_status", header: "Visa" },
    ],
    data: sample([
      { name: "Mohammed Ali", department: "Operations", visa_status: "Valid" },
      { name: "Priya Sharma", department: "Finance", visa_status: "Expiring Soon" },
    ]),
  },
  "/hr/visa-tracker": {
    title: "Visa & Document Tracker",
    description: "Renewal pipeline and expiry alerts",
    columns: [
      { accessorKey: "employee", header: "Employee" },
      { accessorKey: "doc", header: "Document" },
      { accessorKey: "expiry", header: "Expiry" },
    ],
    data: sample([{ employee: "Priya Sharma", doc: "Visa", expiry: "2026-07-20" }]),
  },
  "/hr/trade-license": {
    title: "Trade License Management",
    description: "Per company/branch renewal tracking",
    columns: [
      { accessorKey: "company", header: "Company" },
      { accessorKey: "license", header: "License #" },
      { accessorKey: "expiry", header: "Expiry" },
    ],
    data: sample([{ company: "Bait Al Shaar Trading LLC", license: "CN-1234567", expiry: "2026-08-30" }]),
  },
  "/hr/government-fees": {
    title: "Government Fees Log",
    description: "Fee entries linked to expenses",
    columns: [
      { accessorKey: "date", header: "Date" },
      { accessorKey: "fee_type", header: "Fee Type" },
      { accessorKey: "amount", header: "Amount" },
    ],
    data: sample([{ date: "2026-06-01", fee_type: "Visa Renewal", amount: "AED 3,500" }]),
  },
  "/hr/pro-dashboard": {
    title: "PRO Dashboard",
    description: "Consolidated expiry calendar",
  },
  "/logistics/fleet": {
    title: "Fleet Registry",
    description: "Vehicles, Mulkiya, insurance, maintenance",
    columns: [
      { accessorKey: "plate", header: "Plate" },
      { accessorKey: "vehicle", header: "Vehicle" },
      { accessorKey: "status", header: "Status" },
    ],
    data: sample([{ plate: "A 12345", vehicle: "Isuzu NPR Truck", status: "Active" }]),
  },
  "/logistics/drivers": {
    title: "Drivers",
    description: "Emirates ID, visa, license, performance",
    columns: [
      { accessorKey: "name", header: "Driver" },
      { accessorKey: "license", header: "License" },
      { accessorKey: "score", header: "Score" },
    ],
    data: sample([{ name: "Khalid Rashid", license: "DXB-987654", score: "4.5/5" }]),
  },
  "/logistics/trips": {
    title: "Trips",
    description: "Trip planning and closure",
    columns: [
      { accessorKey: "id", header: "Trip" },
      { accessorKey: "route", header: "Route" },
      { accessorKey: "status", header: "Status" },
    ],
    data: sample([{ id: "TRP-2026-0089", route: "DXB → AUH", status: "completed" }]),
  },
  "/logistics/loading-bay": {
    title: "Loading Bay Scheduler",
    description: "Calendar queue view",
    comingSoon: true,
  },
  "/logistics/trip-costing": {
    title: "Trip Costing & Profitability",
    description: "Per-trip cost vs revenue",
    columns: [
      { accessorKey: "trip", header: "Trip" },
      { accessorKey: "revenue", header: "Revenue" },
      { accessorKey: "cost", header: "Cost" },
      { accessorKey: "margin", header: "Margin" },
    ],
    data: sample([{ trip: "TRP-2026-0089", revenue: "AED 2,500", cost: "AED 1,800", margin: "28%" }]),
  },
  "/logistics/route-optimization": {
    title: "Route Optimization",
    description: "AI-assisted route planning",
    comingSoon: true,
  },
  "/logistics/proof-of-delivery": {
    title: "Proof of Delivery",
    description: "Signature and photo capture",
    comingSoon: true,
  },
  "/logistics/reports": {
    title: "Logistics Reports",
    description: "Daily trips, utilization, on-time %",
    columns: [
      { accessorKey: "report", header: "Report" },
      { accessorKey: "period", header: "Period" },
    ],
    data: sample([{ report: "Daily Trips Summary", period: "Jun 14, 2026" }]),
  },
  "/real-estate/properties": {
    title: "Property Registry",
    description: "Properties with lease/owned status",
    columns: [
      { accessorKey: "name", header: "Property" },
      { accessorKey: "location", header: "Location" },
      { accessorKey: "status", header: "Status" },
    ],
    data: sample([{ name: "Al Majaz Tower Unit 4B", location: "Sharjah", status: "Leased" }]),
  },
  "/real-estate/leases": {
    title: "Lease Management",
    description: "Contracts, renewals, escalation",
    columns: [
      { accessorKey: "tenant", header: "Tenant" },
      { accessorKey: "property", header: "Property" },
      { accessorKey: "rent", header: "Monthly Rent" },
    ],
    data: sample([{ tenant: "ABC Trading", property: "Al Majaz Tower 4B", rent: "AED 45,000" }]),
  },
  "/real-estate/utilities": {
    title: "Utility Tracking",
    description: "DEWA/ADDC/FEWA bills per property",
    columns: [
      { accessorKey: "property", header: "Property" },
      { accessorKey: "provider", header: "Provider" },
      { accessorKey: "amount", header: "Last Bill" },
    ],
    data: sample([{ property: "Al Majaz Tower 4B", provider: "SEWA", amount: "AED 1,200" }]),
  },
  "/real-estate/maintenance": {
    title: "Maintenance",
    description: "Work orders and requests",
    columns: [
      { accessorKey: "wo", header: "WO #" },
      { accessorKey: "property", header: "Property" },
      { accessorKey: "issue", header: "Issue" },
      { accessorKey: "status", header: "Status" },
    ],
    data: sample([{ wo: "WO-2026-0034", property: "Al Majaz Tower 4B", issue: "AC Repair", status: "Open" }]),
  },
  "/real-estate/tenant-portal": {
    title: "Tenant Portal",
    description: "External tenant self-service",
    comingSoon: true,
  },
  "/real-estate/rental-income": {
    title: "Rental Income",
    description: "Accounting integration with VAT treatment",
    comingSoon: true,
  },
  "/construction/projects": {
    title: "Projects",
    description: "Construction projects with budget tracking",
    columns: [
      { accessorKey: "name", header: "Project" },
      { accessorKey: "status", header: "Status" },
      { accessorKey: "budget", header: "Budget" },
      { accessorKey: "actual", header: "Actual" },
    ],
    data: sample([{ name: "Marina Tower Fit-out", status: "Active", budget: "AED 2.5M", actual: "AED 1.8M" }]),
  },
  "/construction/boq": {
    title: "BOQ (Bill of Quantities)",
    description: "Line-item estimation",
    comingSoon: true,
  },
  "/construction/progress-billing": {
    title: "Progress Billing",
    description: "Milestone invoicing",
    comingSoon: true,
  },
  "/construction/subcontractors": {
    title: "Subcontractors",
    description: "Contracts, payments, retention",
    columns: [
      { accessorKey: "name", header: "Subcontractor" },
      { accessorKey: "project", header: "Project" },
      { accessorKey: "contract", header: "Contract Value" },
    ],
    data: sample([{ name: "Steel Works LLC", project: "Marina Tower", contract: "AED 450,000" }]),
  },
  "/ecommerce": {
    title: "E-Commerce Integration Dashboard",
    description: "Channel connection status",
    comingSoon: true,
  },
  "/ecommerce/order-pull": {
    title: "Order Pull Queue",
    description: "Incoming online orders as pending SOs",
    columns: [
      { accessorKey: "order", header: "Online Order" },
      { accessorKey: "channel", header: "Channel" },
      { accessorKey: "status", header: "Status" },
    ],
    data: sample([{ order: "WEB-2026-1234", channel: "Website", status: "Pending" }]),
  },
  "/ecommerce/payment-log": {
    title: "Payment Gateway Log",
    description: "Tabby/Stripe transactions",
    comingSoon: true,
  },
  "/ecommerce/shipping-log": {
    title: "Shipping / Carrier Log",
    description: "Aramex/DHL/Fetchr labels",
    comingSoon: true,
  },
  "/ecommerce/returns": {
    title: "Returns / Refunds",
    description: "Online order returns",
    columns: [
      { accessorKey: "return", header: "Return #" },
      { accessorKey: "order", header: "Order" },
      { accessorKey: "status", header: "Status" },
    ],
    data: sample([{ return: "RET-2026-0045", order: "WEB-2026-1198", status: "Processing" }]),
  },
  "/bi/report-builder": {
    title: "Custom Report Builder",
    description: "Drag-and-drop field picker",
    comingSoon: true,
  },
  "/documents": {
    title: "Document Management",
    description: "Files per entity with version history",
    comingSoon: true,
  },
  "/documents/audit-trail": {
    title: "System Audit Trail",
    description: "Global searchable audit log",
    columns: [
      { accessorKey: "timestamp", header: "Time" },
      { accessorKey: "user", header: "User" },
      { accessorKey: "action", header: "Action" },
    ],
    data: sample([{ timestamp: "2026-06-14 10:30", user: "Ahmed Al Mansoori", action: "Created invoice" }]),
  },
};
