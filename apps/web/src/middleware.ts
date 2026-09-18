import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;

  // Protect /g/* and /guilds routes
  if ((pathname.startsWith("/g/") || pathname.startsWith("/guilds")) && !isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.url));
  }
});

export const config = {
  matcher: ["/g/:path*", "/guilds/:path*"],
};
