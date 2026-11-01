import { requireRole } from "@/lib/permissions";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Building2, CreditCard, Wrench } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TenantOverviewPage() {
  const user = await requireRole(["TENANT"]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Welcome, {user.name || "Tenant"}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your personal tenant portal for unit details, payments, and requests.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Unit</CardTitle>
            <Building2 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">None</div>
            <CardDescription className="text-xs mt-1">
              You are not currently linked to an active lease or property unit.
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Rent</CardTitle>
            <CreditCard className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
            <CardDescription className="text-xs mt-1">
              No rent payments currently due.
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Wrench className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <CardDescription className="text-xs mt-1">
              No pending maintenance tickets submitted.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
