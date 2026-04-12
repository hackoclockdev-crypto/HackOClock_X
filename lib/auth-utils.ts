import 'server-only';
import { env } from '@/lib/env';

/**
 * Validates if an email is in the list of allowed admin emails.
 * Uses the ADMIN_EMAILS environment variable (comma-separated list).
 */
export function checkIsAdmin(email: string | null | undefined): boolean {
  if (!email) return false;

  const emailsString = env.ADMIN_EMAILS;
  if (!emailsString) {
    // Fallback to legacy single ADMIN_EMAIL or the new ADMIN_EMAIL_2
    const targetEmail = email.toLowerCase();
    return (
      targetEmail === env.ADMIN_EMAIL?.toLowerCase() ||
      targetEmail === env.ADMIN_EMAIL_2?.toLowerCase()
    );
  }

  const allowedEmails = emailsString.split(',').map(e => e.trim().toLowerCase());
  return allowedEmails.includes(email.toLowerCase());
}
