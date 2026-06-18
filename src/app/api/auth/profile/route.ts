import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth/session";
import { createAdminClientOrNull } from "@/utils/supabase/admin";

export async function PATCH(request: Request) {
  const token = await getSessionFromCookies();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { full_name?: string };
  const full_name = body.full_name?.trim();

  if (!full_name) {
    return NextResponse.json({ error: "Full name is required" }, { status: 400 });
  }

  const db = createAdminClientOrNull();
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data, error } = await db
    .from("profiles")
    .update({ full_name })
    .eq("id", token.sub)
    .select("id, email, full_name, role_id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ profile: data });
}
