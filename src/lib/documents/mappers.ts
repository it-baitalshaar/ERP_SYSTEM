import type {
  DeliveryNote,
  MaterialReceiptNote,
  MaterialRequest,
  ProformaInvoice,
  PurchaseOrder,
  PurchasePayment,
  Quotation,
  SalesOrder,
  SupplierDeliveryNote,
  SupplierInvoice,
  TaxInvoice,
} from "@/lib/types";
import { documentTotals } from "@/lib/sales/calculations";
import type { PrintableDocument, PrintContext } from "@/lib/documents/types";
import { linesToPrintable } from "@/lib/documents/types";

function base(
  module: PrintableDocument["module"],
  docType: string,
  title: string,
  number: string,
  date: string,
  ctx: PrintContext,
  extra?: Partial<PrintableDocument>
): PrintableDocument {
  return {
    module,
    docType,
    title,
    number,
    date,
    companyName: ctx.companyName,
    branchName: ctx.branchName,
    currency: ctx.currency ?? "AED",
    lines: [],
    ...extra,
  };
}

export function quotationToPrintable(q: Quotation, ctx: PrintContext): PrintableDocument {
  const totals = documentTotals(q.lines);
  return base("sales", "quotation", "Quotation", q.number, q.date, ctx, {
    status: q.status,
    partyLabel: "Customer",
    partyName: q.customer_name,
    meta: q.valid_until ? [{ label: "Valid until", value: q.valid_until }] : undefined,
    lines: linesToPrintable(q.lines),
    subtotal: totals.subtotal,
    vat_amount: totals.vat_amount,
    total: totals.total,
  });
}

export function salesOrderToPrintable(o: SalesOrder, ctx: PrintContext): PrintableDocument {
  const totals = documentTotals(o.lines);
  return base("sales", "sales_order", "Sales Order", o.number, o.date, ctx, {
    status: o.status,
    partyLabel: "Customer",
    partyName: o.customer_name,
    lines: linesToPrintable(o.lines),
    subtotal: totals.subtotal,
    vat_amount: totals.vat_amount,
    total: totals.total,
  });
}

export function taxInvoiceToPrintable(inv: TaxInvoice, ctx: PrintContext): PrintableDocument {
  return base("sales", "tax_invoice", "Tax Invoice", inv.number, inv.date, ctx, {
    status: inv.status,
    partyLabel: "Customer",
    partyName: inv.customer_name,
    meta: [
      { label: "Paid", value: inv.is_paid ? "Yes" : "No" },
      ...(inv.e_invoice_status
        ? [{ label: "E-Invoice", value: inv.e_invoice_status }]
        : []),
    ],
    lines: linesToPrintable(inv.lines),
    subtotal: inv.subtotal,
    vat_amount: inv.vat_amount,
    total: inv.total,
  });
}

export function deliveryNoteToPrintable(dn: DeliveryNote, ctx: PrintContext): PrintableDocument {
  const totals = documentTotals(dn.lines);
  return base("sales", "delivery_note", "Delivery Note", dn.number, dn.date, ctx, {
    status: dn.status,
    partyLabel: "Customer",
    partyName: dn.customer_name,
    meta: dn.invoice_number ? [{ label: "Invoice", value: dn.invoice_number }] : undefined,
    lines: linesToPrintable(dn.lines),
    subtotal: totals.subtotal,
    vat_amount: totals.vat_amount,
    total: totals.total,
  });
}

export function materialRequestToPrintable(
  mr: MaterialRequest,
  ctx: PrintContext
): PrintableDocument {
  const totals = documentTotals(mr.lines);
  return base("procurement", "material_request", "Material Request", mr.number, mr.date, ctx, {
    status: mr.status,
    partyLabel: "Requested by",
    partyName: mr.requester_name ?? mr.requested_by,
    notes: mr.notes,
    lines: linesToPrintable(mr.lines),
    total: totals.total,
  });
}

export function purchaseOrderToPrintable(po: PurchaseOrder, ctx: PrintContext): PrintableDocument {
  const totals = documentTotals(po.lines);
  return base("procurement", "purchase_order", "Local Purchase Order (LPO)", po.number, po.date, ctx, {
    status: po.status,
    partyLabel: "Supplier",
    partyName: po.supplier_name,
    meta: [
      { label: "Payment terms", value: po.payment_terms_type.replace("_", " ") },
      ...(po.expected_delivery
        ? [{ label: "Expected delivery", value: po.expected_delivery }]
        : []),
    ],
    lines: linesToPrintable(po.lines),
    total: totals.total,
    currency: po.currency,
  });
}

export function proformaToPrintable(pfi: ProformaInvoice, ctx: PrintContext): PrintableDocument {
  const totals = documentTotals(pfi.lines);
  return base("procurement", "proforma", "Proforma Invoice", pfi.number, pfi.date, ctx, {
    status: pfi.status,
    partyLabel: "Supplier",
    partyName: pfi.supplier_name,
    meta: [
      ...(pfi.purchase_order_number
        ? [{ label: "LPO", value: pfi.purchase_order_number }]
        : []),
      ...(pfi.supplier_reference
        ? [{ label: "Supplier ref", value: pfi.supplier_reference }]
        : []),
    ],
    lines: linesToPrintable(pfi.lines),
    total: totals.total,
    currency: pfi.currency,
  });
}

export function supplierDeliveryNoteToPrintable(
  sdn: SupplierDeliveryNote,
  ctx: PrintContext
): PrintableDocument {
  return base(
    "procurement",
    "supplier_delivery_note",
    "Supplier Delivery Note",
    sdn.number,
    sdn.date,
    ctx,
    {
      status: sdn.status,
      partyLabel: "Supplier",
      partyName: sdn.supplier_name,
      meta: [
        ...(sdn.purchase_order_number ? [{ label: "LPO", value: sdn.purchase_order_number }] : []),
        ...(sdn.carrier ? [{ label: "Carrier", value: sdn.carrier }] : []),
      ],
      lines: linesToPrintable(sdn.lines),
      notes: sdn.notes,
    }
  );
}

export function mrnToPrintable(mrn: MaterialReceiptNote, ctx: PrintContext): PrintableDocument {
  const totals = documentTotals(mrn.lines);
  return base(
    "procurement",
    "mrn",
    "Material Receipt Note (MRN)",
    mrn.number,
    mrn.date,
    ctx,
    {
      status: mrn.status,
      meta: mrn.purchase_order_number ? [{ label: "LPO", value: mrn.purchase_order_number }] : undefined,
      lines: linesToPrintable(mrn.lines),
      total: totals.total,
    }
  );
}

export function supplierInvoiceToPrintable(
  inv: SupplierInvoice,
  ctx: PrintContext
): PrintableDocument {
  return base("procurement", "supplier_invoice", "Supplier Tax Invoice", inv.number, inv.date, ctx, {
    status: inv.status,
    partyLabel: "Supplier",
    partyName: inv.supplier_name,
    lines: linesToPrintable(inv.lines),
    subtotal: inv.subtotal,
    vat_amount: inv.vat_amount,
    total: inv.total,
    meta: [
      ...(inv.purchase_order_number ? [{ label: "LPO", value: inv.purchase_order_number }] : []),
      ...(inv.mrn_number ? [{ label: "MRN", value: inv.mrn_number }] : []),
      { label: "Paid", value: inv.is_paid ? "Yes" : "No" },
    ],
  });
}

export function purchasePaymentToPrintable(
  pay: PurchasePayment,
  ctx: PrintContext
): PrintableDocument {
  return base("procurement", "purchase_payment", "Purchase Payment", pay.number, pay.date, ctx, {
    status: pay.status,
    partyLabel: "Supplier",
    partyName: pay.supplier_name,
    amount: pay.amount,
    currency: pay.currency,
    meta: [
      { label: "Payment type", value: pay.payment_type.replace("_", " ") },
      ...(pay.reference ? [{ label: "Reference", value: pay.reference }] : []),
    ],
    lines: [],
  });
}
