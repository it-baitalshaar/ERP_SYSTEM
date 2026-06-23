import type { PrintableDocument, PrintContext } from "@/lib/documents/types";
import { formatMoney } from "@/lib/documents/types";
import { buildTemplateHtml } from "@/lib/documents/templates";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** @deprecated Use buildTemplateHtml with PrintContext for styled templates. */
export function buildPrintHtml(doc: PrintableDocument, ctx?: PrintContext): string {
  if (ctx) {
    return buildTemplateHtml({ doc, ctx });
  }
  return buildLegacyPrintHtml(doc);
}

function buildLegacyPrintHtml(doc: PrintableDocument): string {
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
    .header { display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px solid #1e3a5f; padding-bottom: 12px; }
    .company { font-weight: bold; font-size: 14px; }
    .doc-no { font-size: 16px; font-weight: bold; text-align: right; }
    table.lines { width: 100%; border-collapse: collapse; margin-top: 8px; }
    table.lines th, table.lines td { border: 1px solid #ccc; padding: 6px 8px; }
    table.lines th { background: #f3f4f6; text-align: left; }
    .num { text-align: right; white-space: nowrap; }
    @media print { body { margin: 12mm; } }
  </style>
</head>
<body>
  <div class="header">
    <div><div class="company">${escapeHtml(doc.companyName)}</div></div>
    <div class="doc-no">
      <div>${escapeHtml(doc.title)}</div>
      <div>${escapeHtml(doc.number)}</div>
    </div>
  </div>
  ${doc.lines.length ? `<table class="lines"><thead><tr><th>#</th><th>Description</th><th class="num">Qty</th><th class="num">Unit price</th><th class="num">Total</th></tr></thead><tbody>${lineRows}</tbody></table>` : ""}
  ${totalsBlock}
</body>
</html>`;
}

function injectAutoPrintScript(html: string): string {
  const script = `
<script>
(function () {
  function triggerPrint() {
    window.focus();
    setTimeout(function () {
      window.print();
    }, 150);
  }
  function waitForImages(cb) {
    var imgs = document.images;
    if (!imgs.length) { cb(); return; }
    var pending = imgs.length;
    function done() {
      pending -= 1;
      if (pending <= 0) cb();
    }
    for (var i = 0; i < imgs.length; i += 1) {
      if (imgs[i].complete) done();
      else {
        imgs[i].addEventListener("load", done);
        imgs[i].addEventListener("error", done);
      }
    }
  }
  if (document.readyState === "complete") {
    waitForImages(triggerPrint);
  } else {
    window.addEventListener("load", function () { waitForImages(triggerPrint); });
  }
})();
</script>`;
  return html.replace("</body>", `${script}</body>`);
}

/** Opens the OS print dialog (Windows / macOS) with the rendered document. */
export function openPrintWindow(
  doc: PrintableDocument,
  ctxOrAutoPrint?: PrintContext | boolean,
  autoPrint = true
): void {
  let ctx: PrintContext | undefined;
  let shouldPrint = autoPrint;
  if (typeof ctxOrAutoPrint === "boolean") {
    shouldPrint = ctxOrAutoPrint;
  } else if (ctxOrAutoPrint) {
    ctx = ctxOrAutoPrint;
  }

  let html = buildPrintHtml(doc, ctx);
  if (shouldPrint) {
    html = injectAutoPrintScript(html);
  }

  printHtmlInFrame(html, shouldPrint);
}

function printHtmlInFrame(html: string, autoPrint: boolean): void {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", "Print document");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
  document.body.appendChild(iframe);

  const frameWin = iframe.contentWindow;
  const frameDoc = frameWin?.document;
  if (!frameWin || !frameDoc) {
    document.body.removeChild(iframe);
    openPrintPopup(html, autoPrint);
    return;
  }

  frameDoc.open();
  frameDoc.write(html);
  frameDoc.close();

  const cleanup = () => {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  };

  if (!autoPrint) {
    iframe.style.cssText =
      "position:fixed;inset:4%;width:92%;height:92%;border:1px solid #ccc;visibility:visible;z-index:99999;background:#fff;";
    return;
  }

  const triggerPrint = () => {
    try {
      frameWin.focus();
      frameWin.print();
    } finally {
      frameWin.addEventListener("afterprint", cleanup, { once: true });
      setTimeout(cleanup, 60_000);
    }
  };

  if (frameDoc.readyState === "complete") {
    setTimeout(triggerPrint, 200);
  } else {
    iframe.onload = () => setTimeout(triggerPrint, 200);
  }
}

/** Fallback when iframe printing is unavailable — must not use noopener (breaks print). */
function openPrintPopup(html: string, autoPrint: boolean): void {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    throw new Error("Pop-up blocked — allow pop-ups to open the print dialog");
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  if (autoPrint) {
    win.focus();
  }
}

export async function buildPdfDocument(doc: PrintableDocument, ctx?: PrintContext) {
  if (ctx) {
    throw new Error("Use print with Save as PDF for styled templates");
  }
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const currency = doc.currency ?? "AED";
  let y = 14;
  pdf.text(doc.companyName, 14, y);
  y += 7;
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

  if (doc.total !== undefined) {
    pdf.setFontSize(12);
    pdf.text(`Total: ${formatMoney(doc.total, currency)}`, 140, y, { align: "right" });
  } else if (doc.amount !== undefined) {
    pdf.setFontSize(12);
    pdf.text(`Amount: ${formatMoney(doc.amount, currency)}`, 140, y, { align: "right" });
  }

  return pdf;
}

function pdfFilename(doc: PrintableDocument): string {
  return `${doc.number.replace(/[/\\?%*:|"<>]/g, "-")}.pdf`;
}

export async function generatePdfBlob(doc: PrintableDocument, ctx?: PrintContext): Promise<Blob> {
  if (ctx) {
    openPrintWindow(doc, ctx, true);
    throw new Error("Use Print dialog → Save as PDF for styled templates");
  }
  const pdf = await buildPdfDocument(doc);
  return pdf.output("blob");
}

export function downloadPdfBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadPdf(doc: PrintableDocument, ctx?: PrintContext): Promise<void> {
  try {
    if (ctx) {
      openPrintWindow(doc, ctx, true);
      return;
    }
    const blob = await generatePdfBlob(doc);
    downloadPdfBlob(blob, pdfFilename(doc));
  } catch (err) {
    if (err instanceof Error && err.message.includes("styled templates")) {
      return;
    }
    openPrintWindow(doc, ctx, true);
    throw new Error("PDF library not installed — use Print dialog → Save as PDF");
  }
}
