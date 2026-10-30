import { cache } from "react";
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
 * Request-cached retrieval of user roles and active status from the database.
 */
export const getDbUser = cache(async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, roles: true, lastActiveRole: true, isActive: true },
  });
});

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
 * Validates that the authenticated user possesses one of the allowed roles,
 * confirms against the database (request-cached), and ensures active status.
 */
export async function requireRole(allowedRoles: Role[]) {
  const user = await requireUser();
  const dbUser = await getDbUser(user.id);

  if (!dbUser || !dbUser.isActive) {
    redirect("/login");
  }

  const activeRole = user.activeRole;
  if (!dbUser.roles.includes(activeRole) || !allowedRoles.includes(activeRole)) {
    const matchingRole = allowedRoles.find((r) => dbUser.roles.includes(r));
    if (matchingRole) {
      redirect(roleHomeMap[matchingRole] || "/login");
    }
    const ownArea = roleHomeMap[activeRole] || "/login";
    redirect(ownArea);
  }

  return {
    ...user,
    roles: dbUser.roles,
    activeRole,
  };
}

/**
 * Checks whether a user can access a specific property:
 * - ADMIN can access any property
 * - OWNER can access properties they own
 * - CARETAKER can access properties they are assigned to
 */
export async function canAccessProperty(
  user: { id: string; activeRole?: Role; role?: Role; roles?: Role[] },
  propertyId: string
): Promise<boolean> {
  const currentRole = user.activeRole || user.role;
  if (currentRole === "ADMIN") {
    return true;
  }
  if (currentRole === "OWNER") {
    const property = await prisma.property.findFirst({
      where: { id: propertyId, ownerId: user.id },
      select: { id: true },
    });
    return !!property;
  }
  if (currentRole === "CARETAKER") {
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
  user: { id: string; activeRole?: Role; role?: Role; roles?: Role[] },
  propertyId: string
): Promise<void> {
  const allowed = await canAccessProperty(user, propertyId);
  if (!allowed) {
    const currentRole = user.activeRole || user.role || "TENANT";
    const ownArea = roleHomeMap[currentRole] || "/login";
    redirect(ownArea);
  }
}
