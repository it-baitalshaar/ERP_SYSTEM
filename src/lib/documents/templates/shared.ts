import type { PrintableDocument } from "@/lib/documents/types";
import { formatMoney } from "@/lib/documents/types";
import type { DocumentTemplateSettings } from "@/lib/documents/template-settings";

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatDocDate(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDocDateTime(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  const day = d.toLocaleDateString("en-GB").replace(/\//g, "-");
  const time = d.toLocaleTimeString("en-GB", { hour12: false });
  return `${day} ${time}`;
}

export function lineGross(qty: number, unitPrice: number): number {
  return Math.round(qty * unitPrice * 100) / 100;
}

export interface TemplateBuildInput {
  doc: PrintableDocument;
  settings?: DocumentTemplateSettings;
  companyAddress?: string;
}

export function companyBlock(input: TemplateBuildInput): {
  logoHtml: string;
  nameEn: string;
  nameAr: string;
  address: string;
  phone: string;
  email: string;
} {
  const { doc, settings, companyAddress } = input;
  const logo = settings?.logo_url || (doc as PrintableDocument & { logoUrl?: string }).logoUrl;
  const logoHtml = logo
    ? `<img src="${escapeHtml(logo)}" alt="Logo" class="logo" />`
    : "";

  return {
    logoHtml,
    nameEn: doc.companyName,
    nameAr: settings?.company_name_ar ?? "",
    address: companyAddress ?? "",
    phone: settings?.phone ?? "",
    email: settings?.email ?? "",
  };
}

export function formatAmountPlain(amount: number, currency: string): string {
  return formatMoney(amount, currency).replace(/^AED\s/, "");
}
