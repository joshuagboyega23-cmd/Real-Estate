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
  const userRole = req.auth?.user?.role;
  const pathname = nextUrl.pathname;

  const roleHome = userRole && roleHomeMap[userRole] ? roleHomeMap[userRole] : "/login";

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

  // Unauthenticated users hitting /owner, /tenant, /caretaker or /admin are redirected to /login
  if (!isLoggedIn && isDashboardRoute) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Each role may only access its own area; anyone entering another role's area is redirected to their own
  if (isLoggedIn && userRole) {
    if (pathname.startsWith("/owner") && userRole !== "OWNER") {
      return NextResponse.redirect(new URL(roleHome, nextUrl));
    }
    if (pathname.startsWith("/tenant") && userRole !== "TENANT") {
      return NextResponse.redirect(new URL(roleHome, nextUrl));
    }
    if (pathname.startsWith("/caretaker") && userRole !== "CARETAKER") {
      return NextResponse.redirect(new URL(roleHome, nextUrl));
    }
    if (pathname.startsWith("/admin") && userRole !== "ADMIN") {
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

