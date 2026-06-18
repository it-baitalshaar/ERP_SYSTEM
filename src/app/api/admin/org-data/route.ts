import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth/session";
import {
  deleteBranch,
  exportOrgData,
  resetOrgData,
  restoreOrgData,
} from "@/lib/server/org-data-lifecycle";
import type { OrgDataScope } from "@/lib/org-data-backup";
import { loadOrgStructure } from "@/lib/server/org-structure";
import { buildSessionForUserId, isAdminRole } from "@/lib/server/users";
import { createAdminClientOrNull } from "@/utils/supabase/admin";

async function requireAdmin() {
  const token = await getSessionFromCookies();
  if (!token || !isAdminRole(token.role_id)) {
    throw new Error("Forbidden");
  }
  return token;
}

function parseScope(value: unknown): OrgDataScope {
  if (value === "unit" || value === "branch" || value === "warehouse") return value;
  throw new Error("Invalid scope");
}

export async function POST(request: Request) {
  try {
    const token = await requireAdmin();
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action ?? "");

    const db = createAdminClientOrNull();
    if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

    if (action === "export") {
      const scope = parseScope(body.scope);
      const entity_id = String(body.entity_id ?? "");
      if (!entity_id) {
        return NextResponse.json({ error: "entity_id required" }, { status: 400 });
      }

      const backup = await exportOrgData(db, token.sub, scope, entity_id);
      return NextResponse.json({ backup });
    }

    if (action === "reset") {
      const scope = parseScope(body.scope);
      const entity_id = String(body.entity_id ?? "");
      const confirm_name = String(body.confirm_name ?? "");

      if (!entity_id || !confirm_name) {
        return NextResponse.json(
          { error: "entity_id and confirm_name are required" },
          { status: 400 }
        );
      }

      const { backup, organization_id } = await resetOrgData(db, token.sub, {
        scope,
        entity_id,
        confirm_name,
      });

      const structure = await loadOrgStructure(db, organization_id);
      const session = await buildSessionForUserId(token.sub);

      return NextResponse.json({ ...structure, session, backup });
    }

    if (action === "restore") {
      const target_id = String(body.target_id ?? "");
      const confirm_name = String(body.confirm_name ?? "");
      const backup = body.backup;

      if (!target_id || !confirm_name || !backup) {
        return NextResponse.json(
          { error: "target_id, confirm_name, and backup are required" },
          { status: 400 }
        );
      }

      const result = await restoreOrgData(db, token.sub, {
        target_id,
        confirm_name,
        backup,
      });

      const structure = await loadOrgStructure(db, result.organization_id);
      const session = await buildSessionForUserId(token.sub);

      return NextResponse.json({ ...structure, session, backup: result.backup });
    }

    if (action === "delete") {
      const scope = parseScope(body.scope);
      if (scope !== "branch") {
        return NextResponse.json({ error: "Only branch deletion is supported here" }, { status: 400 });
      }

      const branch_id = String(body.entity_id ?? "");
      const confirm_name = String(body.confirm_name ?? "");
      const transfer_to_branch_id = body.transfer_to_branch_id
        ? String(body.transfer_to_branch_id)
        : undefined;

      if (!branch_id || !confirm_name) {
        return NextResponse.json(
          { error: "entity_id and confirm_name are required" },
          { status: 400 }
        );
      }

      const { backup, organization_id } = await deleteBranch(db, token.sub, {
        branch_id,
        confirm_name,
        transfer_to_branch_id,
      });

      const structure = await loadOrgStructure(db, organization_id);
      const session = await buildSessionForUserId(token.sub);

      return NextResponse.json({ ...structure, session, backup });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed";
    const status = message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
