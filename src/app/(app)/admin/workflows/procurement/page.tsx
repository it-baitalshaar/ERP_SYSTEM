"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { WorkflowMindmap } from "@/components/workflows/workflow-mindmap";
import { WorkflowStepEditor } from "@/components/workflows/workflow-step-editor";
import { fetchWorkflowBundle, saveWorkflowSettings } from "@/lib/data/workflows";
import { PROCUREMENT_WORKFLOW_FLAG } from "@/lib/workflows/procurement";
import type { WorkflowDefinition, WorkflowStepDefinition } from "@/lib/workflows/types";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";

export default function ProcurementWorkflowAdminPage() {
  const companyId = useAppStore((s) => s.currentCompanyId);
  const company = useAppStore((s) => s.getCurrentCompany());
  const workflowFlagEnabled = useAppStore((s) =>
    s.isFeatureEnabled(PROCUREMENT_WORKFLOW_FLAG)
  );
  const toggleFeatureFlag = useAppStore((s) => s.toggleFeatureFlag);

  const [definition, setDefinition] = useState<WorkflowDefinition | null>(null);
  const [steps, setSteps] = useState<WorkflowStepDefinition[]>([]);
  const [selectedStepKey, setSelectedStepKey] = useState<string | null>("mr_approve");
  const [users, setUsers] = useState<{ id: string; full_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [bundle, usersRes] = await Promise.all([
      fetchWorkflowBundle(companyId, "procurement"),
      fetch("/api/admin/users"),
    ]);
    if (bundle.definition) setDefinition(bundle.definition);
    if (bundle.data?.steps) setSteps(bundle.data.steps);
    if (usersRes.ok) {
      const json = (await usersRes.json()) as {
        users?: { id: string; full_name: string }[];
      };
      setUsers(json.users ?? []);
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedStep = steps.find((s) => s.step_key === selectedStepKey) ?? steps[0];

  const updateStep = (patch: Partial<WorkflowStepDefinition>) => {
    if (!selectedStep) return;
    setSteps((prev) =>
      prev.map((s) => (s.step_key === selectedStep.step_key ? { ...s, ...patch } : s))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    const overrides = steps.map((s) => ({
      step_key: s.step_key,
      enabled: s.enabled,
      requires_approval: s.requires_approval,
      approver_mode: s.approver_mode,
      approver_role_id: s.approver_role_id,
      approver_user_id: s.approver_user_id,
    }));
    const result = await saveWorkflowSettings(companyId, "procurement", overrides);
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    if (result.data) setSteps(result.data.steps);
    toast.success("Procurement workflow saved");
  };

  if (loading || !definition) {
    return <p className="text-sm text-muted-foreground">Loading workflow…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/workflows">
            <ArrowLeft className="mr-1 h-4 w-4" />
            All departments
          </Link>
        </Button>
        {company && <Badge variant="outline">{company.name}</Badge>}
      </div>

      <PageHeader
        title="Procurement workflow"
        description={definition.description}
        action={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/procurement/workflow">Preview (user view)</Link>
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving…" : "Save workflow"}
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Feature toggle</CardTitle>
          <CardDescription>
            When enabled, approval rules below are enforced on procurement documents.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <Label htmlFor="workflow-flag">Custom procurement workflow</Label>
          <Switch
            id="workflow-flag"
            checked={workflowFlagEnabled}
            onCheckedChange={() => void toggleFeatureFlag(PROCUREMENT_WORKFLOW_FLAG)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Process map</CardTitle>
          <CardDescription>
            Click a step to configure it. Disabled steps are skipped in the live flow.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WorkflowMindmap
            definition={definition}
            steps={steps}
            selectedStepKey={selectedStepKey}
            onStepClick={setSelectedStepKey}
          />
        </CardContent>
      </Card>

      {selectedStep && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Step settings</CardTitle>
          </CardHeader>
          <CardContent>
            <WorkflowStepEditor step={selectedStep} users={users} onChange={updateStep} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
