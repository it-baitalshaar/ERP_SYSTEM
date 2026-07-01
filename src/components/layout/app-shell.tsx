"use client";

import { useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Breadcrumbs } from "@/components/shared/page-header";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AiChatbotWidget } from "@/components/shared/ai-chatbot";
import { HydrationGate } from "@/components/providers/hydration-gate";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { useAppStore } from "@/stores/app-store";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isHydrated, hydrateSession, isFeatureEnabled } = useAppStore();
  const crumbs = useBreadcrumbs();

  useEffect(() => {
    void hydrateSession();
  }, [hydrateSession]);

  if (!isHydrated) return null;
  if (!isAuthenticated) return null;

  const aiEnabled = isFeatureEnabled("mod_ai");

  return (
    <HydrationGate>
      <LocaleProvider>
        <TooltipProvider>
        <div className="flex h-screen overflow-hidden">
          <div className="hidden lg:block">
            <Sidebar />
          </div>
          <div className="flex flex-1 flex-col overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-auto p-4 md:p-6">
              <Breadcrumbs items={crumbs} />
              {children}
            </main>
          </div>
        </div>
        {aiEnabled && <AiChatbotWidget />}
        </TooltipProvider>
      </LocaleProvider>
    </HydrationGate>
  );
}
