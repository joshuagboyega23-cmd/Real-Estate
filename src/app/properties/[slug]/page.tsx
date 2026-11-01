import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { site } from "@/config/site";
import { PropertyGallery } from "@/components/public/property-gallery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building,
  MapPin,
  Compass,
  Phone,
  Mail,
  ArrowLeft,
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
  };
}

export default async function PublicPropertyPage(props: PublicPropertyPageProps) {
  const { slug } = await props.params;

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

  if (!property || !property.isPublished) {
    notFound();
  }

  const showContactCard = !!(site.phone || site.email || site.whatsapp);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <Building className="size-6 text-primary" />
            <span>{site.name}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/properties">
                <ArrowLeft className="size-4 mr-1.5" />
                All Listings
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-8 max-w-6xl space-y-8">
        {/* Title & Location Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              {property.name}
            </h1>
            <p className="flex items-center gap-1.5 text-sm sm:text-base text-muted-foreground mt-1.5">
              <MapPin className="size-4 text-primary shrink-0" />
              {property.address}, {property.city}
              {property.state ? `, ${property.state}` : ""}, {property.country}
            </p>
          </div>

          {property.latitude && property.longitude && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Compass className="size-4 mr-1.5 text-primary" />
                Get Directions
              </a>
            </Button>
          )}
        </div>

        {/* Photo Gallery */}
        <PropertyGallery images={property.images} propertyName={property.name} />

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Description, Amenities, Units */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {property.description && (
              <section className="space-y-3">
                <h2 className="text-xl font-bold tracking-tight">About the Property</h2>
                <p className="text-foreground/85 whitespace-pre-line leading-relaxed text-sm sm:text-base">
                  {property.description}
                </p>
              </section>
            )}

            {/* Amenities */}
            {property.amenities.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xl font-bold tracking-tight">Amenities & Features</h2>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((item, idx) => (
                    <Badge key={idx} variant="secondary" className="px-3 py-1 text-sm font-normal">
                      {item}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {/* Available Units Table */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Available Units</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Units cataloged in this residence with current availability status.
                  </p>
                </div>
                <Badge variant="outline" className="font-medium">
                  {property.units.length} Total Units
                </Badge>
              </div>

              {property.units.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed bg-muted/20 text-muted-foreground text-sm">
                  No units listed yet for this property.
                </div>
              ) : (
                <div className="rounded-xl border bg-card overflow-hidden shadow-xs">
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
                      {property.units.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-semibold">
                            <div>
                              <span>{u.name}</span>
                              {u.description && (
                                <p className="text-xs text-muted-foreground font-normal line-clamp-1">
                                  {u.description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {u.bedrooms} Bed · {u.bathrooms} Bath
                          </TableCell>
                          <TableCell className="font-bold text-sm">
                            {formatMoney(u.rentAmount, property.currency)}
                            <span className="text-xs text-muted-foreground font-normal block">
                              per {u.rentPeriod.toLowerCase()}
                            </span>
                          </TableCell>
                          <TableCell>
                            {u.status === "VACANT" ? (
                              <Badge variant="secondary" className="border-success/20 bg-success/10 text-success">
                                Available
                              </Badge>
                            ) : u.status === "OCCUPIED" ? (
                              <Badge variant="secondary" className="border-info/20 bg-info/10 text-info">
                                Occupied
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-warning/40 bg-warning/10 text-warning">
                                Maintenance
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Contact & Quick Info */}
          <div className="space-y-6">
            {/* Contact Card */}
            {showContactCard && (
              <Card className="sticky top-24 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Contact Property Team</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Interested in leasing a unit or scheduling an in-person viewing? Get in touch
                    directly.
                  </p>
                  {site.phone && (
                    <a
                      href={`tel:${site.phone}`}
                      className="flex items-center gap-2 p-2.5 rounded-lg border hover:bg-muted transition-colors font-medium text-foreground"
                    >
                      <Phone className="size-4 text-primary shrink-0" />
                      <span>{site.phone}</span>
                    </a>
                  )}
                  {site.email && (
                    <a
                      href={`mailto:${site.email}?subject=Inquiry regarding ${encodeURIComponent(property.name)}`}
                      className="flex items-center gap-2 p-2.5 rounded-lg border hover:bg-muted transition-colors font-medium text-foreground"
                    >
                      <Mail className="size-4 text-primary shrink-0" />
                      <span className="truncate">{site.email}</span>
                    </a>
                  )}
                  {site.whatsapp && (
                    <a
                      href={`https://wa.me/${site.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg border p-2.5 font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      <Phone className="size-4 shrink-0 text-primary" />
                      <span>Message on WhatsApp</span>
                    </a>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Specs Card */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Residence Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 text-sm">
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Currency</span>
                  <span className="font-mono font-medium">{property.currency}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Total Units</span>
                  <span className="font-medium">{property.units.length}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Vacant Units</span>
                  <span className="font-medium text-success">
                    {property.units.filter((u) => u.status === "VACANT").length}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Location</span>
                  <span className="font-medium">{property.city}, {property.country}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {site.name}. All rights reserved.
      </footer>
    </div>
  );
}
