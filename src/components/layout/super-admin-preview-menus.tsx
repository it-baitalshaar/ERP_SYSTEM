"use client";

import { useCallback, useState } from "react";
import { Eye, UserCog, Users } from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { fetchAdminUsers, fetchUserPreview } from "@/lib/data/preview-access";
import { isSuperAdmin } from "@/lib/permissions";
import { roles, useAppStore } from "@/stores/app-store";
import { toast } from "sonner";

export function SuperAdminPreviewMenus() {
  const {
    currentUser,
    previewRoleId,
    previewUser,
    setPreviewRole,
    setPreviewUser,
    clearPreview,
    isPreviewActive,
  } = useAppStore();

  const [users, setUsers] = useState<{ id: string; full_name: string; role: string }[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    if (usersLoaded) return;
    const list = await fetchAdminUsers();
    setUsers(
      list
        .filter((u) => u.is_active)
        .map((u) => ({ id: u.id, full_name: u.full_name, role: u.role }))
    );
    setUsersLoaded(true);
  }, [usersLoaded]);

  if (!currentUser || !isSuperAdmin(currentUser.role_id)) {
    return null;
  }

  const handlePreviewUser = async (userId: string) => {
    setLoadingUserId(userId);
    const result = await fetchUserPreview(userId);
    setLoadingUserId(null);

    if (result.error || !result.data) {
      toast.error(result.error ?? "Could not load user access");
      return;
    }

    const data = result.data;
    setPreviewUser({
      userId: data.user_id,
      fullName: data.full_name,
      roleId: data.role_id,
      roleName: data.role_name,
      permissions: data.permissions,
      roleModules: data.role_modules.map((m) => m.key),
      extraModules: data.extra_modules.map((m) => m.key),
    });

    const extras =
      data.extra_modules.length > 0
        ? ` + ${data.extra_modules.map((m) => m.label).join(", ")}`
        : "";
    toast.success(`Previewing as ${data.full_name} (${data.role_name}${extras})`);
  };

  return (
    <>
      {isPreviewActive() && (
        <DropdownMenuItem onClick={() => clearPreview()}>
          <Eye className="mr-2 h-4 w-4" />
          Exit preview
        </DropdownMenuItem>
      )}
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <UserCog className="mr-2 h-4 w-4" />
          Preview as role
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem
            onClick={() => {
              clearPreview();
              toast.message("Using your Super Admin access");
            }}
          >
            Default (Super Admin)
            {!previewRoleId && !previewUser && " ✓"}
          </DropdownMenuItem>
          {roles.map((r) => (
            <DropdownMenuItem
              key={r.id}
              onClick={() => {
                setPreviewRole(r.id);
                toast.success(`Previewing as role: ${r.name}`);
              }}
            >
              {r.name}
              {previewRoleId === r.id && " ✓"}
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSub onOpenChange={(open) => open && void loadUsers()}>
        <DropdownMenuSubTrigger>
          <Users className="mr-2 h-4 w-4" />
          Preview as user
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="max-h-72 overflow-y-auto">
          {users.length === 0 && (
            <DropdownMenuItem disabled>
              {usersLoaded ? "No users found" : "Loading users…"}
            </DropdownMenuItem>
          )}
          {users.map((u) => (
            <DropdownMenuItem
              key={u.id}
              disabled={loadingUserId === u.id}
              onClick={() => void handlePreviewUser(u.id)}
            >
              <span className="flex flex-col items-start gap-0.5">
                <span>
                  {u.full_name}
                  {previewUser?.userId === u.id && " ✓"}
                </span>
                <span className="text-xs text-muted-foreground">{u.role}</span>
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </>
  );
}
