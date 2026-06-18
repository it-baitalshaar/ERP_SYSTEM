import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionTokenSafe } from "@/lib/auth/session";
import { PLATFORM_INIT_PATH } from "@/lib/auth/platform-init";

const PUBLIC_PREFIXES = [
  "/login",
  "/forgot-password",
  PLATFORM_INIT_PATH,
  "/api/auth/login",
  "/api/auth/forgot-password",
  "/api/auth/session",
  "/api/auth/setup",
  "/api/auth/setup-status",
];
const PUBLIC_EXACT = ["/"];

/** Paths that must never be discoverable — return 404. */
const DISABLED_PREFIXES = ["/setup", "/signup"];

function isPublic(pathname: string) {
  if (PUBLIC_EXACT.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function updateAppSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (DISABLED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.rewrite(new URL("/not-found", request.url));
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionTokenSafe(token) : null;
  const isPublicRoute = isPublic(pathname);
  const isPlatformInit = pathname === PLATFORM_INIT_PATH || pathname.startsWith(`${PLATFORM_INIT_PATH}/`);

  if (!session && !isPublicRoute) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (session && (pathname.startsWith("/login") || pathname.startsWith("/forgot-password"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Platform init is allowed while signed in (super admin adding organizations)
  if (session && isPlatformInit) {
    return NextResponse.next({ request });
  }

  return NextResponse.next({ request });
}
