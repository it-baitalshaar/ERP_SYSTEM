import type { LanguageMode, MessageTree } from "@/lib/i18n/types";
import { ar } from "@/lib/i18n/messages/ar";
import { en } from "@/lib/i18n/messages/en";

function getNested(tree: MessageTree, key: string): string | undefined {
  const parts = key.split(".");
  let cur: string | MessageTree | undefined = tree;
  for (const part of parts) {
    if (!cur || typeof cur === "string") return undefined;
    cur = cur[part];
  }
  return typeof cur === "string" ? cur : undefined;
}

export function messageEn(key: string, fallback?: string): string {
  return getNested(en, key) ?? fallback ?? key;
}

export function messageAr(key: string, fallback?: string): string {
  return getNested(ar, key) ?? getNested(en, key) ?? fallback ?? key;
}

/** Plain string for the active language mode (not bilingual). */
export function translateText(
  key: string,
  mode: LanguageMode,
  fallback?: string
): string {
  if (mode === "ar") return messageAr(key, fallback);
  return messageEn(key, fallback);
}

export function documentDirection(mode: LanguageMode): "ltr" | "rtl" {
  return mode === "ar" ? "rtl" : "ltr";
}

export function documentLang(mode: LanguageMode): string {
  if (mode === "ar") return "ar";
  if (mode === "both") return "en";
  return "en";
}
