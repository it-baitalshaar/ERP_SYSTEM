import {
  getEnabledFlagKeysForBusinessLines,
  mergeFeatureFlags,
} from "@/lib/feature-flags";
import { featureFlagDefs } from "@/lib/mock-data/feature-flags";
import type { BusinessLine } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

type Db = SupabaseClient;

export async function isCompanyFeatureEnabled(
  db: Db,
  companyId: string,
  flagKey: string
): Promise<boolean> {
  const [{ data: flag }, { data: company }] = await Promise.all([
    db
      .from("feature_flags")
      .select("enabled")
      .eq("company_id", companyId)
      .eq("flag_key", flagKey)
      .maybeSingle(),
    db.from("companies").select("business_lines").eq("id", companyId).maybeSingle(),
  ]);

  const businessLines = (company?.business_lines ?? ["trading"]) as BusinessLine[];
  const defaults = getEnabledFlagKeysForBusinessLines(businessLines);

  if (flag) return Boolean(flag.enabled);

  return defaults.has(flagKey);
}

export async function listCompanyFeatureFlags(db: Db, companyId: string) {
  const { data: company } = await db
    .from("companies")
    .select("business_lines")
    .eq("id", companyId)
    .maybeSingle();

  const businessLines = (company?.business_lines ?? ["trading"]) as BusinessLine[];

  const { data: overrides } = await db
    .from("feature_flags")
    .select("flag_key, enabled")
    .eq("company_id", companyId);

  return mergeFeatureFlags(
    companyId,
    businessLines,
    (overrides ?? []).map((o) => ({
      flag_key: String(o.flag_key),
      enabled: Boolean(o.enabled),
    }))
  ).map((f) => ({
    key: f.key,
    label: featureFlagDefs.find((d) => d.key === f.key)?.label ?? f.key,
    enabled: f.enabled,
  }));
}
