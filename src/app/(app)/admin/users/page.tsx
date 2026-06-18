"use client";

import { useCallback, useEffect, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Key, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { roles } from "@/lib/mock-data/roles";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active?: boolean;
  status: string;
};

type ResetRequest = {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  created_at: string;
};

export default function UserManagementPage() {
  const { companies, branches, currentCompanyId } = useAppStore();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [resetRequests, setResetRequests] = useState<ResetRequest[]>([]);
  const [open, setOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetUser, setResetUser] = useState<UserRow | null>(null);
  const [resetRequest, setResetRequest] = useState<ResetRequest | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    role_id: "role-sales",
    company_ids: [] as string[],
    branch_ids: [] as string[],
  });

  const defaultCompanyId = currentCompanyId || companies[0]?.id || "";
  const defaultBranchId =
    branches.find((b) => b.company_id === defaultCompanyId)?.id ?? branches[0]?.id ?? "";

  const loadUsers = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    if (!res.ok) return;
    const json = (await res.json()) as { users: UserRow[] };
    setUsers(
      json.users.map((u) => ({
        ...u,
        status: u.is_active ? "Active" : "Inactive",
      }))
    );
  }, []);

  const loadResetRequests = useCallback(async () => {
    const res = await fetch("/api/admin/password-reset-requests");
    if (!res.ok) return;
    const json = (await res.json()) as { requests: ResetRequest[] };
    setResetRequests(json.requests ?? []);
  }, []);

  useEffect(() => {
    void loadUsers();
    void loadResetRequests();
  }, [loadUsers, loadResetRequests]);

  const openCreate = () => {
    setForm({
      email: "",
      password: "",
      full_name: "",
      role_id: "role-sales",
      company_ids: defaultCompanyId ? [defaultCompanyId] : [],
      branch_ids: defaultBranchId ? [defaultBranchId] : [],
    });
    setOpen(true);
  };

  const handleCreate = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = (await res.json()) as { error?: string };
    setSaving(false);
    if (!res.ok) {
      toast.error(json.error ?? "Failed to create user");
      return;
    }
    toast.success("User created — share the email and password with them");
    setOpen(false);
    void loadUsers();
  };

  const handleResetPassword = async () => {
    const userId = resetUser?.id ?? resetRequest?.user_id;
    if (!userId || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setSaving(true);

    if (resetRequest) {
      const res = await fetch("/api/admin/password-reset-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: resetRequest.id,
          action: "resolve",
          new_password: newPassword,
        }),
      });
      const json = (await res.json()) as { error?: string };
      setSaving(false);
      if (!res.ok) {
        toast.error(json.error ?? "Failed to reset password");
        return;
      }
    } else {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userId,
          action: "reset_password",
          password: newPassword,
        }),
      });
      const json = (await res.json()) as { error?: string };
      setSaving(false);
      if (!res.ok) {
        toast.error(json.error ?? "Failed to reset password");
        return;
      }
    }

    toast.success("Password updated — share the new password with the user");
    setResetOpen(false);
    setResetUser(null);
    setResetRequest(null);
    setNewPassword("");
    void loadResetRequests();
  };

  const columns: ColumnDef<UserRow>[] = [
    { accessorKey: "full_name", header: "Name" },
    { accessorKey: "email", header: "Email / Username" },
    { accessorKey: "role", header: "Role" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.status === "Active" ? "outline" : "secondary"}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setResetUser(row.original);
            setResetRequest(null);
            setNewPassword("");
            setResetOpen(true);
          }}
        >
          <Key className="mr-1 h-3 w-3" />
          Reset password
        </Button>
      ),
    },
  ];

  const currentUser = useAppStore((s) => s.currentUser);
  const assignableRoles = roles.filter((r) => {
    if (r.id === "role-auditor") return false;
    if (currentUser?.role_id === "role-super") return true;
    return ["role-sales", "role-cashier", "role-accountant", "role-warehouse"].includes(r.id);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Create users, reset passwords, and handle forgot-password requests"
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create user
          </Button>
        }
      />

      {resetRequests.length > 0 && (
        <Card className="border-warning/40">
          <CardHeader>
            <CardTitle className="text-base">Password reset requests</CardTitle>
            <CardDescription>
              Users who used Forgot password — set a new password and share it with them
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {resetRequests.map((req) => (
              <div
                key={req.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
              >
                <div>
                  <p className="font-medium">{req.full_name || req.email}</p>
                  <p className="text-sm text-muted-foreground">{req.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Requested {new Date(req.created_at).toLocaleString()}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setResetRequest(req);
                    setResetUser(null);
                    setNewPassword("");
                    setResetOpen(true);
                  }}
                >
                  Set new password
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={users} searchKey="full_name" />
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create user</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email (login username)</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <PasswordInput
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min 6 characters"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role_id} onValueChange={(v) => setForm({ ...form, role_id: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {assignableRoles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Companies</Label>
              {companies.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.company_ids.includes(c.id)}
                    onCheckedChange={(checked) => {
                      setForm({
                        ...form,
                        company_ids: checked
                          ? [...form.company_ids, c.id]
                          : form.company_ids.filter((id) => id !== c.id),
                      });
                    }}
                  />
                  {c.name}
                </label>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Branches</Label>
              {branches
                .filter((b) => form.company_ids.includes(b.company_id))
                .map((b) => (
                  <label key={b.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={form.branch_ids.includes(b.id)}
                      onCheckedChange={(checked) => {
                        setForm({
                          ...form,
                          branch_ids: checked
                            ? [...form.branch_ids, b.id]
                            : form.branch_ids.filter((id) => id !== b.id),
                        });
                      }}
                    />
                    {b.code} — {b.name}
                  </label>
                ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleCreate()} disabled={saving}>
              {saving ? "Creating…" : "Create user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Set new password</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {resetRequest
              ? `Reset password for ${resetRequest.full_name || resetRequest.email}`
              : resetUser
                ? `Reset password for ${resetUser.full_name}`
                : ""}
          </p>
          <div className="space-y-2">
            <Label>New password</Label>
            <PasswordInput
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 6 characters"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleResetPassword()} disabled={saving}>
              {saving ? "Saving…" : "Save password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
