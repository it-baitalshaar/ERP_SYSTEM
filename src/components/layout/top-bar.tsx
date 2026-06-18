"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Menu, Search, Settings, UserCog } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/sidebar";
import { Badge } from "@/components/ui/badge";
import { roles, useAppStore } from "@/stores/app-store";

export function TopBar() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const {
    organizations,
    companies,
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
    setPreviewRole,
    previewRoleId,
    logout,
  } = useAppStore();

  const roleId = getEffectiveRoleId();
  const role = roles.find((r) => r.id === roleId);
  const orgCompanies = getOrganizationCompanies();
  const companyBranches = getCompanyBranches();
  const companyWarehouses = getCompanyWarehouses();
  const initials = currentUser?.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2) ?? "U";

  return (
    <header className="flex h-14 items-center gap-2 border-b bg-card px-4">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <Sidebar mobile onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-wrap items-center gap-2">
        <Select
          value={currentOrganizationId}
          onValueChange={(id) => {
            void setOrganization(id);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Organization" />
          </SelectTrigger>
          <SelectContent>
            {organizations
              .filter((o) => currentUser?.organization_ids.includes(o.id))
              .map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        <Select
          value={currentCompanyId}
          onValueChange={(id) => {
            void setCompany(id);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Shop / Dept" />
          </SelectTrigger>
          <SelectContent>
            {orgCompanies.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.unit_type === "shop" ? "Shop: " : "Dept: "}
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
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Branch" />
            </SelectTrigger>
            <SelectContent>
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
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Warehouse" />
            </SelectTrigger>
            <SelectContent>
              {companyWarehouses.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.code} — {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="relative hidden flex-1 md:block md:max-w-md">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Global search..." className="pl-8" />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-[10px]">3</Badge>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium leading-none">{currentUser?.full_name}</p>
                <p className="text-xs text-muted-foreground">{role?.name}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Account settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/signup/organization")}>
              Register new organization
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <UserCog className="mr-2 h-4 w-4" />
                Preview as Role (QA)
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setPreviewRole(null)}>
                  Default ({roles.find((r) => r.id === currentUser?.role_id)?.name})
                </DropdownMenuItem>
                {roles.map((r) => (
                  <DropdownMenuItem key={r.id} onClick={() => setPreviewRole(r.id)}>
                    {r.name}
                    {previewRoleId === r.id && " ✓"}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                void logout();
                router.push("/login");
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
