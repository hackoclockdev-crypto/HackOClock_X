/**
 * app/api/upload/route.ts
 *
 * Secure file upload endpoint.
 * Refactored for build-safety and removed Redis dependency.
 */

import { NextRequest, NextResponse } from 'next/server';

// ── Next.js Route Configuration ──────────────────────────────────────────────
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { uploadLimiter, checkCooldown, getClientIp } from '@/lib/ratelimit';
import { supabase } from '@/lib/supabase-admin';
import { randomUUID } from 'crypto';

const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]],
};

const ALLOWED_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return false;

  for (const signature of signatures) {
    const match = signature.every((byte, index) => buffer[index] === byte);
    if (match) {
      if (mimeType === 'image/webp') {
        const webpMarker = [0x57, 0x45, 0x42, 0x50];
        const webpMatch = webpMarker.every((byte, index) => buffer[8 + index] === byte);
        return webpMatch;
      }
      return true;
    }
  }
  return false;
}

export async function POST(request: NextRequest) {
  // ── Build-Time Protection ──────────────────────────────────────────────────
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return new NextResponse('Build-time bypass', { status: 200 });
  }

  const clientIp = getClientIp(request);

  if (checkCooldown(clientIp)) {
    return NextResponse.json(
      { success: false, message: 'Too many requests. Please wait a moment.' },
      { status: 429, headers: { 'Retry-After': '1' } }
    );
  }

  // Note: Redis logic removed per user request.
  const { success: rateLimitOk, reset } = await uploadLimiter.limit();
  if (!rateLimitOk) {
    const retryAfterSeconds = Math.ceil((reset - Date.now()) / 1000);
    return NextResponse.json(
      { success: false, message: 'Upload limit exceeded. Please try again later.', retryAfter: retryAfterSeconds },
      { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file provided.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, message: 'File must not exceed 5MB.' }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ success: false, message: 'File cannot be empty.' }, { status: 400 });
    }

    const declaredMime = file.type;
    if (!Object.keys(MAGIC_BYTES).includes(declaredMime)) {
      return NextResponse.json(
        { success: false, message: 'Only JPEG, PNG, and WebP images are accepted.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const headerBytes = fileBuffer.slice(0, 16);

    if (!validateMagicBytes(headerBytes, declaredMime)) {
      return NextResponse.json(
        { success: false, message: 'File content does not match the declared type.' },
        { status: 400 }
      );
    }

    const fileExtension = ALLOWED_EXTENSIONS[declaredMime];
    const secureFileName = `${randomUUID()}.${fileExtension}`;

    const { error } = await supabase.storage
      .from('payment-screenshots')
      .upload(secureFileName, fileBuffer, {
        contentType: declaredMime,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('[upload] Supabase Error:', error);
      return NextResponse.json({ success: false, message: 'Upload failed.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully.',
      path: `payment-screenshots/${secureFileName}`,
    });

  } catch (error) {
    console.error('[upload] Internal error:', error);
    return NextResponse.json({ success: false, message: 'Upload failed.' }, { status: 500 });
  }
}
