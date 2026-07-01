# Extra Features (Beyond PRD / User-Requested)

Living catalog of capabilities added during build that extend or specialize the base PRD.
**Update this file** whenever a new extra is shipped — see `.cursor/rules/erp-docs-and-features.mdc`.

| Feature | Flag / admin setting | Key paths | Notes |
|---------|---------------------|-----------|-------|
| Document print + PDF | — | `src/lib/documents/*`, `createPrintColumn` | All sales + procurement lists |
| WhatsApp share | — | `src/lib/documents/whatsapp.ts`, `document-whatsapp-dialog.tsx` | Print column + phone from party |
| Admin document delete | Admin role | `src/lib/server/document-delete.ts` | Linked-doc blockers |
| Admin customer delete | Admin role | `src/lib/server/customer-delete.ts` | Block if transactions exist |
| 3-way match (LPO/MRN/SINV) | — | `src/lib/procurement/three-way-match.ts` | Post validation + UI panel |
| LPO price variance approval | Admin on MRN post | `src/lib/server/mrn-lpo-variance.ts`, `mrn-post-dialog.tsx` | Updates LPO, not payable from stale price |
| Purchase payments → supplier balance | — | `src/lib/server/supplier-balance.ts`, `/procurement/payments` | Link to supplier invoice; no mark-paid on invoice |
| UOM catalog + subunits | — | `src/lib/inventory/uom.ts`, `item-form-dialog.tsx` | box, pcs, dozen, sqm, etc. |
| MRN → inventory cost + sale price | — | `src/lib/server/inventory.ts` `postMrnToInventory` | `items.cost_price`, `unit_price` |
| Stock movements list | — | `/inventory/movements`, `api/inventory` `stock_movements` | Audit trail |
| Document templates (LPO + quote) | Admin → Document Templates | `src/lib/documents/templates/*`, `0013_document_templates.sql` | Logo, doc naming, classic vs standard |
| Below-cost sale warning | `feat_below_cost_warning` | `src/lib/sales/below-cost.ts`, Feature Management | Warn if sell < `cost_price` |
| Product warehouse availability | `feat_product_warehouse_availability` | `src/lib/sales/warehouse-availability.ts`, sales document form | Inline + details popup per warehouse |
| Partial sales delivery | `feat_partial_sales_delivery` | `partial-delivery-dialog.tsx`, `sales-delivery.ts` | Partial pay + DN for paid qty |
| Customer product reservations | `feat_customer_product_blocks` | `customer-product-blocks-panel.tsx`, `0017` migration | Hold stock per customer + WhatsApp reminder |
| Procurement workflow builder | `feat_procurement_workflow` | `/admin/workflows/procurement`, `/procurement/workflow` | Configurable approvals + mindmap |
| Windows print dialog | — | `src/lib/documents/print.ts` `printHtmlInFrame` | iframe + `window.print()` |
| Per-user module grants | — | `0009_user_module_permissions.sql`, `/admin/users` | Extra modules beyond role |

## Related docs

- `01_BUILD_PROMPT.md` — §4.O–§4.R appendices  
- `PROGRESS_INDEX.md` — build status  
- `03_AI_INDEX_RULES.md` — how to maintain the index  
- `.cursor/rules/` — agent rules (structure + docs sync)
