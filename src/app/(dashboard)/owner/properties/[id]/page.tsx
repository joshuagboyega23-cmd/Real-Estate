import { notFound } from "next/navigation";
import { requireRole, assertCanAccessProperty } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  PropertyDetailsView,
  type SerializedPropertyDetails,
} from "@/components/dashboard/property-details-view";

export const dynamic = "force-dynamic";

interface OwnerPropertyPageProps {
  params: Promise<{ id: string }>;
}

export default async function OwnerPropertyPage(props: OwnerPropertyPageProps) {
  const { id } = await props.params;
  const user = await requireRole(["OWNER"]);
  await assertCanAccessProperty(user, id);

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      owner: { select: { name: true, email: true } },
      units: {
        orderBy: { name: "asc" },
      },
      caretakers: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!property) {
    notFound();
  }

  const serialized: SerializedPropertyDetails = {
    id: property.id,
    name: property.name,
    slug: property.slug,
    description: property.description,
    address: property.address,
    city: property.city,
    state: property.state,
    country: property.country,
    currency: property.currency,
    amenities: property.amenities,
    images: property.images,
    isPublished: property.isPublished,
    latitude: property.latitude,
    longitude: property.longitude,
    ownerName: property.owner.name,
    ownerEmail: property.owner.email,
    caretakers: property.caretakers.map((c) => ({
      id: c.user.id,
      name: c.user.name,
      email: c.user.email,
    })),
    units: property.units.map((u) => ({
      id: u.id,
      name: u.name,
      description: u.description,
      bedrooms: u.bedrooms,
      bathrooms: u.bathrooms,
      rentAmount: u.rentAmount,
      rentPeriod: u.rentPeriod,
      status: u.status,
      features: u.features,
      images: u.images,
    })),
  };

  return (
    <PropertyDetailsView
      property={serialized}
      basePath="/owner/properties"
      canManage={true}
    />
  );
}

