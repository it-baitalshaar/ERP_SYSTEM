// Phase 2 data facade
export { fetchCompanies, updateCompanyName } from "@/lib/data/companies";
export { fetchFeatureFlagsForCompany, upsertFeatureFlag } from "@/lib/data/feature-flags";
export { fetchCustomers, fetchSalesOrders, fetchTaxInvoices } from "@/lib/data/sales";
export { signInWithEmail, signOut, loadSession, hydrateFeatureFlags } from "@/lib/data/auth";
