"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Menu, Search, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/sidebar";
import { SuperAdminPreviewMenus } from "@/components/layout/super-admin-preview-menus";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { Badge } from "@/components/ui/badge";
import { roles, useAppStore } from "@/stores/app-store";
import { isSuperAdmin } from "@/lib/permissions";
import { useTranslations } from "@/hooks/use-translations";

const contextSelectClass =
  "h-9 w-[min(11rem,28vw)] shrink-0 [&>span]:line-clamp-1 [&>span]:text-left";

export function TopBar() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const {
    organizations,
    currentOrganizationId,
    currentCompanyId,
    currentBranchId,
    currentWarehouseId,
    currentSiteKind,
    currentUser,
    setOrganization,
    setCompany,
    setBranch,
    setWarehouse,
    getOrganizationCompanies,
    getCompanyBranches,
    getCompanyWarehouses,
    getEffectiveRoleId,
    previewRoleId,
    previewUser,
    isPreviewActive,
    logout,
  } = useAppStore();
  const { t } = useTranslations();

  const roleId = getEffectiveRoleId();
  const role = roles.find((r) => r.id === roleId);
  const orgCompanies = getOrganizationCompanies();
  const companyBranches = getCompanyBranches();
  const companyWarehouses = getCompanyWarehouses();
  const userOrgs = organizations.filter((o) =>
    currentUser?.organization_ids.includes(o.id)
  );
  const showOrgSelect = userOrgs.length > 1;

  const initials =
    currentUser?.full_name
      .split(/\s+/)
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "U";

  const subtitle = previewUser
    ? `Preview · ${previewUser.roleName}`
    : previewRoleId
      ? `Preview · ${role?.name ?? "Role"}`
      : role?.name;

  const showPreviewBanner = isPreviewActive() && isSuperAdmin(currentUser?.role_id ?? "");

  return (
    <div className="shrink-0 border-b bg-card">
      {showPreviewBanner && (
        <div className="border-b bg-amber-500/10 px-3 py-1.5 text-center text-xs text-amber-900 dark:text-amber-200">
          <p className="truncate">
            {t("common.previewBanner")}{" "}
            {previewUser
              ? `${previewUser.fullName} (${previewUser.roleName}${
                  previewUser.extraModules.length
                    ? ` + ${previewUser.extraModules.join(", ")}`
                    : ""
                })`
              : role?.name ?? "selected role"}
            . {t("common.previewRemainSuper")}
          </p>
        </div>
      )}

      <header className="flex min-h-14 items-center gap-2 px-3 py-2 lg:px-4">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <Sidebar mobile onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto scrollbar-none">
          {showOrgSelect && (
            <Select
              value={currentOrganizationId}
              onValueChange={(id) => {
                void setOrganization(id);
              }}
            >
              <SelectTrigger className={contextSelectClass}>
                <SelectValue placeholder={t("common.organization")} />
              </SelectTrigger>
              <SelectContent align="start">
                {userOrgs.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select
            value={currentCompanyId}
            onValueChange={(id) => {
              void setCompany(id);
            }}
          >
            <SelectTrigger className={contextSelectClass} title={t("common.deptShop")}>
              <SelectValue placeholder={t("common.deptShop")} />
            </SelectTrigger>
            <SelectContent align="start">
              {orgCompanies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.unit_type === "shop" ? t("common.shopPrefix") : t("common.deptPrefix")}{" "}
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {companyBranches.length > 0 && (
            <Select
              value={currentSiteKind === "branch" ? currentBranchId : undefined}
              onValueChange={(id) => setBranch(id)}
            >
              <SelectTrigger className={contextSelectClass} title={t("common.branch")}>
                <SelectValue placeholder={t("common.branch")} />
              </SelectTrigger>
              <SelectContent align="start">
                {companyBranches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.code} — {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {companyWarehouses.length > 0 && (
            <Select
              value={currentSiteKind === "warehouse" ? currentWarehouseId : undefined}
              onValueChange={(id) => setWarehouse(id)}
            >
              <SelectTrigger className={contextSelectClass}>
                <SelectValue placeholder={t("common.warehouse")} />
              </SelectTrigger>
              <SelectContent align="start">
                {companyWarehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.code} — {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="relative hidden w-52 shrink-0 xl:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("common.globalSearch")} className="h-9 pl-8" />
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <LanguageSwitcher />
          <Button variant="ghost" size="icon" className="relative shrink-0">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-[10px]">3</Badge>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto max-w-[11rem] gap-2 px-2 py-1.5 sm:max-w-[13rem]"
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="hidden min-w-0 text-left md:block">
                  <p className="truncate text-sm font-medium leading-tight">
                    {currentUser?.full_name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="font-normal">
                <p className="truncate font-medium">{currentUser?.full_name}</p>
                <p className="truncate text-xs font-normal text-muted-foreground">
                  {currentUser?.email}
                </p>
                <p className="text-xs font-normal text-muted-foreground">{subtitle}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Settings className="me-2 h-4 w-4" />
                {t("common.accountSettings")}
              </DropdownMenuItem>
              <SuperAdminPreviewMenus />
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  void logout();
                  router.push("/login");
                }}
              >
                <LogOut className="me-2 h-4 w-4" />
                {t("common.signOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </div>
  );
}
