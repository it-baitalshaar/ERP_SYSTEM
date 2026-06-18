import type {
  Customer,
  DeliveryNote,
  Quotation,
  SalesOrder,
  TaxInvoice,
} from "@/lib/types";
import { COMPANY_AL_SAQIYA, BRANCH_AL_SAQIYA_HQ } from "@/lib/mock-data/companies";

export const customers: Customer[] = [
  {
    id: "cust-1",
    company_id: COMPANY_AL_SAQIYA,
    name: "Emirates Building Materials",
    email: "procurement@ebm.ae",
    phone: "+971 4 123 4567",
    classification: "wholesale",
    credit_limit: 500000,
    outstanding_balance: 125000,
    is_blocked: false,
  },
  {
    id: "cust-2",
    company_id: COMPANY_AL_SAQIYA,
    name: "Al Noor Trading",
    email: "orders@alnoor.ae",
    phone: "+971 2 987 6543",
    classification: "vip",
    credit_limit: 1000000,
    outstanding_balance: 890000,
    is_blocked: false,
  },
  {
    id: "cust-3",
    company_id: COMPANY_AL_SAQIYA,
    name: "Quick Mart LLC",
    email: "buyer@quickmart.ae",
    phone: "+971 50 111 2233",
    classification: "retail",
    credit_limit: 50000,
    outstanding_balance: 62000,
    is_blocked: true,
  },
];

export const quotations: Quotation[] = [
  {
    id: "qt-1",
    company_id: COMPANY_AL_SAQIYA,
    branch_id: BRANCH_AL_SAQIYA_HQ,
    customer_id: "cust-1",
    customer_name: "Emirates Building Materials",
    number: "QT-DXB-2026-00045",
    date: "2026-06-01",
    valid_until: "2026-06-30",
    status: "approved",
    lines: [
      { item_id: "item-1", item_name: "Ceramic Tiles 60x60", qty: 500, uom: "box", unit_price: 85, discount_pct: 5, vat_pct: 5 },
    ],
    total: 40375,
  },
  {
    id: "qt-2",
    company_id: COMPANY_AL_SAQIYA,
    branch_id: BRANCH_AL_SAQIYA_HQ,
    customer_id: "cust-2",
    customer_name: "Al Noor Trading",
    number: "QT-DXB-2026-00046",
    date: "2026-06-10",
    valid_until: "2026-07-10",
    status: "draft",
    lines: [
      { item_id: "item-2", item_name: "Portland Cement 50kg", qty: 200, uom: "bag", unit_price: 22, discount_pct: 0, vat_pct: 5 },
    ],
    total: 4620,
  },
];

export const salesOrders: SalesOrder[] = [
  {
    id: "so-1",
    company_id: COMPANY_AL_SAQIYA,
    branch_id: BRANCH_AL_SAQIYA_HQ,
    customer_id: "cust-1",
    customer_name: "Emirates Building Materials",
    number: "SO-DXB-2026-00123",
    date: "2026-06-05",
    status: "approved",
    lines: [
      { item_id: "item-1", item_name: "Ceramic Tiles 60x60", qty: 500, uom: "box", unit_price: 85, discount_pct: 5, vat_pct: 5, warehouse_id: "wh-1" },
    ],
    total: 40375,
    salesperson_id: "user-2",
  },
  {
    id: "so-2",
    company_id: COMPANY_AL_SAQIYA,
    branch_id: "br-2",
    customer_id: "cust-2",
    customer_name: "Al Noor Trading",
    number: "SO-AUH-2026-00089",
    date: "2026-06-12",
    status: "pending_approval",
    lines: [
      { item_id: "item-3", item_name: "Steel Rebar 12mm", qty: 100, uom: "ton", unit_price: 2800, discount_pct: 2, vat_pct: 5, warehouse_id: "wh-2" },
    ],
    total: 288120,
    salesperson_id: "user-2",
  },
];

export const taxInvoices: TaxInvoice[] = [
  {
    id: "inv-1",
    company_id: COMPANY_AL_SAQIYA,
    branch_id: BRANCH_AL_SAQIYA_HQ,
    customer_id: "cust-1",
    customer_name: "Emirates Building Materials",
    sales_order_id: "so-1",
    number: "INV-DXB-2026-00098",
    date: "2026-06-06",
    status: "posted",
    lines: [
      { item_id: "item-1", item_name: "Ceramic Tiles 60x60", qty: 500, uom: "box", unit_price: 85, discount_pct: 5, vat_pct: 5, warehouse_id: "wh-1" },
    ],
    subtotal: 40375,
    vat_amount: 2018.75,
    total: 42393.75,
    is_paid: true,
    e_invoice_status: "accepted",
  },
  {
    id: "inv-2",
    company_id: COMPANY_AL_SAQIYA,
    branch_id: BRANCH_AL_SAQIYA_HQ,
    customer_id: "cust-3",
    customer_name: "Quick Mart LLC",
    number: "INV-DXB-2026-00099",
    date: "2026-06-14",
    status: "posted",
    lines: [
      { item_id: "item-2", item_name: "Portland Cement 50kg", qty: 50, uom: "bag", unit_price: 22, discount_pct: 0, vat_pct: 5 },
    ],
    subtotal: 1100,
    vat_amount: 55,
    total: 1155,
    is_paid: false,
    e_invoice_status: "pending",
  },
];

export const deliveryNotes: DeliveryNote[] = [
  {
    id: "dn-1",
    company_id: COMPANY_AL_SAQIYA,
    branch_id: BRANCH_AL_SAQIYA_HQ,
    invoice_id: "inv-1",
    number: "DN-DXB-2026-00067",
    date: "2026-06-07",
    status: "posted",
    lines: [
      { item_id: "item-1", item_name: "Ceramic Tiles 60x60", qty: 500, uom: "box", unit_price: 85, discount_pct: 0, vat_pct: 0, warehouse_id: "wh-1" },
    ],
  },
];
