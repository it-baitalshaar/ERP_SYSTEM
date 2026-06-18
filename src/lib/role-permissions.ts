import type { Permission, PermissionAction } from "@/lib/types";

export const MODULE_KEYS = [
  "sales",
  "procurement",
  "inventory",
  "finance",
  "compliance",
  "hr",
  "logistics",
  "real_estate",
  "construction",
  "ecommerce",
  "bi",
  "documents",
  "ai",
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];

export const MODULE_LABELS: Record<ModuleKey, string> = {
  sales: "Sales & CRM",
  procurement: "Procurement",
  inventory: "Inventory",
  finance: "Accounts & Finance",
  compliance: "UAE Compliance",
  hr: "HR & PRO",
  logistics: "Logistics & Fleet",
  real_estate: "Real Estate",
  construction: "Construction",
  ecommerce: "E-Commerce",
  bi: "Business Intelligence",
  documents: "Documents & Audit",
  ai: "AI Assistant",
};

const ALL: PermissionAction[] = ["view", "create", "edit", "delete", "approve"];
const RW: PermissionAction[] = ["view", "create", "edit"];
const RW_APPROVE: PermissionAction[] = ["view", "create", "edit", "approve"];
const VIEW: PermissionAction[] = ["view"];

/** Default module access per role — only listed modules appear in the sidebar. */
export const ROLE_MODULE_DEFAULTS: Record<string, Partial<Record<ModuleKey, PermissionAction[]>>> = {
  "role-super": Object.fromEntries(MODULE_KEYS.map((k) => [k, ALL])) as Record<
    ModuleKey,
    PermissionAction[]
  >,
  "role-company-admin": Object.fromEntries(MODULE_KEYS.map((k) => [k, ALL])) as Record<
    ModuleKey,
    PermissionAction[]
  >,
  "role-auditor": Object.fromEntries(MODULE_KEYS.map((k) => [k, VIEW])) as Record<
    ModuleKey,
    PermissionAction[]
  >,
  "role-cashier": {
    sales: RW_APPROVE,
  },
  "role-sales": {
    sales: RW,
  },
  "role-accountant": {
    finance: RW_APPROVE,
    compliance: RW,
    sales: VIEW,
  },
  "role-warehouse": {
    inventory: RW_APPROVE,
    procurement: RW,
  },
  "role-procurement": {
    procurement: RW_APPROVE,
  },
  "role-hr": {
    hr: RW,
    compliance: VIEW,
  },
  "role-driver": {
    logistics: RW,
  },
};

export interface EffectivePermission {
  module_key: string;
  actions: PermissionAction[];
}

export function getRolePermissions(roleId: string): Permission[] {
  const defaults = ROLE_MODULE_DEFAULTS[roleId] ?? {};
  return Object.entries(defaults).map(([module_key, actions]) => ({
    role_id: roleId,
    module_key,
    actions: actions as PermissionAction[],
  }));
}

export function getRoleModuleKeys(roleId: string): string[] {
  return Object.keys(ROLE_MODULE_DEFAULTS[roleId] ?? {});
}

export function mergeEffectivePermissions(
  roleId: string,
  extraGrants: { module_key: string; actions: PermissionAction[] }[]
): EffectivePermission[] {
  const merged = new Map<string, Set<PermissionAction>>();

  for (const perm of getRolePermissions(roleId)) {
    merged.set(perm.module_key, new Set(perm.actions));
  }

  for (const grant of extraGrants) {
    const set = merged.get(grant.module_key) ?? new Set();
    for (const action of grant.actions) set.add(action);
    merged.set(grant.module_key, set);
  }

  return Array.from(merged.entries()).map(([module_key, actions]) => ({
    module_key,
    actions: Array.from(actions),
  }));
}

/** Modules an admin may grant on top of the user's role defaults. */
export function getGrantableModulesForRole(roleId: string): ModuleKey[] {
  if (roleId === "role-super" || roleId === "role-company-admin") return [];
  const roleModules = new Set(getRoleModuleKeys(roleId));
  return MODULE_KEYS.filter((k) => !roleModules.has(k));
}

export const DEFAULT_GRANT_ACTIONS: PermissionAction[] = ["view", "create", "edit"];
