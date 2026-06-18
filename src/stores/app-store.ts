"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Branch,
  Company,
  FeatureFlag,
  Organization,
  SiteKind,
  User,
  OrgWarehouse,
} from "@/lib/types";
import {
  branches as mockBranches,
  companies as mockCompanies,
  warehouses as mockWarehouses,
  COMPANY_AL_SAQIYA,
  BRANCH_AL_SAQIYA_HQ,
  ORG_AL_SAQIYA,
} from "@/lib/mock-data/companies";
import { organizations as mockOrganizations } from "@/lib/mock-data/organizations";
import { getDefaultFeatureFlags } from "@/lib/mock-data/feature-flags";
import { roles } from "@/lib/mock-data/roles";
import { users as mockUsers } from "@/lib/mock-data/users";
import {
  hydrateFeatureFlags,
  loadSession,
  signOut as authSignOut,
  signInWithEmail,
} from "@/lib/data/auth";
import { upsertFeatureFlag } from "@/lib/data/feature-flags";
import type { SessionPayload } from "@/lib/server/users";

interface AppState {
  isAuthenticated: boolean;
  isHydrated: boolean;
  currentUser: User | null;
  organizations: Organization[];
  companies: Company[];
  branches: Branch[];
  warehouses: OrgWarehouse[];
  currentOrganizationId: string;
  currentCompanyId: string;
  currentBranchId: string;
  currentWarehouseId: string;
  currentSiteKind: SiteKind;
  previewRoleId: string | null;
  featureFlags: FeatureFlag[];
  sidebarCollapsed: boolean;
  loginWithPassword: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  hydrateSession: () => Promise<void>;
  setOrganization: (organizationId: string) => Promise<void>;
  setCompany: (companyId: string) => Promise<void>;
  setBranch: (branchId: string) => void;
  setWarehouse: (warehouseId: string) => void;
  setPreviewRole: (roleId: string | null) => void;
  toggleFeatureFlag: (key: string) => Promise<void>;
  refreshCompanies: (companies: Company[]) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  getEffectiveRoleId: () => string;
  getCurrentOrganization: () => Organization | undefined;
  getCurrentCompany: () => Company | undefined;
  getCurrentBranch: () => Branch | undefined;
  getCurrentWarehouse: () => OrgWarehouse | undefined;
  getOrganizationCompanies: () => Company[];
  getCompanyBranches: () => Branch[];
  getCompanyWarehouses: () => OrgWarehouse[];
  isFeatureEnabled: (key: string) => boolean;
}

async function applySession(
  set: (partial: Partial<AppState> | ((s: AppState) => Partial<AppState>)) => void,
  session: SessionPayload
) {
  const company = session.companies.find((c) => c.id === session.companyId);
  const flags = await hydrateFeatureFlags(
    session.companyId,
    company?.business_lines ?? ["trading"]
  );
  set({
    isAuthenticated: true,
    currentUser: session.user,
    organizations: session.organizations,
    companies: session.companies,
    branches: session.branches,
    warehouses: session.warehouses,
    currentOrganizationId: session.organizationId,
    currentCompanyId: session.companyId,
    currentBranchId: session.branchId ?? "",
    currentWarehouseId: session.warehouseId ?? "",
    currentSiteKind: session.siteKind,
    featureFlags: flags,
    previewRoleId: null,
  });
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isHydrated: false,
      currentUser: null,
      organizations: mockOrganizations,
      companies: mockCompanies,
      branches: mockBranches,
      warehouses: mockWarehouses,
      currentOrganizationId: ORG_AL_SAQIYA,
      currentCompanyId: COMPANY_AL_SAQIYA,
      currentBranchId: BRANCH_AL_SAQIYA_HQ,
      currentWarehouseId: "",
      currentSiteKind: "branch",
      previewRoleId: null,
      featureFlags: getDefaultFeatureFlags(COMPANY_AL_SAQIYA),
      sidebarCollapsed: false,

      loginWithPassword: async (email, password) => {
        const result = await signInWithEmail(email, password);
        if (result.error) return { error: result.error };
        const session = result.session ?? (await loadSession());
        if (!session) return { error: "Could not load session" };
        await applySession(set, session);
        return {};
      },

      logout: async () => {
        await authSignOut();
        set({
          isAuthenticated: false,
          currentUser: null,
          previewRoleId: null,
        });
      },

      hydrateSession: async () => {
        const session = await loadSession();
        if (session) {
          await applySession(set, session);
        }
        set({ isHydrated: true });
      },

      setOrganization: async (organizationId) => {
        const orgCompanies = get().companies.filter(
          (c) =>
            c.organization_id === organizationId &&
            get().currentUser?.company_ids.includes(c.id)
        );
        const companyId = orgCompanies[0]?.id ?? get().currentCompanyId;
        const companyBranches = get().branches.filter((b) => b.company_id === companyId);
        const companyWarehouses = get().warehouses.filter((w) => w.company_id === companyId);
        const company = get().companies.find((c) => c.id === companyId);
        const flags = await hydrateFeatureFlags(
          companyId,
          company?.business_lines ?? ["trading"]
        );
        set({
          currentOrganizationId: organizationId,
          currentCompanyId: companyId,
          currentBranchId: companyBranches[0]?.id ?? "",
          currentWarehouseId: companyWarehouses[0]?.id ?? "",
          currentSiteKind: companyBranches.length ? "branch" : "warehouse",
          featureFlags: flags,
        });
      },

      setCompany: async (companyId) => {
        const companyBranches = get().branches.filter((b) => b.company_id === companyId);
        const companyWarehouses = get().warehouses.filter((w) => w.company_id === companyId);
        const company = get().companies.find((c) => c.id === companyId);
        const flags = await hydrateFeatureFlags(
          companyId,
          company?.business_lines ?? ["trading"]
        );
        set({
          currentCompanyId: companyId,
          currentBranchId: companyBranches[0]?.id ?? "",
          currentWarehouseId: companyWarehouses[0]?.id ?? "",
          currentSiteKind: companyBranches.length ? "branch" : "warehouse",
          featureFlags: flags,
        });
      },

      setBranch: (branchId) =>
        set({ currentBranchId: branchId, currentSiteKind: "branch" }),

      setWarehouse: (warehouseId) =>
        set({ currentWarehouseId: warehouseId, currentSiteKind: "warehouse" }),

      setPreviewRole: (roleId) => set({ previewRoleId: roleId }),

      toggleFeatureFlag: async (key) => {
        const state = get();
        const flag = state.featureFlags.find((f) => f.key === key);
        if (!flag) return;
        const enabled = !flag.enabled;
        set({
          featureFlags: state.featureFlags.map((f) =>
            f.key === key ? { ...f, enabled } : f
          ),
        });
        await upsertFeatureFlag(state.currentCompanyId, key, enabled);
      },

      refreshCompanies: (companies) => set({ companies }),

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      getEffectiveRoleId: () =>
        get().previewRoleId ?? get().currentUser?.role_id ?? "role-auditor",

      getCurrentOrganization: () =>
        get().organizations.find((o) => o.id === get().currentOrganizationId),

      getCurrentCompany: () =>
        get().companies.find((c) => c.id === get().currentCompanyId),

      getCurrentBranch: () =>
        get().branches.find((b) => b.id === get().currentBranchId),

      getCurrentWarehouse: () =>
        get().warehouses.find((w) => w.id === get().currentWarehouseId),

      getOrganizationCompanies: () =>
        get().companies.filter(
          (c) =>
            c.organization_id === get().currentOrganizationId &&
            get().currentUser?.company_ids.includes(c.id)
        ),

      getCompanyBranches: () =>
        get().branches.filter((b) => b.company_id === get().currentCompanyId),

      getCompanyWarehouses: () =>
        get().warehouses.filter((w) => w.company_id === get().currentCompanyId),

      isFeatureEnabled: (key) => {
        const flag = get().featureFlags.find((f) => f.key === key);
        return flag?.enabled ?? false;
      },
    }),
    {
      name: "erp-app-store",
      partialize: (s) => ({
        sidebarCollapsed: s.sidebarCollapsed,
        currentOrganizationId: s.currentOrganizationId,
        currentCompanyId: s.currentCompanyId,
        currentBranchId: s.currentBranchId,
        currentWarehouseId: s.currentWarehouseId,
        currentSiteKind: s.currentSiteKind,
      }),
    }
  )
);

export { roles, mockUsers as users };
