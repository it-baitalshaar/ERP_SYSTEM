import { randomUUID } from "crypto";
import { assertCompanyAccess } from "@/lib/server/sales";
import type {
  Item,
  LineItem,
  PriceUpdateLine,
  StockLevelRow,
  UomConversion,
} from "@/lib/types";
import { createAdminClientOrNull } from "@/utils/supabase/admin";

export { assertCompanyAccess };

type Db = NonNullable<ReturnType<typeof createAdminClientOrNull>>;

export function mapItem(row: Record<string, unknown>): Item {
  return {
    id: String(row.id),
    company_id: String(row.company_id),
    sku: String(row.sku),
    name: String(row.name),
    category_id: row.category_id ? String(row.category_id) : "",
    base_uom: String(row.base_uom ?? "pcs"),
    uom_conversions: (row.uom_conversions as UomConversion[]) ?? [],
    is_batch_managed: Boolean(row.is_batch_managed),
    reorder_level: Number(row.reorder_level ?? 0),
    cost_price: Number(row.cost_price ?? row.unit_price ?? 0),
    unit_price: Number(row.unit_price ?? 0),
    image_url: row.image_url ? String(row.image_url) : undefined,
  };
}

export function mapStockLevelRow(row: Record<string, unknown>): StockLevelRow {
  const item = row.items as { name?: string; sku?: string; reorder_level?: number } | null;
  const wh = row.warehouses as { name?: string; code?: string } | null;
  return {
    id: String(row.id),
    company_id: String(row.company_id),
    item_id: String(row.item_id),
    warehouse_id: String(row.warehouse_id),
    qty_on_hand: Number(row.qty_on_hand),
    qty_reserved: Number(row.qty_reserved),
    reorder_level: Number(row.reorder_level ?? item?.reorder_level ?? 0),
    item_name: String(item?.name ?? ""),
    item_sku: String(item?.sku ?? ""),
    warehouse_name: String(wh?.name ?? ""),
    warehouse_code: String(wh?.code ?? ""),
  };
}

export async function resolveDefaultWarehouse(
  db: Db,
  companyId: string,
  preferredId?: string
): Promise<string> {
  if (preferredId) {
    const { data } = await db
      .from("warehouses")
      .select("id")
      .eq("id", preferredId)
      .eq("company_id", companyId)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  const { data, error } = await db
    .from("warehouses")
    .select("id")
    .eq("company_id", companyId)
    .limit(1)
    .maybeSingle();

  if (error || !data?.id) {
    throw new Error("No warehouse configured for this company");
  }
  return data.id;
}

async function getOrCreateStockLevel(
  db: Db,
  companyId: string,
  itemId: string,
  warehouseId: string
) {
  const { data: existing } = await db
    .from("stock_levels")
    .select("*")
    .eq("item_id", itemId)
    .eq("warehouse_id", warehouseId)
    .maybeSingle();

  if (existing) return existing;

  const { data: item } = await db
    .from("items")
    .select("reorder_level")
    .eq("id", itemId)
    .eq("company_id", companyId)
    .single();

  const { data: created, error } = await db
    .from("stock_levels")
    .insert({
      id: randomUUID(),
      company_id: companyId,
      item_id: itemId,
      warehouse_id: warehouseId,
      qty_on_hand: 0,
      qty_reserved: 0,
      reorder_level: item?.reorder_level ?? null,
    })
    .select("*")
    .single();

  if (error || !created) throw new Error(error?.message ?? "Could not init stock level");
  return created;
}

export async function applyStockMovement(
  db: Db,
  input: {
    company_id: string;
    item_id: string;
    warehouse_id: string;
    movement_type: "in" | "out";
    qty: number;
    reference_type: string;
    reference_id: string;
    reference_number?: string;
    notes?: string;
  }
) {
  if (input.qty <= 0) throw new Error("Movement quantity must be greater than zero");

  const level = await getOrCreateStockLevel(
    db,
    input.company_id,
    input.item_id,
    input.warehouse_id
  );

  const onHand = Number(level.qty_on_hand);
  const delta = input.movement_type === "in" ? input.qty : -input.qty;
  const newQty = onHand + delta;

  if (newQty < 0) {
    throw new Error(`Insufficient stock for item in warehouse (available ${onHand})`);
  }

  const { error: updateError } = await db
    .from("stock_levels")
    .update({ qty_on_hand: newQty, updated_at: new Date().toISOString() })
    .eq("id", level.id);

  if (updateError) throw new Error(updateError.message);

  const { error: moveError } = await db.from("stock_movements").insert({
    id: randomUUID(),
    company_id: input.company_id,
    item_id: input.item_id,
    warehouse_id: input.warehouse_id,
    movement_type: input.movement_type,
    qty: input.qty,
    reference_type: input.reference_type,
    reference_id: input.reference_id,
    reference_number: input.reference_number ?? null,
    notes: input.notes ?? null,
  });

  if (moveError) throw new Error(moveError.message);
}

export async function postMrnToInventory(
  db: Db,
  companyId: string,
  mrn: {
    id: string;
    number: string;
    warehouse_id: string | null;
    lines: LineItem[];
    price_updates: PriceUpdateLine[];
  }
) {
  const warehouseId = await resolveDefaultWarehouse(db, companyId, mrn.warehouse_id ?? undefined);

  for (const line of mrn.lines) {
    if (!line.item_id) continue;
    await applyStockMovement(db, {
      company_id: companyId,
      item_id: line.item_id,
      warehouse_id: line.warehouse_id ?? warehouseId,
      movement_type: "in",
      qty: line.qty,
      reference_type: "mrn",
      reference_id: mrn.id,
      reference_number: mrn.number,
    });
  }

  for (const update of mrn.price_updates ?? []) {
    if (!update.item_id) continue;
    const cost = update.new_unit_price;
    const sale =
      update.new_sale_price !== undefined && update.new_sale_price > 0
        ? update.new_sale_price
        : undefined;
    const patch: Record<string, number> = { cost_price: cost };
    if (sale !== undefined) patch.unit_price = sale;
    else if (cost > 0) patch.unit_price = cost;
    await db.from("items").update(patch).eq("id", update.item_id).eq("company_id", companyId);
  }
}

export async function postDeliveryNoteToInventory(
  db: Db,
  companyId: string,
  note: {
    id: string;
    number: string;
    warehouse_id: string | null;
    lines: LineItem[];
  }
) {
  const defaultWarehouse = await resolveDefaultWarehouse(
    db,
    companyId,
    note.warehouse_id ?? undefined
  );

  for (const line of note.lines) {
    if (!line.item_id) continue;
    await applyStockMovement(db, {
      company_id: companyId,
      item_id: line.item_id,
      warehouse_id: line.warehouse_id ?? defaultWarehouse,
      movement_type: "out",
      qty: line.qty,
      reference_type: "delivery_note",
      reference_id: note.id,
      reference_number: note.number,
    });
  }
}

export function itemInsertPayload(input: {
  company_id: string;
  sku: string;
  name: string;
  category_id?: string;
  base_uom?: string;
  uom_conversions?: UomConversion[];
  is_batch_managed?: boolean;
  reorder_level?: number;
  cost_price?: number;
  unit_price?: number;
}) {
  return {
    id: randomUUID(),
    company_id: input.company_id,
    category_id: input.category_id ?? null,
    sku: input.sku.trim().toUpperCase(),
    name: input.name.trim(),
    base_uom: input.base_uom ?? "pcs",
    uom_conversions: input.uom_conversions ?? [{ uom: input.base_uom ?? "pcs", factor: 1 }],
    is_batch_managed: Boolean(input.is_batch_managed),
    reorder_level: Number(input.reorder_level ?? 0),
    cost_price: Number(input.cost_price ?? input.unit_price ?? 0),
    unit_price: Number(input.unit_price ?? 0),
    is_active: true,
  };
}
