import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "./api/session";

export async function proxy(request: NextRequest) {
  const sessionId = request.cookies.get("JSESSIONID")?.value;
  const sessionUser = sessionId ? await getSessionUser(sessionId) : null;
  const isAuthenticated = sessionUser !== null;
  const isProtectedAdminRoute = ["/users", "/platforms", "/work-schedules"]
    .some((path) => request.nextUrl.pathname.startsWith(path));

  if ((request.nextUrl.pathname === "/" || isProtectedAdminRoute) && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (request.nextUrl.pathname === "/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/users/:path*", "/platforms/:path*", "/work-schedules/:path*"],
};
