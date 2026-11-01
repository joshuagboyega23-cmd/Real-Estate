import { requireRole } from "@/lib/permissions";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Greeting } from "@/components/dashboard/greeting";

export const dynamic = "force-dynamic";

export default async function CaretakerOverviewPage() {
  const user = await requireRole(["CARETAKER"]);
  const firstName = user.name?.trim().split(/\s+/)[0] || "Caretaker";

  return (
    <div className="space-y-6">
      <div>
        <Greeting name={firstName} timezone={user.timezone} />
        <PageHeader title="Caretaker overview" description="Assigned properties and task management overview." />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Assigned Properties" value={0} description="No properties assigned to your account yet." icon="building" delay={0} />
        <StatCard title="Active Leases" value="--" description="Lease management is coming soon." icon="lease" comingSoon delay={50} />
        <StatCard title="Open Maintenance Tasks" value="--" description="Maintenance task tracking is coming soon." icon="maintenance" comingSoon delay={100} />
      </div>
    </div>
  );
}
