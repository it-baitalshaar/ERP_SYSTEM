import type { BusinessLine, FeatureFlag } from "@/lib/types";
import { featureFlagDefs } from "@/lib/mock-data/feature-flags";

/** PRD §5 — each business line enables its module group (+ shared core). */
export const BUSINESS_LINE_MODULE_FLAGS: Record<BusinessLine, string[]> = {
  trading: [
    "mod_sales",
    "mod_procurement",
    "mod_inventory",
    "mod_finance",
    "mod_ecommerce",
    "feat_batch_tracking",
    "feat_below_cost_warning",
    "feat_product_warehouse_availability",
    "feat_procurement_workflow",
    "feat_partial_sales_delivery",
    "feat_customer_product_blocks",
  ],
  logistics: ["mod_logistics", "mod_procurement", "mod_inventory", "mod_finance"],
  construction: ["mod_construction", "mod_procurement", "mod_inventory", "mod_finance"],
  real_estate: ["mod_real_estate", "mod_finance", "mod_hr"],
};

/** Enabled for every company regardless of business line. */
export const UNIVERSAL_FEATURE_FLAGS = [
  "mod_compliance",
  "mod_hr",
  "mod_bi",
  "mod_documents",
  "mod_ai",
  "feat_e_invoicing",
];

/** Off by default until admin enables (still listed in Feature Management). */
export const OPTIONAL_FEATURE_FLAGS = ["feat_customer_portal"];

export function getEnabledFlagKeysForBusinessLines(businessLines: BusinessLine[]): Set<string> {
  const keys = new Set<string>(UNIVERSAL_FEATURE_FLAGS);
  for (const line of businessLines) {
    for (const key of BUSINESS_LINE_MODULE_FLAGS[line]) {
      keys.add(key);
    }
  }
  return keys;
}

export function buildDefaultFeatureFlags(
  companyId: string,
  businessLines: BusinessLine[]
): FeatureFlag[] {
  const enabled = getEnabledFlagKeysForBusinessLines(businessLines);
  return featureFlagDefs.map((f) => ({
    ...f,
    company_id: companyId,
    enabled: enabled.has(f.key),
  }));
}

/** Merge DB overrides onto business-line defaults (admin toggles win). */
export function mergeFeatureFlags(
  companyId: string,
  businessLines: BusinessLine[],
  overrides: { flag_key: string; enabled: boolean }[]
): FeatureFlag[] {
  const defaults = buildDefaultFeatureFlags(companyId, businessLines);
  if (!overrides.length) return defaults;

  const overrideMap = new Map(overrides.map((o) => [o.flag_key, o.enabled]));
  return defaults.map((f) =>
    overrideMap.has(f.key) ? { ...f, enabled: overrideMap.get(f.key)! } : f
  );
}

export function getBusinessLineLabel(line: BusinessLine): string {
  const labels: Record<BusinessLine, string> = {
    trading: "Trading",
    logistics: "Logistics",
    construction: "Construction",
    real_estate: "Real Estate",
  };
  return labels[line];
}
