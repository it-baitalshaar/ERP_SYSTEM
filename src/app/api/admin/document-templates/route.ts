import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/permissions";
import { assertCompanyAccess } from "@/lib/server/sales";
import {
  getDocumentTemplateSettings,
  upsertDocumentTemplateSettings,
} from "@/lib/server/document-templates";
import type { DocumentTemplateSettings } from "@/lib/documents/template-settings";

async function requireAdmin() {
  const token = await getSessionFromCookies();
  if (!token) throw new Error("Unauthorized");
  if (!isAdminRole(token.role_id)) throw new Error("Admin access required");
  return token;
}

export async function GET(request: Request) {
  try {
    const token = await getSessionFromCookies();
    if (!token) throw new Error("Unauthorized");
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    if (!companyId) {
      return NextResponse.json({ error: "companyId required" }, { status: 400 });
    }
    await assertCompanyAccess(token.sub, companyId);

    const data = await getDocumentTemplateSettings(companyId);
    return NextResponse.json({ data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load settings";
    const status =
      message === "Unauthorized" ? 401 : message.includes("Admin") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as Partial<DocumentTemplateSettings> & {
      company_id?: string;
    };
    const companyId = String(body.company_id ?? "");
    if (!companyId) {
      return NextResponse.json({ error: "company_id required" }, { status: 400 });
    }

    const data = await upsertDocumentTemplateSettings(companyId, body);
    return NextResponse.json({ data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Save failed";
    const status =
      message === "Unauthorized" ? 401 : message.includes("Admin") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
