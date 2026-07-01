"use client";

import { Check, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "@/hooks/use-translations";
import type { LanguageMode } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";

const MODES: { value: LanguageMode; labelKey: string }[] = [
  { value: "en", labelKey: "language.en" },
  { value: "ar", labelKey: "language.ar" },
  { value: "both", labelKey: "language.both" },
];

export function LanguageSwitcher() {
  const { languageMode, setLanguageMode, t } = useTranslations();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0" title={t("language.label")}>
          <Languages className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{t("language.label")}</DropdownMenuLabel>
        {MODES.map((mode) => (
          <DropdownMenuItem
            key={mode.value}
            onClick={() => setLanguageMode(mode.value)}
            className="justify-between"
          >
            {t(mode.labelKey)}
            <Check
              className={cn(
                "h-4 w-4",
                languageMode === mode.value ? "opacity-100" : "opacity-0"
              )}
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
