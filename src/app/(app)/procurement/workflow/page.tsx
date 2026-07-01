"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { BilingualText } from "@/components/i18n/field-label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkflowMindmap } from "@/components/workflows/workflow-mindmap";
import { fetchWorkflowBundle } from "@/lib/data/workflows";
import { PROCUREMENT_WORKFLOW } from "@/lib/workflows/procurement";
import type { WorkflowDefinition, WorkflowStepDefinition } from "@/lib/workflows/types";
import { useAppStore } from "@/stores/app-store";
import { isAdminRole } from "@/lib/permissions";
import { useTranslations } from "@/hooks/use-translations";

export default function ProcurementWorkflowViewPage() {
  const companyId = useAppStore((s) => s.currentCompanyId);
  const roleId = useAppStore((s) => s.getEffectiveRoleId());
  const { t } = useTranslations();
  const [definition, setDefinition] = useState<WorkflowDefinition>(PROCUREMENT_WORKFLOW);
  const [steps, setSteps] = useState<WorkflowStepDefinition[]>(PROCUREMENT_WORKFLOW.steps);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const bundle = await fetchWorkflowBundle(companyId, "procurement");
    if (bundle.definition) setDefinition(bundle.definition);
    if (bundle.data?.steps) setSteps(bundle.data.steps);
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={<BilingualText labelKey="procurement.pages.workflow.title" />}
        description={<BilingualText labelKey="procurement.pages.workflow.descriptionLong" />}
        action={
          isAdminRole(roleId) ? (
            <Button variant="outline" asChild>
              <Link href="/admin/workflows/procurement">
                <Settings className="me-2 h-4 w-4" />
                {t("procurement.pages.workflow.configure")}
              </Link>
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>
            <BilingualText labelKey="procurement.pages.workflow.mindmapTitle" />
          </CardTitle>
          <CardDescription>
            <BilingualText labelKey="procurement.pages.workflow.mindmapDescription" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
          ) : (
            <WorkflowMindmap definition={definition} steps={steps} compact />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
