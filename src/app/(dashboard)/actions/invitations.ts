"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { getAppUrl } from "@/lib/app-url";
import {
  createInvitationSchema,
  type CreateInvitationResult,
  type RevokeInvitationResult,
} from "@/lib/validations/invitation";

/**
 * Server action to create a new invitation.
 * - OWNER can invite ADMIN, CARETAKER, TENANT
 * - ADMIN can invite CARETAKER, TENANT only
 * - Raw token is never persisted; only SHA-256 hash is saved
 */
export async function createInvitation(data: unknown): Promise<CreateInvitationResult> {
  const user = await requireRole(["OWNER", "ADMIN"]);

  const parsed = createInvitationSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please correct the errors in the form.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, role, propertyId, unitId } = parsed.data;

  // Role restrictions: Nobody can invite OWNER
  if ((role as string) === "OWNER") {
    return {
      success: false,
      error: "Nobody can invite users with the Owner role.",
    };
  }

  // Authorization role-tier enforcement: Only OWNER can invite ADMIN
  if (role === "ADMIN" && user.activeRole !== "OWNER") {
    return {
      success: false,
      error: "Only owners can invite administrators.",
    };
  }

  // Check if an account already exists with this email and already holds the role
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true, roles: true },
  });

  if (existingUser && existingUser.roles.includes(role)) {
    return {
      success: false,
      error: `A user with this email address already holds the ${role} role.`,
    };
  }

  // Check if an active pending invitation exists for this email and role
  const existingPending = await prisma.invitation.findFirst({
    where: {
      email,
      role,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });

  if (existingPending) {
    return {
      success: false,
      error: `An active pending invitation for this email address with role ${role} already exists.`,
    };
  }

  // Generate 32-byte secure random token and its SHA-256 hash
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  // Expires in 7 days
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  try {
    const invitation = await prisma.invitation.create({
      data: {
        email,
        role,
        token: hashedToken,
        propertyId: propertyId || null,
        unitId: unitId || null,
        invitedById: user.id,
        status: "PENDING",
        expiresAt,
      },
    });

    await logActivity({
      actorId: user.id,
      action: "INVITATION_CREATED",
      entityType: "Invitation",
      entityId: invitation.id,
      metadata: {
        email,
        role,
        propertyId: propertyId || undefined,
        unitId: unitId || undefined,
      },
    });

    const baseUrl = getAppUrl();
    const inviteLink = `${baseUrl}/accept-invite?token=${rawToken}`;

    revalidatePath("/owner/invitations");
    revalidatePath("/admin/invitations");

    return {
      success: true,
      inviteLink,
    };
  } catch (error) {
    console.error("Failed to create invitation:", error);
    return {
      success: false,
      error: "An error occurred while creating the invitation.",
    };
  }
}

/**
 * Server action to revoke an existing invitation.
 */
export async function revokeInvitation(invitationId: string): Promise<RevokeInvitationResult> {
  const user = await requireRole(["OWNER", "ADMIN"]);

  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) {
    return {
      success: false,
      error: "Invitation not found.",
    };
  }

  if (invitation.status === "ACCEPTED") {
    return {
      success: false,
      error: "Cannot revoke an invitation that has already been accepted.",
    };
  }

  if (invitation.status === "REVOKED") {
    return {
      success: false,
      error: "This invitation is already revoked.",
    };
  }

  try {
    await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: "REVOKED" },
    });

    await logActivity({
      actorId: user.id,
      action: "INVITATION_REVOKED",
      entityType: "Invitation",
      entityId: invitationId,
      metadata: { email: invitation.email, role: invitation.role },
    });

    revalidatePath("/owner/invitations");
    revalidatePath("/admin/invitations");

    return { success: true };
  } catch (error) {
    console.error("Failed to revoke invitation:", error);
    return {
      success: false,
      error: "Failed to revoke invitation. Please try again.",
    };
  }
}

