# ERP Build — Progress Index
Last updated: 2026-06-16 by Cursor Agent

## 1. Status Snapshot
- Phase: 2 started (Supabase schema + Sales module wired)
- Stack: Next.js 15 + TS + Tailwind + shadcn + Zustand + Supabase
- Backend: Supabase clients + migrations; Sales read paths live

## 2. Module Build Status
| Module | Route | Status | Notes |
|---|---|---|---|
| Sales (customers, orders, invoices) | /sales/* | in-progress | Reads from Supabase with mock fallback |
| Company feature defaults | Admin + store | done | Business-line drives default flags (PRD §5) |
| Auth | /login | done | Supabase password auth + middleware |
| Admin company rename | /admin/companies | done | Editable name → Supabase `companies` |
| (other modules) | … | done shell | Unchanged Phase 1 shells |

## 3. Feature Flags Implemented
- [x] Business-line defaults (`src/lib/feature-flags.ts`)
- [x] Trading → sales/procurement/inventory/finance/ecommerce
- [x] Construction + Real Estate → respective modules + shared core
- [x] Logistics → logistics module group
- [x] Admin toggles persist to `feature_flags` table
- [x] Sidebar reacts to flags + business_line nav gating

## 4. Companies (seed)
| Company | Business lines | Default modules |
|---|---|---|
| AL SAQIYA TRADING | trading | Sales, Procurement, Inventory, Finance, … |
| Bait Al-Shaar General Contracting and Maintenance | construction, real_estate | Construction, Real Estate, shared core |

## 5. Users (AL SAQIYA — seed via `scripts/seed-auth-users.ts`)
| Email | Role |
|---|---|
| admin@alsaqiya.ae | Super Admin |
| sales@alsaqiya.ae | Salesperson |
| cashier@alsaqiya.ae | Cashier |
| accountant@alsaqiya.ae | Accountant |

## 6. Supabase Schema Status
| Migration | Status |
|---|---|
| 0001_init.sql | ready — companies, RBAC, feature_flags, sales tables, RLS |
| 0002_seed_users.sql | ready — run after Auth users created |

## 7. Next Session Should Start With
- Run migrations on Supabase project, seed auth users, verify Sales CRUD write paths (create quotation/SO).
