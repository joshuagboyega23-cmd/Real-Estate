import { notFound } from "next/navigation";
import { requireRole, assertCanAccessProperty } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PropertyForm, type SerializedPropertyData } from "@/components/dashboard/property-form";

export const dynamic = "force-dynamic";

interface OwnerPropertyEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function OwnerPropertyEditPage(props: OwnerPropertyEditPageProps) {
  const { id } = await props.params;
  const user = await requireRole(["OWNER"]);
  await assertCanAccessProperty(user, id);

  const property = await prisma.property.findUnique({
    where: { id, ownerId: user.id },
  });

  if (!property) {
    notFound();
  }

  const initialData: SerializedPropertyData = {
    id: property.id,
    name: property.name,
    description: property.description,
    address: property.address,
    city: property.city,
    state: property.state,
    country: property.country,
    currency: property.currency,
    amenities: property.amenities,
    latitude: property.latitude,
    longitude: property.longitude,
  };

  return (
    <PropertyForm
      initialData={initialData}
      backHref={`/owner/properties/${property.id}`}
    />
  );
}
