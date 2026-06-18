"use client";

import { useEffect, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil } from "lucide-react";
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
import { getBusinessLineLabel } from "@/lib/feature-flags";
import { fetchCompanies, updateCompanyName } from "@/lib/data/companies";
import type { BusinessLine, Company } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";

type CompanyRow = Company & { branches: number };

export default function CompanyManagementPage() {
  const { companies, branches, refreshCompanies } = useAppStore();
  const [rows, setRows] = useState<CompanyRow[]>([]);
  const [editing, setEditing] = useState<Company | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const fromDb = await fetchCompanies();
      const source = fromDb.length ? fromDb : companies;
      if (fromDb.length) refreshCompanies(fromDb);
      setRows(
        source.map((c) => ({
          ...c,
          branches: branches.filter((b) => b.company_id === c.id).length,
        }))
      );
    })();
  }, [companies, branches, refreshCompanies]);

  const columns: ColumnDef<CompanyRow>[] = [
    { accessorKey: "name", header: "Company" },
    { accessorKey: "trade_license_no", header: "Trade License" },
    { accessorKey: "currency", header: "Currency" },
    { accessorKey: "branches", header: "Branches" },
    {
      accessorKey: "business_lines",
      header: "Business Lines",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.business_lines.map((bl) => (
            <Badge key={bl} variant="secondary">
              {getBusinessLineLabel(bl as BusinessLine)}
            </Badge>
          ))}
        </div>
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
            setEditing(row.original);
            setEditName(row.original.name);
          }}
        >
          <Pencil className="mr-1 h-3 w-3" />
          Edit name
        </Button>
      ),
    },
  ];

  const handleSave = async () => {
    if (!editing || !editName.trim()) return;
    setSaving(true);
    const { error } = await updateCompanyName(editing.id, editName.trim());
    setSaving(false);
    if (error) {
      toast.error(error);
      return;
    }
    const updated = companies.map((c) =>
      c.id === editing.id ? { ...c, name: editName.trim() } : c
    );
    refreshCompanies(updated);
    toast.success("Company name updated");
    setEditing(null);
  };

  return (
    <div>
      <PageHeader
        title="Company Management"
        description="Business lines drive default enabled modules (PRD §5). Names are editable by admin."
      />
      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={rows} searchKey="name" />
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit company name</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="company-name">Company name</Label>
            <Input
              id="company-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
