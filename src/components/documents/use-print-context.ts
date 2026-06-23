"use client";

import { useEffect, useState } from "react";
import type { PrintContext } from "@/lib/documents/types";
import { fetchDocumentTemplateSettings } from "@/lib/data/document-templates";
import { useAppStore } from "@/stores/app-store";

export function usePrintContext(): PrintContext {
  const company = useAppStore((s) => s.getCurrentCompany());
  const branch = useAppStore((s) => s.getCurrentBranch());
  const companyId = useAppStore((s) => s.currentCompanyId);
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
      procurement_template: "classic_lpo",
      sales_template: "standard",
      doc_titles: {},
      show_amount_in_words: true,
      show_vat_breakdown: true,
      signature_left_label: "Prepared by",
      signature_right_label: "Approved by",
      accent_color: "#1e293b",
    },
  };
}
