import type { BusinessLine, FeatureFlag } from "@/lib/types";
import { mergeFeatureFlags } from "@/lib/feature-flags";
import { getDefaultFeatureFlags } from "@/lib/mock-data/feature-flags";

export async function fetchFeatureFlagsForCompany(
  companyId: string,
  businessLines: BusinessLine[]
): Promise<FeatureFlag[]> {
  try {
    const res = await fetch(`/api/data/feature-flags?companyId=${companyId}`);
    if (!res.ok) return getDefaultFeatureFlags(companyId);
    const json = (await res.json()) as { flags?: FeatureFlag[] };
    if (json.flags?.length) return json.flags;
    return mergeFeatureFlags(companyId, businessLines, []);
  } catch {
    return getDefaultFeatureFlags(companyId);
  }
}

export async function upsertFeatureFlag(
  companyId: string,
  flagKey: string,
  enabled: boolean
): Promise<{ error?: string }> {
  const res = await fetch("/api/data/feature-flags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyId, flagKey, enabled }),
  });
  const json = (await res.json()) as { error?: string };
  if (!res.ok) return { error: json.error ?? "Update failed" };
  return {};
}
