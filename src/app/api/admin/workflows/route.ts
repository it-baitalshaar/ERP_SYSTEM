import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/permissions";
import { assertCompanyAccess } from "@/lib/server/sales";
import {
  getCompanyWorkflowSettings,
  getWorkflowDefinition,
  saveCompanyWorkflowSettings,
} from "@/lib/server/workflows";
import type { WorkflowModule, WorkflowStepOverride } from "@/lib/workflows/types";

async function requireAdmin() {
  const token = await getSessionFromCookies();
  if (!token) throw new Error("Unauthorized");
  if (!isAdminRole(token.role_id)) throw new Error("Admin access required");
  return token;
}

function parseModule(raw: string | null): WorkflowModule {
  if (raw === "procurement" || raw === "sales" || raw === "inventory") return raw;
  return "procurement";
}

export async function GET(request: Request) {
  try {
    const token = await getSessionFromCookies();
    if (!token) throw new Error("Unauthorized");

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const module = parseModule(searchParams.get("module"));

    if (!companyId) {
      return NextResponse.json({ error: "companyId required" }, { status: 400 });
    }

    await assertCompanyAccess(token.sub, companyId);

    const data = await getCompanyWorkflowSettings(companyId, module);
    const definition = getWorkflowDefinition(module);

    return NextResponse.json({ data, definition });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load workflow";
    const status =
      message === "Unauthorized" ? 401 : message.includes("Admin") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as {
      company_id?: string;
      module?: WorkflowModule;
      steps?: WorkflowStepOverride[];
    };

    const companyId = String(body.company_id ?? "");
    const module = parseModule(body.module ?? "procurement");

    if (!companyId) {
      return NextResponse.json({ error: "company_id required" }, { status: 400 });
    }

    const data = await saveCompanyWorkflowSettings(
      companyId,
      module,
      body.steps ?? []
    );

    return NextResponse.json({ data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Save failed";
    const status =
      message === "Unauthorized" ? 401 : message.includes("Admin") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
