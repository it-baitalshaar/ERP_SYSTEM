import type { EffectivePermission } from "@/lib/role-permissions";

export interface AdminUserRow {
  id: string;
  email: string;
  full_name: string;
  role_id: string;
  role: string;
  is_active: boolean;
}

export interface UserPreviewPayload {
  user_id: string;
  email: string;
  full_name: string;
  role_id: string;
  role_name: string;
  is_active: boolean;
  permissions: EffectivePermission[];
  role_modules: { key: string; label: string }[];
  extra_modules: { key: string; label: string; actions: string[] }[];
}

export async function fetchAdminUsers(): Promise<AdminUserRow[]> {
  const res = await fetch("/api/admin/users");
  if (!res.ok) return [];
  const json = (await res.json()) as { users?: AdminUserRow[] };
  return json.users ?? [];
}

export async function fetchUserPreview(
  userId: string
): Promise<{ data?: UserPreviewPayload; error?: string }> {
  const res = await fetch(`/api/admin/users/preview?userId=${encodeURIComponent(userId)}`);
  const json = (await res.json()) as UserPreviewPayload & { error?: string };
  if (!res.ok) return { error: json.error ?? "Failed to load user preview" };
  return { data: json };
}
