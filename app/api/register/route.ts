/**
 * app/api/register/route.ts
 *
 * Team registration handler.
 * Refactored for strict server-side Node.js runtime and build-safety.
 *
 * OWASP A03/A05: Injection / Security Misconfiguration
 */

import { NextRequest, NextResponse } from 'next/server';

// ── Next.js Route Configuration ──────────────────────────────────────────────
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { RegistrationSchema } from '@/lib/validation';
import { sanitizeText } from '@/lib/sanitize';
import { registrationLimiter, checkCooldown, getClientIp } from '@/lib/ratelimit';
import { supabase } from '@/lib/supabase-admin';

// ── CORS Configuration ────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:3001',
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
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return new NextResponse('Build-time bypass', { status: 200 });
  }

  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  const clientIp = getClientIp(request);

  // ── 1. In-memory cooldown ─────────────────────────────────────────────────
  if (checkCooldown(clientIp)) {
    return NextResponse.json(
      { success: false, message: 'Too many requests. Please wait a moment.' },
      { status: 429, headers: { ...corsHeaders, 'Retry-After': '1' } }
    );
  }

  // ── 2. Rate limit ─────────────────────────────────────────────────────────
  // Note: Redis logic removed per user request. Simplified mock used.
  const { success: rateLimitOk, reset } = await registrationLimiter.limit();
  if (!rateLimitOk) {
    const retryAfterSeconds = Math.ceil((reset - Date.now()) / 1000);
    return NextResponse.json(
      { success: false, message: 'Registration limit reached. Please try again later.', retryAfter: retryAfterSeconds },
      { status: 429, headers: { ...corsHeaders, 'Retry-After': String(retryAfterSeconds) } }
    );
  }

  try {
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid request format.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // ── 4. Zod validation ────────────────────────────────────────────────
    const parseResult = RegistrationSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const firstError = Object.values(parseResult.error.flatten().fieldErrors)[0]?.[0] || 'Validation failed. Please check your inputs.';
      return NextResponse.json(
        { success: false, message: firstError },
        { status: 422, headers: corsHeaders }
      );
    }

    const validatedData = parseResult.data;

    // ── 5. Duplicate check ──────────────────────────────────────────────
    const { data: existingQuery, error: existingError } = await supabase
      .from('registrations')
      .select('id')
      .eq('leaderEmail', validatedData.leaderEmail)
      .limit(1);

    if (existingError) {
      console.error('[register] Database error:', existingError);
      return NextResponse.json(
        { success: false, message: 'Internal validation failed.' },
        { status: 500, headers: corsHeaders }
      );
    }

    if (existingQuery && existingQuery.length > 0) {
      return NextResponse.json(
        { success: false, message: 'A registration with this email already exists.' },
        { status: 409, headers: corsHeaders }
      );
    }

    // ── 6. Verify payment screenshot path exists ──────────────────────────
    if (!validatedData.paymentScreenshotPath.startsWith('payment-screenshots/')) {
      return NextResponse.json(
        { success: false, message: 'Invalid payment screenshot. Please upload again.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // ── 7. Sanitize all text fields before storage ─────────────────────────
    const sanitizedData = {
      teamName: await sanitizeText(validatedData.teamName),
      teamSize: validatedData.teamSize,
      track: validatedData.track,
      leaderName: await sanitizeText(validatedData.leaderName),
      leaderEmail: await sanitizeText(validatedData.leaderEmail),
      leaderPhone: await sanitizeText(validatedData.leaderPhone),
      memberEmails: validatedData.memberEmails ? await Promise.all(validatedData.memberEmails.map(e => sanitizeText(e))) : [],
      paymentScreenshotPath: validatedData.paymentScreenshotPath,
      status: 'PENDING',
      submittedFromIp: clientIp,
    };

    // ── 8. Write to Supabase ──────────────────────────────────────────────
    const { error: insertError } = await supabase
      .from('registrations')
      .insert([sanitizedData]);
      
    if (insertError) {
      console.error('[register] Supabase Insert Error:', insertError);
      return NextResponse.json(
        { success: false, message: 'Database constraint error.' },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Your Hack0'Clock registration is submitted! We'll verify your payment within 24 hours.",
      },
      { status: 201, headers: corsHeaders }
    );

  } catch (error) {
    console.error('[register] Internal error:', error);
    return NextResponse.json(
      { success: false, message: 'Registration failed. Please try again.' },
      { status: 500, headers: corsHeaders }
    );
  }
}
