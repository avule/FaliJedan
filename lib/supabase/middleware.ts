// Srce proxy dijela (vidi proxy.ts). Na svaki zahtjev osvjezi Supabase sesiju i
// odlucuje ko gdje smije: neulogovane salje na login, a ulogovane bez
// zavrsenog onboardinga na /onboarding. Provjeru onboardinga kesira u kolacic
// da ne udara u bazu na svaku navigaciju.

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

const PUBLIC_PATHS = ["/", "/login", "/register", "/register/provjeri-email"];
const ONBOARDED_COOKIE = "fj_onboarded";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic =
    PUBLIC_PATHS.includes(path) ||
    path.startsWith("/_next") ||
    path.startsWith("/api/") || // API rute imaju svoju zastitu (npr. cron tajna)
    path.startsWith("/auth/") || // callback za potvrdu mejla
    path.startsWith("/igrac/"); // javni profili igraca

  // Neulogovan korisnik na zasticenoj strani ide na login, uz "next" da ga
  // poslije prijave vratimo tacno tamo gdje je htio.
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // Provjera onboardinga. Cuvamo u kolacicu da ne udaramo u bazu na svaku navigaciju.
  if (user && path !== "/onboarding" && !path.startsWith("/api")) {
    const onboardedCookie = request.cookies.get(ONBOARDED_COOKIE)?.value;

    if (onboardedCookie === "1") {
      // Kolacic kaze da je zavrsio, vjeruj mu i preskoci upit u bazu.
      return response;
    }

    const { data: player } = await supabase
      .from("players")
      .select("city_id, sports")
      .eq("id", user.id)
      .maybeSingle();

    const needsOnboarding =
      !player || !player.city_id || !player.sports || player.sports.length === 0;

    if (needsOnboarding) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    // Zapamti na 24h. Brise se pri odjavi (vidi auth akciju).
    response.cookies.set(ONBOARDED_COOKIE, "1", {
      httpOnly: false, // namjerno, da i klijent moze da procita ako zatreba
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24h
    });
  }

  return response;
}
