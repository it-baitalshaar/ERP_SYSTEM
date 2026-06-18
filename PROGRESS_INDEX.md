# ERP Build — Progress Index
Last updated: 2026-06-16 by Cursor Agent

## 1. Status Snapshot
- Phase: 2 — Supabase + Sales + Procurement wired
- Stack: Next.js 15 + TS + Tailwind + shadcn + Zustand + Supabase
- Backend: Migrations through `0010_procurement.sql`; Sales + Procurement API live
- Structure: `.cursor/rules/erp-project-structure.mdc` (always apply)

## 2. Module Build Status
| Module | Route | Status | Notes |
|---|---|---|---|
| Sales (customers, orders, invoices) | /sales/* | in-progress | CRUD + approve/convert flows |
| Procurement (full purchase cycle) | /procurement/* | in-progress | MR→LPO→PFI→SDN→MRN→SINV→PAY; see `docs/PROCUREMENT_FLOW.md` |
| Org structure + data lifecycle | /admin/org-structure | done | Delete w/ backup, export/reset/restore |
| User module grants | /admin/users | done | Per-user extra modules; Super Admin bypass |
| Auth + platform init | /login, /itbaitalshaar | done | Username or email login |
| (other modules) | … | shell / coming-soon | Phase 1 shells unchanged |

## 3. Feature Flags Implemented
- [x] Business-line defaults (`src/lib/feature-flags.ts`)
- [x] Admin toggles → `feature_flags` table
- [x] Sidebar: flags + role permissions + `user_module_permissions`
- [x] Super Admin: full nav, all flags treated enabled

## 4. RBAC Implemented
- [x] Role defaults (`src/lib/role-permissions.ts`) — cashier/sales → sales only
- [x] Per-user module grants (`0009_user_module_permissions.sql`)
- [x] Super Admin bypasses nav and feature checks

## 5. Key Docs
| File | Purpose |
|---|---|
| `docs/PROCUREMENT_FLOW.md` | Purchase cycle spec (MR → payment) |
| `.cursor/rules/erp-project-structure.mdc` | Layering, naming, no-mess rules |
| `03_AI_INDEX_RULES.md` | How to maintain this index |

## 6. Known Gaps / Coming Soon
- RFQ / vendor comparison — nav `coming_soon` only
- MRN → inventory stock post (needs Inventory module)
- 3-way match UI validation (LPO vs MRN vs SINV)
- Purchase returns / debit notes, landed cost

## 7. Next Session Should Start With
- Run `0010_procurement.sql` on Supabase if not applied; smoke-test MR → LPO → MRN → payment flow end-to-end.

## 8. Supabase Schema Status
| Migration | Status |
|---|---|
| 0001_init.sql | ready |
| 0002_seed_users.sql | ready (after Auth users) |
| 0003–0009 | org, password reset, backups, data ops, user module perms |
| 0010_procurement.sql | ready — suppliers, MR, LPO, PFI, SDN, MRN, SINV, payments |
