"use client";

import { Badge } from "@/components/ui/badge";
import type { DocumentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/hooks/use-translations";

const statusStyles: Record<DocumentStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  pending_approval: "bg-warning/15 text-warning border-warning/30",
  approved: "bg-primary/10 text-primary border-primary/30",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
  posted: "bg-success/10 text-success border-success/30",
  cancelled: "bg-muted text-muted-foreground line-through",
};

export function StatusBadge({ status, className }: { status: DocumentStatus; className?: string }) {
  const { t } = useTranslations();
  return (
    <Badge variant="outline" className={cn(statusStyles[status], className)}>
      {t(`status.${status}`, status.replace(/_/g, " "))}
    </Badge>
  );
}

export function ExpiryBadge({ daysRemaining }: { daysRemaining: number }) {
  const style =
    daysRemaining <= 14
      ? "bg-destructive/10 text-destructive border-destructive/30"
      : daysRemaining <= 45
        ? "bg-warning/15 text-warning border-warning/30"
        : "bg-success/10 text-success border-success/30";
  return (
    <Badge variant="outline" className={style}>
      {daysRemaining} days
    </Badge>
  );
}
