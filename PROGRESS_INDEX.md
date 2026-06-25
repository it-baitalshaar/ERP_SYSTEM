# ERP Build — Progress Index
Last updated: 2026-06-16 by Cursor Agent

## 1. Status Snapshot
- Phase: 2 — Supabase + Sales + Procurement + Inventory core wired
- Stack: Next.js 15 + TS + Tailwind + shadcn + Zustand + Supabase
- Backend: Migrations through `0013_document_templates.sql`
- Structure: `.cursor/rules/` — `erp-project-structure`, `erp-code-quality`, `erp-docs-and-features` (always apply)
- Extras catalog: `docs/EXTRA_FEATURES.md`

## 2. Module Build Status
| Module | Route | Status | Notes |
|---|---|---|---|
| Inventory (items, stock, movements) | /inventory/* | in-progress | UOM catalog; cost/sale on items; MRN updates stock + pricing |
| Sales (customers, orders, invoices, DN) | /sales/* | in-progress | Below-cost warning; warehouse availability on product pick |
| Procurement (full purchase cycle) | /procurement/* | in-progress | LPO variance; linked purchase payments |
| Document print / PDF | cross-module | done | Templates + Windows print dialog |
| Admin document templates | /admin/ui-customization | done | Logo, LPO/quote layout, doc naming |
| Org structure + data lifecycle | /admin/org-structure | done | Delete w/ backup, export/reset/restore |
| User module grants | /admin/users | done | Per-user extra modules; Super Admin bypass |
| Auth + platform init | /login, /itbaitalshaar | done | Username or email login |
| ESS (Employee Self-Service) | /ess/* | not-started | Spec in `01_BUILD_PROMPT.md` §4.N |
| (other modules) | … | shell / coming-soon | Finance, transfers, etc. |

## 3. Feature Flags Implemented
- [x] Business-line defaults (`src/lib/feature-flags.ts`)
- [x] Admin toggles → `feature_flags` table (`/admin/features`)
- [x] Sidebar: flags + role permissions + `user_module_permissions`
- [x] Super Admin: full nav, all flags treated enabled
- [x] `feat_below_cost_warning` — below purchase cost on sales docs
- [x] `feat_product_warehouse_availability` — warehouse stock on sales product pick
- [x] `feat_batch_tracking`, `feat_customer_portal`, `feat_e_invoicing` (defs in mock-data)

## 4. RBAC Implemented
- [x] Role defaults (`src/lib/role-permissions.ts`)
- [x] Per-user module grants (`0009_user_module_permissions.sql`)
- [x] Super Admin bypasses nav and feature checks

## 5. Key Docs
| File | Purpose |
|---|---|
| `docs/EXTRA_FEATURES.md` | User-requested extras — **update on every new feature** |
| `docs/PROCUREMENT_FLOW.md` | Purchase cycle spec (MR → payment) |
| `.cursor/rules/erp-project-structure.mdc` | Layers, naming, migrations |
| `.cursor/rules/erp-docs-and-features.mdc` | Sync index + build docs |
| `.cursor/rules/erp-code-quality.mdc` | Quality bar, tsc, flags |
| `03_AI_INDEX_RULES.md` | How to maintain this index |
| `01_BUILD_PROMPT.md` §4.O–§4.T | Print, delete, templates, extras |

## 6. Known Gaps / Coming Soon
- RFQ / vendor comparison — nav `coming_soon` only
- Customer receipt payments (mirror of purchase payments)
- Purchase returns, landed cost
- Stock transfers, adjustments, batch lots UI
- Finance / GL integration

## 7. Next Session Should Start With
- Run pending migrations on Supabase (`0012`, `0013`); smoke-test print + below-cost warning.
- Customer payment receipts linked to tax invoices.

## 8. Supabase Schema Status
| Migration | Status |
|---|---|
| 0001_init.sql | ready — sales tables |
| 0002–0009 | org, auth, backups, user module perms |
| 0010_procurement.sql | ready — full purchase chain |
| 0011_inventory.sql | ready — items, stock_levels, movements |
| 0012_building_materials.sql | ready — cost_price, supplier balance, MRN variance |
| 0013_document_templates.sql | ready — company print template settings |
