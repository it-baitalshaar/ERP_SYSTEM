import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth/session";
import { buildSessionForUserId, isAdminRole } from "@/lib/server/users";
import { createAdminClientOrNull } from "@/utils/supabase/admin";
import { hashPassword } from "@/lib/auth/password";
import { randomUUID } from "crypto";

export async function GET() {
  const token = await getSessionFromCookies();
  if (!token || !isAdminRole(token.role_id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = createAdminClientOrNull();
  if (!db) return NextResponse.json({ users: [] });

  const { data: profiles } = await db
    .from("profiles")
    .select("id, email, full_name, role_id, is_active")
    .order("full_name");

  const { roles } = await import("@/lib/mock-data/roles");

  const users = (profiles ?? []).map((p) => ({
    id: p.id,
    email: p.email,
    full_name: p.full_name,
    role_id: p.role_id,
    role: roles.find((r) => r.id === p.role_id)?.name ?? p.role_id,
    is_active: p.is_active,
  }));

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const token = await getSessionFromCookies();
  if (!token || !isAdminRole(token.role_id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    email?: string;
    password?: string;
    full_name?: string;
    role_id?: string;
    company_ids?: string[];
    branch_ids?: string[];
  };

  const email = body.email?.toLowerCase().trim();
  const password = body.password;
  const full_name = body.full_name?.trim();
  const role_id = body.role_id;
  const company_ids = body.company_ids ?? [];
  const branch_ids = body.branch_ids ?? [];

  if (!email || !password || password.length < 6 || !full_name || !role_id) {
    return NextResponse.json(
      { error: "Email, name, role, and password (min 6 chars) are required" },
      { status: 400 }
    );
  }

  if (!company_ids.length) {
    return NextResponse.json({ error: "At least one company is required" }, { status: 400 });
  }

  const db = createAdminClientOrNull();
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const password_hash = await hashPassword(password);
  const userId = randomUUID();

  const { error: profileError } = await db.from("profiles").insert({
    id: userId,
    email,
    full_name,
    role_id,
    password_hash,
    is_active: true,
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  await db.from("user_companies").insert(
    company_ids.map((company_id) => ({ user_id: userId, company_id }))
  );

  if (branch_ids.length) {
    await db.from("user_branches").insert(
      branch_ids.map((branch_id) => ({ user_id: userId, branch_id }))
    );
  }

  return NextResponse.json({
    user: { id: userId, email, full_name, role_id },
  });
}

export async function PATCH(request: Request) {
  const token = await getSessionFromCookies();
  if (!token || !isAdminRole(token.role_id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    id?: string;
    action?: string;
    password?: string;
    is_active?: boolean;
  };

  const userId = body.id;
  if (!userId) {
    return NextResponse.json({ error: "User id is required" }, { status: 400 });
  }

  const db = createAdminClientOrNull();
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  if (body.action === "reset_password") {
    const password = body.password ?? "";
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const password_hash = await hashPassword(password);
    const { error } = await db
      .from("profiles")
      .update({ password_hash })
      .eq("id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  }

  if (body.is_active !== undefined) {
    const { error } = await db
      .from("profiles")
      .update({ is_active: body.is_active })
      .eq("id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
