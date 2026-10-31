import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PropertiesGrid, type PropertyCard } from "@/components/dashboard/properties-grid";

export const dynamic = "force-dynamic";

export default async function CaretakerPropertiesPage() {
  const user = await requireRole(["CARETAKER"]);

  const properties = await prisma.property.findMany({
    where: {
      caretakers: {
        some: { userId: user.id },
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      units: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  const cards: PropertyCard[] = properties.map((p) => ({
    id: p.id,
    name: p.name,
    city: p.city,
    state: p.state,
    country: p.country,
    currency: p.currency,
    isPublished: p.isPublished,
    coverImage: p.images.length > 0 ? p.images[0] : null,
    totalUnits: p.units.length,
    vacantUnits: p.units.filter((u) => u.status === "VACANT").length,
  }));

  return (
    <PropertiesGrid
      properties={cards}
      basePath="/caretaker/properties"
      canAdd={false}
    />
  );
}

