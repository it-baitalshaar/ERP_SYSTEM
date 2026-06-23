import type { LineItem } from "@/lib/types";
import { lineSubtotal } from "@/lib/sales/calculations";
import type { DocumentTemplateSettings } from "@/lib/documents/template-settings";

export interface PrintableLine {
  item_name: string;
  qty: number;
  uom: string;
  unit_price: number;
  line_total: number;
  /** Net after discount, before VAT (standard template Amount column). */
  net_amount?: number;
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
  partyPhone?: string;
  meta?: PrintableMetaRow[];
  lines: PrintableLine[];
  subtotal?: number;
  vat_amount?: number;
  total?: number;
  amount?: number;
  currency?: string;
  notes?: string;
  /** Total line discount (standard template). */
  discount_amount?: number;
}

export interface PrintContext {
  companyName: string;
  branchName?: string;
  currency?: string;
  companyAddress?: string;
  templateSettings?: DocumentTemplateSettings;
}

export function linesToPrintable(lines: LineItem[]): PrintableLine[] {
  return lines.map((line) => {
    const net = lineSubtotal(line);
    const withVat = net * (1 + (line.vat_pct ?? 0) / 100);
    return {
      item_name: line.item_name,
      qty: line.qty,
      uom: line.uom,
      unit_price: line.unit_price,
      net_amount: Math.round(net * 100) / 100,
      line_total: Math.round(withVat * 100) / 100,
    };
  });
}

export function formatMoney(amount: number, currency = "AED"): string {
  return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
