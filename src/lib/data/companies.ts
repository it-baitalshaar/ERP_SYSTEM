import type { Company } from "@/lib/types";

export async function fetchCompanies(): Promise<Company[]> {
  try {
    const res = await fetch("/api/data/companies");
    if (!res.ok) return [];
    const json = (await res.json()) as { companies?: Company[] };
    return json.companies ?? [];
  } catch {
    return [];
  }
}

export async function updateCompanyName(companyId: string, name: string): Promise<{ error?: string }> {
  const res = await fetch("/api/data/companies", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyId, name }),
  });
  const json = (await res.json()) as { error?: string };
  if (!res.ok) return { error: json.error ?? "Update failed" };
  return {};
}
