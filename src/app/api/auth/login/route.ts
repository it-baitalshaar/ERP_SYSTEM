import { NextResponse } from "next/server";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { authenticateUser } from "@/lib/server/users";
import { createAdminClientOrNull } from "@/utils/supabase/admin";
import { mockAuthenticate } from "@/lib/server/mock-auth";

export async function POST(request: Request) {
  try {
    const { email, password } = (await request.json()) as { email?: string; password?: string };
    if (!email?.trim() || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const db = createAdminClientOrNull();
    let session = db ? await authenticateUser(email, password) : null;

    // Dev fallback when service role key is not configured
    if (!session && !db) {
      session = mockAuthenticate(email, password);
    }

    if (!session) {
      const hint = db
        ? "Check email/password, run migration 0003_admin_auth.sql, then pnpm run seed:users"
        : "Add SUPABASE_SERVICE_ROLE_KEY to .env.local and seed users, or restart dev server after pulling latest code";
      return NextResponse.json(
        { error: `Invalid email or password. ${hint}` },
        { status: 401 }
      );
    }

    const token = await createSessionToken({
      sub: session.user.id,
      email: session.user.email,
      role_id: session.user.role_id,
    });

    const response = NextResponse.json({ session });
    setSessionCookie(response, token);
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
