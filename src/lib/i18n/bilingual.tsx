import type { ReactNode } from "react";
import type { LanguageMode } from "@/lib/i18n/types";
import { messageAr, messageEn } from "@/lib/i18n/translate";
import { cn } from "@/lib/utils";

export function bilingualTextParts(
  key: string,
  fallback?: string
): { en: string; ar: string } {
  return {
    en: messageEn(key, fallback),
    ar: messageAr(key, fallback),
  };
}

export function renderBilingualText(
  en: string,
  ar: string,
  mode: LanguageMode,
  className?: string
): ReactNode {
  if (mode === "en") {
    return <span className={className}>{en}</span>;
  }
  if (mode === "ar") {
    return (
      <span className={className} dir="rtl" lang="ar">
        {ar}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex max-w-full flex-wrap items-baseline gap-x-1.5 gap-y-0.5",
        className
      )}
    >
      <span>{en}</span>
      <span className="text-muted-foreground" aria-hidden>
        /
      </span>
      <span dir="rtl" lang="ar">
        {ar}
      </span>
    </span>
  );
}
