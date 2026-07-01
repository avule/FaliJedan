// Robots pravila govore pretrazivacima sta smiju da obilaze.

import type { MetadataRoute } from "next";

// robots.txt generisan iz koda. Dozvoljava sve osim API ruta i upucuje
// pretrazivace na sitemap. URL sajta dolazi iz okruzenja.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
