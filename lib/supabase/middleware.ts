import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

const PUBLIC_PATHS = ["/", "/login", "/register"];
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
    path.startsWith("/api/auth") ||
    path.startsWith("/igrac/"); // public profiles

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // Onboarding gate. Cookie-cached so we don't hit the DB on every nav.
  if (user && path !== "/onboarding" && !path.startsWith("/api")) {
    const onboardedCookie = request.cookies.get(ONBOARDED_COOKIE)?.value;

    if (onboardedCookie === "1") {
      // Cached: trust the cookie, skip DB roundtrip
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

    // Cache for next 24h. Cleared on logout (see auth action).
    response.cookies.set(ONBOARDED_COOKIE, "1", {
      httpOnly: false, // we want client to know too if needed
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24h
    });
  }

  return response;
}
