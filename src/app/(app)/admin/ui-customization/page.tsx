"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ComingSoonButton } from "@/components/shared/coming-soon-button";
import { Card, CardContent } from "@/components/ui/card";

export default function UiCustomizationPage() {
  return (
    <div>
      <PageHeader title="UI Customization" description="Custom fields, column visibility, menu ordering" comingSoon />
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Configure custom fields for Invoice, Item, Customer forms and toggle standard list columns.
          </p>
          <ComingSoonButton className="mt-4">Add Custom Field</ComingSoonButton>
        </CardContent>
      </Card>
    </div>
  );
}
