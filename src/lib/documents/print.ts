import type { PrintableDocument } from "@/lib/documents/types";
import { formatMoney } from "@/lib/documents/types";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildPrintHtml(doc: PrintableDocument): string {
  const currency = doc.currency ?? "AED";
  const metaRows = (doc.meta ?? [])
    .map((m) => `<tr><td class="label">${escapeHtml(m.label)}</td><td>${escapeHtml(m.value)}</td></tr>`)
    .join("");

  const lineRows = doc.lines
    .map(
      (line, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(line.item_name)}</td>
        <td class="num">${line.qty} ${escapeHtml(line.uom)}</td>
        <td class="num">${formatMoney(line.unit_price, currency)}</td>
        <td class="num">${formatMoney(line.line_total, currency)}</td>
      </tr>`
    )
    .join("");

  const totalsBlock =
    doc.subtotal !== undefined
      ? `
    <table class="totals">
      <tr><td>Subtotal</td><td class="num">${formatMoney(doc.subtotal, currency)}</td></tr>
      ${doc.vat_amount !== undefined ? `<tr><td>VAT</td><td class="num">${formatMoney(doc.vat_amount, currency)}</td></tr>` : ""}
      ${doc.total !== undefined ? `<tr class="grand"><td>Total</td><td class="num">${formatMoney(doc.total, currency)}</td></tr>` : ""}
    </table>`
      : doc.total !== undefined
        ? `<p class="grand-total">Total: ${formatMoney(doc.total, currency)}</p>`
        : doc.amount !== undefined
          ? `<p class="grand-total">Amount: ${formatMoney(doc.amount, currency)}</p>`
          : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(doc.number)} — ${escapeHtml(doc.title)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #111; margin: 24px; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    .subtitle { color: #555; margin-bottom: 16px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px solid #1e3a5f; padding-bottom: 12px; }
    .company { font-weight: bold; font-size: 14px; }
    .doc-no { font-size: 16px; font-weight: bold; text-align: right; }
    .meta { width: 100%; margin-bottom: 16px; }
    .meta td { padding: 3px 8px 3px 0; vertical-align: top; }
    .meta .label { color: #555; width: 140px; }
    table.lines { width: 100%; border-collapse: collapse; margin-top: 8px; }
    table.lines th, table.lines td { border: 1px solid #ccc; padding: 6px 8px; }
    table.lines th { background: #f3f4f6; text-align: left; }
    .num { text-align: right; white-space: nowrap; }
    table.totals { margin-top: 12px; margin-left: auto; width: 280px; }
    table.totals td { padding: 4px 8px; }
    table.totals .grand td { font-weight: bold; font-size: 14px; border-top: 2px solid #111; }
    .grand-total { font-size: 16px; font-weight: bold; text-align: right; margin-top: 16px; }
    .notes { margin-top: 16px; color: #444; }
    .footer { margin-top: 32px; font-size: 10px; color: #888; text-align: center; }
    @media print { body { margin: 12mm; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company">${escapeHtml(doc.companyName)}</div>
      ${doc.branchName ? `<div>${escapeHtml(doc.branchName)}</div>` : ""}
    </div>
    <div class="doc-no">
      <div>${escapeHtml(doc.title)}</div>
      <div>${escapeHtml(doc.number)}</div>
      <div style="font-size:12px;font-weight:normal;color:#555">${escapeHtml(doc.date)}</div>
    </div>
  </div>
  ${doc.partyName ? `<p><strong>${escapeHtml(doc.partyLabel ?? "Party")}:</strong> ${escapeHtml(doc.partyName)}</p>` : ""}
  ${doc.status ? `<p><strong>Status:</strong> ${escapeHtml(doc.status.replace(/_/g, " "))}</p>` : ""}
  ${metaRows ? `<table class="meta">${metaRows}</table>` : ""}
  ${
    doc.lines.length
      ? `<table class="lines">
    <thead>
      <tr>
        <th>#</th><th>Description</th><th class="num">Qty</th><th class="num">Unit price</th><th class="num">Line total</th>
      </tr>
    </thead>
    <tbody>${lineRows}</tbody>
  </table>`
      : ""
  }
  ${totalsBlock}
  ${doc.notes ? `<p class="notes"><strong>Notes:</strong> ${escapeHtml(doc.notes)}</p>` : ""}
  <div class="footer">Bait Al Shaar ERP — ${escapeHtml(doc.title)} — ${escapeHtml(doc.number)}</div>
  <script>window.onload = function() { /* optional auto-print */ };</script>
</body>
</html>`;
}

export function openPrintWindow(doc: PrintableDocument, autoPrint = true): void {
  const html = buildPrintHtml(doc);
  const win = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
  if (!win) {
    throw new Error("Pop-up blocked — allow pop-ups to print this document");
  }
  win.document.write(html);
  win.document.close();
  if (autoPrint) {
    win.onload = () => {
      win.focus();
      win.print();
    };
  }
}

export async function downloadPdf(doc: PrintableDocument): Promise<void> {
  try {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const currency = doc.currency ?? "AED";
    let y = 14;

    pdf.setFontSize(16);
    pdf.text(doc.companyName, 14, y);
    y += 7;
    pdf.setFontSize(10);
    pdf.setTextColor(100);
    if (doc.branchName) {
      pdf.text(doc.branchName, 14, y);
      y += 5;
    }
    pdf.setTextColor(0);
    pdf.setFontSize(14);
    pdf.text(doc.title, 140, 14, { align: "right" });
    pdf.setFontSize(11);
    pdf.text(doc.number, 140, 21, { align: "right" });
    pdf.text(doc.date, 140, 27, { align: "right" });
    y = Math.max(y, 32);

    if (doc.partyName) {
      pdf.setFontSize(10);
      pdf.text(`${doc.partyLabel ?? "Party"}: ${doc.partyName}`, 14, y);
      y += 6;
    }
    if (doc.status) {
      pdf.text(`Status: ${doc.status.replace(/_/g, " ")}`, 14, y);
      y += 6;
    }
    for (const m of doc.meta ?? []) {
      pdf.text(`${m.label}: ${m.value}`, 14, y);
      y += 5;
    }

    if (doc.lines.length) {
      autoTable(pdf, {
        startY: y + 2,
        head: [["#", "Description", "Qty", "Unit price", "Total"]],
        body: doc.lines.map((line, i) => [
          String(i + 1),
          line.item_name,
          `${line.qty} ${line.uom}`,
          formatMoney(line.unit_price, currency),
          formatMoney(line.line_total, currency),
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 58, 95] },
      });
      y = (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    }

    pdf.setFontSize(10);
    if (doc.subtotal !== undefined) {
      pdf.text(`Subtotal: ${formatMoney(doc.subtotal, currency)}`, 140, y, { align: "right" });
      y += 5;
    }
    if (doc.vat_amount !== undefined) {
      pdf.text(`VAT: ${formatMoney(doc.vat_amount, currency)}`, 140, y, { align: "right" });
      y += 5;
    }
    if (doc.total !== undefined) {
      pdf.setFontSize(12);
      pdf.text(`Total: ${formatMoney(doc.total, currency)}`, 140, y, { align: "right" });
    } else if (doc.amount !== undefined) {
      pdf.setFontSize(12);
      pdf.text(`Amount: ${formatMoney(doc.amount, currency)}`, 140, y, { align: "right" });
    }

    if (doc.notes) {
      y += 10;
      pdf.setFontSize(9);
      pdf.text(`Notes: ${doc.notes}`, 14, y, { maxWidth: 180 });
    }

    pdf.save(`${doc.number.replace(/[/\\?%*:|"<>]/g, "-")}.pdf`);
  } catch {
    openPrintWindow(doc, true);
    throw new Error("PDF library not installed — use Print dialog → Save as PDF");
  }
}
