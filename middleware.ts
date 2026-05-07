import { NextRequest, NextResponse } from "next/server";
import { canAccessPath, getUnauthorizedReason } from "@/lib/auth";
import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED_PATHS = ["/", "/crew", "/dla", "/admin"];

function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const { response, supabase } = await updateSession(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginRoute = pathname === "/login";

  if (!user) {
    if (isProtectedPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(url);
    }

    return response;
  }

  if (isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, system_role, is_active")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("station_memberships")
      .select("membership_role, is_active")
      .eq("profile_id", user.id)
      .eq("is_active", true),
  ]);

  const isProfileActive = profile?.is_active === true;
  if (user && !isProfileActive && pathname !== "/unauthorized") {
    const url = request.nextUrl.clone();
    url.pathname = "/unauthorized";
    url.searchParams.set(
      "reason",
      "Your account profile is inactive. Please contact a station admin or LOM.",
    );
    return NextResponse.redirect(url);
  }

  const roleSet = new Set(
    ((memberships ?? []) as { membership_role: string; is_active: boolean }[])
      .filter((membership) => membership.is_active)
      .map((membership) => membership.membership_role),
  );
  const isSuperAdmin = isProfileActive && profile?.system_role === "super_admin";
  const canAccessCrew = !!user && isProfileActive && (isSuperAdmin || roleSet.size > 0);
  const canAccessDla =
    !!user &&
    isProfileActive &&
    (isSuperAdmin || roleSet.has("dla") || roleSet.has("lom") || roleSet.has("admin"));
  const canAccessAdmin =
    !!user && isProfileActive && (isSuperAdmin || roleSet.has("lom") || roleSet.has("admin"));

  const authorized = canAccessPath(pathname, {
    isAuthenticated: !!user,
    isProfileActive,
    canAccessCrew,
    canAccessDla,
    canAccessAdmin,
    isSuperAdmin: !!isSuperAdmin,
  });

  if (!authorized && isProtectedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/unauthorized";
    url.searchParams.set("reason", getUnauthorizedReason(pathname));
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/", "/crew/:path*", "/dla/:path*", "/admin/:path*", "/login", "/unauthorized"],
};
