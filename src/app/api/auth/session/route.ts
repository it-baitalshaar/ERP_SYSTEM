import { NextResponse } from "next/server";
import { clearSessionCookie, getSessionFromCookies } from "@/lib/auth/session";
import { buildSessionForUserId } from "@/lib/server/users";

export async function GET() {
  const tokenPayload = await getSessionFromCookies();
  if (!tokenPayload) {
    return NextResponse.json({ session: null });
  }

  const session = await buildSessionForUserId(tokenPayload.sub);
  if (!session) {
    const response = NextResponse.json({ session: null });
    clearSessionCookie(response);
    return response;
  }

  return NextResponse.json({ session });
}
