"use client";

import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@/stores/app-store";

/** Resolved company + branch for transactional documents (sales, procurement, print). */
export function useDocumentContext() {
  return useAppStore(useShallow((s) => s.getDocumentContext()));
}
