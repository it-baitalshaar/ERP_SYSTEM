"use client";

import type { ComponentPropsWithoutRef } from "react";
import { Label } from "@/components/ui/label";
import { useTranslations } from "@/hooks/use-translations";
import { cn } from "@/lib/utils";

interface FieldLabelProps extends ComponentPropsWithoutRef<typeof Label> {
  labelKey: string;
  fallback?: string;
}

/** Form field label — side-by-side EN/AR when language mode is both. */
export function FieldLabel({
  labelKey,
  fallback,
  className,
  ...props
}: FieldLabelProps) {
  const { label } = useTranslations();
  return (
    <Label className={cn(className)} {...props}>
      {label(labelKey, fallback)}
    </Label>
  );
}

interface BilingualTextProps {
  labelKey: string;
  fallback?: string;
  className?: string;
  as?: "span" | "p" | "h1" | "h2" | "h3";
}

export function BilingualText({
  labelKey,
  fallback,
  className,
  as: Tag = "span",
}: BilingualTextProps) {
  const { label } = useTranslations();
  return <Tag className={className}>{label(labelKey, fallback)}</Tag>;
}
