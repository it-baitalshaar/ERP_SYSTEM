import type { DocumentTemplateSettings } from "@/lib/documents/template-settings";
import { DEFAULT_DOCUMENT_TEMPLATE_SETTINGS } from "@/lib/documents/template-settings";
import { createAdminClientOrNull } from "@/utils/supabase/admin";

export function mapDocumentTemplateSettings(
  companyId: string,
  row: Record<string, unknown> | null,
  company?: { logo_url?: string | null; address?: string | null }
): DocumentTemplateSettings {
  if (!row) {
    return {
      company_id: companyId,
      logo_url: company?.logo_url ?? undefined,
      ...DEFAULT_DOCUMENT_TEMPLATE_SETTINGS,
    };
  }

  const docTitles = (row.doc_titles as Record<string, string>) ?? {};

  return {
    company_id: companyId,
    logo_url: row.logo_url ? String(row.logo_url) : company?.logo_url ?? undefined,
    company_name_ar: row.company_name_ar ? String(row.company_name_ar) : undefined,
    phone: row.phone ? String(row.phone) : undefined,
    email: row.email ? String(row.email) : undefined,
    footer_phone: row.footer_phone ? String(row.footer_phone) : undefined,
    procurement_template:
      row.procurement_template === "standard" ? "standard" : "classic_lpo",
    sales_template: row.sales_template === "classic_lpo" ? "classic_lpo" : "standard",
    doc_titles: docTitles,
    show_amount_in_words: row.show_amount_in_words !== false,
    show_vat_breakdown: row.show_vat_breakdown !== false,
    footer_notes: row.footer_notes ? String(row.footer_notes) : undefined,
    terms_conditions: row.terms_conditions ? String(row.terms_conditions) : undefined,
    signature_left_label: String(row.signature_left_label ?? "Prepared by"),
    signature_right_label: String(row.signature_right_label ?? "Approved by"),
    accent_color: String(row.accent_color ?? "#1e293b"),
  };
}

export async function getDocumentTemplateSettings(
  companyId: string
): Promise<DocumentTemplateSettings> {
  const db = createAdminClientOrNull();
  if (!db) {
    return mapDocumentTemplateSettings(companyId, null);
  }

  const [{ data: company }, { data: settings }] = await Promise.all([
    db.from("companies").select("logo_url, address").eq("id", companyId).maybeSingle(),
    db
      .from("company_document_settings")
      .select("*")
      .eq("company_id", companyId)
      .maybeSingle(),
  ]);

  return mapDocumentTemplateSettings(companyId, settings, company ?? undefined);
}

export async function upsertDocumentTemplateSettings(
  companyId: string,
  input: Partial<DocumentTemplateSettings>
): Promise<DocumentTemplateSettings> {
  const db = createAdminClientOrNull();
  if (!db) {
    throw new Error("Database not configured");
  }

  const payload = {
    company_id: companyId,
    logo_url: input.logo_url ?? null,
    company_name_ar: input.company_name_ar ?? null,
    phone: input.phone ?? null,
    email: input.email ?? null,
    footer_phone: input.footer_phone ?? null,
    procurement_template: input.procurement_template ?? "classic_lpo",
    sales_template: input.sales_template ?? "standard",
    doc_titles: input.doc_titles ?? {},
    show_amount_in_words: input.show_amount_in_words ?? true,
    show_vat_breakdown: input.show_vat_breakdown ?? true,
    footer_notes: input.footer_notes ?? null,
    terms_conditions: input.terms_conditions ?? null,
    signature_left_label: input.signature_left_label ?? "Prepared by",
    signature_right_label: input.signature_right_label ?? "Approved by",
    accent_color: input.accent_color ?? "#1e293b",
  };

  const { data, error } = await db
    .from("company_document_settings")
    .upsert(payload, { onConflict: "company_id" })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  if (input.logo_url) {
    await db.from("companies").update({ logo_url: input.logo_url }).eq("id", companyId);
  }

  const { data: company } = await db
    .from("companies")
    .select("logo_url, address")
    .eq("id", companyId)
    .maybeSingle();

  return mapDocumentTemplateSettings(companyId, data, company ?? undefined);
}
