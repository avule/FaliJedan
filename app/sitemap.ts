// Sitemap za javne stranice koje pretrazivaci smiju indeksirati.

import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase/server";

// Sitemap iz koda: javne marketing rute + javni profili igraca. Profili se
// povlace service klijentom (bez sesije); ako to padne, vrati bar marketing
// rute da sitemap nikad ne pukne.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/register`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  try {
    const admin = createServiceClient();
    const { data } = await admin
      .from("players")
      .select("id, created_at")
      .order("created_at", { ascending: false })
      .limit(1000);

    const profileRoutes: MetadataRoute.Sitemap = (data ?? []).map((p) => ({
      url: `${SITE_URL}/igrac/${p.id}`,
      lastModified: p.created_at ? new Date(p.created_at) : now,
      changeFrequency: "weekly",
      priority: 0.5,
    }));

    return [...staticRoutes, ...profileRoutes];
  } catch {
    return staticRoutes;
  }
}
