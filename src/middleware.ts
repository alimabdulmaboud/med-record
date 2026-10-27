import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSecurityHeaders } from "@/lib/security/headers";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Apply non-negotiable security headers
  const securityHeaders = getSecurityHeaders();
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  const { pathname } = request.nextUrl;

  // Protect /family paths with consent verification
  if (pathname.startsWith("/family")) {
    const consentCookie = request.cookies.get("med_consent_accepted")?.value;
    if (!consentCookie && !pathname.startsWith("/consent")) {
      // In web flow, redirect to consent if consent cookie is missing
      const consentUrl = new URL("/consent", request.url);
      consentUrl.searchParams.set("redirect", pathname);
      const redirectResponse = NextResponse.redirect(consentUrl);
      for (const [key, value] of Object.entries(securityHeaders)) {
        redirectResponse.headers.set(key, value);
      }
      return redirectResponse;
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
