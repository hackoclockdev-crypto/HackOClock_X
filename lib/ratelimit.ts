/**
 * lib/ratelimit.ts
 *
 * Simplified in-memory rate limiting fallbacks.
 *
 * NOTE: Since Upstash Redis was removed as per user request, global rate limiting
 * is disabled. We retain a simple per-instance cooldown to prevent rapid spamming.
 *
 * OWASP A05: Security Misconfiguration — defense-in-depth against brute force and DDoS.
 */

import 'server-only';

// ── Rate limiter mock (Replacing Upstash Redis) ──────────────────────────────

export const contactLimiter = {
  limit: async () => ({ success: true, reset: Date.now() })
};

export const registrationLimiter = {
  limit: async () => ({ success: true, reset: Date.now() })
};

export const uploadLimiter = {
  limit: async () => ({ success: true, reset: Date.now() })
};

export const adminLoginLimiter = {
  limit: async () => ({ success: true, reset: Date.now() })
};

// ── In-memory per-IP cooldown (100ms between requests) ──────────────────────
// This still works per-server-instance and is useful for UI debounce/basic spam.
const lastRequestTime = new Map<string, number>();

export function checkCooldown(ip: string): boolean {
  const now = Date.now();
  const last = lastRequestTime.get(ip) ?? 0;
  if (now - last < 100) {
    return true; 
  }
  lastRequestTime.set(ip, now);
  if (lastRequestTime.size > 10_000) {
    // Basic LRU-ish cleanup to prevent memory leaks
    const firstKey = lastRequestTime.keys().next().value;
    if (firstKey) lastRequestTime.delete(firstKey);
  }
  return false;
}

/**
 * Helper: extract the real client IP from Next.js request headers.
 */
export function getClientIp(request: Request | { headers: Record<string, string | string[] | undefined> } | null): string {
  try {
    if (!request) return '127.0.0.1';

    // 1. Try modern Request/NextRequest (.headers.get())
    if ('headers' in request && typeof request.headers.get === 'function') {
      const forwarded = request.headers.get('x-forwarded-for');
      if (forwarded) return forwarded.split(',')[0].trim();
      return request.headers.get('x-real-ip') ?? '127.0.0.1';
    }

    // 2. Fallback to object-based headers (e.g. NextAuth normalized req)
    if (request.headers) {
      const headers = request.headers as Record<string, string | string[] | undefined>;
      const forwarded = headers['x-forwarded-for'];
      if (forwarded) {
        return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim();
      }
      return (headers['x-real-ip'] as string) ?? '127.0.0.1';
    }
  } catch (err) {
    console.warn('[ratelimit] Failed to parse IP:', err);
  }
  
  return '127.0.0.1';
}
