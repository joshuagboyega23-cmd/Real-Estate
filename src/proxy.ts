import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const roleHomeMap: Record<string, string> = {
  OWNER: "/owner",
  TENANT: "/tenant",
  CARETAKER: "/caretaker",
  ADMIN: "/admin",
};

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const activeRole = req.auth?.user?.activeRole;
  const pathname = nextUrl.pathname;

  const roleHome = activeRole && roleHomeMap[activeRole] ? roleHomeMap[activeRole] : "/login";

  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isDashboardRoute =
    pathname.startsWith("/owner") ||
    pathname.startsWith("/tenant") ||
    pathname.startsWith("/caretaker") ||
    pathname.startsWith("/admin");

  // Logged-in users visiting /login or /register are redirected to their own area
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL(roleHome, nextUrl));
  }

  // Unauthenticated users hitting dashboard routes are redirected to /login
  if (!isLoggedIn && isDashboardRoute) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Each role may only access its own active area; visiting another redirects to active role home
  if (isLoggedIn && activeRole) {
    if (pathname.startsWith("/owner") && activeRole !== "OWNER") {
      return NextResponse.redirect(new URL(roleHome, nextUrl));
    }
    if (pathname.startsWith("/tenant") && activeRole !== "TENANT") {
      return NextResponse.redirect(new URL(roleHome, nextUrl));
    }
    if (pathname.startsWith("/caretaker") && activeRole !== "CARETAKER") {
      return NextResponse.redirect(new URL(roleHome, nextUrl));
    }
    if (pathname.startsWith("/admin") && activeRole !== "ADMIN") {
      return NextResponse.redirect(new URL(roleHome, nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
