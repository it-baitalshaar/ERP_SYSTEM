import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/permissions";
import {
  getRoleModuleKeys,
  MODULE_LABELS,
  type EffectivePermission,
} from "@/lib/role-permissions";
import { loadEffectivePermissions, loadUserModuleGrants } from "@/lib/server/permissions";
import { createAdminClientOrNull } from "@/utils/supabase/admin";

export async function GET(request: Request) {
  const token = await getSessionFromCookies();
  if (!token || !isSuperAdmin(token.role_id)) {
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
    .select("id, email, full_name, role_id, is_active")
    .eq("id", userId)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { roles } = await import("@/lib/mock-data/roles");
  const permissions: EffectivePermission[] = await loadEffectivePermissions(
    db,
    profile.id,
    profile.role_id
  );
  const grants = await loadUserModuleGrants(db, userId);
  const roleModules = getRoleModuleKeys(profile.role_id);

  return NextResponse.json({
    user_id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    role_id: profile.role_id,
    role_name: roles.find((r) => r.id === profile.role_id)?.name ?? profile.role_id,
    is_active: profile.is_active,
    permissions,
    role_modules: roleModules.map((key) => ({
      key,
      label: MODULE_LABELS[key as keyof typeof MODULE_LABELS] ?? key,
    })),
    extra_modules: grants.map((g) => ({
      key: g.module_key,
      label: MODULE_LABELS[g.module_key as keyof typeof MODULE_LABELS] ?? g.module_key,
      actions: g.actions,
    })),
  });
}
