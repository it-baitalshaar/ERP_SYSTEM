"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Breadcrumbs } from "@/components/shared/page-header";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getBreadcrumbs } from "@/lib/navigation";
import { AiChatbotWidget } from "@/components/shared/ai-chatbot";
import { HydrationGate } from "@/components/providers/hydration-gate";
import { useAppStore } from "@/stores/app-store";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, isHydrated, hydrateSession, isFeatureEnabled } = useAppStore();

  useEffect(() => {
    void hydrateSession();
  }, [hydrateSession]);

  if (!isHydrated) return null;
  if (!isAuthenticated) return null;

  const crumbs = getBreadcrumbs(pathname);
  const aiEnabled = isFeatureEnabled("mod_ai");

  return (
    <HydrationGate>
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
    </HydrationGate>
  );
}
