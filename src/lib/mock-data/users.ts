import type { User } from "@/lib/types";
import {
  BRANCH_AL_SAQIYA_HQ,
  BRANCH_BAS_SHJ,
  COMPANY_AL_SAQIYA,
  COMPANY_BAIT_AL_SHAAR,
  WAREHOUSE_AL_SAQIYA,
} from "@/lib/mock-data/companies";
import { ORG_AL_SAQIYA, ORG_BAIT_AL_SHAAR } from "@/lib/mock-data/organizations";

export const users: User[] = [
  {
    id: "33333333-3333-4333-8333-333333333301",
    email: "admin@alsaqiya.ae",
    full_name: "System Administrator",
    role_id: "role-super",
    organization_ids: [ORG_AL_SAQIYA, ORG_BAIT_AL_SHAAR],
    company_ids: [COMPANY_AL_SAQIYA, COMPANY_BAIT_AL_SHAAR],
    branch_ids: [BRANCH_AL_SAQIYA_HQ, BRANCH_BAS_SHJ],
    warehouse_ids: [WAREHOUSE_AL_SAQIYA],
    is_active: true,
  },
  {
    id: "33333333-3333-4333-8333-333333333302",
    email: "sales@alsaqiya.ae",
    full_name: "Al Saqiya Sales",
    role_id: "role-sales",
    organization_ids: [ORG_AL_SAQIYA],
    company_ids: [COMPANY_AL_SAQIYA],
    branch_ids: [BRANCH_AL_SAQIYA_HQ],
    warehouse_ids: [WAREHOUSE_AL_SAQIYA],
    is_active: true,
  },
  {
    id: "33333333-3333-4333-8333-333333333303",
    email: "cashier@alsaqiya.ae",
    full_name: "Al Saqiya Cashier",
    role_id: "role-cashier",
    organization_ids: [ORG_AL_SAQIYA],
    company_ids: [COMPANY_AL_SAQIYA],
    branch_ids: [BRANCH_AL_SAQIYA_HQ],
    warehouse_ids: [],
    is_active: true,
  },
  {
    id: "33333333-3333-4333-8333-333333333304",
    email: "accountant@alsaqiya.ae",
    full_name: "Al Saqiya Accountant",
    role_id: "role-accountant",
    organization_ids: [ORG_AL_SAQIYA],
    company_ids: [COMPANY_AL_SAQIYA],
    branch_ids: [BRANCH_AL_SAQIYA_HQ],
    warehouse_ids: [],
    is_active: true,
  },
];
