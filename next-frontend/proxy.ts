import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "./api/session";

export async function proxy(request: NextRequest) {
  const sessionId = request.cookies.get("JSESSIONID")?.value;
  const sessionUser = sessionId ? await getSessionUser(sessionId) : null;
  const isAuthenticated = sessionUser !== null;
  const isUsersRoute = request.nextUrl.pathname.startsWith("/users");

  if ((request.nextUrl.pathname === "/" || isUsersRoute) && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (request.nextUrl.pathname === "/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/users/:path*"],
};
