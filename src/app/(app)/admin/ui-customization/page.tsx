"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, ImagePlus, Save } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  DOCUMENT_TITLE_OPTIONS,
  type DocumentTemplateSettings,
} from "@/lib/documents/template-settings";
import {
  fetchDocumentTemplateSettings,
  saveDocumentTemplateSettings,
} from "@/lib/data/document-templates";
import { openPrintWindow } from "@/lib/documents/print";
import { sampleLpoDocument, sampleQuoteDocument } from "@/lib/documents/templates";
import { usePrintContext } from "@/components/documents/use-print-context";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";

export default function UiCustomizationPage() {
  const companyId = useAppStore((s) => s.currentCompanyId);
  const company = useAppStore((s) => s.getCurrentCompany());
  const printCtx = usePrintContext();
  const [settings, setSettings] = useState<DocumentTemplateSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchDocumentTemplateSettings(companyId);
    setSettings(
      data ?? {
        company_id: companyId,
        logo_url: company?.logo_url,
        procurement_template: "classic_lpo",
        sales_template: "standard",
        doc_titles: {},
        show_amount_in_words: true,
        show_vat_breakdown: true,
        footer_notes: "Looking forward for your business.",
        signature_left_label: "Purchase",
        signature_right_label: "Purchase Manager",
        accent_color: "#1e293b",
      }
    );
    setLoading(false);
  }, [companyId, company?.logo_url]);

  useEffect(() => {
    void load();
  }, [load]);

  const update = (patch: Partial<DocumentTemplateSettings>) => {
    setSettings((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const updateDocTitle = (key: string, value: string) => {
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            doc_titles: { ...prev.doc_titles, [key]: value },
          }
        : prev
    );
  };

  const handleLogoUpload = (file: File | null) => {
    if (!file) return;
    if (file.size > 512_000) {
      toast.error("Logo must be under 500 KB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      update({ logo_url: String(reader.result) });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    const result = await saveDocumentTemplateSettings(companyId, settings);
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Document template settings saved");
    if (result.data) setSettings(result.data);
  };

  const previewLpo = () => {
    const doc = sampleLpoDocument(printCtx);
    openPrintWindow(doc, printCtx, false);
  };

  const previewQuote = () => {
    const doc = sampleQuoteDocument(printCtx);
    openPrintWindow(doc, printCtx, false);
  };

  if (loading || !settings) {
    return (
      <div>
        <PageHeader title="Document Templates" description="Loading settings…" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Templates"
        description="Customize LPO, quotes, and invoices — logo, layout, and document naming"
        action={
          <Button onClick={() => void handleSave()} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving…" : "Save settings"}
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Company branding</CardTitle>
            <CardDescription>Logo and contact details shown on printed documents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Company logo</Label>
              <div className="flex items-center gap-4">
                {settings.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={settings.logo_url}
                    alt="Logo preview"
                    className="h-14 max-w-[160px] object-contain rounded border p-1"
                  />
                ) : (
                  <div className="flex h-14 w-28 items-center justify-center rounded border border-dashed text-xs text-muted-foreground">
                    No logo
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => logoInputRef.current?.click()}
                >
                  <ImagePlus className="mr-1 h-3 w-3" />
                  Upload logo
                </Button>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => handleLogoUpload(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name-ar">Company name (Arabic)</Label>
              <Input
                id="name-ar"
                dir="rtl"
                value={settings.company_name_ar ?? ""}
                onChange={(e) => update({ company_name_ar: e.target.value })}
                placeholder="الساقية للتجارة"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={settings.phone ?? ""}
                  onChange={(e) => update({ phone: e.target.value })}
                  placeholder="0504443247"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="footer-phone">Footer phone</Label>
                <Input
                  id="footer-phone"
                  value={settings.footer_phone ?? ""}
                  onChange={(e) => update({ footer_phone: e.target.value })}
                  placeholder="02-6792066-0504443247"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={settings.email ?? ""}
                onChange={(e) => update({ email: e.target.value })}
                placeholder="info@company.ae"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accent">Accent colour</Label>
              <Input
                id="accent"
                type="color"
                className="h-10 w-20 cursor-pointer p-1"
                value={settings.accent_color}
                onChange={(e) => update({ accent_color: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Template layout</CardTitle>
            <CardDescription>
              Classic LPO (bilingual grid) for procurement; Standard for quotes &amp; invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Procurement template (LPO, MRN, supplier docs)</Label>
              <Select
                value={settings.procurement_template}
                onValueChange={(v) =>
                  update({ procurement_template: v as "classic_lpo" | "standard" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classic_lpo">Classic LPO (Al Saqiya style)</SelectItem>
                  <SelectItem value="standard">Standard (modern)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sales template (quotes, invoices, delivery notes)</Label>
              <Select
                value={settings.sales_template}
                onValueChange={(v) =>
                  update({ sales_template: v as "classic_lpo" | "standard" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard quote / invoice</SelectItem>
                  <SelectItem value="classic_lpo">Classic LPO style</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={previewLpo}>
                <Eye className="mr-1 h-3 w-3" />
                Preview LPO sample
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={previewQuote}>
                <Eye className="mr-1 h-3 w-3" />
                Preview quote sample
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Amount in words (LPO)</p>
                <p className="text-xs text-muted-foreground">e.g. TWO THOUSAND TWO HUNDRED AND FIVE ONLY</p>
              </div>
              <Switch
                checked={settings.show_amount_in_words}
                onCheckedChange={(checked) => update({ show_amount_in_words: checked })}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Show VAT breakdown</p>
              </div>
              <Switch
                checked={settings.show_vat_breakdown}
                onCheckedChange={(checked) => update({ show_vat_breakdown: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Document naming</CardTitle>
            <CardDescription>
              Override printed titles — e.g. LPO, QUOTE, INVOICE, BILL, RECEIPT
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {DOCUMENT_TITLE_OPTIONS.map((opt) => (
                <div key={opt.key} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{opt.label}</Label>
                  <Input
                    value={settings.doc_titles[opt.key] ?? ""}
                    onChange={(e) => updateDocTitle(opt.key, e.target.value)}
                    placeholder={opt.defaultTitle}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Footer &amp; signatures</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Left signature</Label>
                <Input
                  value={settings.signature_left_label}
                  onChange={(e) => update({ signature_left_label: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Right signature</Label>
                <Input
                  value={settings.signature_right_label}
                  onChange={(e) => update({ signature_right_label: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Default notes (quotes / invoices)</Label>
              <textarea
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                rows={2}
                value={settings.footer_notes ?? ""}
                onChange={(e) => update({ footer_notes: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Terms &amp; conditions</CardTitle>
            <CardDescription>One line per numbered term on standard template</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              rows={6}
              value={settings.terms_conditions ?? ""}
              onChange={(e) => update({ terms_conditions: e.target.value })}
              placeholder="Government fees are approximate..."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
