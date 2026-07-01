"use client";

import { useCallback } from "react";
import type { LanguageMode } from "@/lib/i18n/types";
import {
  bilingualTextParts,
  renderBilingualText,
} from "@/lib/i18n/bilingual";
import {
  documentDirection,
  documentLang,
  translateText,
} from "@/lib/i18n/translate";
import { useAppStore } from "@/stores/app-store";

export function useTranslations() {
  const languageMode = useAppStore((s) => s.languageMode);
  const setLanguageMode = useAppStore((s) => s.setLanguageMode);

  const t = useCallback(
    (key: string, fallback?: string) => translateText(key, languageMode, fallback),
    [languageMode]
  );

  const label = useCallback(
    (key: string, fallback?: string, className?: string) => {
      const { en, ar } = bilingualTextParts(key, fallback);
      return renderBilingualText(en, ar, languageMode, className);
    },
    [languageMode]
  );

  return {
    languageMode,
    setLanguageMode,
    dir: documentDirection(languageMode),
    lang: documentLang(languageMode),
    isRtl: languageMode === "ar",
    t,
    label,
  };
}

export type UseTranslationsReturn = ReturnType<typeof useTranslations>;
