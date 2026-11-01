import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { site } from "@/config/site";
import { prisma } from "@/lib/prisma";
import { roleHomeMap } from "@/lib/permissions";
import { LandingHeader } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import {
  LandingSections,
  type FeaturedProperty,
} from "@/components/landing/sections";
import { FloatingActions } from "@/components/landing/floating-actions";

export const dynamic = "force-dynamic";

const publicImagesDirectory = path.join(process.cwd(), "public", "images");
const heroImage = fs.existsSync(path.join(publicImagesDirectory, "hero.webp"))
  ? "/images/hero.webp"
  : fs.existsSync(path.join(publicImagesDirectory, "hero.jpg"))
    ? "/images/hero.jpg"
    : "/images/hero.svg";

function isNewProperty(createdAt: Date): boolean {
  return Date.now() - createdAt.getTime() < 14 * 24 * 60 * 60 * 1000;
}

export const metadata: Metadata = {
  title: `${site.name} | Homes in ${site.city}`,
  description: site.tagline,
  openGraph: {
    title: `${site.name} | Homes in ${site.city}`,
    description: site.tagline,
    images: [
      {
        url: heroImage,
        width: 1920,
        height: 1080,
        alt: `Home in a tropical urban setting in ${site.city}`,
      },
    ],
  },
};

export default async function HomePage() {
  const [session, featuredRows, publishedCount, vacantUnits] = await Promise.all([
    auth(),
    prisma.property.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        units: {
          select: {
            id: true,
            rentAmount: true,
            status: true,
          },
        },
      },
    }),
    prisma.property.count({ where: { isPublished: true } }),
    prisma.unit.count({
      where: { status: "VACANT", property: { isPublished: true } },
    }),
  ]);

  const properties: FeaturedProperty[] = featuredRows.map((property) => {
    const vacantRents = property.units
      .filter((unit) => unit.status === "VACANT")
      .map((unit) => unit.rentAmount);
    const allRents = property.units.map((unit) => unit.rentAmount);
    return {
      id: property.id,
      slug: property.slug,
      name: property.name,
      city: property.city,
      state: property.state,
      country: property.country,
      currency: property.currency,
      coverImage: property.images[0] || null,
      rentFrom:
        vacantRents.length > 0
          ? Math.min(...vacantRents)
          : allRents.length > 0
            ? Math.min(...allRents)
            : null,
      vacantUnits: property.units.filter((unit) => unit.status === "VACANT").length,
      totalUnits: property.units.length,
      isNew: isNewProperty(property.createdAt),
    };
  });

  const user = session?.user;
  const dashboardHref = user?.activeRole ? roleHomeMap[user.activeRole] : "/login";

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader
        brand={site.name}
        phone={site.phone}
        dashboardHref={dashboardHref}
        isLoggedIn={!!user}
        showTestimonials={site.testimonials.length > 0}
      />
      <Hero city={site.city} tagline={site.tagline} imageSrc={heroImage} />
      <LandingSections
        properties={properties}
        publishedCount={publishedCount}
        vacantUnits={vacantUnits}
      />
      <FloatingActions whatsapp={site.whatsapp} />
    </div>
  );
}
