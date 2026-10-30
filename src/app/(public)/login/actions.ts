"use server";

import { headers } from "next/headers";
import { signIn, determineActiveRole } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkLoginRateLimit } from "@/lib/rate-limit";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { AuthError } from "next-auth";
import {
  loginSchema,
  type LoginResult,
} from "@/lib/validations/auth";
import type { Role } from "@/generated/prisma/client";

const roleRedirectMap: Record<Role, string> = {
  OWNER: "/owner",
  TENANT: "/tenant",
  CARETAKER: "/caretaker",
  ADMIN: "/admin",
};

/**
 * Server action to authenticate credentials and redirect based on activeRole.
 * OWNER -> /owner, TENANT -> /tenant, CARETAKER -> /caretaker, ADMIN -> /admin
 */
export async function loginAction(data: unknown): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please enter a valid email and password.",
    };
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  // Extract client IP address for rate limiting
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");
  const clientIp = forwarded ? forwarded.split(",")[0].trim() : (realIp || "unknown");

  // Rate limiting check prior to database lookup (mitigating user enumeration / brute-force)
  const rateLimit = checkLoginRateLimit(normalizedEmail, clientIp);
  if (!rateLimit.success) {
    return {
      success: false,
      error: "Too many login attempts. Please try again in 15 minutes.",
    };
  }

  // Pre-fetch roles for dynamic role-based redirect
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { roles: true, lastActiveRole: true, isActive: true },
  });

  if (!user || !user.isActive || user.roles.length === 0) {
    return {
      success: false,
      error: "Invalid email or password.",
    };
  }

  const activeRole = determineActiveRole(user.roles, user.lastActiveRole);
  const redirectTo = roleRedirectMap[activeRole] || "/login";

  try {
    await signIn("credentials", {
      email: normalizedEmail,
      password,
      redirectTo,
    });
    return { success: true, redirectTo };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, error: "Invalid email or password." };
        default:
          return { success: false, error: "Authentication failed. Please try again." };
      }
    }
    return {
      success: false,
      error: "An unexpected error occurred during sign in.",
    };
  }
}
