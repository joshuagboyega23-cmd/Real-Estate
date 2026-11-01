import Link from "next/link";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Greeting } from "@/components/dashboard/greeting";
import { Reveal } from "@/components/landing/motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const user = await requireRole(["ADMIN"]);

  const [totalProperties, totalUnits, vacantUnits] = await Promise.all([
    prisma.property.count(),
    prisma.unit.count(),
    prisma.unit.count({ where: { status: "VACANT" } }),
  ]);
  const occupiedUnits = totalUnits - vacantUnits;
  const occupiedPercent = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
  const firstName = user.name?.trim().split(/\s+/)[0] || "Administrator";

  return (
    <div className="space-y-6">
      <div>
        <Greeting name={firstName} timezone={user.timezone} />
        <PageHeader
          title="Platform overview"
          description="System-wide administration overview across all properties and units."
          actions={
            <Button asChild className="min-h-10 rounded-xl">
              <Link href="/admin/properties/new"><Plus className="size-4" /> Add Property</Link>
            </Button>
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Properties" value={totalProperties} description="Active registered properties on platform" icon="building" href="/admin/properties" delay={0} />
        <StatCard title="Total Units" value={totalUnits} description="Total rental units cataloged" icon="door" href="/admin/properties" delay={50} />
        <StatCard title="Vacant Units" value={vacantUnits} description="Units currently vacant across all portfolios" icon="home" tone="green" href="/admin/properties" delay={100} />
        <StatCard title="Rent & Revenue" value="--" description="Payment gateway tracking coming soon" icon="credit" comingSoon delay={150} />
        <StatCard title="Maintenance Requests" value="--" description="Maintenance dispatch oversight coming soon" icon="maintenance" comingSoon delay={200} />
      </div>

      {totalUnits > 0 && (
        <Reveal delay={150} className="dashboard-reveal">
          <Card className="rounded-2xl border-border/80 shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-base">Occupancy summary</CardTitle></CardHeader>
            <CardContent>
              <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm">
                <span className="font-semibold text-navy">{occupiedUnits} occupied</span>
                <span className="text-muted-foreground">{vacantUnits} vacant · {totalUnits} total</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-sky" role="img" aria-label={`${occupiedUnits} of ${totalUnits} units occupied; ${vacantUnits} vacant`}>
                <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${occupiedPercent}%` }} />
              </div>
            </CardContent>
          </Card>
        </Reveal>
      )}

      <Reveal delay={200} className="dashboard-reveal">
        <Card className="rounded-2xl border-border/80 shadow-sm">
          <CardHeader><CardTitle className="text-base">Quick actions</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/admin/properties/new"><Plus className="size-4" /> Add Property</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/admin/invitations">View Invitations <ArrowRight className="size-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      </Reveal>
    </div>
  );
}
