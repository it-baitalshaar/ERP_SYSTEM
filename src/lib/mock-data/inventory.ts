import type { Item, StockLevel, Warehouse } from "@/lib/types";

export const warehouses: Warehouse[] = [
  { id: "wh-1", branch_id: "br-1", name: "Dubai Main Warehouse", code: "DXB-WH1" },
  { id: "wh-2", branch_id: "br-2", name: "Abu Dhabi Warehouse", code: "AUH-WH1" },
];

export const items: Item[] = [
  {
    id: "item-1",
    company_id: "co-1",
    sku: "TILE-6060-WHT",
    name: "Ceramic Tiles 60x60",
    category_id: "cat-tiles",
    base_uom: "box",
    uom_conversions: [
      { uom: "box", factor: 1 },
      { uom: "carton", factor: 10 },
      { uom: "pcs", factor: 0.04 },
    ],
    is_batch_managed: true,
    reorder_level: 100,
    unit_price: 85,
  },
  {
    id: "item-2",
    company_id: "co-1",
    sku: "CEM-PORT-50",
    name: "Portland Cement 50kg",
    category_id: "cat-cement",
    base_uom: "bag",
    uom_conversions: [{ uom: "bag", factor: 1 }, { uom: "pallet", factor: 40 }],
    is_batch_managed: false,
    reorder_level: 500,
    unit_price: 22,
  },
  {
    id: "item-3",
    company_id: "co-1",
    sku: "STL-RB-12",
    name: "Steel Rebar 12mm",
    category_id: "cat-steel",
    base_uom: "ton",
    uom_conversions: [{ uom: "ton", factor: 1 }],
    is_batch_managed: false,
    reorder_level: 10,
    unit_price: 2800,
  },
];

export const stockLevels: StockLevel[] = [
  { item_id: "item-1", warehouse_id: "wh-1", qty_on_hand: 850, qty_reserved: 200, reorder_level: 100 },
  { item_id: "item-1", warehouse_id: "wh-2", qty_on_hand: 120, qty_reserved: 0, reorder_level: 50 },
  { item_id: "item-2", warehouse_id: "wh-1", qty_on_hand: 320, qty_reserved: 50, reorder_level: 500 },
  { item_id: "item-3", warehouse_id: "wh-2", qty_on_hand: 45, qty_reserved: 10, reorder_level: 10 },
];
