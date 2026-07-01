"use client";

import { useEffect } from "react";
import { documentDirection, documentLang } from "@/lib/i18n/translate";
import { useAppStore } from "@/stores/app-store";

/** Syncs html lang/dir with the selected language mode. */
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const languageMode = useAppStore((s) => s.languageMode);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = documentLang(languageMode);
    root.dir = documentDirection(languageMode);
  }, [languageMode]);

  return <>{children}</>;
}
