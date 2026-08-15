import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/groups");
  const isAuthPage = pathname === "/";

  if (!isProtectedRoute && !isAuthPage) {
    return NextResponse.next();
  }

  // Check for the better-auth session cookie directly to avoid internal HTTP fetch overhead
  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  // We consider the user tentatively authenticated if the token exists.
  // The actual server components will perform the strict DB validation.
  const session = sessionToken ? true : null;

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
