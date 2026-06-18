import { createOrganization, type CreateOrganizationPayload } from "@/lib/server/organizations";
import type { SessionPayload } from "@/lib/server/users";
import { createAdminClientOrNull } from "@/utils/supabase/admin";

export async function countProfiles(): Promise<number | null> {
  const db = createAdminClientOrNull();
  if (!db) return null;

  const { count, error } = await db
    .from("profiles")
    .select("*", { count: "exact", head: true });

  if (error) throw new Error(error.message);
  return count ?? 0;
}

/** True when the database is configured and has no users yet. */
export async function needsSetup(): Promise<boolean> {
  const count = await countProfiles();
  if (count === null) return false;
  return count === 0;
}

export type BootstrapInput = CreateOrganizationPayload;

export async function runBootstrap(input: BootstrapInput): Promise<SessionPayload> {
  const { session } = await createOrganization({ ...input, bootstrap: true });
  return session;
}
