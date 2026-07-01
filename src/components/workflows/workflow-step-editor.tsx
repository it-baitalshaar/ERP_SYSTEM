"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { WorkflowStepDefinition, WorkflowApproverMode } from "@/lib/workflows/types";
import { roles } from "@/lib/mock-data/roles";

interface WorkflowStepEditorProps {
  step: WorkflowStepDefinition;
  users: { id: string; full_name: string }[];
  onChange: (patch: Partial<WorkflowStepDefinition>) => void;
}

const APPROVER_MODES: { value: WorkflowApproverMode; label: string }[] = [
  { value: "none", label: "Auto (no approver)" },
  { value: "admin", label: "Admin roles" },
  { value: "role", label: "Specific role" },
  { value: "user", label: "Specific user" },
];

export function WorkflowStepEditor({ step, users, onChange }: WorkflowStepEditorProps) {
  const canConfigureApproval =
    step.kind === "approval" || step.kind === "gate" || step.kind === "validation";

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div>
        <h4 className="font-medium">{step.label}</h4>
        <p className="text-sm text-muted-foreground">{step.description}</p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <Label htmlFor={`${step.step_key}-enabled`}>Step enabled</Label>
          <p className="text-xs text-muted-foreground">
            Off = skip this step in the chain
          </p>
        </div>
        <Switch
          id={`${step.step_key}-enabled`}
          checked={step.enabled}
          onCheckedChange={(enabled) => onChange({ enabled })}
          disabled={step.step_key === "mr_create"}
        />
      </div>

      {canConfigureApproval && step.enabled && (
        <>
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor={`${step.step_key}-approval`}>Requires approval</Label>
              <p className="text-xs text-muted-foreground">
                When off, documents pass through automatically
              </p>
            </div>
            <Switch
              id={`${step.step_key}-approval`}
              checked={step.requires_approval}
              onCheckedChange={(requires_approval) => onChange({ requires_approval })}
            />
          </div>

          {step.requires_approval && (
            <div className="space-y-3 border-t pt-3">
              <div className="space-y-2">
                <Label>Approver</Label>
                <Select
                  value={step.approver_mode}
                  onValueChange={(v) =>
                    onChange({ approver_mode: v as WorkflowApproverMode })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {APPROVER_MODES.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {step.approver_mode === "role" && (
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={step.approver_role_id ?? undefined}
                    onValueChange={(approver_role_id) => onChange({ approver_role_id })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {step.approver_mode === "user" && (
                <div className="space-y-2">
                  <Label>User</Label>
                  <Select
                    value={step.approver_user_id ?? undefined}
                    onValueChange={(approver_user_id) => onChange({ approver_user_id })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
