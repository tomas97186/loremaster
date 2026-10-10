import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "lm_session";

// Controllo leggero: la validità reale della sessione è verificata nel
// layout (app) e nella pagina di login, che leggono il database.
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE);
  const isAuthRoute = request.nextUrl.pathname.startsWith("/login");

  if (!hasSession && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/health|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
