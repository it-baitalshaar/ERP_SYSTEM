"use client";

import { ArrowRight, CheckCircle2, Circle, Shield, User, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { WorkflowDefinition, WorkflowStepDefinition } from "@/lib/workflows/types";
import { cn } from "@/lib/utils";

const kindColors: Record<string, string> = {
  document: "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40",
  approval: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40",
  gate: "border-violet-200 bg-violet-50 dark:border-violet-900 dark:bg-violet-950/40",
  validation: "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40",
};

function approverLabel(step: WorkflowStepDefinition): string | null {
  if (!step.requires_approval || step.kind === "document") return null;
  if (!step.enabled) return "Skipped";
  switch (step.approver_mode) {
    case "admin":
      return "Admin";
    case "role":
      return step.approver_role_id ? `Role: ${step.approver_role_id}` : "Role";
    case "user":
      return step.approver_user_id ? `User` : "Specific user";
    default:
      return "Auto";
  }
}

interface WorkflowMindmapProps {
  definition: WorkflowDefinition;
  steps: WorkflowStepDefinition[];
  compact?: boolean;
  onStepClick?: (stepKey: string) => void;
  selectedStepKey?: string | null;
}

export function WorkflowMindmap({
  definition,
  steps,
  compact = false,
  onStepClick,
  selectedStepKey,
}: WorkflowMindmapProps) {
  const stepMap = new Map(steps.map((s) => [s.step_key, s]));
  const ordered = [...steps].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto pb-2">
        <div
          className={cn(
            "flex min-w-max items-stretch gap-0",
            compact ? "gap-1" : "gap-0"
          )}
        >
          {ordered.map((step, index) => {
            const approver = approverLabel(step);
            const isSelected = selectedStepKey === step.step_key;
            return (
              <div key={step.step_key} className="flex items-center">
                <button
                  type="button"
                  onClick={() => onStepClick?.(step.step_key)}
                  className={cn(
                    "text-left transition-shadow",
                    onStepClick && "cursor-pointer hover:opacity-90",
                    !onStepClick && "cursor-default"
                  )}
                >
                  <Card
                    className={cn(
                      "w-[min(11rem,42vw)] shrink-0 border-2 shadow-sm",
                      kindColors[step.kind] ?? "bg-card",
                      !step.enabled && "opacity-50 grayscale",
                      isSelected && "ring-2 ring-primary ring-offset-2"
                    )}
                  >
                    <CardContent className={cn("p-3", compact && "p-2")}>
                      <div className="mb-1 flex items-start justify-between gap-1">
                        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          {step.kind}
                        </span>
                        {step.enabled ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <p className={cn("font-semibold leading-tight", compact ? "text-xs" : "text-sm")}>
                        {step.label}
                      </p>
                      {!compact && (
                        <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                          {step.description}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {step.requires_approval && step.enabled && (
                          <Badge variant="outline" className="text-[10px]">
                            Approval
                          </Badge>
                        )}
                        {approver && (
                          <Badge variant="secondary" className="gap-0.5 text-[10px]">
                            {step.approver_mode === "admin" && (
                              <Shield className="h-2.5 w-2.5" />
                            )}
                            {step.approver_mode === "user" && (
                              <User className="h-2.5 w-2.5" />
                            )}
                            {approver}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </button>
                {index < ordered.length - 1 && (
                  <ArrowRight className="mx-1 h-5 w-5 shrink-0 text-muted-foreground" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Circle className="h-2 w-2 fill-blue-500 text-blue-500" /> Document
        </span>
        <span className="flex items-center gap-1">
          <Circle className="h-2 w-2 fill-amber-500 text-amber-500" /> Approval
        </span>
        <span className="flex items-center gap-1">
          <Circle className="h-2 w-2 fill-violet-500 text-violet-500" /> Gate
        </span>
        <span className="flex items-center gap-1">
          <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500" /> Validation
        </span>
      </div>

      {/* Edge summary for accessibility */}
      <p className="sr-only">
        Flow: {definition.edges.map((e) => `${e.from} to ${e.to}`).join(", ")}
      </p>
    </div>
  );
}
