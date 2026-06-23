import { amountInWords } from "@/lib/documents/amount-in-words";
import { formatMoney } from "@/lib/documents/types";
import {
  companyBlock,
  escapeHtml,
  formatAmountPlain,
  formatDocDate,
  formatDocDateTime,
  lineGross,
  type TemplateBuildInput,
} from "@/lib/documents/templates/shared";

/** Classic LPO layout — bilingual header, grid table (Al Saqiya style). */
export function buildClassicLpoHtml(input: TemplateBuildInput): string {
  const { doc, settings } = input;
  const currency = doc.currency ?? "AED";
  const co = companyBlock(input);
  const accent = settings?.accent_color ?? "#1e293b";
  const now = formatDocDateTime(doc.date);

  const lineRows = doc.lines
    .map((line, i) => {
      const gross = lineGross(line.qty, line.unit_price);
      return `<tr>
        <td class="c">${i + 1}</td>
        <td class="l">${escapeHtml(line.item_name)}</td>
        <td class="c">${escapeHtml(line.uom)}</td>
        <td class="r">${line.qty.toFixed(2)}</td>
        <td class="r">${formatAmountPlain(line.unit_price, currency)}</td>
        <td class="r">${gross.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
      </tr>`;
    })
    .join("");

  const emptyRows = Array.from({ length: Math.max(0, 8 - doc.lines.length) })
    .map(() => `<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td></tr>`)
    .join("");

  const grossTotal = doc.lines.reduce((s, l) => s + lineGross(l.qty, l.unit_price), 0);
  const total = doc.total ?? grossTotal;
  const vat = doc.vat_amount ?? Math.max(0, total - grossTotal);
  const words =
    settings?.show_amount_in_words !== false
      ? amountInWords(total, currency)
      : "";

  const titleAr =
    doc.docType === "purchase_order" ? "أمر شراء محلي" : escapeHtml(doc.title);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(doc.number)} — ${escapeHtml(doc.title)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #000; margin: 16px 20px; }
    .top { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid ${accent}; padding-bottom: 8px; margin-bottom: 6px; }
    .top .en { font-weight: bold; font-size: 15px; text-transform: uppercase; }
    .top .ar { font-weight: bold; font-size: 15px; direction: rtl; font-family: 'Traditional Arabic', 'Arial', sans-serif; }
    .logo { max-height: 48px; max-width: 140px; margin-bottom: 4px; display: block; }
    .title-row { text-align: center; margin: 8px 0; }
    .title-row .en { font-size: 18px; font-weight: bold; letter-spacing: 2px; }
    .title-row .ar { font-size: 16px; font-weight: bold; direction: rtl; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 11px; }
    .supplier { font-weight: bold; font-size: 12px; text-transform: uppercase; margin: 10px 0 6px; border-top: 1px solid #999; padding-top: 6px; }
    .instruction { font-size: 10px; margin-bottom: 4px; }
    table.grid { width: 100%; border-collapse: collapse; }
    table.grid th, table.grid td { border: 1px solid #000; padding: 4px 6px; }
    table.grid th { background: #f0f0f0; font-size: 10px; text-align: center; }
    table.grid td.r { text-align: right; }
    table.grid td.c { text-align: center; }
    table.grid td.l { text-align: left; }
    .total-row td { font-weight: bold; }
    .words { margin-top: 10px; font-size: 11px; text-transform: uppercase; }
    .vat-line { text-align: right; margin-top: 4px; font-size: 11px; }
    .sigs { display: flex; justify-content: space-between; margin-top: 36px; }
    .sig { width: 40%; border-top: 1px solid #000; padding-top: 4px; text-align: center; font-size: 10px; }
    .footer-phone { text-align: right; margin-top: 12px; font-size: 10px; }
    @media print { body { margin: 10mm; } }
  </style>
</head>
<body>
  <div class="top">
    <div>
      ${co.logoHtml}
      <div class="en">${escapeHtml(co.nameEn)}</div>
      ${co.address ? `<div style="font-size:10px;margin-top:2px">${escapeHtml(co.address)}</div>` : ""}
    </div>
    <div style="text-align:right">
      ${co.nameAr ? `<div class="ar">${escapeHtml(co.nameAr)}</div>` : ""}
    </div>
  </div>

  <div class="title-row">
    <div class="en">${escapeHtml(doc.title)}</div>
    <div class="ar">${titleAr}</div>
  </div>

  <div class="meta">
    <div><strong>No:</strong> ${escapeHtml(doc.number)}</div>
    <div><strong>Date:</strong> ${now}</div>
    <div><strong>Original</strong></div>
  </div>

  ${doc.partyName ? `<div class="supplier">${escapeHtml(doc.partyName)}</div>` : ""}
  <div class="instruction">PLEASE SUPPLY THE FOLLOWING GOODS:-</div>

  <table class="grid">
    <thead>
      <tr>
        <th>Number</th>
        <th>Name</th>
        <th>Deli</th>
        <th>Quantity</th>
        <th>Rate</th>
        <th>Gross</th>
      </tr>
    </thead>
    <tbody>
      ${lineRows}
      ${emptyRows}
      <tr class="total-row">
        <td colspan="5" style="text-align:left"><strong>Total</strong></td>
        <td class="r"><strong>${formatMoney(total, currency)}</strong></td>
      </tr>
    </tbody>
  </table>

  ${settings?.show_vat_breakdown !== false && vat > 0.01 ? `<div class="vat-line">VAT: ${formatMoney(vat, currency)}</div>` : ""}
  ${words ? `<div class="words">${escapeHtml(words)}</div>` : ""}

  <div class="sigs">
    <div class="sig">${escapeHtml(settings?.signature_left_label ?? "Purchase")}</div>
    <div class="sig">${escapeHtml(settings?.signature_right_label ?? "Purchase Manager")}</div>
  </div>

  ${settings?.footer_phone || co.phone ? `<div class="footer-phone">${escapeHtml(settings?.footer_phone ?? co.phone)}</div>` : ""}
</body>
</html>`;
}
