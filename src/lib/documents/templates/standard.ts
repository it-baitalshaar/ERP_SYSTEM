import { formatMoney } from "@/lib/documents/types";
import {
  companyBlock,
  escapeHtml,
  formatAmountPlain,
  formatDocDate,
  type TemplateBuildInput,
} from "@/lib/documents/templates/shared";

/** Modern quote / invoice layout (Interact-style). */
export function buildStandardHtml(input: TemplateBuildInput): string {
  const { doc, settings } = input;
  const currency = doc.currency ?? "AED";
  const co = companyBlock(input);
  const accent = settings?.accent_color ?? "#1e293b";

  const lineRows = doc.lines
    .map((line, i) => {
      const amount = line.net_amount ?? line.line_total;
      return `<tr>
        <td class="c">${i + 1}</td>
        <td class="l">${escapeHtml(line.item_name)}</td>
        <td class="r">${line.qty.toFixed(2)}</td>
        <td class="r">${formatAmountPlain(line.unit_price, currency)}</td>
        <td class="r">${formatAmountPlain(amount, currency)}</td>
      </tr>`;
    })
    .join("");

  const subtotal = doc.subtotal ?? doc.total ?? 0;
  const discount = doc.discount_amount ?? 0;
  const total = doc.total ?? subtotal;

  const terms = settings?.terms_conditions?.trim();
  const notes = doc.notes?.trim() || settings?.footer_notes?.trim();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(doc.number)} — ${escapeHtml(doc.title)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; font-size: 12px; color: #222; margin: 28px 32px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .brand .name { font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .brand .meta { font-size: 11px; color: #555; margin-top: 4px; line-height: 1.5; }
    .logo { max-height: 56px; max-width: 160px; margin-bottom: 8px; display: block; }
    .doc-title { text-align: right; }
    .doc-title h1 { margin: 0; font-size: 28px; font-weight: 700; color: ${accent}; letter-spacing: 1px; }
    .doc-title .num { font-size: 13px; color: #444; margin-top: 4px; }
    .party-row { display: flex; justify-content: space-between; margin-bottom: 20px; align-items: flex-end; }
    .bill-to .label { font-size: 11px; color: #666; margin-bottom: 4px; }
    .bill-to .name { font-size: 13px; font-weight: 700; color: #2563eb; text-transform: uppercase; }
    .date { font-size: 12px; color: #333; }
    table.items { width: 100%; border-collapse: collapse; margin-top: 8px; }
    table.items th { background: ${accent}; color: #fff; padding: 8px 10px; font-size: 11px; font-weight: 600; }
    table.items td { border-bottom: 1px solid #e5e7eb; padding: 8px 10px; font-size: 11px; }
    table.items td.r { text-align: right; white-space: nowrap; }
    table.items td.c { text-align: center; width: 36px; }
    table.items td.l { text-align: left; }
    .totals { margin-top: 16px; margin-left: auto; width: 280px; }
    .totals table { width: 100%; border-collapse: collapse; }
    .totals td { padding: 5px 8px; font-size: 12px; }
    .totals td:last-child { text-align: right; }
    .totals tr.grand td { background: #f3f4f6; font-weight: 700; font-size: 14px; border-top: 2px solid ${accent}; }
    .section { margin-top: 24px; }
    .section h3 { font-size: 12px; font-weight: 700; margin: 0 0 6px; color: ${accent}; }
    .section p, .section ol { font-size: 11px; color: #444; margin: 0; line-height: 1.6; }
    .footer { margin-top: 32px; font-size: 10px; color: #999; text-align: right; }
    @media print { body { margin: 12mm; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      ${co.logoHtml}
      <div class="name">${escapeHtml(co.nameEn)}</div>
      <div class="meta">
        ${co.address ? `${escapeHtml(co.address)}<br/>` : ""}
        ${co.phone ? `Phone: ${escapeHtml(co.phone)}<br/>` : ""}
        ${co.email ? `Email: ${escapeHtml(co.email)}` : ""}
      </div>
    </div>
    <div class="doc-title">
      <h1>${escapeHtml(doc.title)}</h1>
      <div class="num"># ${escapeHtml(doc.number)}</div>
    </div>
  </div>

  <div class="party-row">
    <div class="bill-to">
      <div class="label">${escapeHtml(doc.partyLabel ?? "Bill To")}</div>
      ${doc.partyName ? `<div class="name">${escapeHtml(doc.partyName)}</div>` : ""}
    </div>
    <div class="date"><strong>Date:</strong> ${formatDocDate(doc.date)}</div>
  </div>

  ${
    doc.lines.length
      ? `<table class="items">
    <thead>
      <tr>
        <th>#</th>
        <th>Item &amp; Description</th>
        <th style="text-align:right">Qty</th>
        <th style="text-align:right">Rate</th>
        <th style="text-align:right">Amount</th>
      </tr>
    </thead>
    <tbody>${lineRows}</tbody>
  </table>`
      : doc.amount !== undefined
        ? `<p style="font-size:14px;text-align:right"><strong>Amount: ${formatMoney(doc.amount, currency)}</strong></p>`
        : ""
  }

  ${
    doc.lines.length
      ? `<div class="totals">
    <table>
      <tr><td>Sub Total</td><td>${formatMoney(subtotal, currency)}</td></tr>
      ${discount > 0 ? `<tr><td>Discount</td><td>(-) ${formatMoney(discount, currency)}</td></tr>` : ""}
      ${settings?.show_vat_breakdown !== false && doc.vat_amount !== undefined
        ? `<tr><td>VAT</td><td>${formatMoney(doc.vat_amount, currency)}</td></tr>`
        : ""}
      <tr class="grand"><td>Total</td><td>${formatMoney(total, currency)}</td></tr>
    </table>
  </div>`
      : ""
  }

  ${notes ? `<div class="section"><h3>Notes</h3><p>${escapeHtml(notes)}</p></div>` : ""}
  ${terms ? `<div class="section"><h3>Terms &amp; Conditions</h3><ol>${terms.split("\n").filter(Boolean).map((t, i) => `<li>${escapeHtml(t)}</li>`).join("")}</ol></div>` : ""}

  <div class="footer">PDF Template: Standard</div>
</body>
</html>`;
}
