import type { DocumentTemplateSettings } from "@/lib/documents/template-settings";

export async function fetchDocumentTemplateSettings(
  companyId: string
): Promise<DocumentTemplateSettings | null> {
  const res = await fetch(`/api/admin/document-templates?companyId=${companyId}`);
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: DocumentTemplateSettings };
  return json.data ?? null;
}

export async function saveDocumentTemplateSettings(
  companyId: string,
  input: Partial<DocumentTemplateSettings>
): Promise<{ data?: DocumentTemplateSettings; error?: string }> {
  const res = await fetch("/api/admin/document-templates", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ company_id: companyId, ...input }),
  });
  const json = (await res.json()) as { data?: DocumentTemplateSettings; error?: string };
  if (!res.ok) return { error: json.error ?? "Save failed" };
  return { data: json.data };
}
