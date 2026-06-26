import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isPublic = pathname === "/login" || pathname === "/";

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (session) {
    const role = (session.user as any).role;

    if (pathname === "/dashboard") {
      if (role === "ADMIN")        return NextResponse.redirect(new URL("/admin",        req.url));
      if (role === "SUPPORT")      return NextResponse.redirect(new URL("/support",      req.url));
      if (role === "COMM_SUPPORT") return NextResponse.redirect(new URL("/comm-support", req.url));
      if (role === "COMM_ADMIN")   return NextResponse.redirect(new URL("/comm-admin",   req.url));
      return NextResponse.redirect(new URL("/portal", req.url));
    }

    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (pathname.startsWith("/support") && role !== "SUPPORT" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (pathname.startsWith("/comm-support") && role !== "COMM_SUPPORT" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (pathname.startsWith("/comm-admin") && role !== "COMM_ADMIN" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
