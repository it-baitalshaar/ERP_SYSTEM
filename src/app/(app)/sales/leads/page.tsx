"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const stages = [
  {
    id: "lead",
    title: "Lead",
    items: [
      { id: "1", name: "Gulf Interiors", value: "AED 25,000" },
      { id: "2", name: "Desert Homes", value: "AED 18,000" },
    ],
  },
  {
    id: "opportunity",
    title: "Opportunity",
    items: [{ id: "3", name: "Skyline Developers", value: "AED 120,000" }],
  },
  {
    id: "quotation",
    title: "Quotation",
    items: [{ id: "4", name: "Emirates Building Materials", value: "AED 40,375" }],
  },
  {
    id: "order",
    title: "Order",
    items: [{ id: "5", name: "Al Noor Trading", value: "AED 288,120" }],
  },
];

export default function LeadsPipelinePage() {
  const [board, setBoard] = useState(stages);

  const onDragStart = (e: React.DragEvent, itemId: string, fromStage: string) => {
    e.dataTransfer.setData("itemId", itemId);
    e.dataTransfer.setData("fromStage", fromStage);
  };

  const onDrop = (e: React.DragEvent, toStage: string) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData("itemId");
    const fromStage = e.dataTransfer.getData("fromStage");
    if (fromStage === toStage) return;

    setBoard((prev) => {
      const next = prev.map((s) => ({ ...s, items: [...s.items] }));
      const from = next.find((s) => s.id === fromStage);
      const to = next.find((s) => s.id === toStage);
      if (!from || !to) return prev;
      const idx = from.items.findIndex((i) => i.id === itemId);
      if (idx < 0) return prev;
      const [item] = from.items.splice(idx, 1);
      to.items.push(item);
      return next;
    });
  };

  return (
    <div>
      <PageHeader title="Leads & Pipeline" description="Drag cards between stages — Lead → Opportunity → Quotation → Order" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {board.map((stage) => (
          <Card
            key={stage.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, stage.id)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                {stage.title}
                <Badge variant="secondary">{stage.items.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stage.items.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, item.id, stage.id)}
                  className="cursor-grab rounded-md border bg-card p-3 shadow-sm active:cursor-grabbing"
                >
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.value}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
