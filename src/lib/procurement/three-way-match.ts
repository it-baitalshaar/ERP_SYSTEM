import { documentTotal } from "@/lib/sales/calculations";
import type { LineItem, PriceUpdateLine } from "@/lib/types";

export type ThreeWayLineStatus =
  | "matched"
  | "qty_mismatch"
  | "price_mismatch"
  | "over_received"
  | "missing_on_lpo"
  | "missing_on_mrn"
  | "missing_on_invoice";

export interface ThreeWayMatchLine {
  item_id: string;
  item_name: string;
  uom: string;
  lpo_qty: number;
  lpo_unit_price: number;
  mrn_qty: number;
  mrn_unit_price: number;
  invoice_qty: number;
  invoice_unit_price: number;
  qty_variance: number;
  price_variance: number;
  status: ThreeWayLineStatus;
}

export interface ThreeWayMatchResult {
  purchase_order_id: string;
  purchase_order_number: string;
  mrn_id: string;
  mrn_number: string;
  supplier_invoice_id?: string;
  supplier_invoice_number?: string;
  supplier_id: string;
  supplier_name: string;
  lines: ThreeWayMatchLine[];
  matched: boolean;
  lpo_total: number;
  mrn_total: number;
  invoice_total: number;
  issues: string[];
}

const QTY_TOLERANCE = 0.001;
const MONEY_TOLERANCE = 0.02;

function lineKey(line: Pick<LineItem, "item_id" | "item_name">): string {
  return line.item_id || line.item_name.trim().toLowerCase();
}

function near(a: number, b: number, tolerance: number): boolean {
  return Math.abs(a - b) <= tolerance;
}

export function mrnEffectiveUnitPrice(
  line: LineItem,
  priceUpdates: PriceUpdateLine[]
): number {
  const update = priceUpdates.find(
    (u) => u.item_id === line.item_id || u.item_name === line.item_name
  );
  return update?.new_unit_price ?? line.unit_price;
}

export function linesFromMrn(
  mrnLines: LineItem[],
  priceUpdates: PriceUpdateLine[]
): LineItem[] {
  return mrnLines.map((line) => ({
    ...line,
    unit_price: mrnEffectiveUnitPrice(line, priceUpdates),
    vat_pct: line.vat_pct ?? 5,
  }));
}

/** Supplier invoice lines: MRN qty with LPO unit price (standard 3-way match). */
export function invoiceLinesFromMrnAndLpo(
  mrnLines: LineItem[],
  lpoLines: LineItem[]
): LineItem[] {
  const lpoMap = new Map(lpoLines.map((l) => [lineKey(l), l]));
  return mrnLines.map((line) => {
    const lpo = lpoMap.get(lineKey(line));
    return {
      ...line,
      unit_price: lpo?.unit_price ?? line.unit_price,
      vat_pct: line.vat_pct ?? 5,
    };
  });
}

export function computeThreeWayMatch(input: {
  purchase_order_id: string;
  purchase_order_number: string;
  mrn_id: string;
  mrn_number: string;
  supplier_id: string;
  supplier_name: string;
  lpo_lines: LineItem[];
  mrn_lines: LineItem[];
  mrn_price_updates: PriceUpdateLine[];
  invoice_lines: LineItem[];
  supplier_invoice_id?: string;
  supplier_invoice_number?: string;
}): ThreeWayMatchResult {
  const lpoMap = new Map(input.lpo_lines.map((l) => [lineKey(l), l]));
  const mrnMap = new Map(input.mrn_lines.map((l) => [lineKey(l), l]));
  const invMap = new Map(input.invoice_lines.map((l) => [lineKey(l), l]));

  const keys = new Set([...lpoMap.keys(), ...mrnMap.keys(), ...invMap.keys()]);
  const lines: ThreeWayMatchLine[] = [];
  const issues: string[] = [];

  for (const key of keys) {
    const lpo = lpoMap.get(key);
    const mrn = mrnMap.get(key);
    const inv = invMap.get(key);

    const item_name = inv?.item_name ?? mrn?.item_name ?? lpo?.item_name ?? key;
    const item_id = inv?.item_id ?? mrn?.item_id ?? lpo?.item_id ?? "";
    const uom = inv?.uom ?? mrn?.uom ?? lpo?.uom ?? "pcs";

    const lpo_qty = lpo?.qty ?? 0;
    const lpo_unit_price = lpo?.unit_price ?? 0;
    const mrn_qty = mrn?.qty ?? 0;
    const mrn_unit_price = mrn
      ? mrnEffectiveUnitPrice(mrn, input.mrn_price_updates)
      : 0;
    const invoice_qty = inv?.qty ?? 0;
    const invoice_unit_price = inv?.unit_price ?? 0;

    let status: ThreeWayLineStatus = "matched";

    if (!lpo) status = "missing_on_lpo";
    else if (!mrn) status = "missing_on_mrn";
    else if (!inv) status = "missing_on_invoice";
    else if (mrn_qty > lpo_qty + QTY_TOLERANCE) status = "over_received";
    else if (!near(invoice_qty, mrn_qty, QTY_TOLERANCE)) status = "qty_mismatch";
    else if (!near(invoice_unit_price, lpo_unit_price, MONEY_TOLERANCE)) status = "price_mismatch";

    const qty_variance = invoice_qty - mrn_qty;
    const price_variance = invoice_unit_price - lpo_unit_price;

    if (status !== "matched") {
      issues.push(
        `${item_name}: ${status.replace(/_/g, " ")} (LPO ${lpo_qty} @ ${lpo_unit_price}, MRN ${mrn_qty}, invoice ${invoice_qty} @ ${invoice_unit_price})`
      );
    }

    lines.push({
      item_id,
      item_name,
      uom,
      lpo_qty,
      lpo_unit_price,
      mrn_qty,
      mrn_unit_price,
      invoice_qty,
      invoice_unit_price,
      qty_variance,
      price_variance,
      status,
    });
  }

  const invoice_total = documentTotal(input.invoice_lines);
  const lpo_total = documentTotal(input.lpo_lines);
  const mrnPricedLines = linesFromMrn(input.mrn_lines, input.mrn_price_updates);
  const mrn_total = documentTotal(mrnPricedLines);

  return {
    purchase_order_id: input.purchase_order_id,
    purchase_order_number: input.purchase_order_number,
    mrn_id: input.mrn_id,
    mrn_number: input.mrn_number,
    supplier_invoice_id: input.supplier_invoice_id,
    supplier_invoice_number: input.supplier_invoice_number,
    supplier_id: input.supplier_id,
    supplier_name: input.supplier_name,
    lines,
    matched: issues.length === 0,
    lpo_total,
    mrn_total,
    invoice_total,
    issues,
  };
}

export function lineMatchLabel(status: ThreeWayLineStatus): string {
  return status.replace(/_/g, " ");
}
