import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "./api/session";
import { getSafeReturnPath } from "./api/return-path";

export async function proxy(request: NextRequest) {
  const sessionId = request.cookies.get("JSESSIONID")?.value;
  const sessionUser = sessionId ? await getSessionUser(sessionId) : null;
  const isAuthenticated = sessionUser !== null;
  const isProtectedAdminRoute = ["/manage", "/users", "/platforms", "/work-schedules", "/sites", "/dashboard", "/lunch"]
    .some((path) => request.nextUrl.pathname.startsWith(path));

  if ((request.nextUrl.pathname === "/" || isProtectedAdminRoute) && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (request.nextUrl.pathname === "/login" && isAuthenticated) {
    const returnPath = getSafeReturnPath(request.nextUrl.searchParams.get("next")) ?? "/";
    return NextResponse.redirect(new URL(returnPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/manage", "/manage/:path*", "/users/:path*", "/platforms/:path*", "/work-schedules/:path*", "/sites/:path*", "/dashboard/:path*", "/lunch/:path*"],
};
