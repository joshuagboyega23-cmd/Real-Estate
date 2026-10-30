import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/generated/prisma/client";

export const roleHomeMap: Record<Role, string> = {
  OWNER: "/owner",
  TENANT: "/tenant",
  CARETAKER: "/caretaker",
  ADMIN: "/admin",
};

/**
 * Returns the currently authenticated user from the session,
 * or redirects to /login if unauthenticated.
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user || !session.user.id) {
    redirect("/login");
  }
  return session.user;
}

/**
 * Validates that the authenticated user possesses one of the allowed roles.
 * If not authorized, redirects to the user's designated home dashboard area.
 */
export async function requireRole(allowedRoles: Role[]) {
  const user = await requireUser();
  if (!allowedRoles.includes(user.role)) {
    const ownArea = roleHomeMap[user.role] || "/login";
    redirect(ownArea);
  }
  return user;
}

/**
 * Checks whether a user can access a specific property:
 * - ADMIN can access any property
 * - OWNER can access properties they own
 * - CARETAKER can access properties they are assigned to
 */
export async function canAccessProperty(
  user: { id: string; role: Role },
  propertyId: string
): Promise<boolean> {
  if (user.role === "ADMIN") {
    return true;
  }
  if (user.role === "OWNER") {
    const property = await prisma.property.findFirst({
      where: { id: propertyId, ownerId: user.id },
      select: { id: true },
    });
    return !!property;
  }
  if (user.role === "CARETAKER") {
    const assignment = await prisma.propertyCaretaker.findUnique({
      where: {
        propertyId_userId: {
          propertyId,
          userId: user.id,
        },
      },
      select: { id: true },
    });
    return !!assignment;
  }
  return false;
}

/**
 * Asserts property access permission.
 * Redirects to the user's dashboard area if access is denied.
 */
export async function assertCanAccessProperty(
  user: { id: string; role: Role },
  propertyId: string
): Promise<void> {
  const allowed = await canAccessProperty(user, propertyId);
  if (!allowed) {
    const ownArea = roleHomeMap[user.role] || "/login";
    redirect(ownArea);
  }
}

