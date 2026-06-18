import type { PermissionAction } from "@/lib/types";
import {
  getRolePermissions,
  mergeEffectivePermissions,
  type EffectivePermission,
} from "@/lib/role-permissions";

export type { EffectivePermission };

export function hasPermission(
  effective: EffectivePermission[],
  moduleKey: string,
  action: PermissionAction
): boolean {
  const perm = effective.find((p) => p.module_key === moduleKey);
  return perm?.actions.includes(action) ?? false;
}

export function canViewModule(effective: EffectivePermission[], moduleKey: string): boolean {
  return hasPermission(effective, moduleKey, "view");
}

export function isAdminRole(roleId: string): boolean {
  return roleId === "role-super" || roleId === "role-company-admin";
}

export function isSuperAdmin(roleId: string): boolean {
  return roleId === "role-super";
}

/** @deprecated Use session effective permissions — kept for role preview */
export function canViewModuleForRole(roleId: string, moduleKey: string): boolean {
  const perms = mergeEffectivePermissions(roleId, []);
  return canViewModule(perms, moduleKey);
}

export function getEffectivePermissionsForRole(roleId: string): EffectivePermission[] {
  return mergeEffectivePermissions(roleId, []);
}

export { getRolePermissions };
