import { NextResponse } from "next/server";
import { createAdminClientOrNull } from "@/utils/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.toLowerCase().trim();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const db = createAdminClientOrNull();
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const { data: profile } = await db
      .from("profiles")
      .select("id, email, is_active")
      .eq("email", email)
      .maybeSingle();

    if (profile?.is_active) {
      const { data: existing } = await db
        .from("password_reset_requests")
        .select("id")
        .eq("user_id", profile.id)
        .eq("status", "pending")
        .maybeSingle();

      if (!existing) {
        await db.from("password_reset_requests").insert({
          user_id: profile.id,
          email: profile.email,
          status: "pending",
        });
      }
    }

    // Always return success — do not reveal whether the email exists
    return NextResponse.json({
      ok: true,
      message:
        "If an account exists for this email, your administrator has been notified and will reset your password.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed";
    // Table may not exist yet if migration not run
    if (message.includes("password_reset_requests")) {
      return NextResponse.json(
        {
          error:
            "Password reset is not configured yet. Ask your administrator to run migration 0005_password_reset_requests.sql",
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
