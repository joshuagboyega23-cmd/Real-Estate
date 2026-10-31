import { requireRole } from "@/lib/permissions";
import { PropertyForm } from "@/components/dashboard/property-form";

export const dynamic = "force-dynamic";

export default async function OwnerNewPropertyPage() {
  await requireRole(["OWNER"]);

  return <PropertyForm backHref="/owner/properties" />;
}

