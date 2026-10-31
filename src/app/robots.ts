import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.AUTH_URL || "http://localhost:3000";

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
    sitemap: `${baseUrl.replace(/\/+$/, "")}/sitemap.xml`,
  };
}

