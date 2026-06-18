import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth/session";
import {
  getGrantableModulesForRole,
  getRoleModuleKeys,
  MODULE_LABELS,
} from "@/lib/role-permissions";
import {
  loadUserModuleGrants,
  saveUserModuleGrants,
} from "@/lib/server/permissions";
import { buildSessionForUserId, isAdminRole } from "@/lib/server/users";
import { createAdminClientOrNull } from "@/utils/supabase/admin";

export async function GET(request: Request) {
  const token = await getSessionFromCookies();
  if (!token || !isAdminRole(token.role_id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = new URL(request.url).searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const db = createAdminClientOrNull();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const { data: profile } = await db
    .from("profiles")
    .select("id, role_id, full_name")
    .eq("id", userId)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const grants = await loadUserModuleGrants(db, userId);
  const roleModules = getRoleModuleKeys(profile.role_id);
  const grantableModules = getGrantableModulesForRole(profile.role_id);

  return NextResponse.json({
    user_id: userId,
    role_id: profile.role_id,
    role_modules: roleModules,
    role_module_labels: roleModules.map((k) => ({ key: k, label: MODULE_LABELS[k as keyof typeof MODULE_LABELS] ?? k })),
    grantable_modules: grantableModules.map((k) => ({
      key: k,
      label: MODULE_LABELS[k],
      granted: grants.some((g) => g.module_key === k),
    })),
    extra_module_keys: grants.map((g) => g.module_key),
  });
}

export async function PATCH(request: Request) {
  const token = await getSessionFromCookies();
  if (!token || !isAdminRole(token.role_id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    user_id?: string;
    module_keys?: string[];
  };

  const userId = body.user_id;
  if (!userId) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }

  const db = createAdminClientOrNull();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const { data: profile } = await db
    .from("profiles")
    .select("role_id")
    .eq("id", userId)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    await saveUserModuleGrants(
      db,
      userId,
      profile.role_id,
      body.module_keys ?? [],
      token.sub
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save access";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const session =
    userId === token.sub ? await buildSessionForUserId(token.sub) : undefined;

  return NextResponse.json({ ok: true, session });
}
