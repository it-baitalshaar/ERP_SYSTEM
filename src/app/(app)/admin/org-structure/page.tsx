"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, MapPin, Package, Pencil, Plus, Store, Trash2 } from "lucide-react";
import { OrgDataActions, GlobalOrgDataRestore } from "@/components/admin/org-data-lifecycle-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { getBusinessLineLabel } from "@/lib/feature-flags";
import {
  deleteBranchEntity,
  downloadOrgDataBackupFile,
  exportOrgDataBackup,
  type OrgDataBackupV1,
} from "@/lib/data/org-data";
import {
  createOrgResource,
  deleteDepartmentUnit,
  downloadBackupFile,
  fetchOrgStructure,
  fetchUnitBackup,
  updateOrgResource,
  type OrgStructure,
  type OrgStructureUnit,
  type UnitDeletionBackup,
} from "@/lib/data/org-structure";
import type { BusinessLine, UnitType } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";

const BUSINESS_LINES: BusinessLine[] = ["trading", "construction", "logistics", "real_estate"];

type BranchRow = OrgStructureUnit["branches"][number];

type DialogKind = "unit" | "edit_unit" | "branch" | "warehouse" | "delete" | "delete_branch" | null;

const emptyUnitForm = (orgCurrency = "AED") => ({
  name: "",
  unit_type: "department" as UnitType,
  trade_license_no: "",
  business_lines: ["trading"] as BusinessLine[],
  address: "",
  currency: orgCurrency,
  vat_trn: "",
  fiscal_year_start: "01-01",
});

function unitNeedsTransfer(unit: OrgStructureUnit) {
  return (
    unit.branches.length > 0 ||
    unit.warehouses.length > 0
  );
}

export default function OrganizationStructurePage() {
  const {
    organizations,
    currentOrganizationId,
    setOrganization,
    hydrateSession,
  } = useAppStore();

  const [orgId, setOrgId] = useState(currentOrganizationId);
  const [structure, setStructure] = useState<OrgStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [selectedUnit, setSelectedUnit] = useState<OrgStructureUnit | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<BranchRow | null>(null);

  const orgCurrency = structure?.organization.currency ?? "AED";

  const [unitForm, setUnitForm] = useState(emptyUnitForm());

  const [siteForm, setSiteForm] = useState({
    name: "",
    code: "",
    trade_license_no: "",
    address: "",
    is_head_office: false,
  });

  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [transferToUnitId, setTransferToUnitId] = useState("");
  const [backupSaved, setBackupSaved] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [localBackup, setLocalBackup] = useState<UnitDeletionBackup | null>(null);

  const [branchDeleteConfirmName, setBranchDeleteConfirmName] = useState("");
  const [transferToBranchId, setTransferToBranchId] = useState("");
  const [branchBackupSaved, setBranchBackupSaved] = useState(false);
  const [branchBackupLoading, setBranchBackupLoading] = useState(false);
  const [branchLocalBackup, setBranchLocalBackup] = useState<OrgDataBackupV1 | null>(null);

  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const data = await fetchOrgStructure(orgId);
    setStructure(data);
    setLoading(false);
  }, [orgId]);

  useEffect(() => {
    setOrgId(currentOrganizationId);
  }, [currentOrganizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const transferTargets = useMemo(() => {
    if (!structure || !selectedUnit) return [];
    return structure.units.filter((u) => u.id !== selectedUnit.id);
  }, [structure, selectedUnit]);

  const branchTransferTargets = useMemo(() => {
    if (!selectedUnit || !selectedBranch) return [];
    return selectedUnit.branches.filter((b) => b.id !== selectedBranch.id);
  }, [selectedUnit, selectedBranch]);

  const openUnitDialog = (unitType: UnitType) => {
    setUnitForm({ ...emptyUnitForm(orgCurrency), unit_type: unitType });
    setDialog("unit");
  };

  const openEditUnitDialog = (unit: OrgStructureUnit) => {
    setSelectedUnit(unit);
    setUnitForm({
      name: unit.name,
      unit_type: unit.unit_type,
      trade_license_no: unit.trade_license_no,
      business_lines: unit.business_lines.length ? unit.business_lines : ["trading"],
      address: unit.address,
      currency: unit.currency || orgCurrency,
      vat_trn: unit.vat_trn,
      fiscal_year_start: unit.fiscal_year_start || "01-01",
    });
    setDialog("edit_unit");
  };

  const openDeleteDialog = (unit: OrgStructureUnit) => {
    setSelectedUnit(unit);
    setDeleteConfirmName("");
    setTransferToUnitId("");
    setBackupSaved(false);
    setLocalBackup(null);
    setDialog("delete");
  };

  const openDeleteBranchDialog = (unit: OrgStructureUnit, branch: BranchRow) => {
    setSelectedUnit(unit);
    setSelectedBranch(branch);
    setBranchDeleteConfirmName("");
    setTransferToBranchId("");
    setBranchBackupSaved(false);
    setBranchLocalBackup(null);
    setDialog("delete_branch");
  };

  const openBranchDialog = (unit: OrgStructureUnit) => {
    setSelectedUnit(unit);
    setSiteForm({
      name: "",
      code: "",
      trade_license_no: "",
      address: "",
      is_head_office: unit.branches.length === 0,
    });
    setDialog("branch");
  };

  const openWarehouseDialog = (unit: OrgStructureUnit) => {
    setSelectedUnit(unit);
    setSiteForm({ name: "", code: "", trade_license_no: "", address: "", is_head_office: false });
    setDialog("warehouse");
  };

  const handleCreateUnit = async () => {
    if (!orgId || !unitForm.name.trim() || !unitForm.trade_license_no.trim()) {
      toast.error("Name and trade license are required");
      return;
    }
    setSaving(true);
    const result = await createOrgResource({
      resource: "unit",
      organization_id: orgId,
      ...unitForm,
    });
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setStructure(result.data ?? null);
    await hydrateSession();
    toast.success(unitForm.unit_type === "shop" ? "Shop created" : "Department created");
    setDialog(null);
  };

  const handleUpdateUnit = async () => {
    if (!selectedUnit || !unitForm.name.trim() || !unitForm.trade_license_no.trim()) {
      toast.error("Name and trade license are required");
      return;
    }
    setSaving(true);
    const result = await updateOrgResource({
      resource: "unit",
      id: selectedUnit.id,
      ...unitForm,
    });
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setStructure(result.data ?? null);
    await hydrateSession();
    toast.success("Unit updated");
    setDialog(null);
  };

  const handleDownloadBackup = async () => {
    if (!selectedUnit) return;
    setBackupLoading(true);
    const result = await fetchUnitBackup(selectedUnit.id);
    setBackupLoading(false);
    if (result.error || !result.data) {
      toast.error(result.error ?? "Backup failed");
      return;
    }
    setLocalBackup(result.data);
    downloadBackupFile(selectedUnit.name, result.data);
    setBackupSaved(true);
    toast.success("Backup downloaded");
  };

  const handleDeleteDepartment = async () => {
    if (!selectedUnit) return;

    const needsTransfer = unitNeedsTransfer(selectedUnit);
    if (needsTransfer && !transferToUnitId) {
      toast.error("Select where branches and warehouses should be moved");
      return;
    }
    if (!backupSaved) {
      toast.error("Download and save the backup before deleting");
      return;
    }
    if (deleteConfirmName.trim() !== selectedUnit.name.trim()) {
      toast.error("Type the exact department name to confirm");
      return;
    }

    setSaving(true);
    const result = await deleteDepartmentUnit({
      unit_id: selectedUnit.id,
      confirm_name: deleteConfirmName.trim(),
      transfer_to_unit_id: needsTransfer ? transferToUnitId : undefined,
    });
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (result.data?.backup) {
      downloadBackupFile(`${selectedUnit.name}-final`, result.data.backup);
    }

    setStructure(result.data ?? null);
    await hydrateSession();
    toast.success("Department deleted. Branches and warehouses were preserved.");
    setDialog(null);
  };

  const handleDownloadBranchBackup = async () => {
    if (!selectedBranch) return;
    setBranchBackupLoading(true);
    const result = await exportOrgDataBackup("branch", selectedBranch.id);
    setBranchBackupLoading(false);
    if (result.error || !result.data) {
      toast.error(result.error ?? "Backup failed");
      return;
    }
    setBranchLocalBackup(result.data);
    downloadOrgDataBackupFile(selectedBranch.name, result.data);
    setBranchBackupSaved(true);
    toast.success("Backup downloaded");
  };

  const handleDeleteBranch = async () => {
    if (!selectedBranch) return;

    if (!branchBackupSaved) {
      toast.error("Download and save the backup before deleting");
      return;
    }
    const confirm = branchDeleteConfirmName.trim();
    if (confirm !== selectedBranch.name.trim() && confirm !== selectedBranch.code.trim()) {
      toast.error("Type the exact branch name or code to confirm");
      return;
    }

    setSaving(true);
    const result = await deleteBranchEntity({
      entity_id: selectedBranch.id,
      confirm_name: confirm,
      transfer_to_branch_id: transferToBranchId || undefined,
    });
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (result.data?.backup) {
      downloadOrgDataBackupFile(`${selectedBranch.name}-deleted`, result.data.backup);
    }

    setStructure(result.data ?? null);
    await hydrateSession();
    toast.success("Branch deleted");
    setDialog(null);
  };

  const handleCreateSite = async () => {
    if (!selectedUnit || !siteForm.name.trim() || !siteForm.code.trim() || !siteForm.trade_license_no.trim()) {
      toast.error("Name, code, and trade license are required");
      return;
    }
    setSaving(true);
    const result = await createOrgResource({
      resource: dialog === "warehouse" ? "warehouse" : "branch",
      company_id: selectedUnit.id,
      name: siteForm.name,
      code: siteForm.code,
      trade_license_no: siteForm.trade_license_no,
      address: siteForm.address,
      is_head_office: dialog === "branch" ? siteForm.is_head_office : undefined,
    });
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setStructure(result.data ?? null);
    await hydrateSession();
    toast.success(dialog === "warehouse" ? "Warehouse created" : "Branch created");
    setDialog(null);
  };

  const org = structure?.organization;
  const deleteReady =
    selectedUnit &&
    backupSaved &&
    deleteConfirmName.trim() === selectedUnit.name.trim() &&
    (!unitNeedsTransfer(selectedUnit) || Boolean(transferToUnitId));

  const branchDeleteReady =
    selectedBranch &&
    branchBackupSaved &&
    (branchDeleteConfirmName.trim() === selectedBranch.name.trim() ||
      branchDeleteConfirmName.trim() === selectedBranch.code.trim());

  const unitFormFields = (
    <>
      <div className="space-y-2">
        <Label>Type</Label>
        <Select
          value={unitForm.unit_type}
          onValueChange={(v) => setUnitForm({ ...unitForm, unit_type: v as UnitType })}
          disabled={dialog === "edit_unit"}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="department">Department</SelectItem>
            <SelectItem value="shop">Shop</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          value={unitForm.name}
          onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
          placeholder="AL SAQIYA TRADING"
        />
      </div>
      <div className="space-y-2">
        <Label>Trade license</Label>
        <Input
          value={unitForm.trade_license_no}
          onChange={(e) => setUnitForm({ ...unitForm, trade_license_no: e.target.value })}
          placeholder="CN-UNIT-001"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Currency</Label>
          <Input
            value={unitForm.currency}
            onChange={(e) => setUnitForm({ ...unitForm, currency: e.target.value })}
            placeholder="AED"
          />
        </div>
        <div className="space-y-2">
          <Label>Fiscal year start (MM-DD)</Label>
          <Input
            value={unitForm.fiscal_year_start}
            onChange={(e) => setUnitForm({ ...unitForm, fiscal_year_start: e.target.value })}
            placeholder="01-01"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>VAT TRN (optional)</Label>
        <Input
          value={unitForm.vat_trn}
          onChange={(e) => setUnitForm({ ...unitForm, vat_trn: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Address</Label>
        <Input
          value={unitForm.address}
          onChange={(e) => setUnitForm({ ...unitForm, address: e.target.value })}
          placeholder="Business Bay, Dubai"
        />
      </div>
      <div className="space-y-2">
        <Label>Business lines</Label>
        <div className="grid grid-cols-2 gap-2">
          {BUSINESS_LINES.map((line) => (
            <label key={line} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={unitForm.business_lines.includes(line)}
                onCheckedChange={(checked) => {
                  const next = checked
                    ? [...unitForm.business_lines, line]
                    : unitForm.business_lines.filter((l) => l !== line);
                  setUnitForm({
                    ...unitForm,
                    business_lines: next.length ? next : ["trading"],
                  });
                }}
              />
              {getBusinessLineLabel(line)}
            </label>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization structure"
        description="Manage departments, shops, branches, and warehouses — each with its own trade license"
        action={
          <div className="flex flex-wrap gap-2">
            <Select
              value={orgId}
              onValueChange={(id) => {
                setOrgId(id);
                void setOrganization(id);
              }}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => openUnitDialog("department")}>
              <Plus className="mr-2 h-4 w-4" />
              Add department
            </Button>
            <Button onClick={() => openUnitDialog("shop")}>
              <Plus className="mr-2 h-4 w-4" />
              Add shop
            </Button>
            {orgId && (
              <GlobalOrgDataRestore
                organizationId={orgId}
                structure={structure}
                onSuccess={() => {
                  void load();
                  void hydrateSession();
                }}
              />
            )}
          </div>
        }
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading structure…</p>
      ) : !org ? (
        <p className="text-sm text-muted-foreground">Organization not found.</p>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" />
                Organization
              </CardTitle>
              <CardDescription>Top-level legal entity</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <span className="text-muted-foreground">Name: </span>
                {org.name}
              </div>
              <div>
                <span className="text-muted-foreground">Trade license: </span>
                {org.trade_license_no || "—"}
              </div>
              <div>
                <span className="text-muted-foreground">Currency: </span>
                {org.currency}
              </div>
              <div>
                <span className="text-muted-foreground">VAT TRN: </span>
                {org.vat_trn || "—"}
              </div>
            </CardContent>
          </Card>

          {structure.units.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No shops or departments yet. Use &quot;Add department&quot; or &quot;Add shop&quot;,
                then add branches and warehouses under each unit.
              </CardContent>
            </Card>
          ) : (
            structure.units.map((unit) => (
              <Card key={unit.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        {unit.unit_type === "shop" ? (
                          <Store className="h-4 w-4" />
                        ) : (
                          <Building2 className="h-4 w-4" />
                        )}
                        {unit.name}
                        <Badge variant="secondary">
                          {unit.unit_type === "shop" ? "Shop" : "Department"}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        License: {unit.trade_license_no || "—"} · Currency: {unit.currency}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      {unit.business_lines.map((bl) => (
                        <Badge key={bl} variant="outline">
                          {getBusinessLineLabel(bl)}
                        </Badge>
                      ))}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditUnitDialog(unit)}
                        aria-label="Edit unit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {unit.unit_type === "department" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => openDeleteDialog(unit)}
                          aria-label="Delete department"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {orgId && (
                        <OrgDataActions
                          scope="unit"
                          entityId={unit.id}
                          entityLabel={unit.name}
                          organizationId={orgId}
                          structure={structure}
                          onUpdated={() => {
                            void load();
                            void hydrateSession();
                          }}
                        />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-medium flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        Branches ({unit.branches.length})
                      </p>
                      <Button size="sm" variant="outline" onClick={() => openBranchDialog(unit)}>
                        <Plus className="mr-1 h-3 w-3" />
                        Add branch
                      </Button>
                    </div>
                    {unit.branches.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No branches yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {unit.branches.map((b) => (
                          <div
                            key={b.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                          >
                            <span>
                              <strong>{b.code}</strong> — {b.name}
                              {b.is_head_office && (
                                <Badge className="ml-2" variant="secondary">
                                  HQ
                                </Badge>
                              )}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">
                                License: {b.trade_license_no || "—"}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                onClick={() => openDeleteBranchDialog(unit, b)}
                                aria-label={`Delete branch ${b.name}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                              {orgId && (
                                <OrgDataActions
                                  scope="branch"
                                  entityId={b.id}
                                  entityLabel={b.name}
                                  organizationId={orgId}
                                  structure={structure}
                                  onUpdated={() => {
                                    void load();
                                    void hydrateSession();
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-medium flex items-center gap-1">
                        <Package className="h-3.5 w-3.5" />
                        Warehouses ({unit.warehouses.length})
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openWarehouseDialog(unit)}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Add warehouse
                      </Button>
                    </div>
                    {unit.warehouses.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No warehouses yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {unit.warehouses.map((w) => (
                          <div
                            key={w.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                          >
                            <span>
                              <strong>{w.code}</strong> — {w.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">
                                License: {w.trade_license_no || "—"}
                              </span>
                              {orgId && (
                                <OrgDataActions
                                  scope="warehouse"
                                  entityId={w.id}
                                  entityLabel={w.name}
                                  organizationId={orgId}
                                  structure={structure}
                                  onUpdated={() => {
                                    void load();
                                    void hydrateSession();
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </>
      )}

      <Dialog open={dialog === "unit" || dialog === "edit_unit"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {dialog === "edit_unit"
                ? "Edit unit"
                : unitForm.unit_type === "shop"
                  ? "Add shop"
                  : "Add department"}
            </DialogTitle>
            <DialogDescription>
              Configure trade license, currency, business lines, and other details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">{unitFormFields}</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => void (dialog === "edit_unit" ? handleUpdateUnit() : handleCreateUnit())}
              disabled={saving}
            >
              {saving ? "Saving…" : dialog === "edit_unit" ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "delete"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Delete department</DialogTitle>
            <DialogDescription>
              This removes the department record only. Branches, warehouses, and sales data are
              moved to another unit — they are not deleted.
            </DialogDescription>
          </DialogHeader>
          {selectedUnit && (
            <div className="space-y-4 text-sm">
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                <p className="font-medium text-destructive">{selectedUnit.name}</p>
                <p className="mt-1 text-muted-foreground">
                  {selectedUnit.branches.length} branch(es), {selectedUnit.warehouses.length}{" "}
                  warehouse(s) will be preserved.
                </p>
              </div>

              {transferTargets.length > 0 && (
                <div className="space-y-2">
                  <Label>Move branches, warehouses &amp; sales data to</Label>
                  <Select value={transferToUnitId} onValueChange={setTransferToUnitId}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          unitNeedsTransfer(selectedUnit)
                            ? "Select target unit (required)"
                            : "Select if sales data exists (optional)"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {transferTargets.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} ({u.unit_type === "shop" ? "Shop" : "Department"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {unitNeedsTransfer(selectedUnit) && transferTargets.length === 0 && (
                <p className="text-xs text-destructive">
                  Create another shop or department before deleting this one.
                </p>
              )}

              <div className="space-y-2">
                <Label>Backup</Label>
                <p className="text-xs text-muted-foreground">
                  Download a JSON archive of this department and all related records before
                  deletion. A copy is also stored server-side.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void handleDownloadBackup()}
                  disabled={backupLoading}
                >
                  {backupLoading ? "Preparing…" : "Download backup"}
                </Button>
                {localBackup && (
                  <p className="text-xs text-muted-foreground">
                    Exported {new Date(localBackup.exported_at).toLocaleString()}
                  </p>
                )}
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={backupSaved}
                    onCheckedChange={(checked) => setBackupSaved(checked === true)}
                  />
                  I have saved the backup file
                </label>
              </div>

              <div className="space-y-2">
                <Label>
                  Type <span className="font-semibold">{selectedUnit.name}</span> to confirm
                </Label>
                <Input
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  placeholder={selectedUnit.name}
                  autoComplete="off"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDeleteDepartment()}
              disabled={saving || !deleteReady}
            >
              {saving ? "Deleting…" : "Delete department"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "delete_branch"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Delete branch</DialogTitle>
            <DialogDescription>
              Permanently removes this branch. Sales documents are moved to another branch in the
              same unit — they are not deleted.
            </DialogDescription>
          </DialogHeader>
          {selectedBranch && (
            <div className="space-y-4 text-sm">
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                <p className="font-medium text-destructive">
                  {selectedBranch.code} — {selectedBranch.name}
                </p>
                {selectedUnit && (
                  <p className="mt-1 text-muted-foreground">Under {selectedUnit.name}</p>
                )}
              </div>

              {branchTransferTargets.length > 0 && (
                <div className="space-y-2">
                  <Label>Move quotations, orders &amp; invoices to</Label>
                  <Select value={transferToBranchId} onValueChange={setTransferToBranchId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target branch (required if sales data exists)" />
                    </SelectTrigger>
                    <SelectContent>
                      {branchTransferTargets.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.code} — {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Required when this branch has sales documents. Select a branch even if unsure.
                  </p>
                </div>
              )}

              {branchTransferTargets.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  This is the only branch under this unit. Sales documents cannot be transferred —
                  reset branch data first if needed.
                </p>
              )}

              <div className="space-y-2">
                <Label>Backup</Label>
                <p className="text-xs text-muted-foreground">
                  Download a JSON archive before deletion. A copy is stored server-side.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void handleDownloadBranchBackup()}
                  disabled={branchBackupLoading}
                >
                  {branchBackupLoading ? "Preparing…" : "Download backup"}
                </Button>
                {branchLocalBackup && (
                  <p className="text-xs text-muted-foreground">
                    Exported {new Date(branchLocalBackup.exported_at).toLocaleString()}
                  </p>
                )}
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={branchBackupSaved}
                    onCheckedChange={(checked) => setBranchBackupSaved(checked === true)}
                  />
                  I have saved the backup file
                </label>
              </div>

              <div className="space-y-2">
                <Label>
                  Type <span className="font-semibold">{selectedBranch.name}</span> or{" "}
                  <span className="font-semibold">{selectedBranch.code}</span> to confirm
                </Label>
                <Input
                  value={branchDeleteConfirmName}
                  onChange={(e) => setBranchDeleteConfirmName(e.target.value)}
                  placeholder={selectedBranch.name}
                  autoComplete="off"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDeleteBranch()}
              disabled={saving || !branchDeleteReady}
            >
              {saving ? "Deleting…" : "Delete branch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog === "branch" || dialog === "warehouse"}
        onOpenChange={(open) => !open && setDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add {dialog === "warehouse" ? "warehouse" : "branch"}
              {selectedUnit ? ` — ${selectedUnit.name}` : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={siteForm.name}
                  onChange={(e) => setSiteForm({ ...siteForm, name: e.target.value })}
                  placeholder={dialog === "warehouse" ? "Al Quoz Warehouse" : "Dubai HQ"}
                />
              </div>
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  value={siteForm.code}
                  onChange={(e) => setSiteForm({ ...siteForm, code: e.target.value })}
                  placeholder="DXB"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Trade license</Label>
              <Input
                value={siteForm.trade_license_no}
                onChange={(e) => setSiteForm({ ...siteForm, trade_license_no: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={siteForm.address}
                onChange={(e) => setSiteForm({ ...siteForm, address: e.target.value })}
              />
            </div>
            {dialog === "branch" && (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={siteForm.is_head_office}
                  onCheckedChange={(checked) =>
                    setSiteForm({ ...siteForm, is_head_office: checked === true })
                  }
                />
                Head office branch
              </label>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button onClick={() => void handleCreateSite()} disabled={saving}>
              {saving ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
