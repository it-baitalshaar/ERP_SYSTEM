# Procurement (Purchase) Flow — Bait Al Shaar ERP

Source of truth for the **end-to-end purchase cycle**. Implementation must follow this order and link documents — do not skip steps without explicit admin override.

---

## 1. Standard document chain

| Step | Document | Code prefix | Purpose |
|------|----------|-------------|---------|
| 1 | **Material Request** (authorize) | `MR` | Internal request for materials; needs approval before buying |
| 2 | **LPO** (Local Purchase Order) | `LPO` | Commitment to supplier; created from approved MR |
| 3 | **Proforma Invoice** | `PFI` | Supplier quote / proforma before shipment |
| 4 | **Supplier Delivery Note** | `SDN` | Proof of dispatch / inbound delivery from supplier |
| 5 | **MRN** (Material Receipt Note) | `MRN` | Warehouse receipt; triggers stock (when Inventory is live) |
| 6 | **Price updation** | (on MRN) | Update item costs when received price ≠ PO price |
| 7 | **Supplier Tax Invoice** | `SINV` | Payable invoice; 3-way match vs LPO + MRN |
| 8 | **Purchase Payment** | `PAY` | Advance, on delivery, partial, final, or credit settlement |

---

## 2. Payment timing (on LPO)

| Mode | When payment happens |
|------|----------------------|
| `advance` | Before or on order confirmation |
| `on_delivery` | When goods are received (MRN posted) |
| `credit` | Per supplier credit days after supplier invoice |

Payments can be **advance + balance**, **partial**, or **full** — tracked on `purchase_payments`.

---

## 3. Additional steps (often missed)

| Item | Notes |
|------|--------|
| **Supplier master** | Payment terms, currency, classification (local/import) |
| **RFQ / vendor comparison** | Optional before LPO when price not fixed |
| **Approval workflow** | MR → `pending_approval` → `approved` / `rejected` |
| **3-way match** | LPO qty/price vs MRN received vs supplier invoice |
| **Purchase return / debit note** | Future: return to supplier after MRN |
| **Landed cost** | Freight, duty — future on MRN |
| **Budget / commitment** | Future: reserved amount on approved LPO |
| **Inventory link** | MRN posts stock when Items module is wired |

---

## 4. Status lifecycle (shared `document_status`)

`draft` → `pending_approval` → `approved` → `posted` | `rejected` | `cancelled`

- **MR**: submit for approval → approve → convert to LPO  
- **LPO**: approve → send to supplier → link proforma / delivery  
- **MRN**: post → updates prices + inventory  
- **SINV**: post → updates supplier balance  
- **PAY**: post → allocates to LPO / SINV  

---

## 5. Code layout (mirror Sales)

```
src/
  app/(app)/procurement/<resource>/page.tsx   # UI pages only
  app/api/procurement/route.ts                # single API entry (resource param)
  lib/server/procurement.ts                   # DB logic, mappers, numbering
  lib/data/procurement.ts                     # client fetch helpers
  components/procurement/                     # forms & dialogs
  lib/procurement/catalog.ts                  # temp catalog until Inventory
supabase/migrations/0010_procurement.sql
```

Do **not** put business logic in page components. Do **not** add duplicate API routes per document type unless the file exceeds maintainability (~400 lines) — then split by domain, not by random feature.

---

## 6. Numbering

`{PREFIX}-{BRANCH_CODE}-{YEAR}-{SEQ}` e.g. `LPO-DXB-2026-00001`

---

## 7. Cross-references

- Sales module pattern: `src/lib/server/sales.ts`, `src/app/api/sales/route.ts`
- PRD: `02_PRD.md` procurement rows
- Progress: `PROGRESS_INDEX.md` § Procurement
