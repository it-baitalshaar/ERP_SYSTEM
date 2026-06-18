import type { PermissionAction } from "@/lib/types";
import { permissions } from "@/lib/mock-data/roles";

export function hasPermission(
  roleId: string,
  moduleKey: string,
  action: PermissionAction
): boolean {
  const perm = permissions.find(
    (p) => p.role_id === roleId && p.module_key === moduleKey
  );
  return perm?.actions.includes(action) ?? false;
}

export function canViewModule(roleId: string, moduleKey: string): boolean {
  return hasPermission(roleId, moduleKey, "view");
}

export function isAdminRole(roleId: string): boolean {
  return roleId === "role-super" || roleId === "role-company-admin";
}
