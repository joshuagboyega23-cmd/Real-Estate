"use server";

import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { AuthError } from "next-auth";
import {
  loginSchema,
  type LoginResult,
} from "@/lib/validations/auth";

/**
 * Server action to authenticate credentials and redirect based on Role.
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

  // Pre-fetch role for dynamic role-based redirect
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { role: true, isActive: true },
  });

  if (!user || !user.isActive) {
    return {
      success: false,
      error: "Invalid email or password.",
    };
  }

  const roleRedirectMap: Record<string, string> = {
    OWNER: "/owner",
    TENANT: "/tenant",
    CARETAKER: "/caretaker",
    ADMIN: "/admin",
  };

  const redirectTo = roleRedirectMap[user.role] || "/owner";

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

