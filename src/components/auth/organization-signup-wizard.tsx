"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getBusinessLineLabel } from "@/lib/feature-flags";
import type { BusinessLine, UnitType } from "@/lib/types";

export interface SiteForm {
  name: string;
  code: string;
  trade_license_no: string;
  address: string;
}

export interface UnitForm {
  name: string;
  unit_type: UnitType;
  trade_license_no: string;
  business_lines: BusinessLine[];
  branches: SiteForm[];
  warehouses: SiteForm[];
}

export interface OrganizationSignupPayload {
  organization: {
    name: string;
    trade_license_no: string;
    address: string;
    currency: string;
    vat_trn: string;
  };
  units: UnitForm[];
  admin?: {
    full_name: string;
    email: string;
    password: string;
  };
}

const BUSINESS_LINE_OPTIONS: BusinessLine[] = [
  "trading",
  "construction",
  "logistics",
  "real_estate",
];

const emptySite = (): SiteForm => ({
  name: "",
  code: "",
  trade_license_no: "",
  address: "",
});

const emptyUnit = (): UnitForm => ({
  name: "",
  unit_type: "department",
  trade_license_no: "",
  business_lines: ["trading"],
  branches: [emptySite()],
  warehouses: [],
});

interface OrganizationSignupWizardProps {
  title: string;
  description: string;
  showAdminStep: boolean;
  loading: boolean;
  onSubmit: (payload: OrganizationSignupPayload) => Promise<void>;
}

export function OrganizationSignupWizard({
  title,
  description,
  showAdminStep,
  loading,
  onSubmit,
}: OrganizationSignupWizardProps) {
  const [step, setStep] = useState(0);
  const [confirmPassword, setConfirmPassword] = useState("");

  const [organization, setOrganization] = useState({
    name: "",
    trade_license_no: "",
    address: "",
    currency: "AED",
    vat_trn: "",
  });

  const [admin, setAdmin] = useState({
    full_name: "",
    email: "",
    password: "",
  });

  const [units, setUnits] = useState<UnitForm[]>([emptyUnit()]);

  const steps = showAdminStep
    ? ["Organization", "Administrator", "Shops & Departments", "Branches & Warehouses"]
    : ["Organization", "Shops & Departments", "Branches & Warehouses"];

  const updateUnit = (index: number, patch: Partial<UnitForm>) => {
    setUnits((prev) => prev.map((u, i) => (i === index ? { ...u, ...patch } : u)));
  };

  const addUnit = () => setUnits((prev) => [...prev, emptyUnit()]);

  const removeUnit = (index: number) => {
    setUnits((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const updateSiteList = (
    unitIndex: number,
    kind: "branches" | "warehouses",
    siteIndex: number,
    patch: Partial<SiteForm>
  ) => {
    setUnits((prev) =>
      prev.map((unit, i) => {
        if (i !== unitIndex) return unit;
        const sites = unit[kind].map((s, si) => (si === siteIndex ? { ...s, ...patch } : s));
        return { ...unit, [kind]: sites };
      })
    );
  };

  const addSite = (unitIndex: number, kind: "branches" | "warehouses") => {
    setUnits((prev) =>
      prev.map((unit, i) =>
        i === unitIndex ? { ...unit, [kind]: [...unit[kind], emptySite()] } : unit
      )
    );
  };

  const removeSite = (unitIndex: number, kind: "branches" | "warehouses", siteIndex: number) => {
    setUnits((prev) =>
      prev.map((unit, i) => {
        if (i !== unitIndex) return unit;
        const next = unit[kind].filter((_, si) => si !== siteIndex);
        return { ...unit, [kind]: next.length ? next : kind === "branches" ? [emptySite()] : [] };
      })
    );
  };

  const canGoNext = () => {
    const current = steps[step];
    if (current === "Organization") {
      return organization.name.trim() && organization.trade_license_no.trim();
    }
    if (current === "Administrator") {
      return (
        admin.full_name.trim() &&
        admin.email.trim() &&
        admin.password.length >= 6 &&
        admin.password === confirmPassword
      );
    }
    if (current === "Shops & Departments") {
      return units.every((u) => u.name.trim() && u.trade_license_no.trim());
    }
    return true;
  };

  const handleFinish = async () => {
    for (const unit of units) {
      const hasBranch = unit.branches.some(
        (b) => b.name.trim() && b.code.trim() && b.trade_license_no.trim()
      );
      const hasWarehouse = unit.warehouses.some(
        (w) => w.name.trim() && w.code.trim() && w.trade_license_no.trim()
      );
      if (!hasBranch && !hasWarehouse) {
        return;
      }
    }

    const payload: OrganizationSignupPayload = {
      organization,
      units: units.map((unit) => ({
        ...unit,
        branches: unit.branches.filter(
          (b) => b.name.trim() && b.code.trim() && b.trade_license_no.trim()
        ),
        warehouses: unit.warehouses.filter(
          (w) => w.name.trim() && w.code.trim() && w.trade_license_no.trim()
        ),
      })),
    };

    if (showAdminStep) {
      payload.admin = admin;
    }

    await onSubmit(payload);
  };

  const renderStep = () => {
    const current = steps[step];

    if (current === "Organization") {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org_name">Organization name</Label>
            <Input
              id="org_name"
              value={organization.name}
              onChange={(e) => setOrganization({ ...organization, name: e.target.value })}
              placeholder="Bait Al Shaar Holdings"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org_license">Organization trade license</Label>
            <Input
              id="org_license"
              value={organization.trade_license_no}
              onChange={(e) =>
                setOrganization({ ...organization, trade_license_no: e.target.value })
              }
              placeholder="CN-ORG-001"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org_address">Address</Label>
            <Input
              id="org_address"
              value={organization.address}
              onChange={(e) => setOrganization({ ...organization, address: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="org_currency">Currency</Label>
              <Input
                id="org_currency"
                value={organization.currency}
                onChange={(e) => setOrganization({ ...organization, currency: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org_vat">VAT TRN</Label>
              <Input
                id="org_vat"
                value={organization.vat_trn}
                onChange={(e) => setOrganization({ ...organization, vat_trn: e.target.value })}
              />
            </div>
          </div>
        </div>
      );
    }

    if (current === "Administrator") {
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This account will be the Super Administrator for the new organization.
          </p>
          <div className="space-y-2">
            <Label htmlFor="admin_name">Full name</Label>
            <Input
              id="admin_name"
              value={admin.full_name}
              onChange={(e) => setAdmin({ ...admin, full_name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin_email">Email</Label>
            <Input
              id="admin_email"
              type="email"
              value={admin.email}
              onChange={(e) => setAdmin({ ...admin, email: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin_password">Password</Label>
            <PasswordInput
              id="admin_password"
              value={admin.password}
              onChange={(e) => setAdmin({ ...admin, password: e.target.value })}
              minLength={6}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin_confirm">Confirm password</Label>
            <PasswordInput
              id="admin_confirm"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
        </div>
      );
    }

    if (current === "Shops & Departments") {
      return (
        <div className="space-y-6">
          {units.map((unit, unitIndex) => (
            <div key={unitIndex} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Unit {unitIndex + 1}</p>
                {units.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeUnit(unitIndex)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={unit.unit_type}
                    onValueChange={(v) =>
                      updateUnit(unitIndex, { unit_type: v as UnitType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shop">Shop</SelectItem>
                      <SelectItem value="department">Department</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={unit.name}
                    onChange={(e) => updateUnit(unitIndex, { name: e.target.value })}
                    placeholder={unit.unit_type === "shop" ? "Dubai Showroom" : "Trading Dept"}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Unit trade license</Label>
                <Input
                  value={unit.trade_license_no}
                  onChange={(e) => updateUnit(unitIndex, { trade_license_no: e.target.value })}
                  placeholder="CN-UNIT-001"
                />
              </div>
              <div className="space-y-2">
                <Label>Business lines</Label>
                <div className="grid grid-cols-2 gap-2">
                  {BUSINESS_LINE_OPTIONS.map((line) => (
                    <label
                      key={line}
                      className="flex items-center gap-2 rounded-md border p-2 text-sm"
                    >
                      <Checkbox
                        checked={unit.business_lines.includes(line)}
                        onCheckedChange={(checked) => {
                          const next = checked
                            ? [...unit.business_lines, line]
                            : unit.business_lines.filter((l) => l !== line);
                          updateUnit(unitIndex, {
                            business_lines: next.length ? next : ["trading"],
                          });
                        }}
                      />
                      {getBusinessLineLabel(line)}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" className="w-full" onClick={addUnit}>
            <Plus className="mr-2 h-4 w-4" />
            Add shop or department
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {units.map((unit, unitIndex) => (
          <div key={unitIndex} className="space-y-4 rounded-lg border p-4">
            <p className="text-sm font-medium">
              {unit.name || `Unit ${unitIndex + 1}`} ({unit.unit_type})
            </p>

            <div className="space-y-3">
              <p className="text-xs font-medium uppercase text-muted-foreground">Branches</p>
              {unit.branches.map((branch, siteIndex) => (
                <div key={siteIndex} className="grid gap-2 rounded-md bg-muted/40 p-3 sm:grid-cols-2">
                  <Input
                    placeholder="Branch name"
                    value={branch.name}
                    onChange={(e) =>
                      updateSiteList(unitIndex, "branches", siteIndex, { name: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Code"
                    value={branch.code}
                    onChange={(e) =>
                      updateSiteList(unitIndex, "branches", siteIndex, { code: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Branch trade license"
                    value={branch.trade_license_no}
                    onChange={(e) =>
                      updateSiteList(unitIndex, "branches", siteIndex, {
                        trade_license_no: e.target.value,
                      })
                    }
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Address"
                      value={branch.address}
                      onChange={(e) =>
                        updateSiteList(unitIndex, "branches", siteIndex, {
                          address: e.target.value,
                        })
                      }
                    />
                    {unit.branches.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSite(unitIndex, "branches", siteIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addSite(unitIndex, "branches")}
              >
                <Plus className="mr-1 h-3 w-3" />
                Add branch
              </Button>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-medium uppercase text-muted-foreground">Warehouses</p>
              {unit.warehouses.length === 0 && (
                <p className="text-xs text-muted-foreground">No warehouses yet (optional).</p>
              )}
              {unit.warehouses.map((warehouse, siteIndex) => (
                <div key={siteIndex} className="grid gap-2 rounded-md bg-muted/40 p-3 sm:grid-cols-2">
                  <Input
                    placeholder="Warehouse name"
                    value={warehouse.name}
                    onChange={(e) =>
                      updateSiteList(unitIndex, "warehouses", siteIndex, { name: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Code"
                    value={warehouse.code}
                    onChange={(e) =>
                      updateSiteList(unitIndex, "warehouses", siteIndex, { code: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Warehouse trade license"
                    value={warehouse.trade_license_no}
                    onChange={(e) =>
                      updateSiteList(unitIndex, "warehouses", siteIndex, {
                        trade_license_no: e.target.value,
                      })
                    }
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Address"
                      value={warehouse.address}
                      onChange={(e) =>
                        updateSiteList(unitIndex, "warehouses", siteIndex, {
                          address: e.target.value,
                        })
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSite(unitIndex, "warehouses", siteIndex)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addSite(unitIndex, "warehouses")}
              >
                <Plus className="mr-1 h-3 w-3" />
                Add warehouse
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="flex justify-center gap-2 pt-2">
          {steps.map((label, i) => (
            <span
              key={label}
              className={`rounded-full px-2 py-0.5 text-xs ${
                i === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}. {label}
            </span>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderStep()}
        <div className="flex justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={step === 0 || loading}
            onClick={() => setStep((s) => s - 1)}
          >
            Back
          </Button>
          {step < steps.length - 1 ? (
            <Button
              type="button"
              disabled={!canGoNext() || loading}
              onClick={() => setStep((s) => s + 1)}
            >
              Next
            </Button>
          ) : (
            <Button type="button" disabled={loading} onClick={() => void handleFinish()}>
              {loading ? "Creating…" : "Complete registration"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
