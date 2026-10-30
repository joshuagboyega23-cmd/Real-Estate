"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { signIn } from "@/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import {
  registerSchema,
  type RegisterResult,
} from "@/lib/validations/auth";

/**
 * Checks whether registration is currently open.
 * Registration is only open if there are 0 users in the system.
 */
export async function isRegistrationOpen(): Promise<boolean> {
  const count = await prisma.user.count();
  return count === 0;
}

/**
 * Server action to register the initial owner account.
 * Closes registration once the first user is created.
 */
export async function registerAction(data: unknown): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the validation errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = parsed.data;

  try {
    const user = await prisma.$transaction(async (tx) => {
      const existingUserCount = await tx.user.count();
      if (existingUserCount > 0) {
        throw new Error("Registration is by invitation only.");
      }

      const passwordHash = await bcrypt.hash(password, 12);

      return await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: "OWNER",
          isActive: true,
        },
      });
    });

    await logActivity({
      actorId: user.id,
      action: "USER_REGISTERED",
      entityType: "User",
      entityId: user.id,
      metadata: { role: "OWNER", email: user.email },
    });

    // Sign the newly registered owner in and redirect to /owner
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/owner",
    });

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    const message =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred during registration.";
    return {
      success: false,
      error: message,
    };
  }
}
