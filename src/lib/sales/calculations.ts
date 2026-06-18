import type { LineItem } from "@/lib/types";

export function lineSubtotal(line: LineItem): number {
  const gross = line.qty * line.unit_price;
  return gross * (1 - line.discount_pct / 100);
}

export function lineVat(line: LineItem): number {
  return lineSubtotal(line) * (line.vat_pct / 100);
}

export function documentTotals(lines: LineItem[]) {
  const subtotal = lines.reduce((sum, line) => sum + lineSubtotal(line), 0);
  const vat_amount = lines.reduce((sum, line) => sum + lineVat(line), 0);
  return {
    subtotal: roundMoney(subtotal),
    vat_amount: roundMoney(vat_amount),
    total: roundMoney(subtotal + vat_amount),
  };
}

export function documentTotal(lines: LineItem[]): number {
  return documentTotals(lines).total;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
