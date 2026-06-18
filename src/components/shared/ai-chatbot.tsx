"use client";

import { MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ComingSoonBadge } from "@/components/shared/coming-soon-badge";
import { showComingSoonToast } from "@/lib/coming-soon";

const sampleMessages = [
  { role: "bot", text: "Hello! I'm the BAS ERP assistant. How can I help you today?" },
  { role: "user", text: "What's our low stock situation?" },
  { role: "bot", text: "Portland Cement 50kg is below reorder level at Dubai Main Warehouse (320 bags vs 500 reorder)." },
];

export function AiChatbotWidget() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
        size="icon"
        onClick={() => setOpen(true)}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 z-50 flex h-[420px] w-[360px] flex-col shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b py-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm">AI Assistant</CardTitle>
          <ComingSoonBadge className="text-[10px]" />
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 overflow-hidden p-3">
        <div className="flex-1 space-y-2 overflow-auto">
          {sampleMessages.map((m, i) => (
            <div
              key={i}
              className={`rounded-lg px-3 py-2 text-sm ${
                m.role === "user" ? "ml-8 bg-primary text-primary-foreground" : "mr-8 bg-muted"
              }`}
            >
              {m.text}
            </div>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            showComingSoonToast("AI chat");
          }}
        >
          <Input placeholder="Ask anything..." />
          <Button type="submit" size="sm">
            Send
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
