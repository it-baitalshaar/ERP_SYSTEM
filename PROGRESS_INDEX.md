# ERP Build — Progress Index
Last updated: 2026-07-01 by Cursor Agent

## 1. Status Snapshot
- Phase: 2 — Supabase + Sales + Procurement + Inventory core wired
- Stack: Next.js 15 + TS + Tailwind + shadcn + Zustand + Supabase
- Backend: Migrations through `0014_focus_raw_staging.sql`
- Focus import: `focus-data-fetch/` Docker job → Supabase raw staging (no ERP mapping yet)
- Structure: `.cursor/rules/` — `erp-project-structure`, `erp-code-quality`, `erp-docs-and-features` (always apply)
- Extras catalog: `docs/EXTRA_FEATURES.md`

## 2. Module Build Status
| Module | Route | Status | Notes |
|---|---|---|---|
| Inventory (items, stock, movements) | /inventory/* | in-progress | UOM catalog; cost/sale on items; MRN updates stock + pricing |
| Sales (customers, orders, invoices, DN) | /sales/* | in-progress | Partial pay/DN; customer product reservations + stock holds |
| Procurement (full purchase cycle) | /procurement/* | in-progress | i18n EN/AR/both on procurement + top bar language switch |
| Document print / PDF | cross-module | done | Templates + Windows print dialog |
| Admin migrations (Focus staging) | /admin/migrations | done | View focus-data-fetch runs, catalog, raw samples |
| Org structure + data lifecycle | /admin/org-structure | done | Delete w/ backup, export/reset/restore |
| User module grants | /admin/users | done | Per-user extra modules; Super Admin bypass |
| Auth + platform init | /login, /itbaitalshaar | done | Username or email login |
| ESS (Employee Self-Service) | /ess/* | not-started | Spec in `01_BUILD_PROMPT.md` §4.N |
| (other modules) | … | shell / coming-soon | Finance, transfers, etc. |

## 3. Feature Flags Implemented
- [x] UI language modes (EN / AR / bilingual) — top bar; persisted in Zustand
- [x] Business-line defaults (`src/lib/feature-flags.ts`)
- [x] Admin toggles → `feature_flags` table (`/admin/features`)
- [x] Sidebar: flags + role permissions + `user_module_permissions`
- [x] Super Admin: full nav, all flags treated enabled
- [x] `feat_below_cost_warning` — below purchase cost on sales docs
- [x] `feat_procurement_workflow` — admin workflow builder + process map
- [x] `feat_partial_sales_delivery` — partial payment + delivery note for paid qty
- [x] `feat_customer_product_blocks` — reserve stock per customer until date + WhatsApp reminder
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
- Extend i18n to Sales + Inventory modules (same `FieldLabel` / `useTranslations` pattern).
- Apply migrations `0015`–`0017` on Supabase if not yet run.
- Enable `feat_partial_sales_delivery` + `feat_customer_product_blocks` in Feature Management; test partial pay → DN → reservation flow.

## 8. Supabase Schema Status
| Migration | Status |
|---|---|
| 0001_init.sql | ready — sales tables |
| 0002–0009 | org, auth, backups, user module perms |
| 0010_procurement.sql | ready — full purchase chain |
| 0011_inventory.sql | ready — items, stock_levels, movements |
| 0012_building_materials.sql | ready — cost_price, supplier balance, MRN variance |
| 0013_document_templates.sql | ready — company print template settings |
| 0014_focus_raw_staging.sql | ready — Focus SQL raw import staging (focus-data-fetch) |
| 0015_procurement_branch_scope.sql | ready — branch_id on proforma, delivery, MRN |
| 0016_procurement_workflow.sql | ready — company_workflow_settings |
| 0017_sales_partial_delivery_blocks.sql | ready — partial pay, customer product blocks |
| 0018_purchase_payments_branch_backfill.sql | ready — fix payments missing branch_id |
