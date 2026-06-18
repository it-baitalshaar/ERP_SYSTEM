import type { Permission, Role } from "@/lib/types";
import { getRolePermissions, MODULE_KEYS } from "@/lib/role-permissions";

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

export { MODULE_KEYS };

export const permissions: Permission[] = roles.flatMap((role) => getRolePermissions(role.id));
