"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "@/hooks/use-translations";
import { navigation } from "@/lib/navigation";

export function useBreadcrumbs() {
  const pathname = usePathname();
  const { t } = useTranslations();

  return useMemo(() => {
    const crumbs: { label: string; href?: string }[] = [
      { label: t("common.home"), href: "/dashboard" },
    ];

    for (const group of navigation) {
      for (const item of group.items) {
        if (item.href === pathname) {
          crumbs.push({
            label: t(`nav.groups.${group.key}`, group.label),
          });
          crumbs.push({
            label: t(`nav.items.${item.key}`, item.label),
          });
          return crumbs;
        }
      }
    }

    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0) {
      crumbs.push({
        label: segments.map((s) => s.replace(/-/g, " ")).join(" / "),
      });
    }
    return crumbs;
  }, [pathname, t]);
}
