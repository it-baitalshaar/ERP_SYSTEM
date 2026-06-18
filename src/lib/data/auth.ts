import type { Company } from "@/lib/types";
import { fetchFeatureFlagsForCompany } from "@/lib/data/feature-flags";
import type { SessionPayload } from "@/lib/server/users";

export type { SessionPayload };

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ error?: string; session?: SessionPayload }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const json = (await res.json()) as { error?: string; session?: SessionPayload };
  if (!res.ok) return { error: json.error ?? "Login failed" };
  return { session: json.session };
}

export async function signOut(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

export async function loadSession(): Promise<SessionPayload | null> {
  const res = await fetch("/api/auth/session");
  if (!res.ok) return null;
  const json = (await res.json()) as { session: SessionPayload | null };
  return json.session;
}

export async function hydrateFeatureFlags(companyId: string, businessLines: Company["business_lines"]) {
  return fetchFeatureFlagsForCompany(companyId, businessLines);
}
