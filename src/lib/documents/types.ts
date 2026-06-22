import type { LineItem } from "@/lib/types";

export interface PrintableLine {
  item_name: string;
  qty: number;
  uom: string;
  unit_price: number;
  line_total: number;
}

export interface PrintableMetaRow {
  label: string;
  value: string;
}

/** Normalized payload for print preview and PDF — all ERP document types. */
export interface PrintableDocument {
  module: "sales" | "procurement" | "inventory" | "finance" | "ess";
  docType: string;
  title: string;
  number: string;
  date: string;
  status?: string;
  companyName: string;
  branchName?: string;
  partyLabel?: string;
  partyName?: string;
  meta?: PrintableMetaRow[];
  lines: PrintableLine[];
  subtotal?: number;
  vat_amount?: number;
  total?: number;
  amount?: number;
  currency?: string;
  notes?: string;
}

export interface PrintContext {
  companyName: string;
  branchName?: string;
  currency?: string;
}

export function linesToPrintable(lines: LineItem[]): PrintableLine[] {
  return lines.map((line) => {
    const gross = line.qty * line.unit_price;
    const net = gross * (1 - (line.discount_pct ?? 0) / 100);
    const withVat = net * (1 + (line.vat_pct ?? 0) / 100);
    return {
      item_name: line.item_name,
      qty: line.qty,
      uom: line.uom,
      unit_price: line.unit_price,
      line_total: Math.round(withVat * 100) / 100,
    };
  });
}

export function formatMoney(amount: number, currency = "AED"): string {
  return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
