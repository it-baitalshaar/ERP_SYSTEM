import type { PrintableDocument } from "@/lib/documents/types";
import { formatMoney } from "@/lib/documents/types";

/** Normalize phone for wa.me (digits only; UAE local 05… → 9715…). */
export function normalizeWhatsAppPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return null;
  if (digits.startsWith("0")) return `971${digits.slice(1)}`;
  if (digits.startsWith("971")) return digits;
  if (digits.length === 9 && digits.startsWith("5")) return `971${digits}`;
  return digits;
}

export function buildWhatsAppMessage(doc: PrintableDocument): string {
  const currency = doc.currency ?? "AED";
  const lines: string[] = [
    doc.companyName,
    `${doc.title}: ${doc.number}`,
    `Date: ${doc.date}`,
  ];

  if (doc.partyName) {
    lines.push(`${doc.partyLabel ?? "Party"}: ${doc.partyName}`);
  }
  if (doc.status) {
    lines.push(`Status: ${doc.status.replace(/_/g, " ")}`);
  }
  for (const m of doc.meta ?? []) {
    lines.push(`${m.label}: ${m.value}`);
  }

  if (doc.lines.length > 0) {
    lines.push("");
    lines.push("Items:");
    for (const line of doc.lines.slice(0, 12)) {
      lines.push(
        `• ${line.item_name} — ${line.qty} ${line.uom} @ ${formatMoney(line.unit_price, currency)}`
      );
    }
    if (doc.lines.length > 12) {
      lines.push(`… +${doc.lines.length - 12} more lines`);
    }
  }

  lines.push("");
  if (doc.total !== undefined) {
    lines.push(`Total: ${formatMoney(doc.total, currency)}`);
  } else if (doc.amount !== undefined) {
    lines.push(`Amount: ${formatMoney(doc.amount, currency)}`);
  }

  return lines.join("\n");
}

export function whatsAppUrl(phone: string, text?: string): string {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) throw new Error("Enter a valid phone number with country code");
  const base = `https://wa.me/${normalized}`;
  if (!text?.trim()) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}

export function openWhatsApp(phone: string, text?: string): void {
  const url = whatsAppUrl(phone, text);
  window.open(url, "_blank", "noopener,noreferrer");
}
