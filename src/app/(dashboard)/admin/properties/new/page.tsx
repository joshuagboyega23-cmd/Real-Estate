import { requireRole } from "@/lib/permissions";
import { PropertyForm } from "@/components/dashboard/property-form";

export const dynamic = "force-dynamic";

export default async function AdminNewPropertyPage() {
  await requireRole(["ADMIN"]);

  return <PropertyForm backHref="/admin/properties" />;
}

