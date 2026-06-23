import type { PrintableDocument, PrintContext } from "@/lib/documents/types";
import {
  DEFAULT_DOCUMENT_TEMPLATE_SETTINGS,
  resolveDocumentTitle,
  resolveTemplateStyle,
  type DocumentTemplateSettings,
  type DocumentTemplateStyle,
} from "@/lib/documents/template-settings";
import { buildClassicLpoHtml } from "@/lib/documents/templates/classic-lpo";
import { buildStandardHtml } from "@/lib/documents/templates/standard";
import type { TemplateBuildInput } from "@/lib/documents/templates/shared";

export interface PrintRenderInput {
  doc: PrintableDocument;
  ctx: PrintContext;
}

export function preparePrintDocument(input: PrintRenderInput): {
  doc: PrintableDocument;
  settings: DocumentTemplateSettings;
  templateStyle: DocumentTemplateStyle;
} {
  const settings: DocumentTemplateSettings = {
    company_id: "",
    ...DEFAULT_DOCUMENT_TEMPLATE_SETTINGS,
    ...input.ctx.templateSettings,
  };

  const templateStyle = resolveTemplateStyle(input.doc.module, settings);
  const title = resolveDocumentTitle(input.doc.docType, input.doc.title, settings);

  return {
    doc: { ...input.doc, title },
    settings,
    templateStyle,
  };
}

export function buildTemplateHtml(input: PrintRenderInput): string {
  const { doc, settings, templateStyle } = preparePrintDocument(input);
  const buildInput: TemplateBuildInput = {
    doc,
    settings,
    companyAddress: input.ctx.companyAddress,
  };

  if (templateStyle === "classic_lpo") {
    return buildClassicLpoHtml(buildInput);
  }
  return buildStandardHtml(buildInput);
}

export function sampleLpoDocument(ctx: PrintContext): PrintableDocument {
  return {
    module: "procurement",
    docType: "purchase_order",
    title: "LPO",
    number: "403",
    date: new Date().toISOString().slice(0, 10),
    companyName: ctx.companyName,
    branchName: ctx.branchName,
    partyLabel: "Supplier",
    partyName: "SAMPLE SUPPLIER LLC",
    currency: ctx.currency ?? "AED",
    lines: [
      {
        item_name: "WEDGE FOR TILE LEVELING",
        qty: 300,
        uom: "pcs",
        unit_price: 7,
        line_total: 2205,
      },
    ],
    subtotal: 2100,
    vat_amount: 105,
    total: 2205,
  };
}

export function sampleQuoteDocument(ctx: PrintContext): PrintableDocument {
  return {
    module: "sales",
    docType: "quotation",
    title: "QUOTE",
    number: "QT-001679",
    date: new Date().toISOString().slice(0, 10),
    companyName: ctx.companyName,
    branchName: ctx.branchName,
    partyLabel: "Bill To",
    partyName: "SAMPLE CUSTOMER L.L.C",
    currency: ctx.currency ?? "AED",
    lines: [
      {
        item_name: "MOFA INDIAN EMBASSY ATTESTATION FOR BIRTH CERTIFICATE",
        qty: 1,
        uom: "pcs",
        unit_price: 330,
        net_amount: 284.48,
        line_total: 284.48,
      },
      {
        item_name: "MOFA UAE ATTESTATION",
        qty: 1,
        uom: "pcs",
        unit_price: 250,
        net_amount: 215.52,
        line_total: 215.52,
      },
    ],
    subtotal: 500,
    discount_amount: 80,
    vat_amount: 0,
    total: 500,
  };
}
