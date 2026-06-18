import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createAdminClientOrNull } from "@/utils/supabase/admin";

export async function POST(request: Request) {
  const token = await getSessionFromCookies();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    current_password?: string;
    new_password?: string;
  };

  const current_password = body.current_password ?? "";
  const new_password = body.new_password ?? "";

  if (!current_password || !new_password) {
    return NextResponse.json(
      { error: "Current and new password are required" },
      { status: 400 }
    );
  }
  if (new_password.length < 6) {
    return NextResponse.json(
      { error: "New password must be at least 6 characters" },
      { status: 400 }
    );
  }

  const db = createAdminClientOrNull();
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: profile } = await db
    .from("profiles")
    .select("password_hash")
    .eq("id", token.sub)
    .single();

  if (!profile?.password_hash) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const valid = await verifyPassword(current_password, profile.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  const password_hash = await hashPassword(new_password);
  const { error } = await db
    .from("profiles")
    .update({ password_hash })
    .eq("id", token.sub);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
