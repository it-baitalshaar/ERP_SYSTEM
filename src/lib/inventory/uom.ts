import type { UomConversion } from "@/lib/types";

/** Standard UOMs for building materials (UAE). */
export const STANDARD_UOMS = [
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "box", label: "Box" },
  { value: "carton", label: "Carton" },
  { value: "roll", label: "Roll" },
  { value: "drum", label: "Drum" },
  { value: "barrel", label: "Barrel" },
  { value: "meter", label: "Meter (m)" },
  { value: "sqm", label: "Square meter (sqm)" },
  { value: "pair", label: "Pair" },
  { value: "gallon", label: "Gallon" },
  { value: "dozen", label: "Dozen" },
  { value: "kg", label: "Kilogram (kg)" },
  { value: "bag", label: "Bag" },
  { value: "ltr", label: "Litre (ltr)" },
] as const;

export type StandardUom = (typeof STANDARD_UOMS)[number]["value"];

/** Suggested sub-unit factors relative to base UOM (usually pcs). */
export const UOM_SUBUNIT_HINTS: Record<string, { subUom: string; defaultFactor: number; label: string }> = {
  box: { subUom: "pcs", defaultFactor: 1, label: "Pieces per box" },
  carton: { subUom: "pcs", defaultFactor: 1, label: "Pieces per carton" },
  dozen: { subUom: "pcs", defaultFactor: 12, label: "Pieces per dozen (12)" },
  pair: { subUom: "pcs", defaultFactor: 2, label: "Pieces per pair (2)" },
  drum: { subUom: "ltr", defaultFactor: 200, label: "Litres per drum" },
  barrel: { subUom: "ltr", defaultFactor: 200, label: "Litres per barrel" },
  roll: { subUom: "meter", defaultFactor: 50, label: "Meters per roll" },
  bag: { subUom: "kg", defaultFactor: 25, label: "Kg per bag" },
};

export function defaultConversionsForBaseUom(baseUom: string): UomConversion[] {
  const base: UomConversion = { uom: baseUom, factor: 1 };
  const hint = UOM_SUBUNIT_HINTS[baseUom];
  if (!hint || hint.subUom === baseUom) return [base];
  return [
    base,
    { uom: hint.subUom, factor: hint.defaultFactor },
  ];
}

export function uomLabel(uom: string): string {
  return STANDARD_UOMS.find((u) => u.value === uom)?.label ?? uom;
}

/** Convert qty from line UOM to base UOM using item conversions. */
export function qtyToBaseUom(
  qty: number,
  lineUom: string,
  baseUom: string,
  conversions: UomConversion[]
): number {
  if (lineUom === baseUom) return qty;
  const conv = conversions.find((c) => c.uom === lineUom);
  if (!conv || conv.factor <= 0) return qty;
  return qty * conv.factor;
}
