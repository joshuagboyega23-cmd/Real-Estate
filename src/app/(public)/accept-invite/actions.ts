"use server";

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";
import { logActivity } from "@/lib/activity";
import { roleHomeMap } from "@/lib/permissions";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import {
  acceptInviteSchema,
  type AcceptInviteResult,
} from "@/lib/validations/invitation";

/**
 * Server action to accept an invitation.
 * - Validates credentials input
 * - In a transaction: verifies invitation, creates User, marks invitation ACCEPTED,
 *   and if CARETAKER with propertyId, creates PropertyCaretaker record.
 * - Logs activity and automatically signs the user in.
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
        throw new Error("An account with this email address already exists.");
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const newUser = await tx.user.create({
        data: {
          name,
          email: invitation.email,
          passwordHash,
          role: invitation.role,
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
      metadata: { email: user.email, role: user.role },
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

