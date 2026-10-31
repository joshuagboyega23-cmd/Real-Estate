"use server";

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth, signIn, unstable_update } from "@/auth";
import { logActivity } from "@/lib/activity";
import { roleHomeMap } from "@/lib/permissions";
import { checkLoginRateLimit } from "@/lib/rate-limit";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import {
  acceptInviteSchema,
  acceptInviteExistingSchema,
  type AcceptInviteResult,
} from "@/lib/validations/invitation";

/**
 * Server action to accept an invitation for a NEW user.
 */
export async function acceptInviteAction(data: unknown): Promise<AcceptInviteResult> {
  const parsed = acceptInviteSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please correct the form errors.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { token, name, password } = parsed.data;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  try {
    const { user, role } = await prisma.$transaction(async (tx) => {
      const invitation = await tx.invitation.findUnique({
        where: { token: hashedToken },
      });

      if (!invitation) {
        throw new Error("Invalid or unverified invitation link.");
      }

      if (invitation.status === "ACCEPTED") {
        throw new Error("This invitation has already been accepted.");
      }

      if (invitation.status === "REVOKED") {
        throw new Error("This invitation has been revoked.");
      }

      if (invitation.status === "EXPIRED" || new Date() > invitation.expiresAt) {
        throw new Error("This invitation has expired.");
      }

      const existingUser = await tx.user.findUnique({
        where: { email: invitation.email },
      });
      if (existingUser) {
        throw new Error("An account with this email address already exists. Please use the existing account form.");
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const newUser = await tx.user.create({
        data: {
          name,
          email: invitation.email,
          passwordHash,
          roles: [invitation.role],
          lastActiveRole: invitation.role,
          isActive: true,
        },
      });

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" },
      });

      if (invitation.role === "CARETAKER" && invitation.propertyId) {
        await tx.propertyCaretaker.create({
          data: {
            propertyId: invitation.propertyId,
            userId: newUser.id,
          },
        });
      }

      return { user: newUser, role: invitation.role };
    });

    await logActivity({
      actorId: user.id,
      action: "INVITE_ACCEPTED",
      entityType: "Invitation",
      entityId: user.id,
      metadata: { email: user.email, role: user.lastActiveRole },
    });

    const redirectTo = roleHomeMap[role] || "/login";

    await signIn("credentials", {
      email: user.email,
      password,
      redirectTo,
    });

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    const message =
      error instanceof Error
        ? error.message
        : "Failed to accept invitation. Please try again.";
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Server action to accept an invitation for an EXISTING user account.
 * Handles both already-authenticated visitors (1-click) and unauthenticated visitors (password-validated).
 */
export async function acceptInviteExistingAction(data: unknown): Promise<AcceptInviteResult> {
  const parsed = acceptInviteExistingSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid request data.",
    };
  }

  const { token, password } = parsed.data;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const invitation = await prisma.invitation.findUnique({
    where: { token: hashedToken },
  });

  if (!invitation) {
    return { success: false, error: "Invalid or unverified invitation link." };
  }

  if (invitation.status === "ACCEPTED") {
    return { success: false, error: "This invitation has already been accepted." };
  }

  if (invitation.status === "REVOKED") {
    return { success: false, error: "This invitation has been revoked." };
  }

  if (invitation.status === "EXPIRED" || new Date() > invitation.expiresAt) {
    return { success: false, error: "This invitation has expired." };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: invitation.email },
  });

  if (!existingUser) {
    return { success: false, error: "No existing account found for this invitation email." };
  }

  const session = await auth();
  const isAlreadyLoggedIn =
    session?.user?.email?.toLowerCase() === existingUser.email.toLowerCase();

  // If not already logged in, verify existing password with rate limiting
  if (!isAlreadyLoggedIn) {
    if (!password) {
      return { success: false, error: "Please enter your password to confirm." };
    }

    const headersList = await headers();
    const forwarded = headersList.get("x-forwarded-for");
    const realIp = headersList.get("x-real-ip");
    const clientIp = forwarded ? forwarded.split(",")[0].trim() : (realIp || "unknown");

    const rateLimit = checkLoginRateLimit(existingUser.email, clientIp);
    if (!rateLimit.success) {
      return { success: false, error: "Too many login attempts. Please try again in 15 minutes." };
    }

    if (!existingUser.passwordHash) {
      return { success: false, error: "Account cannot be authenticated via password." };
    }

    const passwordsMatch = await bcrypt.compare(password, existingUser.passwordHash);
    if (!passwordsMatch) {
      return { success: false, error: "Incorrect password." };
    }
  }

  const redirectTo = roleHomeMap[invitation.role] || "/login";

  try {
    const updatedRoles = existingUser.roles.includes(invitation.role)
      ? existingUser.roles
      : [...existingUser.roles, invitation.role];

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: existingUser.id },
        data: {
          roles: updatedRoles,
          lastActiveRole: invitation.role,
        },
      });

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" },
      });

      if (invitation.role === "CARETAKER" && invitation.propertyId) {
        await tx.propertyCaretaker.upsert({
          where: {
            propertyId_userId: {
              propertyId: invitation.propertyId,
              userId: existingUser.id,
            },
          },
          update: {},
          create: {
            propertyId: invitation.propertyId,
            userId: existingUser.id,
          },
        });
      }
    });

    await logActivity({
      actorId: existingUser.id,
      action: "ROLE_ADDED",
      entityType: "User",
      entityId: existingUser.id,
      metadata: { role: invitation.role, email: existingUser.email },
    });

    await logActivity({
      actorId: existingUser.id,
      action: "INVITE_ACCEPTED",
      entityType: "Invitation",
      entityId: existingUser.id,
      metadata: { role: invitation.role, email: existingUser.email },
    });

    if (isAlreadyLoggedIn) {
      await unstable_update({
        user: {
          activeRole: invitation.role,
          roles: updatedRoles,
        },
      });
      redirect(redirectTo);
    } else if (password) {
      await signIn("credentials", {
        email: existingUser.email,
        password,
        redirectTo,
      });
    }

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    const message =
      error instanceof Error ? error.message : "Failed to accept invitation.";
    return { success: false, error: message };
  }
}
