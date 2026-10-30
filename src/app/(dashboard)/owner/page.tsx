import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, DoorOpen, Home, CreditCard, Wrench, Plus } from "lucide-react";

export const instant = false;

export default async function OwnerOverviewPage() {
  const user = await requireRole(["OWNER"]);

  const [totalProperties, totalUnits, vacantUnits] = await Promise.all([
    prisma.property.count({ where: { ownerId: user.id } }),
    prisma.unit.count({ where: { property: { ownerId: user.id } } }),
    prisma.unit.count({ where: { property: { ownerId: user.id }, status: "VACANT" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Welcome, {user.name || "Owner"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Here is an overview of your property portfolio and current status.
          </p>
        </div>
        <Button asChild>
          <Link href="/owner/properties/new">
            <Plus className="mr-2 size-4" />
            Add Property
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Building2 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProperties}</div>
            <CardDescription className="text-xs mt-1">
              {totalProperties === 0 ? "No properties yet" : `${totalProperties} managed properties`}
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
            <DoorOpen className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUnits}</div>
            <CardDescription className="text-xs mt-1">
              Across all owned properties
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vacant Units</CardTitle>
            <Home className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vacantUnits}</div>
            <CardDescription className="text-xs mt-1">
              Available for immediate leasing
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rent & Revenue</CardTitle>
            <CreditCard className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">--</div>
            <CardDescription className="text-xs mt-1">
              Rent collection and tracking coming soon
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Requests</CardTitle>
            <Wrench className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">--</div>
            <CardDescription className="text-xs mt-1">
              Maintenance dispatch and logs coming soon
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
