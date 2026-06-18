import { NextResponse } from "next/server";
import { needsSetup } from "@/lib/server/bootstrap";
import { createAdminClientOrNull } from "@/utils/supabase/admin";

export async function GET() {
  try {
    const databaseConfigured = !!createAdminClientOrNull();
    const setupRequired = databaseConfigured ? await needsSetup() : false;

    return NextResponse.json({
      needsSetup: setupRequired,
      databaseConfigured,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not check setup status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
