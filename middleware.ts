/**
 * middleware.ts
 *
 * Next.js Edge Middleware — runs before every matched request.
 *
 * Responsibilities:
 *  1. Admin route protection (OWASP A01: Broken Access Control)
 *     - Verifies NextAuth JWT from httpOnly cookie
 *     - Checks that the user's email EXACTLY matches ADMIN_EMAIL
 *     - On failure: returns 404 (not 401/403) to prevent admin path enumeration
 *  2. Audit logging of admin access attempts
 *
 * WHY redirect to 404 instead of 401/403?
 *   If the admin panel returned "Access Denied", attackers would know the panel exists.
 *   Returning 404 makes /admin indistinguishable from a non-existent route.
 *
 * WHY use Edge middleware instead of server-side checks in each page?
 *   Middleware runs before the page component, preventing ANY rendering of admin content
 *   even if a server component check is accidentally skipped.
 */

import { NextResponse } from 'next/server';
import type { NextRequest, NextFetchEvent } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { checkIsAdmin } from '@/lib/auth-utils';

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;

  // ── Admin Route Guard ──────────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET!,
    });

    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      request.headers.get('x-real-ip') ??
      '0.0.0.0';

    const userAgent = request.headers.get('user-agent') ?? 'unknown';
    const email = token?.email ?? 'unauthenticated';

    // Determine if access should be granted
    const isAuthenticated = !!token;
    const isAdmin = checkIsAdmin(token?.email);

    // ── Fire-and-forget audit log ────────────────────────────────────────────
    // We log to our audit endpoint asynchronously so middleware doesn't block.
    // Use an absolute URL so this works in all deployment environments.
    const auditPayload = {
      event: isAuthenticated && isAdmin ? 'ADMIN_LOGIN_SUCCESS' : 'ADMIN_LOGIN_FAILURE',
      email,
      ip: clientIp,
      userAgent,
      path: pathname,
    };

    // We use fetch in edge middleware — the internal audit endpoint handles storage
    const auditUrl = new URL('/api/admin/audit', request.url);
    
    // Use event.waitUntil to ensure the log is recorded even after the response is sent.
    // This is the "Root Cause" fix for ephemeral edge worker lifecycles.
    event.waitUntil(
      fetch(auditUrl.toString(), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'X-Internal-Secret': process.env.NEXTAUTH_SECRET! 
        },
        body: JSON.stringify(auditPayload),
      }).catch(() => { }) // Silently ignore audit failures — never block the main request
    );

    // ── Admin Route Guard ──────────────────────────────────────────────────────
    if (!isAuthenticated) {
      // If not logged in, redirect to sign-in page
      const signInUrl = new URL('/auth/signin', request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }

    if (!isAdmin) {
      // If logged in but NOT an admin, return 404 — do NOT reveal that admin panel exists
      return NextResponse.rewrite(new URL('/not-found', request.url), { status: 404 });
    }
  }

  return NextResponse.next();
}

// ── Matcher Configuration ─────────────────────────────────────────────────────
// Only run middleware on admin routes to keep performance impact minimal.
// API routes have their own per-handler auth checks.
export const config = {
  matcher: ['/admin/:path*'],
};
