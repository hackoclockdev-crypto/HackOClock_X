/**
 * app/api/admin/audit/route.ts
 *
 * Internal endpoint called by middleware to log admin access attempts.
 * Protected by an internal secret header — not a public endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { supabase } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  // ── Validate internal secret ──────────────────────────────────────────────
  // This endpoint is called by our own middleware, not by users.
  // The internal secret prevents external actors from writing fake audit logs.
  const internalSecret = request.headers.get('x-internal-secret');
  if (internalSecret !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { event, email, ip, userAgent, path } = body;

    // Basic validation of audit payload structure
    if (!event || !email || !ip) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    await supabase.from('audit_logs').insert([{
      event: String(event).slice(0, 100),
      email: String(email).slice(0, 254),
      ip: String(ip).slice(0, 45), // Max IPv6 length
      user_agent: String(userAgent).slice(0, 500),
      path: String(path).slice(0, 500),
    }]);

    return NextResponse.json({ success: true });
  } catch (error) {
    // Silently fail — audit logging should never crash the system
    console.error('[audit] Write failed:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
