import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.AUTH_URL || "http://localhost:3000";
  const cleanBase = baseUrl.replace(/\/+$/, "");

  let propertyRoutes: MetadataRoute.Sitemap = [];

  try {
    const published = await prisma.property.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    });

    propertyRoutes = published.map((p) => ({
      url: `${cleanBase}/properties/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error("Failed to generate sitemap property routes:", error);
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${cleanBase}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${cleanBase}/properties`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
  ];

  return [...staticRoutes, ...propertyRoutes];
}

