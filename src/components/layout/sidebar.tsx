"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { NavIcon } from "@/components/layout/nav-icons";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { navigation } from "@/lib/navigation";
import { canViewModule, isAdminRole } from "@/lib/permissions";
import { useAppStore } from "@/stores/app-store";

interface SidebarProps {
  mobile?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ mobile, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    isFeatureEnabled,
    getEffectiveRoleId,
    getCurrentCompany,
  } = useAppStore();

  const collapsed = !mobile && sidebarCollapsed;
  const roleId = getEffectiveRoleId();
  const company = getCurrentCompany();
  const businessLines = company?.business_lines ?? [];

  const visibleGroups = navigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.feature_flag && !isFeatureEnabled(item.feature_flag)) return false;
        if (item.business_line && !businessLines.includes(item.business_line)) return false;
        if (item.module_key === "admin" && !isAdminRole(roleId)) return false;
        if (!canViewModule(roleId, item.module_key)) return false;
        return true;
      }),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        collapsed ? "w-16" : "w-64",
        mobile && "w-full border-r-0"
      )}
    >
      <div className={cn("flex h-14 items-center border-b border-sidebar-border px-4", collapsed && "justify-center px-2")}>
        {!collapsed && (
          <Link href="/dashboard" className="font-semibold text-white" onClick={onNavigate}>
            Bait Al Shaar ERP
          </Link>
        )}
        {!mobile && (
          <Button
            variant="ghost"
            size="icon"
            className={cn("ml-auto text-sidebar-foreground hover:bg-sidebar-accent", collapsed && "ml-0")}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>
      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="space-y-4">
          {visibleGroups.map((group) => (
            <div key={group.key}>
              {!collapsed && (
                <p className="mb-1 px-2 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/60">
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <li key={item.key}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors",
                          active
                            ? "bg-sidebar-accent text-white"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white",
                          collapsed && "justify-center px-2"
                        )}
                      >
                        <NavIcon name={item.icon} className="h-4 w-4 shrink-0" />
                        {!collapsed && (
                          <span className="truncate">
                            {item.label}
                            {item.coming_soon && (
                              <span className="ml-1 text-[10px] text-warning">•</span>
                            )}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}
