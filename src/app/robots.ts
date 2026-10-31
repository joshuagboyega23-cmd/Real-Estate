import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/app-url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getAppUrl();

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/properties", "/properties/*", "/login", "/register", "/accept-invite"],
      disallow: [
        "/owner",
        "/owner/*",
        "/admin",
        "/admin/*",
        "/tenant",
        "/tenant/*",
        "/caretaker",
        "/caretaker/*",
        "/api",
        "/api/*",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
