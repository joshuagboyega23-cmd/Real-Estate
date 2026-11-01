import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { formatMoney, toMinor } from "@/lib/money";
import { site } from "@/config/site";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Building,
  DoorOpen,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Available Properties in ${site.city}`,
  description: site.tagline,
};

interface PropertiesPageProps {
  searchParams: Promise<{
    city?: string;
    bedrooms?: string;
    maxRent?: string;
    vacant?: string;
    sort?: string;
    page?: string;
  }>;
}

const PAGE_SIZE = 12;

export default async function PublicPropertiesPage(props: PropertiesPageProps) {
  const searchParams = await props.searchParams;

  const city = searchParams.city?.trim() || "";
  const bedrooms = searchParams.bedrooms ? parseInt(searchParams.bedrooms, 10) : undefined;
  const maxRent = searchParams.maxRent ? parseFloat(searchParams.maxRent) : undefined;
  const vacantOnly = searchParams.vacant === "true";
  const sort = searchParams.sort || "newest";
  const page = Math.max(1, parseInt(searchParams.page || "1", 10));

  // Build Prisma where filter
  const where: Prisma.PropertyWhereInput = {
    isPublished: true,
  };

  if (city) {
    where.OR = [
      { city: { contains: city, mode: "insensitive" } },
      { state: { contains: city, mode: "insensitive" } },
      { name: { contains: city, mode: "insensitive" } },
    ];
  }

  const unitFilter: Prisma.UnitWhereInput = {};
  if (bedrooms && !isNaN(bedrooms)) {
    unitFilter.bedrooms = { gte: bedrooms };
  }
  if (maxRent && !isNaN(maxRent)) {
    unitFilter.rentAmount = { lte: toMinor(maxRent) };
  }
  if (vacantOnly) {
    unitFilter.status = "VACANT";
  }

  if (Object.keys(unitFilter).length > 0) {
    where.units = { some: unitFilter };
  }

  const totalCount = await prisma.property.count({ where });
  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  const orderBy: Prisma.PropertyOrderByWithRelationInput =
    sort === "oldest" ? { createdAt: "asc" } : { createdAt: "desc" };

  const properties = await prisma.property.findMany({
    where,
    orderBy,
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: {
      units: {
        select: {
          id: true,
          rentAmount: true,
          status: true,
          bedrooms: true,
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <Building className="size-6 text-primary" />
            <span>{site.name}</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">Home</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Discover Residential Properties
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse verified homes and apartments available across all managed locations.
          </p>
        </div>

        {/* Filter Bar */}
        <form
          method="GET"
          action="/properties"
          className="mb-8 p-4 rounded-xl border bg-card shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
        >
          {/* City / keyword */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              name="city"
              placeholder="City, State or Name..."
              defaultValue={city}
              className="pl-9 h-10 text-sm"
            />
          </div>

          {/* Min Bedrooms */}
          <div>
            <select
              name="bedrooms"
              defaultValue={searchParams.bedrooms || ""}
              className="w-full h-10 px-3 rounded-md border bg-background text-sm text-foreground focus:outline-hidden"
            >
              <option value="">Bedrooms (Any)</option>
              <option value="1">1+ Bedrooms</option>
              <option value="2">2+ Bedrooms</option>
              <option value="3">3+ Bedrooms</option>
              <option value="4">4+ Bedrooms</option>
            </select>
          </div>

          {/* Max Rent */}
          <div>
            <Input
              name="maxRent"
              type="number"
              placeholder="Max Rent..."
              defaultValue={searchParams.maxRent || ""}
              className="h-10 text-sm"
            />
          </div>

          {/* Vacant Only checkbox / select */}
          <div>
            <select
              name="vacant"
              defaultValue={searchParams.vacant || ""}
              className="w-full h-10 px-3 rounded-md border bg-background text-sm text-foreground focus:outline-hidden"
            >
              <option value="">All Properties</option>
              <option value="true">Vacant Units Only</option>
            </select>
          </div>

          {/* Submit */}
          <div className="flex gap-2">
            <Button type="submit" className="flex-1 h-10 font-medium">
              <Filter className="size-4 mr-1.5" />
              Filter
            </Button>
            {(city || bedrooms || maxRent || vacantOnly) && (
              <Button variant="outline" className="h-10" asChild>
                <Link href="/properties">Reset</Link>
              </Button>
            )}
          </div>
        </form>

        {/* Results Count & Grid */}
        <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
          <span>
            Showing <strong>{properties.length}</strong> of <strong>{totalCount}</strong> properties
          </span>
        </div>

        {properties.length === 0 ? (
          <div className="py-20 text-center rounded-xl border border-dashed bg-muted/20">
            <Building2 className="size-12 text-muted-foreground/60 mx-auto mb-3" />
            <h3 className="text-lg font-semibold">No properties matched your criteria</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
              Try adjusting your search filters or clear all filters to see all available homes.
            </p>
            <Button variant="outline" asChild>
              <Link href="/properties">Clear All Filters</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((p) => {
              const coverImg = p.images.length > 0 ? p.images[0] : null;
              const vacantUnits = p.units.filter((u) => u.status === "VACANT");
              const minRent =
                vacantUnits.length > 0
                  ? Math.min(...vacantUnits.map((u) => u.rentAmount))
                  : p.units.length > 0
                  ? Math.min(...p.units.map((u) => u.rentAmount))
                  : null;

              return (
                <Link key={p.id} href={`/properties/${p.slug}`} className="group">
                  <Card className="overflow-hidden h-full hover:shadow-lg transition-all duration-200">
                    <div className="relative aspect-16/10 bg-muted overflow-hidden">
                      {coverImg ? (
                        <Image
                          src={coverImg}
                          alt={p.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-200"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Building2 className="size-12 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-background/90 text-foreground backdrop-blur text-xs shadow-xs">
                          {vacantUnits.length} Vacant
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-5">
                      <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-1">
                        {p.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {p.city}{p.state ? `, ${p.state}` : ""}, {p.country}
                      </p>

                      <div className="mt-4 pt-4 border-t flex items-center justify-between">
                        <div>
                          <span className="text-xs text-muted-foreground block">Rent starting</span>
                          <span className="text-base font-bold text-primary">
                            {minRent !== null
                              ? `${formatMoney(minRent, p.currency)}`
                              : "Inquire"}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <DoorOpen className="size-3.5" />
                          {p.units.length} unit{p.units.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              asChild={page > 1}
            >
              {page > 1 ? (
                <Link
                  href={{
                    pathname: "/properties",
                    query: { ...searchParams, page: String(page - 1) },
                  }}
                >
                  <ChevronLeft className="size-4 mr-1" />
                  Previous
                </Link>
              ) : (
                <span>
                  <ChevronLeft className="size-4 mr-1" />
                  Previous
                </span>
              )}
            </Button>

            <span className="text-sm text-muted-foreground px-2">
              Page {page} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              asChild={page < totalPages}
            >
              {page < totalPages ? (
                <Link
                  href={{
                    pathname: "/properties",
                    query: { ...searchParams, page: String(page + 1) },
                  }}
                >
                  Next
                  <ChevronRight className="size-4 ml-1" />
                </Link>
              ) : (
                <span>
                  Next
                  <ChevronRight className="size-4 ml-1" />
                </span>
              )}
            </Button>
          </div>
        )}
      </main>

      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {site.name}. All rights reserved.
      </footer>
    </div>
  );
}
