/** Visual layout for printed documents. */
export type DocumentTemplateStyle = "standard" | "classic_lpo";

/** Keys match PrintableDocument.docType */
export type DocumentTitleKey =
  | "quotation"
  | "sales_order"
  | "tax_invoice"
  | "delivery_note"
  | "material_request"
  | "purchase_order"
  | "proforma"
  | "supplier_delivery_note"
  | "mrn"
  | "supplier_invoice"
  | "purchase_payment";

export const DOCUMENT_TITLE_OPTIONS: { key: DocumentTitleKey; label: string; defaultTitle: string }[] = [
  { key: "quotation", label: "Quotation", defaultTitle: "QUOTE" },
  { key: "sales_order", label: "Sales order", defaultTitle: "SALES ORDER" },
  { key: "tax_invoice", label: "Tax invoice", defaultTitle: "TAX INVOICE" },
  { key: "delivery_note", label: "Delivery note", defaultTitle: "DELIVERY NOTE" },
  { key: "material_request", label: "Material request", defaultTitle: "MATERIAL REQUEST" },
  { key: "purchase_order", label: "Purchase order (LPO)", defaultTitle: "LPO" },
  { key: "proforma", label: "Proforma invoice", defaultTitle: "PROFORMA INVOICE" },
  { key: "supplier_delivery_note", label: "Supplier delivery note", defaultTitle: "DELIVERY NOTE" },
  { key: "mrn", label: "Material receipt (MRN)", defaultTitle: "MRN" },
  { key: "supplier_invoice", label: "Supplier invoice", defaultTitle: "SUPPLIER INVOICE" },
  { key: "purchase_payment", label: "Purchase payment", defaultTitle: "PAYMENT VOUCHER" },
];

export interface DocumentTemplateSettings {
  company_id: string;
  logo_url?: string;
  company_name_ar?: string;
  phone?: string;
  email?: string;
  footer_phone?: string;
  procurement_template: DocumentTemplateStyle;
  sales_template: DocumentTemplateStyle;
  doc_titles: Partial<Record<DocumentTitleKey, string>>;
  show_amount_in_words: boolean;
  show_vat_breakdown: boolean;
  footer_notes?: string;
  terms_conditions?: string;
  signature_left_label: string;
  signature_right_label: string;
  accent_color: string;
}

export const DEFAULT_DOCUMENT_TEMPLATE_SETTINGS: Omit<DocumentTemplateSettings, "company_id"> = {
  procurement_template: "classic_lpo",
  sales_template: "standard",
  doc_titles: {},
  show_amount_in_words: true,
  show_vat_breakdown: true,
  footer_notes: "Looking forward for your business.",
  terms_conditions: "",
  signature_left_label: "Prepared by",
  signature_right_label: "Approved by",
  accent_color: "#1e293b",
};

export function resolveDocumentTitle(
  docType: string,
  fallbackTitle: string,
  settings?: DocumentTemplateSettings
): string {
  const custom = settings?.doc_titles?.[docType as DocumentTitleKey];
  return custom?.trim() || fallbackTitle;
}

export function resolveTemplateStyle(
  module: "sales" | "procurement" | "inventory" | "finance" | "ess",
  settings?: DocumentTemplateSettings
): DocumentTemplateStyle {
  if (!settings) return module === "procurement" ? "classic_lpo" : "standard";
  return module === "procurement" ? settings.procurement_template : settings.sales_template;
}
