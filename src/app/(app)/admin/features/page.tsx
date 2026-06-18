"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/stores/app-store";
import { featureFlagDefs } from "@/lib/mock-data/feature-flags";
import { getBusinessLineLabel, getEnabledFlagKeysForBusinessLines } from "@/lib/feature-flags";
import type { BusinessLine } from "@/lib/types";

export default function FeatureManagementPage() {
  const { featureFlags, toggleFeatureFlag, getCurrentCompany } = useAppStore();
  const company = getCurrentCompany();
  const businessLineDefaults = company
    ? getEnabledFlagKeysForBusinessLines(company.business_lines as BusinessLine[])
    : new Set<string>();
  const categories = [...new Set(featureFlagDefs.map((f) => f.category))];

  return (
    <div>
      <PageHeader
        title="Feature Management"
        description="Toggles persist per company. Defaults come from business lines selected at company setup."
      />
      {company && (
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Active company:</span>
          <Badge>{company.name}</Badge>
          {company.business_lines.map((bl) => (
            <Badge key={bl} variant="outline">
              {getBusinessLineLabel(bl)}
            </Badge>
          ))}
        </div>
      )}
      <div className="space-y-6">
        {categories.map((cat) => (
          <Card key={cat}>
            <CardContent className="pt-6">
              <h3 className="mb-4 font-medium">{cat}</h3>
              <div className="space-y-4">
                {featureFlags
                  .filter((f) => f.category === cat)
                  .map((flag) => (
                    <div key={flag.key} className="flex items-center justify-between gap-4 rounded-lg border p-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={flag.key} className="font-medium">
                            {flag.label}
                          </Label>
                          {businessLineDefaults.has(flag.key) && (
                            <Badge variant="secondary" className="text-[10px]">
                              Business line default
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{flag.description}</p>
                      </div>
                      <Switch
                        id={flag.key}
                        checked={flag.enabled}
                        onCheckedChange={() => {
                          void toggleFeatureFlag(flag.key);
                        }}
                      />
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
