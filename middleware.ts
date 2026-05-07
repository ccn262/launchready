import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = ["/", "/crew", "/dla", "/admin"];

function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function createRedirect(request: NextRequest, pathname: string, params?: Record<string, string>) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";

  for (const [key, value] of Object.entries(params ?? {})) {
    url.searchParams.set(key, value);
  }

  return NextResponse.redirect(url);
}

function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return { supabaseUrl, supabaseAnonKey };
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isLoginRoute = pathname === "/login";
  const isUnauthorizedRoute = pathname === "/unauthorized";
  const config = getSupabaseConfig();

  if (!config) {
    if (isProtectedPath(pathname)) {
      return createRedirect(request, "/login", { error: "missing_config", redirectTo: pathname });
    }

    return NextResponse.next();
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    const supabase = createServerClient(config.supabaseUrl, config.supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      if (isProtectedPath(pathname)) {
        return createRedirect(request, "/login", { redirectTo: pathname });
      }

      return response;
    }

    if (isLoginRoute) {
      return createRedirect(request, "/");
    }

    if (isUnauthorizedRoute) {
      return response;
    }

    return response;
  } catch {
    if (isProtectedPath(pathname)) {
      return createRedirect(request, "/login", {
        error: "session_unavailable",
        redirectTo: pathname,
      });
    }

    if (isLoginRoute) {
      return response;
    }

    if (isUnauthorizedRoute) {
      return response;
    }

    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
