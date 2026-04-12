/**
 * app/api/admin/signed-url/route.ts
 *
 * Generate a temporary signed URL for viewing a payment screenshot.
 *
 * OWASP A01: Broken Access Control / OWASP A04: Insecure Design
 *
 * WHY signed URLs instead of public URLs?
 *  - Public Firebase Storage URLs are permanent and unrevokable once shared.
 *  - Signed URLs expire in 15 minutes, limiting the window for unauthorized sharing.
 *  - The storage path is never embedded in the frontend — only requested here.
 *  - This endpoint is admin-only; regular users cannot generate signed URLs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { supabase } from '@/lib/supabase-admin';
import { checkIsAdmin } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  // ── Admin session check ───────────────────────────────────────────────────
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !checkIsAdmin(session.user.email)) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { path } = body;

    // ── Validate the path ─────────────────────────────────────────────────
    // Only allow paths within our known payment-screenshots prefix.
    // This prevents generating signed URLs for arbitrary storage paths.
    if (
      typeof path !== 'string' ||
      path.length > 500 ||
      !path.startsWith('payment-screenshots/') ||
      path.includes('..') || // Path traversal prevention
      path.includes('\0')    // Null byte injection prevention
    ) {
      return NextResponse.json({ success: false, message: 'Invalid file path.' }, { status: 400 });
    }

    const storageObjectPath = path.replace('payment-screenshots/', '');
    
    const { data: signedUrlData, error } = await supabase.storage
      .from('payment-screenshots')
      .createSignedUrl(storageObjectPath, 15 * 60);

    if (error || !signedUrlData?.signedUrl) {
      console.error('[admin/signed-url] Supabase Storage Error:', error);
      return NextResponse.json({ 
        success: false, 
        message: `Failed to generate URL: ${error?.message || 'Storage error'}` 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      signedUrl: signedUrlData.signedUrl,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });

  } catch (error) {
    console.error('[admin/signed-url] Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to generate URL.' }, { status: 500 });
  }
}
