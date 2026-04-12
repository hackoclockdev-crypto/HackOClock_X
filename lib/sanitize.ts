/**
 * lib/sanitize.ts
 *
 * Unified DOMPurify wrapper for both server and client environments.
 * 
 * Resilience Note: marked with 'server-only' to ensure it doesn't accidentally
 * leak into client-side bundles which can trigger CSS/DOM-collection errors.
 */

import 'server-only';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let purifyInstance: any = null;

async function getPurify() {
  if (!purifyInstance) {
    // Only import on demand to avoid build-time asset issues
    const DOMPurify = (await import('isomorphic-dompurify')).default;
    purifyInstance = DOMPurify;
  }
  return purifyInstance;
}

/**
 * Server-side text sanitizer.
 * Strips ALL HTML tags and potentially dangerous attributes from the input.
 */
export async function sanitizeText(input: string): Promise<string> {
  if (typeof input !== 'string') return '';

  const purify = await getPurify();
  return purify.sanitize(input.trim(), {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    FORCE_BODY: true,
  });
}

/**
 * Server-side HTML sanitizer for cases where basic formatting is needed.
 */
export async function sanitizeHtml(input: string): Promise<string> {
  if (typeof input !== 'string') return '';

  const purify = await getPurify();
  return purify.sanitize(input.trim(), {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p'],
    ALLOWED_ATTR: [],
    FORCE_BODY: true,
  });
}

/**
 * Sanitize an object's string fields recursively.
 */
export async function sanitizeObject<T extends Record<string, unknown>>(obj: T): Promise<T> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = await sanitizeText(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = await sanitizeObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}
