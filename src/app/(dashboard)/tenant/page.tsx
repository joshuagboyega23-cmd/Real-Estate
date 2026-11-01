import { requireRole } from "@/lib/permissions";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Greeting } from "@/components/dashboard/greeting";

export const dynamic = "force-dynamic";

export default async function TenantOverviewPage() {
  const user = await requireRole(["TENANT"]);
  const firstName = user.name?.trim().split(/\s+/)[0] || "Tenant";

  return (
    <div className="space-y-6">
      <div>
        <Greeting name={firstName} timezone={user.timezone} />
        <PageHeader title="Tenant overview" description="Your personal tenant portal for unit details, payments, and requests." />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Assigned Unit" value="--" description="You are not currently linked to an active lease or property unit." icon="building" delay={0} />
        <StatCard
          title="Upcoming Rent"
          value="--"
          description="Rent payments will appear here once online payments are enabled."
          icon="credit"
          comingSoon
          delay={50}
        />
        <StatCard title="Maintenance" value={0} description="No pending maintenance tickets submitted." icon="maintenance" delay={100} />
      </div>
    </div>
  );
}
