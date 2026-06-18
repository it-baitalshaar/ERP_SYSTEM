"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Database, Download, RotateCcw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OrgStructure } from "@/lib/data/org-structure";
import {
  downloadOrgDataBackupFile,
  exportOrgDataBackup,
  parseBackupFile,
  resetOrgDataScope,
  restoreOrgDataBackup,
  backupSummary,
  type OrgDataBackupV1,
  type OrgDataScope,
} from "@/lib/data/org-data";
import { scopeLabel } from "@/lib/org-data-backup";
import { toast } from "sonner";

interface OrgDataActionsProps {
  scope: OrgDataScope;
  entityId: string;
  entityLabel: string;
  organizationId: string;
  structure: OrgStructure | null;
  onUpdated: () => void;
  variant?: "icon" | "menu";
}

type LifecycleMode = "reset" | "restore" | null;

export function OrgDataActions({
  scope,
  entityId,
  entityLabel,
  organizationId,
  structure,
  onUpdated,
  variant = "icon",
}: OrgDataActionsProps) {
  const [mode, setMode] = useState<LifecycleMode>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    const result = await exportOrgDataBackup(scope, entityId);
    setExporting(false);
    if (result.error || !result.data) {
      toast.error(result.error ?? "Export failed");
      return;
    }
    downloadOrgDataBackupFile(entityLabel, result.data);
    toast.success("Backup downloaded");
  };

  const trigger =
    variant === "menu" ? (
      <Button size="sm" variant="outline">
        <Database className="mr-1 h-3 w-3" />
        Data
      </Button>
    ) : (
      <Button size="sm" variant="ghost" aria-label="Data actions">
        <Database className="h-3.5 w-3.5" />
      </Button>
    );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => void handleExport()} disabled={exporting}>
            <Download className="mr-2 h-4 w-4" />
            Export backup
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setMode("reset")}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset data (start fresh)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setMode("restore")}>
            <Upload className="mr-2 h-4 w-4" />
            Restore from backup file
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <OrgDataLifecycleDialog
        open={mode !== null}
        onOpenChange={(open) => !open && setMode(null)}
        mode={mode ?? "reset"}
        scope={scope}
        entityId={entityId}
        entityLabel={entityLabel}
        organizationId={organizationId}
        structure={structure}
        onSuccess={() => {
          setMode(null);
          onUpdated();
        }}
      />
    </>
  );
}

interface OrgDataLifecycleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "reset" | "restore";
  scope: OrgDataScope;
  entityId: string;
  entityLabel: string;
  organizationId: string;
  structure: OrgStructure | null;
  onSuccess: () => void;
}

export function OrgDataLifecycleDialog({
  open,
  onOpenChange,
  mode,
  scope,
  entityId,
  entityLabel,
  organizationId,
  structure,
  onSuccess,
}: OrgDataLifecycleDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmName, setConfirmName] = useState("");
  const [backupSaved, setBackupSaved] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localBackup, setLocalBackup] = useState<OrgDataBackupV1 | null>(null);
  const [restoreTargetId, setRestoreTargetId] = useState(entityId);

  useEffect(() => {
    if (!open) {
      setConfirmName("");
      setBackupSaved(false);
      setLocalBackup(null);
      setRestoreTargetId(entityId);
    }
  }, [open, entityId]);

  const restoreTargets = useMemo(() => {
    if (!structure || !localBackup) return [];
    if (localBackup.scope === "unit") {
      return structure.units.map((u) => ({
        id: u.id,
        label: `${u.name} (${u.unit_type === "shop" ? "Shop" : "Department"})`,
        confirm: u.name,
      }));
    }
    if (localBackup.scope === "branch") {
      return structure.units.flatMap((u) =>
        u.branches.map((b) => ({
          id: b.id,
          label: `${b.code} — ${b.name}`,
          confirm: b.name,
        }))
      );
    }
    return structure.units.flatMap((u) =>
      u.warehouses.map((w) => ({
        id: w.id,
        label: `${w.code} — ${w.name}`,
        confirm: w.name,
      }))
    );
  }, [structure, localBackup]);

  useEffect(() => {
    if (!open || mode !== "restore" || !localBackup) return;
    if (restoreTargets.some((t) => t.id === entityId)) {
      setRestoreTargetId(entityId);
    } else if (restoreTargets.length === 1) {
      setRestoreTargetId(restoreTargets[0].id);
    }
  }, [open, mode, localBackup, restoreTargets, entityId]);

  const selectedTarget = restoreTargets.find((t) => t.id === restoreTargetId);

  const confirmPhrase =
    mode === "restore" && selectedTarget ? selectedTarget.confirm : entityLabel;

  const ready =
    mode === "reset"
      ? backupSaved && confirmName.trim() === entityLabel.trim()
      : localBackup !== null &&
        localBackup.organization_id === organizationId &&
        localBackup.scope === scope &&
        Boolean(restoreTargetId) &&
        confirmName.trim() === confirmPhrase.trim();

  const handleDownloadPreReset = async () => {
    setBackupLoading(true);
    const result = await exportOrgDataBackup(scope, entityId);
    setBackupLoading(false);
    if (result.error || !result.data) {
      toast.error(result.error ?? "Backup failed");
      return;
    }
    setLocalBackup(result.data);
    downloadOrgDataBackupFile(entityLabel, result.data);
    setBackupSaved(true);
    toast.success("Backup downloaded");
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = await parseBackupFile(file);
      if (parsed.organization_id !== organizationId) {
        toast.error("Backup belongs to a different organization");
        return;
      }
      if (parsed.scope !== scope) {
        toast.error(`This backup is for a ${scopeLabel(parsed.scope)}, not a ${scopeLabel(scope)}`);
        return;
      }
      setLocalBackup(parsed);
      setBackupSaved(true);
      const match = restoreTargets.find((t) => t.id === entityId);
      if (match) setRestoreTargetId(entityId);
      toast.success("Backup file loaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid backup file");
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    if (mode === "reset") {
      const result = await resetOrgDataScope({
        scope,
        entity_id: entityId,
        confirm_name: confirmName.trim(),
      });
      setSaving(false);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.data?.backup) {
        downloadOrgDataBackupFile(`${entityLabel}-after-reset`, result.data.backup);
      }
      toast.success("Data cleared. Structure preserved — you can start fresh or restore.");
      onSuccess();
      return;
    }

    if (!localBackup) {
      setSaving(false);
      toast.error("Load a backup file first");
      return;
    }

    const result = await restoreOrgDataBackup({
      target_id: restoreTargetId,
      confirm_name: confirmName.trim(),
      backup: localBackup,
    });
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Data restored from backup");
    onSuccess();
  };

  const resetDescription =
    scope === "unit"
      ? "Clears customers, quotations, orders, and invoices for this shop or department. Branches and warehouses stay in place."
      : scope === "branch"
        ? "Clears quotations, orders, and invoices for this branch only. The branch record is kept."
        : "Archives the warehouse profile. No transactional warehouse data exists yet — structure is preserved.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "reset" ? "Reset data" : "Restore from backup"} — {entityLabel}
          </DialogTitle>
          <DialogDescription>
            {mode === "reset" ? resetDescription : "Upload a JSON backup exported from this ERP."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {mode === "reset" ? (
            <>
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                <p className="font-medium text-destructive">Start from the beginning</p>
                <p className="mt-1 text-muted-foreground">
                  {scopeLabel(scope)}: <strong>{entityLabel}</strong>
                </p>
              </div>
              <div className="space-y-2">
                <Label>Backup (required)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void handleDownloadPreReset()}
                  disabled={backupLoading}
                >
                  {backupLoading ? "Preparing…" : "Download backup before reset"}
                </Button>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={backupSaved}
                    onCheckedChange={(c) => setBackupSaved(c === true)}
                  />
                  I have saved the backup file
                </label>
              </div>
              <div className="space-y-2">
                <Label>
                  Type <span className="font-semibold">{entityLabel}</span> to confirm
                </Label>
                <Input
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  autoComplete="off"
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Backup file (.json)</Label>
                <Input
                  ref={fileRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={(e) => void handleFile(e.target.files?.[0])}
                />
              </div>
              {localBackup && (
                <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">{localBackup.label}</p>
                  <p className="mt-1">{backupSummary(localBackup)}</p>
                  <p className="mt-1">Exported {new Date(localBackup.exported_at).toLocaleString()}</p>
                </div>
              )}
              {localBackup && restoreTargets.length > 1 && (
                <div className="space-y-2">
                  <Label>Restore into</Label>
                  <Select value={restoreTargetId} onValueChange={setRestoreTargetId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {restoreTargets.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>
                  Type <span className="font-semibold">{confirmPhrase}</span> to confirm restore
                </Label>
                <Input
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  autoComplete="off"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={mode === "reset" ? "destructive" : "default"}
            disabled={saving || !ready}
            onClick={() => void handleSubmit()}
          >
            {saving ? "Working…" : mode === "reset" ? "Reset data" : "Restore data"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface GlobalRestoreCardProps {
  organizationId: string;
  structure: OrgStructure | null;
  onSuccess: () => void;
}

/** Standalone restore entry point (e.g. Backup admin page). */
export function GlobalOrgDataRestore({
  organizationId,
  structure,
  onSuccess,
}: GlobalRestoreCardProps) {
  const [open, setOpen] = useState(false);
  const [backup, setBackup] = useState<OrgDataBackupV1 | null>(null);
  const [targetId, setTargetId] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const [saving, setSaving] = useState(false);

  const targets = useMemo(() => {
    if (!structure || !backup) return [];
    if (backup.scope === "unit") {
      return structure.units.map((u) => ({
        id: u.id,
        label: `${u.name} (${u.unit_type})`,
        confirm: u.name,
      }));
    }
    if (backup.scope === "branch") {
      return structure.units.flatMap((u) =>
        u.branches.map((b) => ({ id: b.id, label: `${b.code} — ${b.name}`, confirm: b.name }))
      );
    }
    return structure.units.flatMap((u) =>
      u.warehouses.map((w) => ({ id: w.id, label: `${w.code} — ${w.name}`, confirm: w.name }))
    );
  }, [structure, backup]);

  const selected = targets.find((t) => t.id === targetId);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = await parseBackupFile(file);
      if (parsed.organization_id !== organizationId) {
        toast.error("Backup belongs to a different organization");
        return;
      }
      setBackup(parsed);
      setTargetId("");
      setConfirmName("");
      toast.success("Backup loaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid file");
    }
  };

  const handleRestore = async () => {
    if (!backup || !targetId || !selected) return;
    setSaving(true);
    const result = await restoreOrgDataBackup({
      target_id: targetId,
      confirm_name: confirmName.trim(),
      backup,
    });
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Restore complete");
    setOpen(false);
    setBackup(null);
    onSuccess();
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Upload className="mr-2 h-4 w-4" />
        Restore from backup file
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Restore from backup</DialogTitle>
            <DialogDescription>
              Upload a customized JSON backup exported from Organization Structure or this page.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <Input
              type="file"
              accept="application/json,.json"
              onChange={(e) => void handleFile(e.target.files?.[0])}
            />
            {backup && (
              <div className="rounded-md border bg-muted/40 p-3 text-xs">
                <p className="font-medium">{scopeLabel(backup.scope)}: {backup.label}</p>
                <p className="mt-1 text-muted-foreground">{backupSummary(backup)}</p>
              </div>
            )}
            {backup && targets.length > 0 && (
              <div className="space-y-2">
                <Label>Restore into</Label>
                <Select value={targetId} onValueChange={setTargetId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target" />
                  </SelectTrigger>
                  <SelectContent>
                    {targets.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {selected && (
              <div className="space-y-2">
                <Label>Type <span className="font-semibold">{selected.confirm}</span> to confirm</Label>
                <Input value={confirmName} onChange={(e) => setConfirmName(e.target.value)} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              disabled={
                saving ||
                !backup ||
                !targetId ||
                !selected ||
                confirmName.trim() !== selected.confirm.trim()
              }
              onClick={() => void handleRestore()}
            >
              {saving ? "Restoring…" : "Restore"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
