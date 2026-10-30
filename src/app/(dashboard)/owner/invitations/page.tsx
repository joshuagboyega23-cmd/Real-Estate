import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  InvitationsView,
  type SerializedInvitation,
  type PropertyOption,
} from "@/components/dashboard/invitations-view";

export const instant = false;

export default async function OwnerInvitationsPage() {
  const user = await requireRole(["OWNER"]);

  const [invitationsData, propertiesData] = await Promise.all([
    prisma.invitation.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        property: { select: { name: true } },
        unit: { select: { name: true } },
      },
    }),
    prisma.property.findMany({
      where: { ownerId: user.id },
      select: {
        id: true,
        name: true,
        units: { select: { id: true, name: true } },
      },
    }),
  ]);

  const invitations: SerializedInvitation[] = invitationsData.map((inv) => ({
    id: inv.id,
    email: inv.email,
    role: inv.role,
    status: inv.status,
    expiresAt: inv.expiresAt.toISOString(),
    createdAt: inv.createdAt.toISOString(),
    propertyName: inv.property?.name,
    unitName: inv.unit?.name,
  }));

  const properties: PropertyOption[] = propertiesData.map((p) => ({
    id: p.id,
    name: p.name,
    units: p.units.map((u) => ({ id: u.id, name: u.name })),
  }));

  return (
    <InvitationsView
      currentUserRole={user.role}
      invitations={invitations}
      properties={properties}
    />
  );
}

