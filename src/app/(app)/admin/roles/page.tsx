"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ComingSoonButton } from "@/components/shared/coming-soon-button";
import { roles } from "@/lib/mock-data/roles";

const modules = ["sales", "procurement", "inventory", "finance", "compliance", "hr", "logistics", "real_estate", "construction", "ecommerce", "bi", "documents", "admin"];
const actions = ["view", "create", "edit", "delete", "approve"];

export default function RolesPermissionsPage() {
  return (
    <div>
      <PageHeader
        title="Roles & Permissions"
        description="Permission matrix — Modules × Roles × Actions"
        action={<ComingSoonButton>Create Role</ComingSoonButton>}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Permission Matrix (Super Admin view)</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left">Module</th>
                {roles.slice(0, 5).map((r) => (
                  <th key={r.id} className="p-2 text-center text-xs">
                    {r.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modules.map((mod) => (
                <tr key={mod} className="border-b">
                  <td className="p-2 font-medium capitalize">{mod.replace(/_/g, " ")}</td>
                  {roles.slice(0, 5).map((r) => (
                    <td key={r.id} className="p-2 text-center">
                      <div className="flex justify-center gap-1">
                        {actions.map((a) => (
                          <Checkbox
                            key={a}
                            defaultChecked={r.id === "role-super" || (r.id === "role-sales" && mod === "sales" && a !== "delete")}
                            disabled
                            title={a}
                          />
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-xs text-muted-foreground">
            Actions per cell: {actions.join(" / ")} — save wiring coming in Phase 2
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
