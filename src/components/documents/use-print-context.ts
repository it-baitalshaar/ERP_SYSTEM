"use client";

import { useEffect, useState } from "react";
import type { PrintContext } from "@/lib/documents/types";
import { DEFAULT_DOCUMENT_TEMPLATE_SETTINGS } from "@/lib/documents/template-settings";
import { fetchDocumentTemplateSettings } from "@/lib/data/document-templates";
import { useAppStore } from "@/stores/app-store";
import { useDocumentContext } from "@/hooks/use-document-context";

export function usePrintContext(): PrintContext {
  const { companyId, branchId } = useDocumentContext();
  const companies = useAppStore((s) => s.companies);
  const branches = useAppStore((s) => s.branches);
  const company = companies.find((c) => c.id === companyId);
  const branch = branches.find((b) => b.id === branchId);
  const [templateSettings, setTemplateSettings] = useState<PrintContext["templateSettings"]>();

  useEffect(() => {
    let cancelled = false;
    void fetchDocumentTemplateSettings(companyId).then((settings) => {
      if (!cancelled && settings) setTemplateSettings(settings);
    });
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  return {
    companyName: company?.name ?? "Company",
    branchName: branch ? `${branch.code} — ${branch.name}` : undefined,
    currency: company?.currency ?? "AED",
    companyAddress: company?.address,
    templateSettings: templateSettings ?? {
      company_id: companyId,
      logo_url: company?.logo_url,
      ...DEFAULT_DOCUMENT_TEMPLATE_SETTINGS,
    },
  };
}
