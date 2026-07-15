import { getSupabaseEnv } from "@/lib/supabase/env";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const ALLOWED_EMAIL_DOMAIN = "bbodek.com";

const PUBLIC_PATHS = ["/login", "/auth"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { url: supabaseUrl, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        supabaseResponse = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          supabaseResponse.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 리디렉트 응답에도 갱신된 세션 쿠키(리프레시/로그아웃)를 실어 보내야 함
  function redirectTo(url: URL) {
    const response = NextResponse.redirect(url);
    for (const cookie of supabaseResponse.cookies.getAll()) {
      response.cookies.set(cookie);
    }
    return response;
  }

  // 도메인 화이트리스트 — @bbodek.com 외 계정은 즉시 로그아웃
  if (user && !user.email?.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "domain_not_allowed");
    return redirectTo(url);
  }

  // 비로그인 사용자는 로그인 페이지로
  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return redirectTo(url);
  }

  // 로그인된 사용자가 /login에 오면 홈으로
  if (user && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return redirectTo(url);
  }

  return supabaseResponse;
}
