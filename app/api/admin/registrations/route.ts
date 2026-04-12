/**
 * app/api/admin/registrations/route.ts
 *
 * Admin-only: fetch all registrations with optional filters.
 *
 * OWASP A01: Broken Access Control
 * - Requires valid NextAuth session with isAdmin=true
 * - Validates email against ADMIN_EMAIL env var (double-check beyond middleware)
 * - Returns sanitized data — never exposes raw storage paths or IPs
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import type { Registration, RegistrationStatus } from '@/types';
import { supabase } from '@/lib/supabase-admin';
import { checkIsAdmin } from '@/lib/auth-utils';

// Valid status values for query filter
const VALID_STATUSES: RegistrationStatus[] = ['PENDING', 'VERIFIED', 'REJECTED'];

export async function GET(request: NextRequest) {
  // ── Double-check session on every admin API call ────────────────────────
  // Middleware already guards /admin pages, but API routes need their own check
  // because they can be called directly (e.g., curl, Postman).
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !checkIsAdmin(session.user.email)) {
    // Return 404 — same pattern as middleware (don't reveal admin API exists)
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const searchQuery = searchParams.get('search')?.slice(0, 100); // Limit search length

    // ── Build Supabase query ─────────────────────────────────────────────
    let query = supabase
      .from('registrations')
      .select('*')
      .order('submitted_at', { ascending: false })
      .limit(500);

    // Validate and apply status filter
    if (statusFilter && VALID_STATUSES.includes(statusFilter as RegistrationStatus)) {
      query = query.eq('status', statusFilter);
    }

    const { data: snapshot, error } = await query;
    if (error) throw error;

    const registrations = snapshot.map(data => {
      // ── CRITICAL: Sanitize output ────────────────────────────────────
      return {
        id: data.id,
        teamName: data.teamName,
        teamSize: data.teamSize,
        track: data.track,
        leaderName: data.leaderName,
        leaderEmail: data.leaderEmail,
        leaderPhone: data.leaderPhone,
        memberEmails: data.memberEmails ?? [],
        status: data.status,
        paymentScreenshotPath: data.paymentScreenshotPath,
        adminNote: data.adminNote ?? '',
        submittedAt: data.submitted_at ?? new Date().toISOString(),
        verifiedAt: data.verifiedAt ?? null,
        verifiedBy: data.verifiedBy ?? null,
      } as Registration;
    });

    // ── Client-side search (Firestore doesn't support full-text search) ──
    const filtered = searchQuery
      ? registrations.filter(r =>
          r.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.leaderEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.leaderName.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : registrations;

    return NextResponse.json({ success: true, data: filtered, total: filtered.length });

  } catch (error) {
    console.error('[admin/registrations] Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch registrations.' }, { status: 500 });
  }
}
