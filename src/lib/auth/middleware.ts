import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionTokenSafe } from "@/lib/auth/session";

const PUBLIC_PREFIXES = [
  "/login",
  "/forgot-password",
  "/setup",
  "/signup",
  "/api/auth/login",
  "/api/auth/forgot-password",
  "/api/auth/session",
  "/api/auth/setup",
  "/api/auth/setup-status",
  "/api/organizations",
];
const PUBLIC_EXACT = ["/"];

function isPublic(pathname: string) {
  if (PUBLIC_EXACT.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function updateAppSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionTokenSafe(token) : null;
  const isPublicRoute = isPublic(pathname);

  if (!session && !isPublicRoute) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (session && (pathname.startsWith("/login") || pathname.startsWith("/setup") || pathname.startsWith("/forgot-password"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Allow authenticated users to register additional organizations
  if (session && pathname.startsWith("/signup/organization")) {
    return NextResponse.next({ request });
  }

  return NextResponse.next({ request });
}
