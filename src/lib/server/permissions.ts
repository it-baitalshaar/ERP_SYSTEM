import {
  DEFAULT_GRANT_ACTIONS,
  getGrantableModulesForRole,
  mergeEffectivePermissions,
  type EffectivePermission,
  type ModuleKey,
} from "@/lib/role-permissions";
import type { PermissionAction } from "@/lib/types";
import { createAdminClientOrNull } from "@/utils/supabase/admin";

type Db = NonNullable<ReturnType<typeof createAdminClientOrNull>>;

export async function loadUserModuleGrants(
  db: Db,
  userId: string
): Promise<{ module_key: string; actions: PermissionAction[] }[]> {
  const { data } = await db
    .from("user_module_permissions")
    .select("module_key, actions")
    .eq("user_id", userId);

  return (data ?? []).map((row) => ({
    module_key: row.module_key,
    actions: (row.actions ?? DEFAULT_GRANT_ACTIONS) as PermissionAction[],
  }));
}

export async function loadEffectivePermissions(
  db: Db | null,
  userId: string,
  roleId: string
): Promise<EffectivePermission[]> {
  if (!db) {
    return mergeEffectivePermissions(roleId, []);
  }

  try {
    const grants = await loadUserModuleGrants(db, userId);
    return mergeEffectivePermissions(roleId, grants);
  } catch {
    return mergeEffectivePermissions(roleId, []);
  }
}

export async function saveUserModuleGrants(
  db: Db,
  userId: string,
  roleId: string,
  extraModuleKeys: string[],
  grantedBy: string
) {
  const allowed = getGrantableModulesForRole(roleId);

  for (const key of extraModuleKeys) {
    if (!allowed.includes(key as ModuleKey)) {
      throw new Error(`Cannot grant module "${key}" for this role`);
    }
  }

  await db.from("user_module_permissions").delete().eq("user_id", userId);

  if (extraModuleKeys.length) {
    const { error } = await db.from("user_module_permissions").insert(
      extraModuleKeys.map((module_key) => ({
        user_id: userId,
        module_key,
        actions: DEFAULT_GRANT_ACTIONS,
        granted_by: grantedBy,
      }))
    );
    if (error) throw new Error(error.message);
  }
}
