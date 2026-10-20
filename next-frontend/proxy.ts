import { NextResponse, type NextRequest } from "next/server";
import { hasValidSession } from "./api/session";

export async function proxy(request: NextRequest) {
  const sessionId = request.cookies.get("JSESSIONID")?.value;
  const isAuthenticated = sessionId ? await hasValidSession(sessionId) : false;

  if ((request.nextUrl.pathname === "/" || request.nextUrl.pathname.startsWith("/users")) && !isAuthenticated) {
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
