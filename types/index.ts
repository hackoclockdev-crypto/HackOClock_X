/**
 * types/index.ts
 *
 * Centralized TypeScript interfaces for the Hack0'Clock registration system.
 * These types drive both the database structure and the API response shapes.
 *
 * SECURITY NOTE: Types marked [INTERNAL] must NEVER be sent to the frontend.
 * Always create a sanitized "public" variant before returning from an API route.
 */

import type { Track } from '@/lib/validation';

// ── Authentication ───────────────────────────────────────────────────────────

export interface AdminUser {
  email: string;
  role: 'ADMIN';
  sessionExpiry: number;
}

// ── Registration ─────────────────────────────────────────────────────────────

export type RegistrationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

/**
 * Firestore document shape for a registration.
 * [INTERNAL] — contains paymentScreenshotPath (storage path, not URL).
 * Never send the full document to the client.
 */
export interface Registration {
  id: string;                          // Firestore document ID
  teamName: string;
  teamSize: number;
  track: Track;
  leaderName: string;
  leaderEmail: string;
  leaderPhone: string;                 // Stored as digits only
  memberEmails: string[];
  paymentScreenshotPath: string;       // Firebase Storage path (NOT a URL)
  status: RegistrationStatus;
  adminNote?: string;
  submittedAt: string;                 // ISO 8601 string
  verifiedAt?: string;
  verifiedBy?: string;                 // Admin email
}

/**
 * Public-facing registration summary.
 * Excludes internal fields (storage paths, timestamps in raw format).
 */
export interface RegistrationPublic {
  id: string;
  teamName: string;
  teamSize: number;
  track: Track;
  leaderName: string;
  leaderEmail: string;
  status: RegistrationStatus;
  submittedAt: string;
}

/**
 * Admin view of registration — includes signed URL for screenshot.
 * The signed URL is generated fresh on each admin API call with 15-min TTL.
 */
export interface RegistrationAdminView extends Registration {
  paymentScreenshotSignedUrl: string; // Temporary URL, expires in 15 minutes
}

// ── Contact Form ─────────────────────────────────────────────────────────────

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  submittedAt: string;
  ip: string;                          // [INTERNAL] for abuse tracking only
}

// ── Audit Log ────────────────────────────────────────────────────────────────

/**
 * Audit log entry stored in Firestore `auditLogs` collection.
 * Records every admin authentication attempt.
 * OWASP A07: Authentication Failures — non-repudiation.
 */
export interface AuditLog {
  id: string;
  event: 'ADMIN_LOGIN_SUCCESS' | 'ADMIN_LOGIN_FAILURE' | 'ADMIN_ACTION';
  email: string;
  ip: string;
  userAgent: string;
  timestamp: string;
  details?: Record<string, string>;
}

// ── API Responses ────────────────────────────────────────────────────────────

/**
 * Standard API success response.
 * Never include internal IDs or Firestore metadata.
 */
export interface ApiSuccess<T = void> {
  success: true;
  message: string;
  data?: T;
}

/**
 * Standard API error response.
 * NEVER include stack traces, internal error messages, or database details.
 */
export interface ApiError {
  success: false;
  message: string;        // Generic, user-safe message
  code?: string;          // Machine-readable error code (no internal details)
  retryAfter?: number;    // Seconds (for 429 responses)
}

// ── Dashboard Stats ──────────────────────────────────────────────────────────

export interface DashboardStats {
  totalTeams: number;
  verified: number;
  pending: number;
  rejected: number;
  totalRevenue: number;  // totalTeams * 299
}

// ── NextAuth Session Extension ────────────────────────────────────────────────

declare module 'next-auth' {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isAdmin?: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    isAdmin?: boolean;
  }
}
