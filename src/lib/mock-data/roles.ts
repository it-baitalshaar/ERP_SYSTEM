import type { Permission, Role } from "@/lib/types";

export const roles: Role[] = [
  { id: "role-super", name: "Super Admin", description: "Full system access", is_system: true },
  { id: "role-company-admin", name: "Company Admin", description: "Company-level administration", is_system: true },
  { id: "role-accountant", name: "Accountant", description: "Finance and accounting", is_system: true },
  { id: "role-cashier", name: "Cashier", description: "Invoicing and payments", is_system: true },
  { id: "role-sales", name: "Salesperson", description: "Sales orders and CRM", is_system: true },
  { id: "role-warehouse", name: "Warehouse Staff", description: "Inventory operations", is_system: true },
  { id: "role-procurement", name: "Procurement Officer", description: "Purchasing", is_system: true },
  { id: "role-hr", name: "HR/PRO Officer", description: "HR and government services", is_system: true },
  { id: "role-driver", name: "Driver/Logistics Officer", description: "Fleet and trips", is_system: true },
  { id: "role-auditor", name: "Auditor", description: "Read-only audit access", is_system: true },
];

const ALL_ACTIONS = ["view", "create", "edit", "delete", "approve"] as const;
const READ_ONLY = ["view"] as const;
const SALES_ACTIONS = ["view", "create", "edit"] as const;
const CASHIER_ACTIONS = ["view", "create", "edit", "approve"] as const;

const moduleKeys = [
  "sales", "procurement", "inventory", "finance", "compliance", "hr",
  "logistics", "real_estate", "construction", "ecommerce", "bi", "documents", "ai", "admin",
];

function permsForRole(roleId: string, actions: readonly string[]): Permission[] {
  return moduleKeys.map((module_key) => ({
    role_id: roleId,
    module_key,
    actions: actions as Permission["actions"],
  }));
}

export const permissions: Permission[] = [
  ...permsForRole("role-super", ALL_ACTIONS),
  ...permsForRole("role-company-admin", ALL_ACTIONS),
  ...permsForRole("role-auditor", READ_ONLY),
  ...moduleKeys.map((module_key) => ({
    role_id: "role-accountant",
    module_key,
    actions: ["view", "create", "edit", "approve"] as Permission["actions"],
  })),
  ...moduleKeys.map((module_key) => ({
    role_id: "role-cashier",
    module_key,
    actions: (module_key === "sales" ? CASHIER_ACTIONS : ["view", "create", "edit"]) as Permission["actions"],
  })),
  ...moduleKeys.map((module_key) => ({
    role_id: "role-sales",
    module_key,
    actions: (module_key === "sales" ? SALES_ACTIONS : ["view"]) as Permission["actions"],
  })),
  ...moduleKeys.map((module_key) => ({
    role_id: "role-warehouse",
    module_key,
    actions: (["inventory", "procurement"].includes(module_key)
      ? ["view", "create", "edit", "approve"]
      : ["view"]) as Permission["actions"],
  })),
  ...moduleKeys.map((module_key) => ({
    role_id: "role-procurement",
    module_key,
    actions: (module_key === "procurement"
      ? ["view", "create", "edit", "approve"]
      : ["view"]) as Permission["actions"],
  })),
  ...moduleKeys.map((module_key) => ({
    role_id: "role-hr",
    module_key,
    actions: (["hr", "compliance", "admin"].includes(module_key)
      ? ["view", "create", "edit"]
      : ["view"]) as Permission["actions"],
  })),
  ...moduleKeys.map((module_key) => ({
    role_id: "role-driver",
    module_key,
    actions: (module_key === "logistics"
      ? ["view", "create", "edit"]
      : ["view"]) as Permission["actions"],
  })),
];
