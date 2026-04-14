/**
 * app/api/contact/route.ts
 *
 * Contact form handler with rate limiting, Zod validation, and sanitization.
 * Refactored for strict server-side Node.js runtime and build-safety.
 *
 * OWASP A03/A05: Injection / Security Misconfiguration
 */

import { NextRequest, NextResponse } from 'next/server';

// ── Next.js Route Configuration ──────────────────────────────────────────────
// These must be at the top level to be recognized by the Next.js compiler.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ── Build-Safe Imports ──────────────────────────────────────────────────────
// We keep these imports here, but we will ensure they don't trigger side effects.
import { ContactSchema } from '@/lib/validation';
import { sanitizeText } from '@/lib/sanitize';
import { contactLimiter, checkCooldown, getClientIp } from '@/lib/ratelimit';
import { supabase } from '@/lib/supabase-admin';

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  'http://localhost:3000',
];

function getCorsHeaders(origin: string | null) {
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'false',
    'Vary': 'Origin',
  };
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, { status: 200, headers: getCorsHeaders(origin) });
}

export async function POST(request: NextRequest) {
  // ── Build-Time Protection ──────────────────────────────────────────────────
  // If Next.js tries to "collect data" for this route during build, we bail out 
  // immediately to prevent any side-effect heavy code from running.
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return new NextResponse('Build-time bypass', { status: 200 });
  }

  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  const clientIp = getClientIp(request);

  // ── In-memory cooldown ────────────────────────────────────────────────────
  if (checkCooldown(clientIp)) {
    return NextResponse.json(
      { success: false, message: 'Too many requests. Please slow down.' },
      { status: 429, headers: { ...corsHeaders, 'Retry-After': '1' } }
    );
  }

  // ── Rate limit ───────────────────────────────────────────────────────────
  // Note: Redis-based limiting was removed per user request. 
  // This now uses a simplified mock that always succeeds.
  const { success: rateLimitOk, reset } = await contactLimiter.limit();
  if (!rateLimitOk) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    return NextResponse.json(
      { success: false, message: 'Too many contact submissions. Please try again later.', retryAfter },
      { status: 429, headers: { ...corsHeaders, 'Retry-After': String(retryAfter) } }
    );
  }

  try {
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid request format.' }, { status: 400, headers: corsHeaders });
    }

    // ── Zod validation ────────────────────────────────────────────────────
    const parseResult = ContactSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, message: 'Validation failed.', fields: parseResult.error.flatten().fieldErrors },
        { status: 422, headers: corsHeaders }
      );
    }

    const data = parseResult.data;

    // ── Sanitize and store ────────────────────────────────────────────────
    const safeMessage = await sanitizeText(data.message);
    const safeTeamNo = data.teamNo ? await sanitizeText(data.teamNo) : '';
    
    const finalMessage = safeTeamNo 
      ? `[Team No: ${safeTeamNo}]\n\n${safeMessage}` 
      : safeMessage;

    const { error: dbError } = await supabase.from('contact_submissions').insert([{
      name: await sanitizeText(data.name),
      email: await sanitizeText(data.email),
      subject: await sanitizeText(data.subject),
      message: finalMessage,
      ip: clientIp,
    }]);

    if (dbError) {
      throw dbError;
    }

    return NextResponse.json(
      { success: true, message: 'Your message has been received. We\'ll get back to you soon!' },
      { status: 201, headers: corsHeaders }
    );

  } catch (error) {
    console.error('[contact] Internal error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send message. Please try again.' },
      { status: 500, headers: corsHeaders }
    );
  }
}
