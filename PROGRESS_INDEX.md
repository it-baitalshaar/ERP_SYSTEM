# ERP Build — Progress Index
Last updated: 2026-06-16 by Cursor Agent

## 1. Status Snapshot
- Phase: 2 — Supabase + Sales + Procurement + Inventory core wired
- Stack: Next.js 15 + TS + Tailwind + shadcn + Zustand + Supabase
- Backend: Migrations through `0013_document_templates.sql`
- Structure: `.cursor/rules/erp-project-structure.mdc` (always apply)

## 2. Module Build Status
| Module | Route | Status | Notes |
|---|---|---|---|
| Inventory (items, stock, movements) | /inventory/* | in-progress | UOM catalog; cost/sale on items; MRN updates stock + pricing |
| Sales (customers, orders, invoices, DN) | /sales/* | in-progress | Print/PDF on all transactional lists |
| Procurement (full purchase cycle) | /procurement/* | in-progress | LPO variance approval; linked purchase payments |
| Document print / PDF | cross-module | done | Classic LPO + Standard quote templates; admin customization |
| Org structure + data lifecycle | /admin/org-structure | done | Delete w/ backup, export/reset/restore |
| User module grants | /admin/users | done | Per-user extra modules; Super Admin bypass |
| Auth + platform init | /login, /itbaitalshaar | done | Username or email login |
| ESS (Employee Self-Service) | /ess/* | not-started | Spec in `01_BUILD_PROMPT.md` §4.N |
| (other modules) | … | shell / coming-soon | Finance, transfers, etc. |

## 3. Feature Flags Implemented
- [x] Business-line defaults (`src/lib/feature-flags.ts`)
- [x] Admin toggles → `feature_flags` table
- [x] Sidebar: flags + role permissions + `user_module_permissions`
- [x] Super Admin: full nav, all flags treated enabled

## 4. RBAC Implemented
- [x] Role defaults (`src/lib/role-permissions.ts`)
- [x] Per-user module grants (`0009_user_module_permissions.sql`)
- [x] Super Admin bypasses nav and feature checks

## 5. Key Docs
| File | Purpose |
|---|---|
| `docs/PROCUREMENT_FLOW.md` | Purchase cycle spec (MR → payment) |
| `.cursor/rules/erp-project-structure.mdc` | Layering, naming, no-mess rules |
| `03_AI_INDEX_RULES.md` | How to maintain this index |
| `01_BUILD_PROMPT.md` §4.N | ESS portal spec (later) |
| `01_BUILD_PROMPT.md` §4.O | Print/PDF standard for all documents |

## 6. Known Gaps / Coming Soon
- RFQ / vendor comparison — nav `coming_soon` only
- ~~3-way match UI (LPO vs MRN vs SINV)~~ — done (MRN → invoice + post validation)
- ~~LPO price variance~~ — admin approves; LPO updated (not payable from stale LPO)
- ~~Purchase payments linked to supplier invoices~~ — post reduces supplier balance
- ~~UOM catalog (box, pcs, dozen, sqm, etc.)~~ — item form + `uom_conversions`
- ~~Stock movements list~~ — `/inventory/movements`
- Customer receipt payments (mirror of purchase payments) — sales invoices still use mark paid
- Purchase returns, landed cost
- Stock transfers, adjustments, batch lots
- Finance / GL integration

## 7. Next Session Should Start With
- Run migration `0012_building_materials.sql` on Supabase; smoke-test MR→LPO→MRN (price variance)→invoice→payment→stock.
- Customer payment receipts linked to tax invoices (like purchase payments).
- Stock transfers / adjustments UI.

## 8. Supabase Schema Status
| Migration | Status |
|---|---|
| 0001_init.sql | ready — sales tables |
| 0002–0009 | org, auth, backups, user module perms |
| 0010_procurement.sql | ready — full purchase chain |
| 0011_inventory.sql | ready — items, stock_levels, movements, delivery_notes |
| 0012_building_materials.sql | ready — cost_price, supplier balance, MRN variance flags |
| 0013_document_templates.sql | ready — per-company print template settings |
