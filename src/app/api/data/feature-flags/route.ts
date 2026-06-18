import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth/session";
import { createAdminClientOrNull } from "@/utils/supabase/admin";
import { isAdminRole } from "@/lib/server/users";
import { mergeFeatureFlags } from "@/lib/feature-flags";
import type { BusinessLine } from "@/lib/types";

export async function GET(request: Request) {
  const token = await getSessionFromCookies();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");
  if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 });

  const db = createAdminClientOrNull();
  if (!db) return NextResponse.json({ flags: [] });

  const { data: company } = await db.from("companies").select("business_lines").eq("id", companyId).single();
  const businessLines = (company?.business_lines ?? ["trading"]) as BusinessLine[];

  const { data } = await db.from("feature_flags").select("flag_key, enabled").eq("company_id", companyId);
  const flags = mergeFeatureFlags(companyId, businessLines, data ?? []);

  return NextResponse.json({ flags });
}

export async function POST(request: Request) {
  const token = await getSessionFromCookies();
  if (!token || !isAdminRole(token.role_id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { companyId, flagKey, enabled } = (await request.json()) as {
    companyId?: string;
    flagKey?: string;
    enabled?: boolean;
  };

  if (!companyId || !flagKey || typeof enabled !== "boolean") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const db = createAdminClientOrNull();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const { error } = await db.from("feature_flags").upsert(
    {
      company_id: companyId,
      flag_key: flagKey,
      enabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "company_id,flag_key" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
