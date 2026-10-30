"use server";

import { requireUser, roleHomeMap } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { unstable_update } from "@/auth";
import { logActivity } from "@/lib/activity";
import { redirect } from "next/navigation";
import type { Role } from "@/generated/prisma/client";

/**
 * Server action to switch the active role for a multi-role user.
 */
export async function switchRole(newRole: Role) {
  const sessionUser = await requireUser();

  const dbUser = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, email: true, roles: true, isActive: true },
  });

  if (!dbUser || !dbUser.isActive) {
    redirect("/login");
  }

  if (!dbUser.roles.includes(newRole)) {
    throw new Error(`You do not hold the ${newRole} role.`);
  }

  await prisma.user.update({
    where: { id: dbUser.id },
    data: { lastActiveRole: newRole },
  });

  await unstable_update({
    user: {
      activeRole: newRole,
      roles: dbUser.roles,
    },
  });

  await logActivity({
    actorId: dbUser.id,
    action: "ROLE_SWITCHED",
    entityType: "User",
    entityId: dbUser.id,
    metadata: { previousRole: sessionUser.activeRole, newRole },
  });

  const destination = roleHomeMap[newRole] || "/login";
  redirect(destination);
}

