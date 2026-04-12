import 'server-only';

/**
 * Validates if an email is in the list of allowed admin emails.
 * Uses the ADMIN_EMAILS environment variable (comma-separated list).
 */
export function checkIsAdmin(email: string | null | undefined): boolean {
  if (!email) return false;

  const emailsString = process.env.ADMIN_EMAILS;
  if (!emailsString) {
    // Fallback to legacy single ADMIN_EMAIL if plural version isn't set yet
    return email.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase();
  }

  const allowedEmails = emailsString.split(',').map(e => e.trim().toLowerCase());
  return allowedEmails.includes(email.toLowerCase());
}
