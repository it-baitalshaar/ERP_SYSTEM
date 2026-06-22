import type { jsPDF } from "jspdf";

declare module "jspdf" {
  interface jsPDF {
    lastAutoTable: { finalY: number };
  }
}

declare module "jspdf-autotable" {
  import type { jsPDF } from "jspdf";
  function autoTable(doc: jsPDF, options: Record<string, unknown>): jsPDF;
  export default autoTable;
}
