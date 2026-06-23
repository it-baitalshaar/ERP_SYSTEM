import type { BusinessLine, FeatureFlag } from "@/lib/types";
import { buildDefaultFeatureFlags } from "@/lib/feature-flags";
import { companies } from "@/lib/mock-data/companies";

const flagDefs: Omit<FeatureFlag, "company_id" | "enabled">[] = [
  { key: "mod_sales", label: "Sales & CRM", description: "Quotations, orders, invoices, CRM", category: "Sales & CRM" },
  { key: "mod_procurement", label: "Procurement", description: "PR, PO, goods receipt, suppliers", category: "Procurement" },
  { key: "mod_inventory", label: "Inventory", description: "Items, stock, transfers, adjustments", category: "Inventory" },
  { key: "mod_finance", label: "Accounts & Finance", description: "GL, journals, AR/AP", category: "Finance" },
  { key: "mod_compliance", label: "UAE Compliance", description: "VAT, e-invoicing, document expiry", category: "Compliance" },
  { key: "mod_hr", label: "HR & PRO", description: "Employees, visas, trade licenses", category: "HR & PRO" },
  { key: "mod_logistics", label: "Logistics & Fleet", description: "Fleet, drivers, trips", category: "Logistics" },
  { key: "mod_real_estate", label: "Real Estate", description: "Properties, leases, utilities", category: "Real Estate" },
  { key: "mod_construction", label: "Construction", description: "Projects, BOQ, subcontractors", category: "Construction" },
  { key: "mod_ecommerce", label: "E-Commerce & API", description: "Online orders, integrations", category: "E-Commerce" },
  { key: "mod_bi", label: "Business Intelligence", description: "Executive dashboards, reports", category: "BI" },
  { key: "mod_documents", label: "Documents & Audit", description: "Document management, audit trail", category: "Documents" },
  { key: "mod_ai", label: "AI Features", description: "Chatbot, forecasting badges", category: "AI" },
  { key: "feat_customer_portal", label: "Customer Portal", description: "External customer self-service", category: "Sales & CRM" },
  { key: "feat_e_invoicing", label: "E-Invoicing (FTA)", description: "UAE FTA e-invoicing integration", category: "Compliance" },
  { key: "feat_batch_tracking", label: "Batch/Lot Tracking", description: "Batch-managed inventory items", category: "Inventory" },
  {
    key: "feat_below_cost_warning",
    label: "Below-cost sale warning",
    description: "Warn when selling below item purchase (cost) price on quotations, orders, and invoices",
    category: "Sales & CRM",
  },
];

export function getDefaultFeatureFlags(companyId: string): FeatureFlag[] {
  const company = companies.find((c) => c.id === companyId);
  const businessLines = (company?.business_lines ?? ["trading"]) as BusinessLine[];
  return buildDefaultFeatureFlags(companyId, businessLines);
}

export const featureFlagDefs = flagDefs;
