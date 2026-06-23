"use client";

import { AlertTriangle } from "lucide-react";
import type { BelowCostLineWarning } from "@/lib/sales/below-cost";

export function BelowCostSummaryAlert({ warnings }: { warnings: BelowCostLineWarning[] }) {
  if (!warnings.length) return null;

  return (
    <div className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="font-medium">Below purchase cost</p>
        <ul className="mt-1 list-inside list-disc text-xs">
          {warnings.map((w) => (
            <li key={`${w.item_id}-${w.index}`}>
              {w.item_name}: selling AED {w.sell_unit_price.toFixed(2)} vs cost AED{" "}
              {w.cost_price.toFixed(2)}
              {w.discount_pct > 0 ? ` (after ${w.discount_pct}% discount)` : ""}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function BelowCostLineHint({
  warning,
}: {
  warning: BelowCostLineWarning | undefined;
}) {
  if (!warning) return null;

  return (
    <p className="text-xs text-amber-700 dark:text-amber-300">
      Below cost (buy AED {warning.cost_price.toFixed(2)}) — check selling price
    </p>
  );
}
