"use client";

import { Badge } from "@/components/ui/badge";
import {
  lineMatchLabel,
  type ThreeWayMatchLine,
  type ThreeWayMatchResult,
} from "@/lib/procurement/three-way-match";

const formatAed = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function statusVariant(
  status: ThreeWayMatchLine["status"]
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "matched") return "default";
  if (status === "missing_on_invoice") return "secondary";
  return "destructive";
}

interface ThreeWayMatchPanelProps {
  match: ThreeWayMatchResult;
  compact?: boolean;
}

export function ThreeWayMatchPanel({ match, compact }: ThreeWayMatchPanelProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span>
          <strong>LPO:</strong> {match.purchase_order_number}
        </span>
        <span className="text-muted-foreground">·</span>
        <span>
          <strong>MRN:</strong> {match.mrn_number}
        </span>
        {match.supplier_invoice_number && (
          <>
            <span className="text-muted-foreground">·</span>
            <span>
              <strong>Invoice:</strong> {match.supplier_invoice_number}
            </span>
          </>
        )}
        <Badge variant={match.matched ? "default" : "destructive"}>
          {match.matched ? "Matched" : "Variances"}
        </Badge>
      </div>

      {!compact && (
        <div className="grid gap-2 text-sm sm:grid-cols-3">
          <div className="rounded-md border p-2">
            <div className="text-muted-foreground">LPO total</div>
            <div className="font-medium">AED {formatAed(match.lpo_total)}</div>
          </div>
          <div className="rounded-md border p-2">
            <div className="text-muted-foreground">MRN total</div>
            <div className="font-medium">AED {formatAed(match.mrn_total)}</div>
          </div>
          <div className="rounded-md border p-2">
            <div className="text-muted-foreground">Invoice total</div>
            <div className="font-medium">AED {formatAed(match.invoice_total)}</div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-2 font-medium">Item</th>
              <th className="p-2 font-medium text-right">LPO qty</th>
              <th className="p-2 font-medium text-right">LPO price</th>
              <th className="p-2 font-medium text-right">MRN qty</th>
              <th className="p-2 font-medium text-right">Inv qty</th>
              <th className="p-2 font-medium text-right">Inv price</th>
              <th className="p-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {match.lines.map((line) => (
              <tr key={`${line.item_id}-${line.item_name}`} className="border-t">
                <td className="p-2">{line.item_name}</td>
                <td className="p-2 text-right">{line.lpo_qty}</td>
                <td className="p-2 text-right">{formatAed(line.lpo_unit_price)}</td>
                <td className="p-2 text-right">{line.mrn_qty}</td>
                <td className="p-2 text-right">{line.invoice_qty}</td>
                <td className="p-2 text-right">{formatAed(line.invoice_unit_price)}</td>
                <td className="p-2">
                  <Badge variant={statusVariant(line.status)} className="text-[10px]">
                    {lineMatchLabel(line.status)}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!match.matched && match.issues.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
          {match.issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
