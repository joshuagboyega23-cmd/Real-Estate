import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { site } from "@/config/site";
import { roleHomeMap } from "@/lib/permissions";
import { PropertyGallery } from "@/components/public/property-gallery";
import { isPropertyNew, PropertyCard } from "@/components/public/property-card";
import { PropertyContactActions } from "@/components/public/property-contact-actions";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";
import { Reveal, CountUp } from "@/components/landing/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowRight,
  Check,
  Compass,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface PublicPropertyPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(
  props: PublicPropertyPageProps
): Promise<Metadata> {
  const { slug } = await props.params;
  const property = await prisma.property.findUnique({
    where: { slug },
    select: { name: true, description: true, images: true, city: true, country: true },
  });

  if (!property) {
    return { title: "Property Not Found" };
  }

  const ogImages = property.images.length > 0 ? [{ url: property.images[0] }] : [];

  return {
    title: `${property.name} in ${property.city}`,
    description:
      property.description?.slice(0, 160) ||
      `Explore units and specifications at ${property.name}, located in ${property.city}, ${property.country}.`,
    openGraph: {
      title: property.name,
      description: property.description || undefined,
      images: ogImages,
    },
    alternates: { canonical: "/properties/" + slug },
  };
}

export default async function PublicPropertyPage(props: PublicPropertyPageProps) {
  const [{ slug }, session] = await Promise.all([props.params, auth()]);
  const property = await prisma.property.findUnique({
    where: { slug },
    include: {
      units: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          bedrooms: true,
          bathrooms: true,
          rentAmount: true,
          rentPeriod: true,
          status: true,
          features: true,
        },
      },
    },
  });

  if (!property || !property.isPublished) notFound();

  const activeRole = session?.user?.activeRole;
  const dashboardHref = activeRole ? roleHomeMap[activeRole] : "/login";
  const vacantUnits = property.units.filter((unit) => unit.status === "VACANT");
  const bedroomValues = property.units.map((unit) => unit.bedrooms);
  const minBedrooms = bedroomValues.length > 0 ? Math.min(...bedroomValues) : null;
  const maxBedrooms = bedroomValues.length > 0 ? Math.max(...bedroomValues) : null;
  const rentUnits = vacantUnits.length > 0 ? vacantUnits : property.units;
  const startingRent = rentUnits.length > 0
    ? Math.min(...rentUnits.map((unit) => unit.rentAmount))
    : null;
  const bedroomRange = minBedrooms === null
    ? "Bedrooms not listed"
    : minBedrooms === maxBedrooms
      ? `${minBedrooms} ${minBedrooms === 1 ? "bedroom" : "bedrooms"}`
      : `${minBedrooms} to ${maxBedrooms} bedrooms`;
  const showContactCard = !!(site.phone || site.email || site.whatsapp);

  const similarInclude = {
    units: { select: { rentAmount: true, status: true, bedrooms: true } },
  } as const;
  let similarProperties = await prisma.property.findMany({
    where: { isPublished: true, id: { not: property.id }, city: property.city },
    orderBy: { createdAt: "desc" },
    take: 3,
    include: similarInclude,
  });
  if (similarProperties.length === 0) {
    similarProperties = await prisma.property.findMany({
      where: { isPublished: true, id: { not: property.id } },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: similarInclude,
    });
  }
  const similarCards = similarProperties.map((item) => {
    const vacancies = item.units.filter((unit) => unit.status === "VACANT");
    const pricedUnits = vacancies.length > 0 ? vacancies : item.units;
    const beds = item.units.map((unit) => unit.bedrooms);
    return {
      id: item.id,
      slug: item.slug,
      name: item.name,
      city: item.city,
      state: item.state,
      currency: item.currency,
      coverImage: item.images[0] ?? null,
      rentFrom: pricedUnits.length > 0 ? Math.min(...pricedUnits.map((unit) => unit.rentAmount)) : null,
      vacantUnits: vacancies.length,
      totalUnits: item.units.length,
      minBedrooms: beds.length > 0 ? Math.min(...beds) : null,
      maxBedrooms: beds.length > 0 ? Math.max(...beds) : null,
      isNew: isPropertyNew(item.createdAt),
    };
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader
        siteName={site.name}
        dashboardHref={dashboardHref}
        isLoggedIn={!!session?.user}
      />
      <main className={`mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-9 ${showContactCard ? "pb-28 lg:pb-9" : ""}`}>
        <nav aria-label="Breadcrumb" className="mb-5 text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/" className="hover:text-primary">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/properties" className="hover:text-primary">Properties</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="max-w-[min(55vw,24rem)] truncate font-medium text-navy">{property.name}</li>
          </ol>
        </nav>

        <section className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-extrabold tracking-tight text-navy sm:text-4xl lg:text-5xl">
              {property.name}
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground sm:text-base">
              <MapPin className="size-4 shrink-0 text-primary" />
              {property.address}, {property.city}
              {property.state ? `, ${property.state}` : ""}, {property.country}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="secondary" className="h-8 rounded-full bg-sky px-3 text-navy">
                {vacantUnits.length} {vacantUnits.length === 1 ? "unit" : "units"} vacant
              </Badge>
              <Badge variant="secondary" className="h-8 rounded-full bg-sky px-3 text-navy">
                {bedroomRange}
              </Badge>
              <Badge variant="secondary" className="h-8 rounded-full bg-sky px-3 text-navy">
                {startingRent === null ? "Rent on request" : `From ${formatMoney(startingRent, property.currency)}`}
              </Badge>
            </div>
          </div>
          {property.latitude && property.longitude && (
            <Button variant="outline" asChild className="min-h-11 shrink-0 rounded-xl">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Compass className="size-4 text-primary" />
                Get Directions
              </a>
            </Button>
          )}
        </section>

        <PropertyGallery images={property.images} propertyName={property.name} />

        <div className="mt-9 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-9 lg:col-span-2">
            {property.description && (
              <Reveal as="section" className="space-y-3">
                <h2 className="text-2xl font-bold tracking-tight">About the Property</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/85 sm:text-base">
                  {property.description}
                </p>
              </Reveal>
            )}

            {property.amenities.length > 0 && (
              <Reveal as="section" className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight">Amenities &amp; Features</h2>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {property.amenities.map((amenity, index) => (
                    <li key={`${amenity}-${index}`} className="flex min-h-11 items-center gap-2 rounded-xl border border-primary/10 bg-sky/60 px-3 py-2 text-sm font-medium text-navy">
                      <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />
                      {amenity}
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}

            <Reveal as="section" className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Available Units</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Explore the residence units and their current availability.
                  </p>
                </div>
                <Badge variant="outline" className="h-8 rounded-full px-3 font-semibold">
                  {property.units.length} Total Units
                </Badge>
              </div>

              {property.units.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-primary/20 bg-sky/40 p-8 text-center text-sm text-muted-foreground">
                  No units listed yet for this property.
                </div>
              ) : (
                <>
                  <div className="hidden overflow-hidden rounded-2xl border bg-white shadow-sm md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Unit</TableHead>
                          <TableHead>Specifications</TableHead>
                          <TableHead>Rent Rate</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {property.units.map((unit) => (
                          <TableRow key={unit.id} className="hover:bg-sky/50">
                            <TableCell className="font-semibold">
                              <span>{unit.name}</span>
                              {unit.description && (
                                <p className="line-clamp-1 text-xs font-normal text-muted-foreground">
                                  {unit.description}
                                </p>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {unit.bedrooms} Bed · {unit.bathrooms} Bath
                            </TableCell>
                            <TableCell className="text-sm font-bold text-navy">
                              {formatMoney(unit.rentAmount, property.currency)}
                              <span className="block text-xs font-normal text-muted-foreground">
                                per {unit.rentPeriod.toLowerCase()}
                              </span>
                            </TableCell>
                            <TableCell><UnitStatus status={unit.status} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="grid gap-3 md:hidden">
                    {property.units.map((unit) => (
                      <article key={unit.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-bold text-navy">{unit.name}</h3>
                            {unit.description && (
                              <p className="mt-1 text-sm text-muted-foreground">{unit.description}</p>
                            )}
                          </div>
                          <UnitStatus status={unit.status} />
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">
                          {unit.bedrooms} Bed · {unit.bathrooms} Bath
                        </p>
                        <p className="mt-2 font-bold text-primary">
                          {formatMoney(unit.rentAmount, property.currency)}
                          <span className="ml-1 text-xs font-medium text-muted-foreground">
                            per {unit.rentPeriod.toLowerCase()}
                          </span>
                        </p>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </Reveal>
          </div>

          <aside className="space-y-5">
            {showContactCard && (
              <Card className="overflow-hidden rounded-2xl border-border/80 shadow-[0_12px_36px_rgb(31_95_191_/_10%)] lg:sticky lg:top-24">
                <div className="bg-primary px-5 py-4 text-white">
                  <h2 className="font-bold text-white">Contact Property Team</h2>
                  <p className="mt-1 text-xs text-white/90">Ask a question or arrange a viewing.</p>
                </div>
                <CardContent className="space-y-3 p-4">
                  {site.whatsapp && (
                    <Button asChild className="min-h-11 w-full rounded-xl">
                      <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="size-4" /> Message on WhatsApp
                      </a>
                    </Button>
                  )}
                  {site.phone && (
                    <a href={`tel:${site.phone}`} className="flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm font-semibold text-navy transition-colors hover:bg-sky focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <Phone className="size-4 text-primary" /> {site.phone}
                    </a>
                  )}
                  {site.email && (
                    <a
                      href={`mailto:${site.email}?subject=Inquiry%20regarding%20${encodeURIComponent(property.name)}`}
                      className="flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm font-semibold text-navy transition-colors hover:bg-sky focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Mail className="size-4 text-primary" /> <span className="truncate">{site.email}</span>
                    </a>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="rounded-2xl border-border/80 shadow-sm">
              <div className="p-5 pb-2">
                <h2 className="font-bold text-navy">Residence Overview</h2>
              </div>
              <CardContent className="space-y-3 px-5 pb-5 text-sm">
                <OverviewRow label="Currency"><span className="font-mono font-medium">{property.currency}</span></OverviewRow>
                <OverviewRow label="Total Units"><CountUp value={property.units.length} className="font-medium text-navy" /></OverviewRow>
                <OverviewRow label="Vacant Units"><CountUp value={vacantUnits.length} className="font-medium text-success" /></OverviewRow>
                <OverviewRow label="Location"><span className="font-medium text-navy">{property.city}, {property.country}</span></OverviewRow>
              </CardContent>
            </Card>
          </aside>
        </div>

        {similarCards.length > 0 && (
          <section className="mt-14 border-t border-border pt-10">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Explore more</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Similar properties</h2>
              </div>
              <Link href="/properties" className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                All properties <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {similarCards.map((item, index) => (
                <PropertyCard key={item.id} property={item} index={index} />
              ))}
            </div>
          </section>
        )}
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
      {showContactCard && (
        <PropertyContactActions
          phone={site.phone}
          email={site.email}
          whatsapp={site.whatsapp}
          propertyName={property.name}
        />
      )}
    </div>
  );
}

function UnitStatus({ status }: { status: string }) {
  if (status === "VACANT") {
    return <Badge className="border border-success/20 bg-success/10 text-success hover:bg-success/10">Available</Badge>;
  }
  if (status === "OCCUPIED") {
    return <Badge className="border border-info/20 bg-info/10 text-info hover:bg-info/10">Occupied</Badge>;
  }
  return <Badge className="border border-warning/30 bg-warning/10 text-warning hover:bg-warning/10">Maintenance</Badge>;
}

function OverviewRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}
