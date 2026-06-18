import type { Branch, Company, OrgWarehouse } from "@/lib/types";
import { ORG_AL_SAQIYA, ORG_BAIT_AL_SHAAR } from "@/lib/mock-data/organizations";

/** Fixed UUIDs — must match supabase/migrations/0001_init.sql */
export const COMPANY_AL_SAQIYA = "11111111-1111-4111-8111-111111111101";
export const COMPANY_BAIT_AL_SHAAR = "11111111-1111-4111-8111-111111111102";
export const BRANCH_AL_SAQIYA_HQ = "22222222-2222-4222-8222-222222222201";
export const BRANCH_BAS_SHJ = "22222222-2222-4222-8222-222222222202";
export const WAREHOUSE_AL_SAQIYA = "44444444-4444-4444-8444-444444444401";

export { ORG_AL_SAQIYA, ORG_BAIT_AL_SHAAR };

export const companies: Company[] = [
  {
    id: COMPANY_AL_SAQIYA,
    organization_id: ORG_AL_SAQIYA,
    unit_type: "department",
    name: "AL SAQIYA TRADING",
    trade_license_no: "CN-ALSAQIYA-001",
    address: "Dubai, UAE",
    currency: "AED",
    vat_trn: "100123456700003",
    fiscal_year_start: "01-01",
    business_lines: ["trading"],
  },
  {
    id: COMPANY_BAIT_AL_SHAAR,
    organization_id: ORG_BAIT_AL_SHAAR,
    unit_type: "department",
    name: "Bait Al-Shaar General Contracting and Maintenance",
    trade_license_no: "CN-BAS-GCM-001",
    address: "Sharjah, UAE",
    currency: "AED",
    vat_trn: "100765432100003",
    fiscal_year_start: "01-01",
    business_lines: ["construction", "real_estate"],
  },
];

export const branches: Branch[] = [
  {
    id: BRANCH_AL_SAQIYA_HQ,
    company_id: COMPANY_AL_SAQIYA,
    name: "Dubai HQ",
    code: "DXB",
    address: "Al Quoz Industrial Area, Dubai",
    trade_license_no: "CN-ALSAQIYA-DXB-001",
    is_head_office: true,
  },
  {
    id: BRANCH_BAS_SHJ,
    company_id: COMPANY_BAIT_AL_SHAAR,
    name: "Sharjah Office",
    code: "SHJ",
    address: "Industrial Area, Sharjah",
    trade_license_no: "CN-BAS-SHJ-001",
    is_head_office: true,
  },
];

export const warehouses: OrgWarehouse[] = [
  {
    id: WAREHOUSE_AL_SAQIYA,
    company_id: COMPANY_AL_SAQIYA,
    name: "Al Quoz Warehouse",
    code: "WH-DXB",
    address: "Al Quoz Industrial Area, Dubai",
    trade_license_no: "CN-ALSAQIYA-WH-001",
  },
];
