/**
 * app/api/admin/verify/route.ts
 *
 * Admin action: verify or reject a registration payment.
 * Refactored for build-safety.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

// ── Next.js Route Configuration ──────────────────────────────────────────────
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { VerifyRegistrationSchema } from '@/lib/validation';
import { supabase } from '@/lib/supabase-admin';
import { checkIsAdmin } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  // ── Build-Time Protection ──────────────────────────────────────────────────
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return new NextResponse('Build-time bypass', { status: 200 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !checkIsAdmin(session.user.email)) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  try {
    const rawBody = await request.json();
    const parseResult = VerifyRegistrationSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid request.', fields: parseResult.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { registrationId, action, adminNote } = parseResult.data;
    const newStatus = action === 'VERIFY' ? 'VERIFIED' : 'REJECTED';

    const { error: updateError } = await supabase
      .from('registrations')
      .update({
        status: newStatus,
        adminNote: adminNote ?? '',
        verifiedAt: new Date().toISOString(),
        verifiedBy: session.user.email,
      })
      .eq('id', registrationId);

    if (updateError) {
      console.error('[admin/verify] Supabase Error:', updateError);
      return NextResponse.json({ success: false, message: 'Failed to update record.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Registration ${newStatus.toLowerCase()} successfully.`,
    });

  } catch (error) {
    console.error('[admin/verify] Error:', error);
    return NextResponse.json({ success: false, message: 'Action failed.' }, { status: 500 });
  }
}
