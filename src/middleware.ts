import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/admin",
  "/super-admin",
  "/expediteur",
  "/livreur",
  "/client",
] as const;

const USE_MOCK =
  process.env.NEXT_PUBLIC_USE_MOCK === "true" ||
  process.env.NEXT_PUBLIC_USE_MOCK === "1";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsAuth = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (!needsAuth) return NextResponse.next();

  if (USE_MOCK) return NextResponse.next();

  const hasSessionHint = request.cookies.get("umbrella_auth")?.value === "1";
  if (hasSessionHint) return NextResponse.next();

  const login = new URL("/login", request.url);
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/super-admin/:path*",
    "/expediteur/:path*",
    "/livreur/:path*",
    "/client/:path*",
  ],
};
