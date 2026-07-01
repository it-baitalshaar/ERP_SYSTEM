"use client";

import Link from "next/link";
import { GitBranch, Package } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const DEPARTMENTS = [
  {
    module: "procurement",
    title: "Procurement",
    description: "Material request → LPO → supplier → proforma → MRN → invoice → payment",
    href: "/admin/workflows/procurement",
    icon: Package,
    available: true,
  },
  {
    module: "sales",
    title: "Sales & CRM",
    description: "Quotation → order → invoice → delivery (coming soon)",
    href: "/admin/workflows/sales",
    icon: GitBranch,
    available: false,
  },
];

export default function AdminWorkflowsPage() {
  return (
    <div>
      <PageHeader
        title="Workflow Builder"
        description="Configure approval gates and process maps per department. Toggle steps and assign approvers."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {DEPARTMENTS.map((dept) => {
          const Icon = dept.icon;
          return (
            <Card key={dept.module} className={!dept.available ? "opacity-70" : undefined}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <CardTitle>{dept.title}</CardTitle>
                  </div>
                  {dept.available ? (
                    <Badge>Active</Badge>
                  ) : (
                    <Badge variant="secondary">Coming soon</Badge>
                  )}
                </div>
                <CardDescription>{dept.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {dept.available ? (
                  <Button asChild>
                    <Link href={dept.href}>Configure & view map</Link>
                  </Button>
                ) : (
                  <Button disabled variant="outline">
                    Not available yet
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
