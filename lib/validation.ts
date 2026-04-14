/**
 * lib/validation.ts
 *
 * Strict Zod schemas for ALL user inputs.
 *
 * OWASP A03: Injection — input validation is the first line of defense.
 * Every schema:
 *   - Uses .strict() to reject unknown keys (prevents mass assignment)
 *   - Validates string lengths to prevent denial-of-service via large payloads
 *   - Applies regex patterns for structured fields (email, phone)
 *   - Uses z.enum() for controlled-vocabulary fields (track, team size)
 *
 * These schemas are used ONLY in server-side route handlers.
 * Never import this in client components for "validation" — client-side
 * validation is UX only, server validation is security.
 */

import { z } from 'zod';

// ── Constants ────────────────────────────────────────────────────────────────

// RFC 5322-compliant email regex (strict)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

// Indian phone number: 10 digits, optionally prefixed with +91 or 0
const PHONE_REGEX = /^(\+91|91|0)?[6-9]\d{9}$/;

// Team name: alphanumeric, spaces, hyphens, underscores only (prevents injection)
const TEAM_NAME_REGEX = /^[a-zA-Z0-9\s\-_]+$/;

// Valid hackathon tracks
export const VALID_TRACKS = [
  'AI_ML',
  'CYBERSECURITY',
  'HEALTHTECH',
  'FINTECH',
  'SUSTAINABILITY_ENV',
] as const;

export type Track = typeof VALID_TRACKS[number];

// ── Registration Schema ──────────────────────────────────────────────────────

export const RegistrationSchema = z.object({
  // Team information
  teamName: z
    .string()
    .min(3, 'Team name must be at least 3 characters')
    .max(50, 'Team name must not exceed 50 characters')
    .regex(TEAM_NAME_REGEX, 'Team name can only contain letters, numbers, spaces, hyphens, and underscores')
    .transform(s => s.trim()),

  teamSize: z
    .number()
    .int('Team size must be a whole number')
    .min(2, 'Minimum team size is 2')
    .max(4, 'Maximum team size is 4'),

  // Track selection (enum prevents injection)
  track: z.enum(VALID_TRACKS, {
    message: 'Please select a valid hackathon track',
  }),

  // Team leader details
  leaderName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s.'-]+$/, 'Name can only contain letters, spaces, and basic punctuation')
    .transform(s => s.trim()),

  leaderEmail: z
    .string()
    .max(254, 'Email must not exceed 254 characters')
    .regex(EMAIL_REGEX, 'Please enter a valid email address')
    .transform(s => s.toLowerCase().trim()),

  leaderPhone: z
    .string()
    // Strip all non-digit characters before validation
    .transform(s => s.replace(/\D/g, ''))
    .pipe(
      z.string()
        .min(10, 'Phone number must be at least 10 digits')
        .max(12, 'Phone number must not exceed 12 digits')
        .regex(PHONE_REGEX, 'Please enter a valid Indian phone number')
    ),

  // Payment screenshot storage path (returned from /api/upload, never a URL)
  paymentScreenshotPath: z
    .string()
    .min(1, 'Payment screenshot is required')
    .max(500, 'Invalid file path')
    // Must look like a Firebase Storage path (not a URL)
    .refine(s => !s.startsWith('http'), 'Invalid payment path — URL not accepted'),

  // Optional member emails (besides leader)
  memberEmails: z
    .array(
      z.string()
        .max(254)
        .regex(EMAIL_REGEX, 'Invalid member email address')
        .transform(s => s.toLowerCase().trim())
    )
    .max(3, 'Too many member emails')
    .optional()
    .default([]),

}).strict(); // .strict() rejects any keys not defined above — prevents mass assignment

export type RegistrationInput = z.infer<typeof RegistrationSchema>;

// ── Contact Form Schema ──────────────────────────────────────────────────────

export const ContactSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s.'-]+$/, 'Name contains invalid characters')
    .transform(s => s.trim()),

  email: z
    .string()
    .max(254)
    .regex(EMAIL_REGEX, 'Please enter a valid email address')
    .transform(s => s.toLowerCase().trim()),

  teamNo: z
    .string()
    .max(50, 'Team name/number must not exceed 50 characters')
    .optional()
    .transform(s => s?.trim() || ''),

  subject: z
    .string()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject must not exceed 200 characters')
    .transform(s => s.trim()),

  message: z
    .string()
    .min(20, 'Message must be at least 20 characters')
    .max(2000, 'Message must not exceed 2000 characters')
    .transform(s => s.trim()),

}).strict();

export type ContactInput = z.infer<typeof ContactSchema>;

// ── Admin Verify Schema ──────────────────────────────────────────────────────

export const VerifyRegistrationSchema = z.object({
  registrationId: z
    .string()
    .min(1)
    .max(128)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid registration ID'),

  action: z.enum(['VERIFY', 'REJECT'] as const, {
    message: 'Action must be VERIFY or REJECT',
  }),

  adminNote: z
    .string()
    .max(500)
    .optional()
    .transform(s => s?.trim()),

}).strict();

export type VerifyRegistrationInput = z.infer<typeof VerifyRegistrationSchema>;

// ── File Upload Headers Schema ────────────────────────────────────────────────

export const UploadMetadataSchema = z.object({
  fileName: z
    .string()
    .min(1)
    .max(255)
    .transform(s => s.trim()),

  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp'] as const, {
    message: 'File must be JPEG, PNG, or WebP',
  }),

  fileSize: z
    .number()
    .int()
    .min(1, 'File cannot be empty')
    .max(5 * 1024 * 1024, 'File must not exceed 5MB'),
}).strict();

export type UploadMetadata = z.infer<typeof UploadMetadataSchema>;
