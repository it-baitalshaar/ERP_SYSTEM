"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ComingSoonButton } from "@/components/shared/coming-soon-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const integrations = [
  { name: "Tabby", type: "Payment Gateway", status: "Not Connected" },
  { name: "Stripe", type: "Payment Gateway", status: "Not Connected" },
  { name: "Aramex", type: "Shipping Carrier", status: "Coming Soon" },
  { name: "DHL", type: "Shipping Carrier", status: "Coming Soon" },
  { name: "Fetchr", type: "Shipping Carrier", status: "Coming Soon" },
  { name: "Shopify", type: "E-Commerce", status: "Coming Soon" },
  { name: "Accounting Export", type: "Export", status: "Not Connected" },
  { name: "AI Chatbot", type: "AI", status: "Coming Soon" },
];

export default function IntegrationsHubPage() {
  return (
    <div>
      <PageHeader title="Integrations Hub" description="Connect payment, shipping, and e-commerce services" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {integrations.map((int) => (
          <Card key={int.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{int.name}</CardTitle>
                <Badge variant="outline">{int.status}</Badge>
              </div>
              <CardDescription>{int.type}</CardDescription>
            </CardHeader>
            <CardContent>
              <ComingSoonButton variant="outline" size="sm" className="w-full">
                Configure
              </ComingSoonButton>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

