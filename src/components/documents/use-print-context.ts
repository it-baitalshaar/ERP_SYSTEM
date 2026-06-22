"use client";

import type { PrintContext } from "@/lib/documents/types";
import { useAppStore } from "@/stores/app-store";

export function usePrintContext(): PrintContext {
  const company = useAppStore((s) => s.getCurrentCompany());
  const branch = useAppStore((s) => s.getCurrentBranch());
  return {
    companyName: company?.name ?? "Company",
    branchName: branch ? `${branch.code} — ${branch.name}` : undefined,
    currency: company?.currency ?? "AED",
  };
}
