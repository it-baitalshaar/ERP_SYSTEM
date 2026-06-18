import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

export const SESSION_COOKIE = "erp_session";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

export interface SessionTokenPayload {
  sub: string;
  email: string;
  role_id: string;
}

function getSecret() {
  const secret =
    process.env.SESSION_SECRET ??
    (process.env.NODE_ENV === "development" ? "erp-dev-session-secret-change-me" : null);
  if (!secret) {
    throw new Error("SESSION_SECRET is not set in environment variables");
  }
  return new TextEncoder().encode(secret);
}

/** Edge-safe verify — returns null if secret missing or token invalid */
export async function verifySessionTokenSafe(token: string): Promise<SessionTokenPayload | null> {
  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function createSessionToken(payload: SessionTokenPayload): Promise<string> {
  return new SignJWT({ email: payload.email, role_id: payload.role_id })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SEC}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const sub = payload.sub;
    if (!sub || typeof sub !== "string") return null;
    return {
      sub,
      email: String(payload.email ?? ""),
      role_id: String(payload.role_id ?? "role-auditor"),
    };
  } catch {
    return null;
  }
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionFromCookies(): Promise<SessionTokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getSessionFromRequest(request: NextRequest): Promise<SessionTokenPayload | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
