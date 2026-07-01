import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth/session";
import {
  getFocusBatchSample,
  getFocusMigrationOverview,
  listFocusBatchSummary,
  listFocusDatabaseNames,
  listFocusImportRuns,
  listFocusRawCatalog,
} from "@/lib/server/focus-migrations";
import { isAdminRole } from "@/lib/server/users";
import { createAdminClientOrNull } from "@/utils/supabase/admin";

async function requireAdmin() {
  const token = await getSessionFromCookies();
  if (!token || !isAdminRole(token.role_id)) {
    throw new Error("Forbidden");
  }
  return token;
}

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const db = createAdminClientOrNull();
    if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

    const { searchParams } = new URL(request.url);
    const resource = searchParams.get("resource") ?? "overview";

    if (resource === "overview") {
      const overview = await getFocusMigrationOverview(db);
      return NextResponse.json(overview);
    }

    if (resource === "runs") {
      const runs = await listFocusImportRuns(db);
      return NextResponse.json({ runs });
    }

    if (resource === "catalog") {
      const database = searchParams.get("database") ?? undefined;
      const catalog = await listFocusRawCatalog(db, { database });
      return NextResponse.json({ catalog });
    }

    if (resource === "databases") {
      const databases = await listFocusDatabaseNames(db);
      return NextResponse.json({ databases });
    }

    if (resource === "batch_summary") {
      const runId = searchParams.get("run_id");
      if (!runId) {
        return NextResponse.json({ error: "run_id required" }, { status: 400 });
      }
      const summary = await listFocusBatchSummary(db, runId);
      return NextResponse.json({ summary });
    }

    if (resource === "batch_sample") {
      const runId = searchParams.get("run_id");
      const database = searchParams.get("database");
      const table = searchParams.get("table");
      const schema = searchParams.get("schema") ?? undefined;
      if (!runId || !database || !table) {
        return NextResponse.json({ error: "run_id, database, table required" }, { status: 400 });
      }
      const sample = await getFocusBatchSample(db, { runId, database, table, schema });
      return NextResponse.json({ sample });
    }

    return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed";
    const status = message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
