import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth/session";
import {
  assertCompanyAccess,
  itemInsertPayload,
  mapItem,
  mapStockLevelRow,
} from "@/lib/server/inventory";
import { createAdminClientOrNull } from "@/utils/supabase/admin";
import type { UomConversion } from "@/lib/types";

async function requireSession() {
  const token = await getSessionFromCookies();
  if (!token) throw new Error("Unauthorized");
  return token;
}

export async function GET(request: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const resource = searchParams.get("resource") ?? "items";

    if (!companyId) {
      return NextResponse.json({ error: "companyId required" }, { status: 400 });
    }

    const db = createAdminClientOrNull();
    if (!db) return NextResponse.json({ data: [] });

    if (resource === "items") {
      const { data, error } = await db
        .from("items")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("name");
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data: (data ?? []).map(mapItem) });
    }

    if (resource === "stock_levels") {
      const { data, error } = await db
        .from("stock_levels")
        .select("*, items(name, sku, reorder_level), warehouses(name, code)")
        .eq("company_id", companyId)
        .order("updated_at", { ascending: false });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data: (data ?? []).map(mapStockLevelRow) });
    }

    return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const token = await requireSession();
    const body = (await request.json()) as Record<string, unknown>;
    const resource = String(body.resource ?? "");
    const companyId = String(body.company_id ?? "");

    if (!companyId) {
      return NextResponse.json({ error: "company_id required" }, { status: 400 });
    }

    await assertCompanyAccess(token.sub, companyId);

    const db = createAdminClientOrNull();
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    if (resource === "items") {
      const sku = String(body.sku ?? "").trim();
      const name = String(body.name ?? "").trim();
      if (!sku || !name) {
        return NextResponse.json({ error: "SKU and name are required" }, { status: 400 });
      }

      const payload = itemInsertPayload({
        company_id: companyId,
        sku,
        name,
        category_id: body.category_id ? String(body.category_id) : undefined,
        base_uom: body.base_uom ? String(body.base_uom) : undefined,
        uom_conversions: body.uom_conversions as UomConversion[] | undefined,
        is_batch_managed: Boolean(body.is_batch_managed),
        reorder_level: Number(body.reorder_level ?? 0),
        unit_price: Number(body.unit_price ?? 0),
      });

      const { data, error } = await db.from("items").insert(payload).select("*").single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ data: mapItem(data) });
    }

    return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Create failed";
    const status =
      message === "Unauthorized" ? 401 : message.includes("access") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const token = await requireSession();
    const body = (await request.json()) as Record<string, unknown>;
    const resource = String(body.resource ?? "");
    const companyId = String(body.company_id ?? "");
    const id = String(body.id ?? "");

    if (!companyId || !id) {
      return NextResponse.json({ error: "company_id and id required" }, { status: 400 });
    }

    await assertCompanyAccess(token.sub, companyId);

    const db = createAdminClientOrNull();
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    if (resource === "items") {
      const updates: Record<string, unknown> = {};
      if (body.name !== undefined) updates.name = String(body.name).trim();
      if (body.sku !== undefined) updates.sku = String(body.sku).trim().toUpperCase();
      if (body.base_uom !== undefined) updates.base_uom = String(body.base_uom);
      if (body.uom_conversions !== undefined) updates.uom_conversions = body.uom_conversions;
      if (body.is_batch_managed !== undefined) updates.is_batch_managed = Boolean(body.is_batch_managed);
      if (body.reorder_level !== undefined) updates.reorder_level = Number(body.reorder_level);
      if (body.unit_price !== undefined) updates.unit_price = Number(body.unit_price);
      if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active);

      const { data, error } = await db
        .from("items")
        .update(updates)
        .eq("id", id)
        .eq("company_id", companyId)
        .select("*")
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ data: mapItem(data) });
    }

    return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    const status =
      message === "Unauthorized" ? 401 : message.includes("access") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
