import { NextRequest, NextResponse } from "next/server";
import {
  getSessionCookieName,
  isAuthEnabled,
  verifySessionToken,
} from "@/lib/auth/session";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export async function proxy(request: NextRequest) {
  if (!isAuthEnabled()) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/login";
  const isLoginApi = pathname === "/api/auth/login";
  const isPublic = isLoginPage || isLoginApi;

  const token = request.cookies.get(getSessionCookieName())?.value;
  let session = null;
  try {
    session = await verifySessionToken(token);
  } catch {
    session = null;
  }

  if (!session && !isPublic) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}
