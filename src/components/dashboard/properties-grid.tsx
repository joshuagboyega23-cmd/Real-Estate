import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, DoorOpen, Home, Plus, Eye, EyeOff } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Reveal } from "@/components/landing/motion";

export interface DashboardPropertyCard {
  id: string;
  name: string;
  city: string;
  state?: string | null;
  country: string;
  currency: string;
  isPublished: boolean;
  coverImage?: string | null;
  totalUnits: number;
  vacantUnits: number;
}

interface PropertiesGridProps {
  properties: DashboardPropertyCard[];
  basePath: string; // "/owner/properties" or "/admin/properties"
  canAdd: boolean;
}

export function PropertiesGrid({ properties, basePath, canAdd }: PropertiesGridProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Properties"
        description={
          properties.length === 0
            ? "No properties yet. Add your first one."
            : `${properties.length} propert${properties.length === 1 ? "y" : "ies"} managed`
        }
        actions={canAdd ? (
          <Button asChild>
            <Link href={`${basePath}/new`}>
              <Plus className="mr-2 size-4" />
              Add Property
            </Link>
          </Button>
        ) : undefined}
      />

      {properties.length === 0 ? (
        <EmptyState
          icon="building"
          title="No properties yet"
          description="Add your first property to get started."
          className="py-16"
          action={canAdd ? (
            <Button asChild>
              <Link href={`${basePath}/new`}>
                <Plus className="mr-2 size-4" />
                Add Property
              </Link>
            </Button>
          ) : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property, index) => {
            const vacancyPercent = property.totalUnits > 0
              ? (property.vacantUnits / property.totalUnits) * 100
              : 0;
            return (
              <Reveal key={property.id} delay={Math.min(index * 50, 250)} className="h-full dashboard-reveal">
                <Link
                  href={`${basePath}/${property.id}`}
                  className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Card className="h-full overflow-hidden rounded-2xl border-border/80 shadow-[0_8px_24px_rgb(31_95_191_/_7%)] transition-[transform,box-shadow] duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_14px_30px_rgb(31_95_191_/_13%)]">
                    <div className="relative aspect-[16/10] overflow-hidden bg-sky">
                      {property.coverImage ? (
                        <Image
                          src={property.coverImage}
                          alt={`${property.name} cover`}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center">
                          <Building2 className="size-12 text-muted-foreground/40" aria-hidden="true" />
                        </div>
                      )}
                      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-navy/70 to-transparent" />
                      <Badge className={`absolute right-3 top-3 gap-1 border-0 ${property.isPublished ? "bg-success text-white" : "bg-white/95 text-muted-foreground"}`}>
                        {property.isPublished ? <Eye className="size-3" aria-hidden="true" /> : <EyeOff className="size-3" aria-hidden="true" />}
                        {property.isPublished ? "Published" : "Draft"}
                      </Badge>
                      <span className="absolute bottom-3 left-4 text-sm font-semibold text-white">
                        {property.city}{property.state ? `, ${property.state}` : ""}
                      </span>
                    </div>
                    <CardContent className="space-y-3 p-4">
                      <div>
                        <h2 className="line-clamp-1 font-bold text-navy transition-colors group-hover:text-primary">{property.name}</h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">{property.city}{property.state ? `, ${property.state}` : ""} · {property.country}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="gap-1.5 rounded-full bg-sky px-2.5 text-navy">
                          <DoorOpen className="size-3.5" aria-hidden="true" />
                          {property.totalUnits} {property.totalUnits === 1 ? "unit" : "units"}
                        </Badge>
                        <Badge variant="secondary" className="gap-1.5 rounded-full bg-success/10 px-2.5 text-success">
                          <Home className="size-3.5" aria-hidden="true" />
                          {property.vacantUnits} vacant
                        </Badge>
                      </div>
                      {property.totalUnits > 0 && (
                        <div
                          className="h-1.5 overflow-hidden rounded-full bg-sky"
                          role="img"
                          aria-label={`${property.vacantUnits} of ${property.totalUnits} units vacant`}
                        >
                          <div className="h-full rounded-full bg-success transition-[width] duration-200" style={{ width: `${vacancyPercent}%` }} />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
