"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PrintableDocument } from "@/lib/documents/types";
import { downloadPdfBlob, generatePdfBlob } from "@/lib/documents/print";
import {
  buildWhatsAppMessage,
  normalizeWhatsAppPhone,
  openWhatsApp,
} from "@/lib/documents/whatsapp";
import { toast } from "sonner";

interface DocumentWhatsAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: PrintableDocument;
}

export function DocumentWhatsAppDialog({
  open,
  onOpenChange,
  document: doc,
}: DocumentWhatsAppDialogProps) {
  const [phone, setPhone] = useState(doc.partyPhone ?? "");
  const [includeText, setIncludeText] = useState(true);
  const [includePdf, setIncludePdf] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      setPhone(doc.partyPhone ?? "");
      setIncludeText(true);
      setIncludePdf(false);
    }
  }, [open, doc.partyPhone]);

  const handleSend = async () => {
    if (!phone.trim()) {
      toast.error("Enter a phone number");
      return;
    }
    if (!normalizeWhatsAppPhone(phone)) {
      toast.error("Invalid phone — use country code (e.g. 971501234567)");
      return;
    }
    if (!includeText && !includePdf) {
      toast.error("Select text and/or PDF");
      return;
    }

    setSending(true);
    try {
      const message = includeText ? buildWhatsAppMessage(doc) : undefined;

      if (includePdf) {
        const blob = await generatePdfBlob(doc);
        const filename = `${doc.number.replace(/[/\\?%*:|"<>]/g, "-")}.pdf`;
        const file = new File([blob], filename, { type: "application/pdf" });

        if (
          typeof navigator !== "undefined" &&
          navigator.canShare?.({ files: [file] })
        ) {
          await navigator.share({
            text: message,
            files: [file],
          });
          toast.success("Shared via WhatsApp / device share");
          onOpenChange(false);
          return;
        }

        downloadPdfBlob(blob, filename);
        toast.message("PDF downloaded — attach it in WhatsApp after the chat opens");
      }

      openWhatsApp(phone, message);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open WhatsApp");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send via WhatsApp</DialogTitle>
          <DialogDescription>
            {doc.title} {doc.number}
            {doc.partyName ? ` — ${doc.partyName}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wa-phone">WhatsApp number</Label>
            <Input
              id="wa-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="971501234567 or 0501234567"
            />
            {!doc.partyPhone && (
              <p className="text-xs text-muted-foreground">
                No phone on file — enter the customer or supplier mobile number.
              </p>
            )}
          </div>

          <div className="space-y-3 rounded-md border p-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeText}
                onChange={(e) => setIncludeText(e.target.checked)}
                className="h-4 w-4"
              />
              Include text summary (document details + lines)
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includePdf}
                onChange={(e) => setIncludePdf(e.target.checked)}
                className="h-4 w-4"
              />
              Include PDF (downloads file; attach in WhatsApp if not auto-shared)
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-[#25D366] hover:bg-[#20bd5a] text-white"
            disabled={sending}
            onClick={() => void handleSend()}
          >
            {sending ? "Opening…" : "Open WhatsApp"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
