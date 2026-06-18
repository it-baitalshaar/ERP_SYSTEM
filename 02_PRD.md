# Product Requirements Document — Custom ERP (v5)

**Status**: Phase 1 — Frontend UI Shell (mock data)
**Backend target**: Supabase (Postgres, Auth, Storage, RLS) → portable to
self-hosted Postgres via `/supabase/migrations`
**Primary region/compliance**: United Arab Emirates (VAT, FTA e-Invoicing,
RTA/ITC for fleet, MOHRE/GDRFA for HR-PRO)

---

## 1. Goals
1. Single ERP covering Trading, Construction, Logistics, and Real Estate
   business lines for one group of companies (multi-company, multi-branch).
2. Fully role-based, fully feature-flaggable — admin can switch any module
   on/off per company and reconfigure permissions without code changes.
3. UAE-compliant: VAT, e-Invoicing (FTA), PRO/document-expiry tracking.
4. Built incrementally — frontend first (with realistic mock data and
   "Coming Soon" markers for unbuilt logic), Supabase backend next,
   optional on-prem migration later.

## 2. Non-Goals (Phase 1)
- No live Supabase connection yet (mock data layer only, shaped to match
  future schema).
- No real payment/shipping/e-invoicing API calls — UI and config screens
  only.
- No mobile app (web responsive only); mobile app integration is a future
  "Coming Soon" item.

## 3. Users / Roles
See `01_BUILD_PROMPT.md` §3.3 for the full role list. Key principle:
**permissions attach to roles**, roles are assigned to users, and the
permission matrix is admin-editable.

## 4. Requirements Traceability
All requirements below are sourced from `ERP_v5_Full_Requirements_AttachThis.xlsx`.
Status legend: **UI** = full UI built with mock data, **Flag** = covered by
a feature flag, **Soon** = "Coming Soon" placeholder, **Phase2** = needs
Supabase/real integration.

### AUTH — Authorization & Access Control
| ID | Requirement | Phase 1 Treatment |
|---|---|---|
| AUTH-001 | Role-based access control | UI — Role CRUD + permission matrix |
| AUTH-002 | Sales Order = Salesperson role only | UI — route guard simulated via role switcher |
| AUTH-003 | Tax Invoice = Cashier role only | UI — same |
| AUTH-004 | Purchase Order = authorized users only | UI |
| AUTH-005 | Delivery Note Receipt = Warehouse role only | UI |
| AUTH-006 | Purchase Invoice = Accountant only | UI |
| AUTH-007 | Inventory Receipt = authorized users only | UI |
| AUTH-008 | Return authorization, flexible timeframe | UI — config field in Admin |
| AUTH-009 | Reservation/Deposit, flexible period | UI |
| AUTH-010 | HR data access restriction | UI — HR module hidden unless HR role |
| AUTH-011 | Data entry vs approval separation | UI — distinct buttons/workflows |
| AUTH-012 | Audit log (user & date) | UI — Admin > Audit Log, mock entries |

### OPS — Operations
| ID | Requirement | Phase 1 Treatment |
|---|---|---|
| OPS-001 | Sales Order as starting point | UI — SO is first step of sales flow |
| OPS-002 | Convert SO → Tax Invoice | UI — "Convert to Invoice" action |
| OPS-003 | Carton/Box multi-UOM support | UI — UOM + conversion factor on item form |
| OPS-004 | Warehouse selection per invoice | UI |
| OPS-005 | Separate invoice numbering per branch | UI — Admin > Numbering & Sequences |
| OPS-006 | Electronic POs | UI |
| OPS-007 | Electronic Delivery Notes | UI |
| OPS-008 | Stock entry from Delivery Note | UI — mock stock update on receipt |
| OPS-009 | Landed cost calculation | UI — fields on Goods Receipt |
| OPS-010 | Supplier invoice from Delivery Note | UI |
| OPS-011 | Loading/unloading cost tracking | UI — field on landed cost |
| OPS-012 | Shipping company expenses | UI — expense entry linked to shipment |
| OPS-013 | FX for imports | UI — currency selector + rate field on PO |
| OPS-014 | Monthly employee sales report | UI — report page, mock data |
| OPS-015 | Monthly inventory movement report | UI |
| OPS-016 | Monthly expense report | UI |
| OPS-017 | A/R & A/P | UI — Accounts > Sub-Ledgers |
| OPS-018 | Slow-moving inventory report | UI |
| OPS-019 | Inventory summary (qty & value) | UI |
| OPS-020 | Delivery status per invoice | UI — status column/badge |
| OPS-021 | Discount-based goods receipt | UI |
| OPS-022 | Return if not collected (flexible time) | UI — config field |
| OPS-023 | Dedicated inventory for unsold invoices | UI — "reserved stock" concept |
| OPS-024 | Product numbering (supplier + sequence) | UI — item code format |
| OPS-025 | Barcode system | UI — barcode field + print preview |
| OPS-026 | Reservation with deposit | UI |
| OPS-027 | Fingerprint/biometric integration | Soon |
| OPS-028 | Payroll link to expenses | Soon |

### ADD — Additional Features
| ID | Requirement | Phase 1 Treatment |
|---|---|---|
| ADD-001 | Fast access to old invoices | UI — indexed/paginated table, search |
| ADD-002 | Customer-specific pricing | UI — price list per customer |
| ADD-003 | Discount permission by role | UI — gated field |
| ADD-004 | Max discount limit per user | UI — Admin config field |
| ADD-005 | Actual cost (direct + indirect) | UI — cost breakdown fields |
| ADD-006 | Cost & profitability reports | UI |
| ADD-007 | UAE VAT auto-calc | UI — VAT computed in invoice totals |
| ADD-008 | FTA tax reports | UI — VAT Dashboard export button (mock) |
| ADD-009 | Customer data & history (CRM) | UI |
| ADD-010 | Customer classification | UI — tags |
| ADD-011 | Complaint management | UI |
| ADD-012 | Complaint reports | UI |
| ADD-013 | Marketing campaign management | Soon |
| ADD-014 | Campaign results reports | Soon |
| ADD-015 | E-commerce platform | Soon |
| ADD-016 | Instant inventory deduction (eCom) | Soon |
| ADD-017 | SO without stock deduction | UI — toggle on SO |
| ADD-018 | Batch/lot management | UI — flag on item, batch table |
| ADD-019 | Product transformation | Soon (UI built) |
| ADD-020 | Deduct original, add new product | Soon (UI built) |
| ADD-021 | Waste/scrap tracking per delivery | Soon (UI built) |
| ADD-022 | Material coding | UI — item code validation pattern |
| ADD-023 | Smart search/access items | UI — global + item search |
| ADD-024 | Low stock alerts per warehouse | UI |
| ADD-025 | Unified inventory alert (all warehouses) | UI |
| ADD-026 | Item classification tree | UI |
| ADD-027 | Image per item | UI |
| ADD-028 | QR code per item | UI |
| ADD-029 | Print item card | UI |
| ADD-030 | Forecast suggested purchase qty | Soon |
| ADD-031 | Prevent delivery if unpaid | UI — block + badge |
| ADD-032 | Override delivery block (authorized) | UI — role-gated override action |
| ADD-033 | Prevent salesperson selecting warehouse | UI — role-gated field |
| ADD-034 | Show available/reserved qty + warehouse in invoice | UI — popover on item row |
| ADD-035 | UI customization (fields, workflows, forms) | UI — Admin > UI Customization |
| ADD-036 | Mobile app integration | Soon |
| ADD-037 | Data export (Excel/CSV/PDF) | UI — export buttons (mock download) |
| ADD-038 | Data migration old → new | Soon |
| ADD-039 | Separate Quotation document | UI |
| ADD-040 | UAE e-Invoicing (FTA) | Soon (UI + config built) |
| ADD-041 | AI capabilities & chatbot | Soon |
| ADD-042 | Seasonal discounts management | UI — rule builder |

### API — API & E-Commerce Integration
All items (API-001 to API-010): **Soon** — build integration hub cards,
status badges, and order-pull/return queues with mock data; no live API
calls in Phase 1.

### LOG — Logistics & Transportation
| ID | Requirement | Phase 1 Treatment |
|---|---|---|
| LOG-001 | Fleet registry | UI |
| LOG-002 | Maintenance schedule | UI |
| LOG-003 | Vehicle documents (Mulkiya, insurance, ITC/RTA) | UI |
| LOG-004 | Fuel management | UI |
| LOG-005 | Driver data | UI |
| LOG-006 | License tracking (ITC, Asateel) | UI |
| LOG-007 | Performance tracking | UI |
| LOG-008 | Trip closure | UI |
| LOG-009 | Loading bay scheduling | Soon |
| LOG-010 | Trip cost (Salik/Darb etc.) | UI |
| LOG-011 | Profitability per trip/route | UI |
| LOG-012 | Ops reports | UI |
| LOG-013 | Financial reports (freight) | UI |
| LOG-014 | Route planning (AI) | Soon |
| LOG-015 | Proof of Delivery (signature/photo) | Soon (UI built) |

### RE — Real Estate
| ID | Requirement | Phase 1 Treatment |
|---|---|---|
| RE-001 | Property registry | UI |
| RE-002 | Lease/rent management | UI |
| RE-003 | Utility management (DEWA/ADDC/FEWA) | UI |
| RE-004 | Maintenance management | UI |
| RE-005 | Rental income ↔ accounting + VAT | Soon |
| RE-006 | Tenant portal | Soon |

### PRO — UAE Government Services
All (PRO-001 to PRO-007): **UI** — Employee/document registries + PRO
Dashboard with expiry countdown; data entry only, no government API calls.

### FIN — Finance & Accounting
| ID | Requirement | Phase 1 Treatment |
|---|---|---|
| FIN-001 | Full GL + multi-branch consolidation | UI — GL view, consolidation toggle |
| FIN-002 | Cost/profit center accounting | UI — tagging on transactions |
| FIN-003 | Budgeting (budget vs actual) | Soon (UI built) |

### CON — Construction
| ID | Requirement | Phase 1 Treatment |
|---|---|---|
| CON-001 | Project costing | UI |
| CON-002 | BOQ management & estimation | Soon (UI built) |
| CON-003 | Progress billing (milestones/%) | Soon (UI built) |
| CON-004 | Subcontractor management | UI |

### INV — Inventory Enhancements
| ID | Requirement | Phase 1 Treatment |
|---|---|---|
| INV-001 | Multi-warehouse transfer + approval | UI |
| INV-002 | Valuation methods (FIFO/Weighted Avg) | UI — config selector, value calc Soon |
| INV-003 | Stock audit / cycle count | UI |

### PRC — Procurement Controls
| ID | Requirement | Phase 1 Treatment |
|---|---|---|
| PRC-001 | Purchase requisition workflow | UI |
| PRC-002 | Vendor comparison / RFQ | Soon (UI built) |
| PRC-003 | Approval workflow engine (configurable) | UI — basic stepper; full config engine Soon |

### CRM — Customer Relationship Management
| ID | Requirement | Phase 1 Treatment |
|---|---|---|
| CRM-001 | Lead-to-sales pipeline | UI — Kanban |
| CRM-002 | Credit limit & risk control | UI — auto-block badge |
| CRM-003 | Customer portal | Soon |

### CCM — Customer Complaints Management
Both items: **UI** — centralized complaint table with division filter, SLA
countdown column, escalation status.

### CMP — Compliance, Audit & Document Management
| ID | Requirement | Phase 1 Treatment |
|---|---|---|
| CMP-001 | Document management (versioning) | Soon (UI built) |
| CMP-002 | System-wide audit trail | UI |

### BI — Business Intelligence & Reporting
| ID | Requirement | Phase 1 Treatment |
|---|---|---|
| BI-001 | Executive dashboard & KPIs | UI |
| BI-002 | Custom report builder | Soon (UI built) |

### IT — Technical & IT Requirements
| ID | Requirement | Phase 1 Treatment |
|---|---|---|
| IT-001 | Mobile approval app | Soon |
| IT-002 | Automated backup & DR | UI — Admin status screen, Soon for actual jobs |
| IT-003 | Performance SLA targets | Documented below (§6) — not a UI item |

---

## 5. Feature Flag Map (Admin > Feature Management)
Group toggles by module category matching the sidebar groups in §4 of
`01_BUILD_PROMPT.md` (Sales & CRM, Procurement, Inventory, Accounts &
Finance, UAE Compliance, HR & PRO, Logistics, Real Estate, Construction,
E-commerce/API, BI, Compliance/Docs, AI). Each business line (Trading,
Construction, Logistics, Real Estate) is itself a top-level flag that
auto-enables/disables its module group.

## 6. Non-Functional Targets (IT-003, draft — confirm with hosting provider
before committing in client-facing docs)
- Response time: < 1.5s for list views (≤ 50 rows), < 3s for reports.
- Concurrent users: design for 50 concurrent, scalable to 200.
- Uptime target: 99.5% (self-hosted) / per Supabase SLA on managed tier.
- Backups: daily automated, 30-day retention minimum.

## 7. Open Questions / Decisions Needed Before Phase 2
- Final list of which business lines apply to your company (affects which
  module groups are enabled by default).
- Default chart of accounts template (UAE-standard vs custom).
- E-Invoicing ASP (Accredited Service Provider) selection — required before
  FTA integration can be built.
- Which payment gateway(s) and shipping carriers to prioritize for API
  integration.
- Confirm invoice numbering format per branch.

## 8. Phasing
- **Phase 1 (this prompt)**: Frontend UI shell, all modules, mock data,
  feature flags, RBAC UI, "Coming Soon" markers.
- **Phase 2**: Supabase schema + Auth + RLS policies; wire CRUD for core
  modules (Company, Users, Items, Sales Order→Invoice, Purchase Order→Goods
  Receipt, basic Accounts).
- **Phase 3**: UAE e-Invoicing integration, payment gateways, e-commerce
  sync, AI chatbot/forecasting, advanced workflow engine, custom report
  builder.
- **Phase 4 (optional)**: Migrate Supabase schema/data to self-hosted
  Postgres via `/supabase/migrations` if required.
