import NextAuth from "next-auth";
import authConfig from "@/lib/auth/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

const PUBLIC_ROUTES = ["/login", "/error"];

export default middleware(async (req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    // Redirect logged-in users away from /login
    if (session?.user && pathname === "/login") {
      return Response.redirect(new URL("/dashboard", req.url));
    }
    return; // NextResponse.next() equivalent
  }

  // Require auth for everything else
  if (!session?.user) {
    return Response.redirect(new URL("/login", req.url));
  }

  // All other checks (workspace membership etc.) happen in API routes / page loaders
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};