import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  return NextResponse.next({
    request
  });
}

export const config = {
  matcher: ["/account/:path*", "/mijn-recepten/:path*", "/abonnement/:path*"]
};
