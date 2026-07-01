# ERP System — Frontend Build Prompt (Phase 1: Full UI Shell)

Paste this into your AI builder (Lovable / Bolt / v0 / Cursor etc.) as the
project brief. It assumes Next.js + Tailwind + shadcn/ui, with Supabase as
the backend (to be wired in Phase 2 — see "Backend" section).

---

## 1. PROJECT OVERVIEW

Build a **fully customizable, multi-company ERP web application** for a UAE
based group with multiple business lines (Trading, Construction, Logistics,
Real Estate). The system must be **modular and admin-configurable** — every
module/feature can be enabled or disabled per company by an administrator,
and the UI must adapt accordingly (hide nav items, hide fields, hide
dashboard widgets for disabled modules).

Core principles:
- **Multi-company / multi-branch** from day one (company switcher in header).
- **Role-Based Access Control (RBAC)** — permissions are assigned to roles,
  not individual users. Roles are fully custom/creatable by Admin.
- **Feature flags** — every module and many sub-features have an on/off
  toggle in Admin > Feature Management. If a feature is OFF, hide it
  entirely from menus/UI (don't just disable).
- **"Coming Soon" pattern** — any module/screen not yet functionally wired
  to the backend must still be fully designed (UI, layout, sample data) but
  show a "Coming Soon" badge near the page title and disable destructive
  actions (Save/Submit) with a tooltip "Backend integration coming soon".
- **UAE context** — AED currency default, UAE VAT (5%), UAE e-Invoicing
  (FTA) readiness, Arabic/English ready (RTL-capable layout, even if only
  English content is filled now).
- Clean, dense, professional ERP look — sidebar navigation, top bar with
  company/branch switcher, breadcrumbs, data tables with filters/search/
  export buttons, modals/drawers for forms.

---

## 2. TECH STACK

- **Framework**: Next.js (App Router), TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Icons**: lucide-react
- **Charts**: recharts (for dashboards/BI)
- **Tables**: TanStack Table (sorting, filtering, pagination, column
  visibility toggle)
- **Forms**: react-hook-form + zod validation
- **State**: React Context / Zustand for app-level state (current company,
  branch, user role, feature flags)
- **Backend (Phase 2)**: Supabase (Postgres + Auth + Storage + RLS). For
  Phase 1, use mock/local JSON data and a typed `lib/mock-data/` folder so
  swapping to Supabase later is a drop-in replacement (same shape).
- **Future**: SQL migrations written Supabase-first but kept in a portable
  `/supabase/migrations` folder so they can be replayed against a self-hosted
  Postgres later with minimal changes.

---

## 3. GLOBAL APP STRUCTURE

### 3.1 Layout
- Collapsible left sidebar grouped by module category (see Module List
  below). Each group is collapsible.
- Top bar: Company switcher, Branch switcher, global search, notifications
  bell (expiry alerts — visas, licenses, low stock, etc.), user menu.
- Main content area with breadcrumb + page title + primary action button.
- Mobile-responsive (sidebar becomes a drawer).

### 3.2 Company / Branch Context
- "Company Creation" wizard (Admin only): Company name, trade license
  details, logo, address, currency (default AED), VAT/TRN number, fiscal
  year start, business lines (Trading/Construction/Logistics/Real Estate —
  multi-select, drives which modules show as "relevant" by default).
- Multi-branch support: branches belong to a company, each branch can have
  its own invoice numbering sequence, warehouse(s), and users.
- All transactional screens (invoices, orders, etc.) show/respect the
  active Company + Branch context.

### 3.3 Authentication & RBAC
- Login screen (email/password placeholder; Supabase Auth later).
- **Roles** (seed these as default roles, but make role creation/editing a
  full CRUD screen under Admin > Roles & Permissions):
  - Super Admin, Company Admin, Accountant, Cashier, Salesperson, Warehouse
    Staff, Procurement Officer, HR/PRO Officer, Driver/Logistics Officer,
    Auditor (read-only), Customer (portal), Tenant (portal).
- **Permission matrix UI**: grid of Modules × Roles × (View / Create / Edit
  / Delete / Approve) checkboxes — fully editable by Super Admin.
- Enforce route-level guards: a role without "View" on a module cannot see
  it in the sidebar.
- "Data Entry vs Approval" separation: any document with an approval
  workflow shows distinct "Submit for Approval" vs "Approve/Reject" actions
  gated by permission.

### 3.4 Admin Panel (the control center)
A dedicated `/admin` section, only visible to Admin roles, containing:
1. **Company Management** — list/create/edit companies & branches.
2. **User Management** — invite/create users, assign roles, activate/
   deactivate, reset access.
3. **Roles & Permissions** — role CRUD + permission matrix described above.
4. **Feature Management (Feature Flags)** — a toggles screen, grouped by
   module category (mirrors the Module List below), each with an on/off
   switch and short description. Disabling a module/feature hides it
   app-wide. Persist this in a `feature_flags` table (company-scoped).
5. **UI Customization** — per-company settings to:
   - Add custom fields to forms (Invoice, Item, Customer, etc.) — field
     name, type (text/number/date/dropdown), required flag.
   - Show/hide standard columns in list views.
   - Reorder/rename menu items (cosmetic only in Phase 1).
6. **Numbering & Sequences** — configure document number formats per branch
   (e.g., INV-DXB-2026-000123), with prefix/suffix/reset rules.
7. **Tax & Compliance Settings** — VAT rate(s), TRN, UAE e-Invoicing
   connection settings (FTA Accredited Service Provider config — show as
   "Coming Soon" with fields for provider, API key, status).
8. **Audit Log Viewer** — searchable table of all create/edit/delete actions
   with user, timestamp, module, before/after diff (mock data fine).
9. **Backup & System Health** — shows backup status, last run, "Run Backup
   Now" button (Coming Soon), and a simple uptime/SLA status widget.
10. **Integrations Hub** — cards for: Payment Gateways (Tabby, Stripe),
    Shipping Carriers (Aramex, DHL, Fetchr), E-commerce platforms, Accounting
    export, AI Chatbot — each card shows Connect/Configure button and status
    badge (Not Connected / Coming Soon).

---

## 4. MODULE LIST (build a full page/section for each — use "Coming Soon"
badges where noted)

### A. Sales & CRM
- Dashboard (sales KPIs, recent orders, top customers)
- **Quotations** — separate document type, convertible to Sales Order
- **Sales Orders (SO)** — Salesperson-role gated, line items with multi-UOM
  (pcs/box/carton with conversion factor), customer-specific pricing,
  discount field gated by max-discount-per-role, warehouse auto-selected
  (warehouse field hidden for Salesperson unless authorized)
- **Tax Invoices** — Cashier-role gated, generated from SO, shows
  available/reserved qty + warehouse on item click (popover), VAT
  auto-calculated, "Prevent delivery if unpaid" badge + override action for
  authorized roles
- **Delivery Notes** — electronic, links to invoice, triggers stock
  deduction
- Customers (CRM) — profile, classification (tags: VIP/Wholesale/Retail),
  credit limit & risk indicator (auto-block badge when over limit),
  purchase history, complaints tab
- Leads & Pipeline — Kanban board: Lead → Opportunity → Quotation → Order
- Customer Portal (separate simplified layout) — orders, invoices,
  payments, statements, service requests — **Coming Soon**
- Marketing Campaigns — campaign list, results report — **Coming Soon**
- Seasonal Discounts — rule builder (date range + % off + product/category)

### B. Procurement
- Purchase Requisitions — Request → Approval → PO workflow (status stepper)
- **Purchase Orders (LPO)** — authorized-roles gated, electronic, supplier
  selection, multi-UOM, FX currency selector for imports
- Vendor Comparison / RFQ — table comparing multiple supplier quotes per
  item — **Coming Soon** (UI + sample data only)
- Goods Receipt / Delivery Note (Inbound) — Warehouse-role gated, triggers
  auto-inventory increase, landed cost entry (item price + freight + customs
  + loading/unloading allocation)
- Supplier Invoices — Accountant-role gated, generated from goods receipt
- Suppliers — directory with classification, payment terms

### C. Inventory
- Dashboard — stock value, low-stock alerts (per-warehouse + unified),
  slow-moving items report
- Items / Products — catalog with image, QR code, SKU (supplier code +
  sequence), category tree, multi-UOM, batch/lot toggle
- Stock Levels — by warehouse, reorder level config per item per warehouse,
  reorder suggestions (AI-forecast badge — **Coming Soon**)
- Multi-Warehouse Transfers — request → approval workflow, status stepper
- Stock Adjustments / Cycle Count — audit sheets, variance report
- Batch/Lot Tracking — for items flagged batch-managed (e.g., ceramic
  batches)
- Product Transformation — "convert" screen: deduct source item qty, add
  output item(s) qty, record waste/scrap — **Coming Soon** (full UI, mock
  conversion logic only)
- Barcode/QR — item card print preview (Name, Code, QR)
- Daily Stock Report — auto-generated daily snapshot table, exportable

### D. Accounts & Finance
- Chart of Accounts — tree view, add/edit accounts
- General Ledger — multi-branch consolidated view, drill-down to
  sub-ledgers
- Sub-Ledgers — Customers (A/R), Suppliers (A/P), Bank/Cash
- Journal Entries — manual entry form with debit/credit lines (must balance)
- Receivables & Payables — aging reports (30/60/90)
- Cost Centers & Profit Centers — tag transactions by business line
- Budgeting — Budget vs Actual table per department/project — **Coming
  Soon**
- Payroll Link — expense postings from payroll — **Coming Soon**
- Bank/Cash accounts — transaction list, reconciliation status

### E. UAE Compliance
- VAT Dashboard — output/input VAT summary, FTA-format report export
- **E-Invoicing (UAE FTA)** — status banner "Mandatory rollout
  2026/2027", config screen for ASP connection, invoice e-sign status
  column on Tax Invoices — **Coming Soon** but UI fully built
- Document Expiry Center (PRO) — table of all expiring docs (Trade License,
  Visas, Emirates IDs, Labor Cards, Insurance) with color-coded countdown

### F. HR & PRO (UAE Government Services)
- Employees — directory (HR-restricted view), Emirates ID, visa status,
  labor card, medical insurance, salary (restricted field)
- Visa & Document Tracker — renewal pipeline, expiry alerts
- Trade License Management — per company/branch, renewal tracking
- Government Fees Log — fee entries linked to expenses
- PRO Dashboard — consolidated expiry calendar (combine with Document
  Expiry Center above or link)

### G. Logistics & Fleet (shown only if "Logistics" business line enabled)
- Fleet Registry — vehicles, documents (Mulkiya, insurance), maintenance
  schedule
- Drivers — Emirates ID, visa, license, performance scores
- Trips — planning, trip closure form (actual times, fuel, KM, expenses,
  returns)
- Loading Bay Scheduler — calendar/queue view — **Coming Soon**
- Trip Costing & Profitability — per-trip cost breakdown vs revenue
- Route Optimization (AI-assisted) — **Coming Soon**
- Proof of Delivery — signature/photo capture UI — **Coming Soon**
  (camera/signature widget can be built, storage wiring later)
- Logistics Reports — daily trips, utilization, on-time %, freight P&L

### H. Real Estate (shown only if "Real Estate" business line enabled)
- Property Registry — list with location, size, lease/owned status
- Lease Management — contracts, renewals, rent escalation schedule, deposits
- Utility Tracking — DEWA/ADDC/FEWA bills per property
- Maintenance — request/work order list
- Tenant Portal — **Coming Soon** (separate simplified layout, similar to
  Customer Portal)
- Rental Income → Accounting integration — VAT treatment indicator —
  **Coming Soon**

### I. Construction (shown only if "Construction" business line enabled)
- Projects — list, status, budget vs actual snapshot
- BOQ (Bill of Quantities) — line-item estimation table — **Coming Soon**
- Progress Billing — milestone/% completion invoicing — **Coming Soon**
- Subcontractors — contracts, payment schedule, retention tracking

### J. E-Commerce & API Integration
- Integration status dashboard (cards per channel: Website, Shopify-like
  store, etc.) — **Coming Soon** for all live syncing
- Order Pull queue — incoming online orders shown as pending Sales Orders
- Payment Gateway log (Tabby/Stripe) — transaction list — **Coming Soon**
- Shipping label / carrier log (Aramex/DHL/Fetchr) — **Coming Soon**
- Returns/Refunds from online orders — list + status

### K. Business Intelligence
- Executive Dashboard — KPI cards (Revenue, Profit, Inventory Value, Open
  Projects) + charts (sales trend, top products, branch comparison)
- Custom Report Builder — drag-and-drop field picker UI — **Coming Soon**
  (build the picker UI; actual query execution later)

### L. Compliance & Documents
- Document Management — file list per entity (contracts, invoices) with
  version history column — **Coming Soon** for upload/versioning logic
- System Audit Trail — global searchable log (shared with Admin > Audit Log)

### M. AI Features
- AI Chatbot widget (floating button, bottom-right, opens a chat panel) —
  **Coming Soon** placeholder UI with sample conversation
- AI Purchase Forecast badges on Inventory reorder screen — **Coming Soon**

---

## 5. DATA MODEL HINTS (for consistent mock data — align with future Supabase
schema)

Build mock TypeScript types/interfaces for at least: `Company`, `Branch`,
`User`, `Role`, `Permission`, `FeatureFlag`, `Customer`, `Supplier`, `Item`
(with `uom_conversions`, `category_id`, `is_batch_managed`), `Warehouse`,
`StockLevel`, `Quotation`, `SalesOrder`, `TaxInvoice`, `DeliveryNote`,
`PurchaseRequisition`, `PurchaseOrder`, `GoodsReceipt`, `SupplierInvoice`,
`JournalEntry`, `Account` (chart of accounts tree), `Project` (construction),
`Property` (real estate), `Vehicle`, `Driver`, `Trip`, `Employee`,
`Document` (expiry tracking), `AuditLogEntry`. Keep field names snake_case to
match Postgres conventions.

---

## 6. WHAT "COMING SOON" MEANS IN THE UI (be consistent)
- Yellow/blue "Coming Soon" badge next to the page H1.
- Form fields and tables render normally with realistic sample data.
- Primary action buttons (Save, Submit, Sync, Connect, Approve) are present
  but show a toast on click: "This feature is coming soon — backend
  integration pending."
- Never hide a planned module entirely from navigation — show it so the
  client can review the full scope, UNLESS its Feature Flag is OFF (then
  hide per section 3.4 #4).

---

## 7. DELIVERABLE FOR THIS PHASE
A working Next.js app with:
- All navigation/modules above present and clickable.
- Functional UI interactions (filters, modals, tabs, steppers, kanban
  drag-drop where listed) using mock data — no real backend calls yet.
- Feature flag toggles in Admin actually show/hide nav items live.
- Role switcher (dev-only, in user menu) to preview the app as different
  roles for QA.
- Clean component structure so Supabase wiring (Phase 2) only requires
  swapping data-fetching functions in `lib/data/*.ts`.

Refer to `02_PRD.md` for detailed feature rationale and `03_AI_INDEX_RULES.md`
for how you (the AI builder) must track progress as you build, across
sessions.

---

# 4.N Employee Self-Service (ESS) Portal (Additive Module)

> Add this module without modifying existing modules. Respect feature flags, RBAC, company scope, branch scope, and Coming Soon behavior.

## Purpose

Provide employees with a self-service workspace separate from Admin and operational ERP screens.

### Access Rules

* Accessible only to authenticated employees.
* Employee sees only own records.
* Managers receive additional team visibility where applicable.
* HR roles receive elevated access based on RBAC.

---

## ESS Dashboard

Route: `/ess`

Widgets:

* Personal profile summary
* Pending approvals
* Leave balance
* Attendance summary
* Upcoming document expiry
* Latest announcements
* Open helpdesk tickets
* Recent payslips
* Quick actions

Quick Actions:

* Request Leave
* Upload Document
* Submit Expense
* Create HR Request
* Raise Helpdesk Ticket
* View Attendance

---

## ESS — My Profile

Route: `/ess/profile`

Features:

* Employee identity summary
* Profile photo
* Employee barcode
* Department
* Reporting manager
* Team members
* Company information
* Employment timeline
* Office location
* Contact information
* Emergency contact
* Insurance status
* Job description
* Company policy attachments
* Personal documents with expiry indicators

UI:

* Timeline component
* Document cards
* Employee org chart
* Editable fields controlled by HR approval

---

## ESS — Time Off / Leave Management

Route: `/ess/time-off`

Features:

* Leave balance cards:

  * Emergency Leave
  * Paid Leave
  * Sick Leave
* Request leave form
* Calendar view
* Leave entitlement table
* Leave history
* Status workflow:
  Draft → Submitted → Approved → Rejected

Controls:

* Date range picker
* Leave type selector
* Attachment upload
* Approval timeline

---

## ESS — Attendance & Overtime

Route: `/ess/attendance`

Widgets:

* Days present
* Hours worked
* Average daily hours
* Average check-in/out
* Late arrivals

Views:

* Weekly bar chart
* Monthly attendance calendar
* Daily logs
* Check-in location pins
* Overtime requests

---

## ESS — Payslips

Route: `/ess/payslips`

Features:

* Filter by year/month
* Salary list
* Gross vs Net cards
* Detailed breakdown drawer
* PDF preview
* Download action

---

## ESS — Employee Loans

Route: `/ess/loans`

Features:

* Loan dashboard
* Active loans
* Outstanding balance
* New loan request
* HR conversation thread
* Loan repayment schedule

Workflow:
Draft → Submitted → Approved → Closed

---

## ESS — Custody / Asset Requests

Route: `/ess/custody`

Features:

* Request company assets
* Equipment selection
* Handover workflow
* Return workflow
* Attachment support
* Draft mode

Statuses:
Draft → Pending → Approved → Returned

---

## ESS — Employee Requests

Route: `/ess/requests`

Request Types:

* Salary Certificate
* Salary Transfer Letter
* NOC
* Salary Advance

Features:

* Arabic / English templates
* Effective date
* Priority
* Attachments
* Request tracking

---

## ESS — Expenses & Reimbursements

Route: `/ess/expenses`

Features:

* Individual expense entry
* Expense report grouping
* Batch submission
* PDF report export
* Approval workflow
* Status badges

Statuses:
Draft → Submitted → Approved → Paid → Refused

---

## ESS — Announcements

Route: `/ess/announcements`

Features:

* Priority badges
* Read acknowledgements
* Filters:

  * Unread
  * High Priority
  * Acknowledged
* Dashboard unread counter

---

## ESS — Disciplinary Records

Route: `/ess/disciplinary`

Features:

* Record history
* Severity
* Appeal submission
* Employee acknowledgement
* Status filtering

---

## ESS — Company Directory

Route: `/ess/directory`

Features:

* Search employees
* Department filters
* Contact actions
* Reporting hierarchy
* Employee cards

---

## ESS — Holiday Calendar

Route: `/ess/calendar`

Features:

* Unified calendar:

  * Public holidays
  * Leave
  * Pending requests
* Leave balances
* Recent requests
* Calendar legend

---

## ESS — Training Center / LMS

Route: `/ess/training`

Tabs:

* Course Catalog
* My Learning

Features:

* Search
* Category filters
* Modality filters
* Enrollment
* Progress tracking
* Certificates (Coming Soon)

---

## ESS — Document Center

Route: `/ess/documents`

Features:

* Upload personal documents
* Expiry tracking
* Expiring Soon widgets
* Download attachments
* Document metadata

Document Types:

* Passport
* Visa
* Emirates ID
* Insurance
* Other

---

## ESS — Appraisals

Route: `/ess/appraisals`

Tabs:

* My Appraisals
* Team Appraisals

Features:

* Survey UI
* 360 feedback
* Progress status
* Completion tracking

---

## ESS — Help Desk

Route: `/ess/helpdesk`

Features:

* Ticket creation
* Team routing
* Priority
* Attachments
* Ticket history
* SLA indicator

Statuses:
Open → Assigned → In Progress → Resolved → Closed

---

# Additional Cross-System Enhancements (Missing in Current Build Prompt)

### Notification Center

Global notification engine:

* Email
* In-app
* WhatsApp (Coming Soon)
* Reminder scheduler
* Escalation rules

### Approval Engine

Create reusable approval workflows:

* Conditions
* Multi-level approvals
* Delegation
* SLA timers

### Dashboard Builder

Admin configurable:

* Widget visibility
* Widget layout
* Saved dashboard templates

### Project Governance (Admin)

Add:

* Sprint board
* Backlog
* Release tracker
* FAT (Feature Acceptance Testing) tracker
* Change Request register

### Communication Center

* Internal announcements
* Employee broadcast
* Message templates
* Notification logs

### Audit Expansion

Track:

* Login history
* Failed attempts
* Session history
* Export history
* Approval actions

### File Storage Layer

Prepare:
`/storage/company`
`/storage/hr`
`/storage/documents`
`/storage/expenses`
`/storage/temp`

---

# 4.O Document Print & PDF (Cross-Module Standard)

**Every transactional document** in Sales, Procurement, Inventory movements, Finance, HR, and future modules must expose **Print** and **Download PDF** on list rows and document detail views.

## Shared layer (do not duplicate per module)

| Path | Role |
|---|---|
| `src/lib/documents/types.ts` | `PrintableDocument`, `PrintContext`, line helpers |
| `src/lib/documents/mappers.ts` | One `*ToPrintable(row, ctx)` per document type |
| `src/lib/documents/print.ts` | `buildPrintHtml`, `openPrintWindow`, `downloadPdf` (jspdf + jspdf-autotable) |
| `src/components/documents/document-print-actions.tsx` | Print + PDF buttons |
| `src/components/documents/document-print-column.tsx` | `createPrintColumn(mapper)` for data tables |
| `src/components/documents/use-print-context.ts` | Company / branch / currency from `useAppStore` |

## When building a new document type

1. Add a mapper in `mappers.ts` (title, number, party, lines, totals, meta).
2. On the list page: `createPrintColumn(yourMapper)` before the actions column.
3. On detail / form dialogs (optional): `<DocumentPrintActions document={…} />`.
4. Letterhead: use `PrintContext` company name and branch; logo field reserved for later admin UI customization.

## Dependencies

- `jspdf`, `jspdf-autotable` in `package.json`
- If PDF libs fail to load, fall back to print window → user can Save as PDF

## Currently wired

- **Sales:** quotations, sales orders, tax invoices, delivery notes
- **Procurement:** material requests, LPO, proforma, supplier delivery notes, MRN, supplier invoices, purchase payments

## WhatsApp share (§4.Q)

- Green **WhatsApp** button on every document row (with Print/PDF).
- Pre-fills customer/supplier phone from master data; user can tick **text** and/or **PDF**.
- Opens `wa.me` with message; PDF downloads for attach (native share on mobile when supported).

## Admin document delete (§4.P)

- **Who:** Super Admin and Company Admin only (`isAdminRole`).
- **Where:** Delete button on each transactional list row (Sales + Procurement).
- **Linked docs:** `check_delete` returns blockers with document number, hint, and link to the list page. User must delete children first (e.g. for LPO: Payments → Supplier Invoices → MRNs → SDN → Proforma → LPO).
- **Posted docs:** Warn on approve/posted status; reversing stock on posted MRN / sales delivery note delete; reduce customer balance on posted tax invoice delete.
- **Server:** `src/lib/server/document-delete.ts` — `checkDocumentDelete`, `deleteDocument`; API `PATCH` actions `check_delete` and `delete`.
- **Customers:** Super Admin / Company Admin — delete on `/sales/customers`; block if quotations, orders, or invoices exist (`src/lib/server/customer-delete.ts`).

---

# 4.R Extra Features Catalog & Doc Sync

All **user-requested extras** and major post-PRD capabilities are tracked in:

| Doc | Role |
|-----|------|
| `docs/EXTRA_FEATURES.md` | Master table — feature, flag, paths |
| `PROGRESS_INDEX.md` | Status, flags, gaps, migrations |
| `03_AI_INDEX_RULES.md` §7 | Mandatory update protocol |
| `.cursor/rules/erp-docs-and-features.mdc` | Cursor agent rule (always apply) |

**When shipping a new extra:** add a row to `EXTRA_FEATURES.md`, append a short §4 subsection here if non-trivial, update `PROGRESS_INDEX.md`, add `feat_*` to `feature-flags.ts` when admin-toggleable.

### Currently catalogued (see `docs/EXTRA_FEATURES.md` for paths)

- Building materials: LPO variance, supplier balance, linked payments, UOM, MRN pricing, stock movements  
- Document templates: classic LPO + standard quote; Admin → Document Templates  
- Below-cost sale warning (`feat_below_cost_warning`)  
- Product warehouse availability (`feat_product_warehouse_availability`) on sales product pick  
- Partial sales delivery (`feat_partial_sales_delivery`) + customer reservations (`feat_customer_product_blocks`)  
- Print → OS print dialog (`printHtmlInFrame`)  
- 3-way match, admin delete, WhatsApp share  

---

# 4.S Building Materials & Procurement Extras

- **LPO vs MRN price:** Admin approves; LPO lines updated (`mrn-lpo-variance.ts`, `mrn-post-dialog.tsx`).  
- **Supplier payments:** `/procurement/payments` linked to invoice; `suppliers.outstanding_balance` (`supplier-balance.ts`).  
- **UOM:** `src/lib/inventory/uom.ts`, item form subunits.  
- **Inventory from MRN:** `postMrnToInventory` sets `cost_price` + sale `unit_price`.  
- **Migrations:** `0012_building_materials.sql`, `0013_document_templates.sql`.

---

# 4.T Sales Guardrails

- **Below-cost warning:** `feat_below_cost_warning` in Feature Management; warns when sell price &lt; `items.cost_price` on quotation/order/invoice (`below-cost.ts`, server `assertSalesLinesNotBelowCost`).
- **Warehouse availability:** `feat_product_warehouse_availability` in Feature Management; shows per-warehouse stock inline and in a details dialog when picking products on quotation/order/invoice (`warehouse-availability.ts`, `product-warehouse-availability.tsx`).
- **Partial delivery:** `feat_partial_sales_delivery` — partial payment on invoice, delivery note limited to paid minus already delivered (`sales-delivery.ts`, `partial-*-dialog.tsx`).
- **Customer reservations:** `feat_customer_product_blocks` — hold qty for a customer until date; visible on stock + sales form; history after expiry; WhatsApp reminder (`customer-blocks.ts`, `customer-product-blocks-panel.tsx`).

---

# 4.U Procurement workflow builder

- **What:** Admin configures the purchase-cycle steps (MR → LPO → proforma → MRN → payment), enables/disables gates, assigns approvers (admin / role / user). Mindmap on admin and procurement pages.
- **Flag:** `feat_procurement_workflow` (Feature Management + toggle on workflow admin page)
- **Key files:** `src/lib/workflows/procurement.ts`, `src/lib/server/workflows.ts`, `src/app/api/admin/workflows/route.ts`, `src/app/(app)/admin/workflows/procurement/page.tsx`, `src/app/(app)/procurement/workflow/page.tsx`, `src/components/workflows/workflow-mindmap.tsx`
- **Migration:** `0016_procurement_workflow.sql` (`company_workflow_settings`)
- **Wired on:** MR/LPO submit auto-skips approval when step disabled; approve actions check assigned approver when flag is on

---

# 4.V Partial sales delivery & customer reservations

- **What:** Record partial payment on a tax invoice (e.g. 300 of 1000 pcs paid), create delivery notes only for paid-and-not-yet-delivered qty, optionally reserve undelivered balance for that customer until a date. Reservations show on stock levels, sales product pick, and customer history; WhatsApp reminder for upcoming expiry.
- **Flags:** `feat_partial_sales_delivery`, `feat_customer_product_blocks` (Feature Management)
- **Key files:**

| Path | Role |
|------|------|
| `supabase/migrations/0017_sales_partial_delivery_blocks.sql` | `paid_line_qty`, `customer_product_blocks` |
| `src/lib/server/sales-delivery.ts` | Fulfillment math, partial pay, partial DN validation |
| `src/lib/server/customer-blocks.ts` | CRUD, expiry, block-other-customer assert |
| `src/components/sales/partial-payment-dialog.tsx` | Record paid qty + optional reservation |
| `src/components/sales/partial-delivery-dialog.tsx` | DN for deliverable qty |
| `src/components/sales/customer-product-blocks-panel.tsx` | Customer reservations + history + WhatsApp |
| `src/app/(app)/inventory/stock-levels/page.tsx` | Customer holds column |

- **Wired on:** Tax invoices list (partial pay / partial DN actions), customers page (Reservations tab), stock levels, sales document form (reservation hints)

---

This keeps your original prompt intact and fills the proposal gaps instead of rewriting architecture.
