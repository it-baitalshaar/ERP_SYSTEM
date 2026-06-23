"use client";

import { useState } from "react";
import { FileDown, MessageCircle, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentWhatsAppDialog } from "@/components/documents/document-whatsapp-dialog";
import type { PrintableDocument, PrintContext } from "@/lib/documents/types";
import { downloadPdf, openPrintWindow } from "@/lib/documents/print";
import { toast } from "sonner";

interface DocumentPrintActionsProps {
  document: PrintableDocument;
  printContext: PrintContext;
  size?: "sm" | "default" | "icon";
  className?: string;
}

export function DocumentPrintActions({
  document,
  printContext,
  size = "sm",
  className,
}: DocumentPrintActionsProps) {
  const [waOpen, setWaOpen] = useState(false);

  const handlePrint = () => {
    try {
      openPrintWindow(document, printContext, true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open print dialog");
    }
  };

  const handlePdf = async () => {
    try {
      await downloadPdf(document, printContext);
    } catch (err) {
      const message = err instanceof Error ? err.message : "PDF failed";
      if (!message.includes("styled templates") && !message.includes("Print dialog")) {
        toast.error(message);
      }
    }
  };

  const whatsappBtn =
    size === "icon" ? (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-[#25D366] hover:text-[#20bd5a]"
        onClick={() => setWaOpen(true)}
        title="WhatsApp"
      >
        <MessageCircle className="h-4 w-4" />
      </Button>
    ) : (
      <Button
        size={size}
        variant="outline"
        className="border-[#25D366]/40 text-[#128C7E] hover:bg-[#25D366]/10"
        onClick={() => setWaOpen(true)}
      >
        <MessageCircle className="mr-1 h-3 w-3" />
        WhatsApp
      </Button>
    );

  if (size === "icon") {
    return (
      <>
        <div className={`flex gap-0.5 ${className ?? ""}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrint} title="Print">
            <Printer className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => void handlePdf()} title="Download PDF">
            <FileDown className="h-4 w-4" />
          </Button>
          {whatsappBtn}
        </div>
        <DocumentWhatsAppDialog open={waOpen} onOpenChange={setWaOpen} document={document} />
      </>
    );
  }

  return (
    <>
      <div className={`flex flex-wrap gap-1 ${className ?? ""}`}>
        <Button size={size} variant="outline" onClick={handlePrint}>
          <Printer className="mr-1 h-3 w-3" />
          Print
        </Button>
        <Button size={size} variant="outline" onClick={() => void handlePdf()}>
          <FileDown className="mr-1 h-3 w-3" />
          PDF
        </Button>
        {whatsappBtn}
      </div>
      <DocumentWhatsAppDialog open={waOpen} onOpenChange={setWaOpen} document={document} />
    </>
  );
}
