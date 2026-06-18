import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth/session";
import { createAdminClientOrNull } from "@/utils/supabase/admin";
import { isAdminRole, buildSessionForUserId } from "@/lib/server/users";

export async function GET() {
  const token = await getSessionFromCookies();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await buildSessionForUserId(token.sub);
  if (!session) return NextResponse.json({ companies: [] });

  return NextResponse.json({ companies: session.companies });
}

export async function PATCH(request: Request) {
  const token = await getSessionFromCookies();
  if (!token || !isAdminRole(token.role_id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { companyId, name } = (await request.json()) as { companyId?: string; name?: string };
  if (!companyId || !name?.trim()) {
    return NextResponse.json({ error: "companyId and name required" }, { status: 400 });
  }

  const db = createAdminClientOrNull();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const { error } = await db.from("companies").update({ name: name.trim() }).eq("id", companyId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
