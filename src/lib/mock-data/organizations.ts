import type { Organization } from "@/lib/types";

export const ORG_AL_SAQIYA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01";
export const ORG_BAIT_AL_SHAAR = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02";

export const organizations: Organization[] = [
  {
    id: ORG_AL_SAQIYA,
    name: "AL SAQIYA TRADING",
    trade_license_no: "CN-ALSAQIYA-ORG-001",
    address: "Dubai, UAE",
    currency: "AED",
    vat_trn: "100123456700003",
  },
  {
    id: ORG_BAIT_AL_SHAAR,
    name: "Bait Al-Shaar Group",
    trade_license_no: "CN-BAS-ORG-001",
    address: "Sharjah, UAE",
    currency: "AED",
    vat_trn: "100765432100003",
  },
];
