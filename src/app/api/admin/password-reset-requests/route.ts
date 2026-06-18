import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { isAdminRole } from "@/lib/server/users";
import { createAdminClientOrNull } from "@/utils/supabase/admin";

export async function GET() {
  const token = await getSessionFromCookies();
  if (!token || !isAdminRole(token.role_id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = createAdminClientOrNull();
  if (!db) return NextResponse.json({ requests: [] });

  const { data, error } = await db
    .from("password_reset_requests")
    .select("id, user_id, email, status, note, created_at, profiles(full_name)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const requests = (data ?? []).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    email: row.email,
    full_name: (row.profiles as { full_name?: string } | null)?.full_name ?? "",
    status: row.status,
    note: row.note,
    created_at: row.created_at,
  }));

  return NextResponse.json({ requests });
}

export async function PATCH(request: Request) {
  const token = await getSessionFromCookies();
  if (!token || !isAdminRole(token.role_id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    id?: string;
    action?: "resolve" | "reject";
    new_password?: string;
    note?: string;
  };

  const id = body.id;
  const action = body.action;

  if (!id || !action) {
    return NextResponse.json({ error: "id and action are required" }, { status: 400 });
  }

  const db = createAdminClientOrNull();
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: reqRow } = await db
    .from("password_reset_requests")
    .select("*")
    .eq("id", id)
    .eq("status", "pending")
    .single();

  if (!reqRow) {
    return NextResponse.json({ error: "Request not found or already handled" }, { status: 404 });
  }

  if (action === "reject") {
    await db
      .from("password_reset_requests")
      .update({
        status: "rejected",
        note: body.note ?? null,
        resolved_at: new Date().toISOString(),
        resolved_by: token.sub,
      })
      .eq("id", id);

    return NextResponse.json({ ok: true });
  }

  const new_password = body.new_password ?? "";
  if (new_password.length < 6) {
    return NextResponse.json(
      { error: "New password must be at least 6 characters" },
      { status: 400 }
    );
  }

  const password_hash = await hashPassword(new_password);

  await db.from("profiles").update({ password_hash }).eq("id", reqRow.user_id);

  await db
    .from("password_reset_requests")
    .update({
      status: "resolved",
      note: body.note ?? "Password reset by administrator",
      resolved_at: new Date().toISOString(),
      resolved_by: token.sub,
    })
    .eq("id", id);

  return NextResponse.json({ ok: true });
}
