/**
 * lib/env.ts
 *
 * Zod-backed environment variable validator.
 * This ensures the app "fails-fast" (via high-visibility logs) if critical secrets are missing.
 *
 * Resilience: This script will NEVER throw a hard Error that crashes the process. 
 * Instead, it logs a massive report and uses safe "mock" values to allow the 
 * build/development server to continue running.
 */

import { z } from 'zod';

const envSchema = z.object({
  // NextAuth
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url().optional(),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Admin Access
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(8),

  // Pricing/UPI
  NEXT_PUBLIC_UPI_ID: z.string().min(1),
  NEXT_PUBLIC_PAYMENT_AMOUNT: z.string().regex(/^\d+$/).transform(Number),
});

const MOCK_ENV: z.infer<typeof envSchema> = {
  NEXTAUTH_SECRET: 'placeholder_at_least_32_characters_long',
  NEXTAUTH_URL: 'http://localhost:3000',
  NEXT_PUBLIC_SUPABASE_URL: 'https://placeholder.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'placeholder',
  ADMIN_EMAIL: 'admin@placeholder.com',
  ADMIN_PASSWORD: 'placeholder_password',
  NEXT_PUBLIC_UPI_ID: 'placeholder@upi',
  NEXT_PUBLIC_PAYMENT_AMOUNT: 350,
};

const parsed = envSchema.safeParse(process.env);

let validatedEnv: z.infer<typeof envSchema>;

if (!parsed.success) {
  // ── Configuration Error Detected ──────────────────────────────────────────
  console.error('\n' + '='.repeat(60));
  console.error('❌  CRITICAL: INVALID ENVIRONMENT CONFIGURATION');
  console.error('='.repeat(60));
  
  const errors = parsed.error.flatten().fieldErrors;
  Object.entries(errors).forEach(([field, messages]) => {
    console.error(`  - ${field}: ${messages?.join(', ')}`);
  });

  console.error('\n⚠️  The application will continue starting with MOCK values.');
  console.error('👉  Fix your .env.local or Vercel settings to resolve this.');
  console.error('='.repeat(60) + '\n');

  validatedEnv = MOCK_ENV;
} else {
  validatedEnv = parsed.data;
}

export const env = validatedEnv;
