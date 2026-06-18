# AI Build Tracking Rules — PROGRESS_INDEX.md Protocol

This file defines how the AI builder (and any human/AI continuing the work
later) must maintain a living progress index, so context can be picked up
in a new session without re-reading the whole codebase or re-explaining
requirements.

---

## 1. Create and maintain `/PROGRESS_INDEX.md` at the project root

On the **first** build session, create `PROGRESS_INDEX.md` with this
structure:

```markdown
# ERP Build — Progress Index
Last updated: <ISO date> by <session/agent name>

## 1. Status Snapshot
- Phase: 1 (Frontend UI shell)
- Stack: Next.js + TS + Tailwind + shadcn
- Backend: Not connected (mock data in lib/mock-data/)

## 2. Module Build Status
| Module | Route | Status | Notes |
|---|---|---|---|
| Sales Dashboard | /sales | done | KPI cards + recent orders table |
| Quotations | /sales/quotations | done | list + create modal |
| Sales Orders | /sales/orders | in-progress | list done, convert-to-invoice pending |
| ... | ... | not-started | ... |

Status values: `not-started`, `in-progress`, `done`, `coming-soon-shell`

## 3. Feature Flags Implemented
- [ ] Feature flag store/context created
- [ ] Admin > Feature Management page
- [ ] Sidebar reacts to flags
- List of flags currently wired: ...

## 4. RBAC Implemented
- [ ] Role CRUD page
- [ ] Permission matrix UI
- [ ] Role switcher (dev tool) for QA
- [ ] Route guards applied to: <list modules>

## 5. Mock Data Files
| File | Covers |
|---|---|
| lib/mock-data/companies.ts | Company, Branch |
| lib/mock-data/items.ts | Item, StockLevel, Category |
| ... | ... |

## 6. Known Gaps / Coming Soon Items (matches PRD §4 "Soon" rows)
- ADD-040 E-Invoicing — config screen only, no ASP connection
- API-001..010 — Integration Hub cards only
- ... (keep this list in sync with 02_PRD.md, don't duplicate full text,
  just reference IDs)

## 7. Next Session Should Start With
- <single most useful next task, written by the last session>
```

---

## 2. Update rules (every session / every significant change)

1. **Before starting work**: read `PROGRESS_INDEX.md` first — it is the
   single source of truth for "what exists" and "what's next." Do not
   re-scan the whole repo unless the index seems stale/incorrect.
2. **After completing a module/page**: update its row in §2 (Module Build
   Status) — change status, add a one-line note (max ~15 words) describing
   what was done and what's left if partial.
3. **After adding/removing a feature flag**: update §3.
4. **After RBAC changes**: update §4.
5. **After adding a new mock data file**: add a row to §5.
6. **Never duplicate the PRD** — reference requirement IDs (e.g. "ADD-018")
   instead of re-describing them. The PRD (`02_PRD.md`) is the spec; the
   index is only status.
7. **Always update §7** ("Next Session Should Start With") as the last
   step before ending a session — one specific, actionable item.
8. Keep the whole file under ~150 lines. If §2 grows too long, split into
   `/PROGRESS_INDEX_modules.md` per module group and link from the main
   index, but keep §1, §6, §7 in the main file always.

---

## 3. Token-efficiency rules for the AI builder

- Don't re-list full requirement descriptions in the index — IDs only,
  cross-reference `02_PRD.md`.
- Don't paste large code snippets into the index — just file paths.
- When resuming, read **only**: `PROGRESS_INDEX.md` → relevant module's
  existing files (via file path from §2/§5) → start work. Avoid full
  repo scans.
- When a "Coming Soon" item later gets real backend logic, move its status
  from `coming-soon-shell` to `in-progress`/`done` and remove its ID from
  §6.

---

## 4. File map for this project (created today)
- `01_BUILD_PROMPT.md` — paste into the AI frontend builder to start/extend
  the build.
- `02_PRD.md` — full requirement-to-treatment mapping (source of truth for
  scope).
- `03_AI_INDEX_RULES.md` — this file; tells the AI how to maintain
  `PROGRESS_INDEX.md` going forward.
- `PROGRESS_INDEX.md` — created by the AI builder on first run inside the
  generated project repo (not provided here, since the project doesn't
  exist yet).

---

## 5. Supabase Migration Note (for later)
When Phase 2 starts, create `/supabase/migrations/0001_init.sql` etc.
Keep each migration additive and named with sequential numeric prefixes.
Add a `## 8. Supabase Schema Status` section to `PROGRESS_INDEX.md` at that
point, tracking which tables/RLS policies are done — same status-table
format as §2.

---

## 6. Project structure (always keep tidy)

The project must stay **well structured** — no scattered logic, no duplicate
API routes, no business rules in page components.

**Enforced by:** `.cursor/rules/erp-project-structure.mdc` (always apply in Cursor).

| Layer | Location |
|---|---|
| UI pages | `src/app/(app)/<module>/<entity>/page.tsx` |
| Client fetch | `src/lib/data/<module>.ts` |
| API | `src/app/api/<module>/route.ts` (`resource` param) |
| Server / DB | `src/lib/server/<module>.ts` |
| Schema | `supabase/migrations/NNNN_<name>.sql` |
| Module spec | `docs/<MODULE>_FLOW.md` when non-trivial |

When adding a module, mirror the nearest completed one (Sales → Procurement).
Update §2 and §7 in `PROGRESS_INDEX.md` before ending the session.
