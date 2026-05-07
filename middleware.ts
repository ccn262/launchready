import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = ["/", "/crew", "/dla", "/admin"];

function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function createRedirect(
  request: NextRequest,
  pathname: string,
  params?: Record<string, string>,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";

  for (const [key, value] of Object.entries(params ?? {})) {
    url.searchParams.set(key, value);
  }

  return NextResponse.redirect(url);
}

function hasLikelySupabaseAuthCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(({ name }) => name.startsWith("sb-") || name.includes("auth-token"));
}

export function middleware(request: NextRequest) {
  let pathname = "/";

  try {
    pathname = request.nextUrl.pathname;
    const isLoginRoute = pathname === "/login";
    const isUnauthorizedRoute = pathname === "/unauthorized";
    const hasAuthCookie = hasLikelySupabaseAuthCookie(request);

    if (isLoginRoute || isUnauthorizedRoute) {
      return NextResponse.next();
    }

    if (isProtectedPath(pathname) && !hasAuthCookie) {
      return createRedirect(request, "/login", {
        error: "middleware_fallback",
        redirectTo: pathname,
      });
    }

    return NextResponse.next();
  } catch {
    if (pathname === "/login" || pathname === "/unauthorized") {
      return NextResponse.next();
    }

    if (isProtectedPath(pathname)) {
      return createRedirect(request, "/login", {
        error: "middleware_fallback",
        redirectTo: pathname,
      });
    }

    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)"],
};
