"use client";

import { useCallback, useEffect, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { COMPANY_AL_SAQIYA, BRANCH_AL_SAQIYA_HQ } from "@/lib/mock-data/companies";

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active?: boolean;
  status: string;
};

export default function UserManagementPage() {
  const { companies, branches } = useAppStore();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    role_id: "role-sales",
    company_ids: [COMPANY_AL_SAQIYA],
    branch_ids: [BRANCH_AL_SAQIYA_HQ],
  });

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

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

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
  ];

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
    toast.success("User created — they can sign in with the email and password you set");
    setOpen(false);
    setForm({
      email: "",
      password: "",
      full_name: "",
      role_id: "role-sales",
      company_ids: [COMPANY_AL_SAQIYA],
      branch_ids: [BRANCH_AL_SAQIYA_HQ],
    });
    void loadUsers();
  };

  const currentUser = useAppStore((s) => s.currentUser);
  const assignableRoles = roles.filter((r) => {
    if (r.id === "role-auditor") return false;
    if (currentUser?.role_id === "role-super") return true;
    return ["role-sales", "role-cashier", "role-accountant", "role-warehouse"].includes(r.id);
  });

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Create users with email and password — no Supabase Auth"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create User
          </Button>
        }
      />
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
              <Input
                type="password"
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
    </div>
  );
}
