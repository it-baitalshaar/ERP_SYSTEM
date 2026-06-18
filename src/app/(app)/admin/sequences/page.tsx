"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ComingSoonButton } from "@/components/shared/coming-soon-button";
import { Card, CardContent } from "@/components/ui/card";

export default function SequencesPage() {
  return (
    <div>
      <PageHeader title="Numbering & Sequences" description="Document number formats per branch" />
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {[
              { doc: "Tax Invoice", format: "INV-{BRANCH}-{YEAR}-{SEQ:6}" },
              { doc: "Sales Order", format: "SO-{BRANCH}-{YEAR}-{SEQ:6}" },
              { doc: "Purchase Order", format: "PO-{BRANCH}-{YEAR}-{SEQ:6}" },
            ].map((s) => (
              <div key={s.doc} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">{s.doc}</p>
                  <p className="font-mono text-sm text-muted-foreground">{s.format}</p>
                </div>
                <ComingSoonButton variant="outline" size="sm">
                  Edit
                </ComingSoonButton>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
