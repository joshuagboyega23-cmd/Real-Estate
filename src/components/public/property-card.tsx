import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, MapPin } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Reveal } from "@/components/landing/motion";

export interface PublicPropertyCardData {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string | null;
  currency: string;
  coverImage: string | null;
  rentFrom: number | null;
  vacantUnits: number;
  totalUnits: number;
  minBedrooms: number | null;
  maxBedrooms: number | null;
  isNew: boolean;
}

export function isPropertyNew(createdAt: Date) {
  const age = Date.now() - createdAt.getTime();
  return age >= 0 && age < 14 * 24 * 60 * 60 * 1000;
}

export function PropertyCard({
  property,
  index = 0,
}: {
  property: PublicPropertyCardData;
  index?: number;
}) {
  const bedroomLabel =
    property.minBedrooms === null
      ? null
      : property.minBedrooms === property.maxBedrooms
        ? `${property.minBedrooms} ${property.minBedrooms === 1 ? "bed" : "beds"}`
        : `${property.minBedrooms} to ${property.maxBedrooms} beds`;

  return (
    <Reveal delay={(index % 3) * 80} className="h-full">
      <Link
        href={`/properties/${property.slug}`}
        className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
      >
        <Card className="h-full overflow-hidden rounded-2xl border-border/80 shadow-[0_8px_24px_rgb(31_95_191_/_7%)] transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary/25 group-hover:shadow-[0_18px_42px_rgb(31_95_191_/_16%)]">
          <div className="relative aspect-[16/10] overflow-hidden bg-sky">
            {property.coverImage ? (
              <Image
                src={property.coverImage}
                alt={`${property.name} exterior`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <Building2 className="size-12 text-muted-foreground/30" />
              </div>
            )}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0B2545]/70 to-transparent"
            />
            {property.isNew && (
              <Badge className="marketing-badge absolute left-4 top-4 border-0 font-bold">
                New
              </Badge>
            )}
            <Badge
              className={`absolute right-4 top-4 border-0 shadow-sm ${
                property.vacantUnits > 0
                  ? "bg-success/10 text-success"
                  : "bg-white/95 text-muted-foreground"
              }`}
            >
              {property.vacantUnits > 0 ? `${property.vacantUnits} vacant` : "Fully let"}
            </Badge>
            <span className="absolute bottom-4 left-4 rounded-lg bg-white px-3 py-1.5 text-sm font-bold text-primary shadow-md">
              {property.rentFrom === null
                ? "Inquire"
                : `From ${formatMoney(property.rentFrom, property.currency)}`}
            </span>
            <span className="absolute bottom-4 right-4 flex translate-x-2 items-center gap-1 text-xs font-semibold text-white opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
              View details <ArrowRight className="size-4" />
            </span>
          </div>
          <CardContent className="p-5">
            <h3 className="line-clamp-1 text-lg font-bold transition-colors group-hover:text-primary">
              {property.name}
            </h3>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" />
              {property.city}
              {property.state ? `, ${property.state}` : ""}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3 text-xs text-muted-foreground">
              {bedroomLabel && <span>{bedroomLabel}</span>}
              <span>
                {property.totalUnits} {property.totalUnits === 1 ? "unit" : "units"}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </Reveal>
  );
}
