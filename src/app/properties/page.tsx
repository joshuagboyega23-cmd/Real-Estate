import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@/generated/prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toMinor } from "@/lib/money";
import { site } from "@/config/site";
import { roleHomeMap } from "@/lib/permissions";
import { isPropertyNew, PropertyCard } from "@/components/public/property-card";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, ChevronLeft, ChevronRight, Filter, Search, X } from "lucide-react";

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

function queryHref(
  params: PropertiesPageProps["searchParams"] extends Promise<infer T> ? T : never,
  removeKey?: string,
  page?: number,
) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key !== removeKey && key !== "page" && value) query.set(key, value);
  }
  if (page && page > 1) query.set("page", String(page));
  const queryString = query.toString();
  return queryString ? `/properties?${queryString}` : "/properties";
}

function getPageItems(page: number, totalPages: number): Array<number | "ellipsis"> {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((value) => value >= 1 && value <= totalPages).sort((a, b) => a - b);
  const result: Array<number | "ellipsis"> = [];
  for (const [index, value] of sorted.entries()) {
    if (index > 0 && value - sorted[index - 1] > 1) result.push("ellipsis");
    result.push(value);
  }
  return result;
}

export default async function PublicPropertiesPage(props: PropertiesPageProps) {
  const [searchParams, session] = await Promise.all([props.searchParams, auth()]);
  const city = searchParams.city?.trim() || "";
  const bedrooms = searchParams.bedrooms ? parseInt(searchParams.bedrooms, 10) : undefined;
  const maxRent = searchParams.maxRent ? parseFloat(searchParams.maxRent) : undefined;
  const vacantOnly = searchParams.vacant === "true";
  const sort = searchParams.sort || "newest";
  const page = Math.max(1, parseInt(searchParams.page || "1", 10));
  const activeRole = session?.user?.activeRole;
  const dashboardHref = activeRole ? roleHomeMap[activeRole] : "/login";

  const where: Prisma.PropertyWhereInput = { isPublished: true };
  if (city) {
    where.OR = [
      { city: { contains: city, mode: "insensitive" } },
      { state: { contains: city, mode: "insensitive" } },
      { name: { contains: city, mode: "insensitive" } },
    ];
  }

  const unitFilter: Prisma.UnitWhereInput = {};
  if (bedrooms && !isNaN(bedrooms)) unitFilter.bedrooms = { gte: bedrooms };
  if (maxRent && !isNaN(maxRent)) unitFilter.rentAmount = { lte: toMinor(maxRent) };
  if (vacantOnly) unitFilter.status = "VACANT";
  if (Object.keys(unitFilter).length > 0) where.units = { some: unitFilter };

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
        select: { id: true, rentAmount: true, status: true, bedrooms: true },
      },
    },
  });

  const activeFilters = [
    city ? { key: "city", label: `Search: ${city}` } : null,
    bedrooms && !isNaN(bedrooms) ? { key: "bedrooms", label: `${bedrooms}+ bedrooms` } : null,
    maxRent && !isNaN(maxRent) ? { key: "maxRent", label: `Max rent: ${searchParams.maxRent}` } : null,
    vacantOnly ? { key: "vacant", label: "Vacant units only" } : null,
    sort === "oldest" ? { key: "sort", label: "Oldest first" } : null,
  ].filter((item): item is { key: string; label: string } => item !== null);

  const cards = properties.map((property) => {
    const vacantUnits = property.units.filter((unit) => unit.status === "VACANT");
    const priceUnits = vacantUnits.length > 0 ? vacantUnits : property.units;
    const bedroomsAvailable = property.units.map((unit) => unit.bedrooms);
    return {
      id: property.id,
      slug: property.slug,
      name: property.name,
      city: property.city,
      state: property.state,
      currency: property.currency,
      coverImage: property.images[0] ?? null,
      rentFrom: priceUnits.length > 0
        ? Math.min(...priceUnits.map((unit) => unit.rentAmount))
        : null,
      vacantUnits: vacantUnits.length,
      totalUnits: property.units.length,
      minBedrooms: bedroomsAvailable.length > 0 ? Math.min(...bedroomsAvailable) : null,
      maxBedrooms: bedroomsAvailable.length > 0 ? Math.max(...bedroomsAvailable) : null,
      isNew: isPropertyNew(property.createdAt),
    };
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader
        siteName={site.name}
        dashboardHref={dashboardHref}
        isLoggedIn={!!session?.user}
      />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-primary/10 bg-gradient-to-br from-sky via-white to-white">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.3] [background-image:radial-gradient(#1F5FBF_0.7px,transparent_0.7px)] [background-size:22px_22px]"
          />
          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
            <p className="hero-enter text-sm font-bold uppercase tracking-[0.15em] text-primary">
              Find a place to call home
            </p>
            <h1 className="hero-enter mt-3 text-3xl font-extrabold tracking-tight text-navy sm:text-5xl">
              Discover homes in {site.city}
            </h1>
            <p className="hero-enter mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Explore thoughtfully managed homes and apartments, and find the right space for you.
            </p>
            <p className="mt-5 text-sm font-semibold text-navy">
              {totalCount} {totalCount === 1 ? "home" : "homes"} to explore
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
          <form
            method="GET"
            action="/properties"
            className="sticky top-16 z-30 -mt-2 mb-7 rounded-2xl border border-primary/10 bg-white/95 p-3 shadow-[0_12px_36px_rgb(31_95_191_/_12%)] backdrop-blur-md sm:p-4"
          >
            <details className="group">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-xl px-2 font-semibold text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-2"><Filter className="size-4 text-primary" /> Filters</span>
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  {activeFilters.length > 0 && <Badge variant="secondary">{activeFilters.length} active</Badge>}
                  <span className="transition-transform group-open:rotate-180">⌄</span>
                </span>
              </summary>
              <div className="hidden grid-cols-1 gap-3 border-t border-border pt-3 group-open:grid md:grid md:grid-cols-5 md:border-0 md:pt-0">
                <FilterFields city={city} bedrooms={searchParams.bedrooms} maxRent={searchParams.maxRent} vacant={searchParams.vacant} sort={sort} />
              </div>
            </details>
            <div className="mt-3 flex flex-wrap items-center gap-2 md:justify-end">
              <Button type="submit" className="h-11 min-w-32 rounded-xl">
                <Search className="mr-1.5 size-4" /> Apply filters
              </Button>
              {activeFilters.length > 0 && (
                <Button variant="outline" asChild className="h-11 rounded-xl">
                  <Link href="/properties">Reset</Link>
                </Button>
              )}
            </div>
          </form>

          {activeFilters.length > 0 && (
            <div className="mb-5 flex flex-wrap items-center gap-2" aria-label="Active filters">
              {activeFilters.map((filter) => (
                <Link
                  key={filter.key}
                  href={queryHref(searchParams, filter.key)}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-primary/15 bg-sky px-3 text-xs font-semibold text-navy transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Remove ${filter.label} filter`}
                >
                  {filter.label} <X className="size-3.5" />
                </Link>
              ))}
            </div>
          )}

          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
            <span>
              Showing <strong className="text-navy">{properties.length}</strong> of{" "}
              <strong className="text-navy">{totalCount}</strong> homes
            </span>
          </div>

          {cards.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-primary/25 bg-gradient-to-b from-sky/70 to-white px-5 py-16 text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-sky text-primary">
                <Building2 className="size-8" />
              </div>
              <h2 className="text-xl font-bold text-navy">No homes found just yet</h2>
              <p className="mx-auto mb-5 mt-2 max-w-md text-sm text-muted-foreground">
                Try a different area or remove a filter to see more available properties.
              </p>
              <Button asChild className="rounded-xl"><Link href="/properties">Clear all filters</Link></Button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((property, index) => (
                <PropertyCard key={property.id} property={property} index={index} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav className="mt-10 flex flex-wrap items-center justify-center gap-1.5" aria-label="Pagination">
              <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
                {page > 1 ? (
                  <Link href={queryHref(searchParams, undefined, page - 1)} aria-label="Go to previous page">
                    <ChevronLeft className="mr-1 size-4" /> Previous
                  </Link>
                ) : (
                  <span><ChevronLeft className="mr-1 size-4" /> Previous</span>
                )}
              </Button>
              {getPageItems(page, totalPages).map((pageItem, index) =>
                pageItem === "ellipsis" ? (
                  <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground" aria-hidden="true">…</span>
                ) : (
                  <Button
                    key={pageItem}
                    size="sm"
                    variant={pageItem === page ? "default" : "outline"}
                    asChild
                  >
                    <Link
                      href={queryHref(searchParams, undefined, pageItem)}
                      aria-label={`Page ${pageItem}`}
                      aria-current={pageItem === page ? "page" : undefined}
                    >
                      {pageItem}
                    </Link>
                  </Button>
                ),
              )}
              <Button variant="outline" size="sm" disabled={page >= totalPages} asChild={page < totalPages}>
                {page < totalPages ? (
                  <Link href={queryHref(searchParams, undefined, page + 1)} aria-label="Go to next page">
                    Next <ChevronRight className="ml-1 size-4" />
                  </Link>
                ) : (
                  <span>Next <ChevronRight className="ml-1 size-4" /></span>
                )}
              </Button>
            </nav>
          )}
        </div>
        <noscript><style>{`.reveal{opacity:1!important;transform:none!important}`}</style></noscript>
      </main>
      <PublicFooter
        siteName={site.name}
        tagline={site.tagline}
        phone={site.phone}
        email={site.email}
        whatsapp={site.whatsapp}
        address={site.address}
      />
    </div>
  );
}

function FilterFields({
  city,
  bedrooms,
  maxRent,
  vacant,
  sort,
}: {
  city: string;
  bedrooms?: string;
  maxRent?: string;
  vacant?: string;
  sort: string;
}) {
  return (
    <>
      <label className="relative block">
        <span className="sr-only">City, state, or property name</span>
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="city"
          placeholder="City, state, or name"
          defaultValue={city}
          className="h-11 rounded-xl pl-9 focus-visible:ring-2"
        />
      </label>
      <label>
        <span className="sr-only">Minimum bedrooms</span>
        <select
          name="bedrooms"
          defaultValue={bedrooms || ""}
          className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Bedrooms (any)</option>
          <option value="1">1+ bedrooms</option>
          <option value="2">2+ bedrooms</option>
          <option value="3">3+ bedrooms</option>
          <option value="4">4+ bedrooms</option>
        </select>
      </label>
      <label>
        <span className="sr-only">Maximum rent in NGN</span>
        <Input
          name="maxRent"
          type="number"
          inputMode="numeric"
          placeholder="Max rent (NGN)"
          defaultValue={maxRent || ""}
          className="h-11 rounded-xl focus-visible:ring-2"
        />
      </label>
      <label>
        <span className="sr-only">Availability</span>
        <select
          name="vacant"
          defaultValue={vacant || ""}
          className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All properties</option>
          <option value="true">Vacant units only</option>
        </select>
      </label>
      <label>
        <span className="sr-only">Sort properties</span>
        <select
          name="sort"
          defaultValue={sort}
          className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </label>
    </>
  );
}
