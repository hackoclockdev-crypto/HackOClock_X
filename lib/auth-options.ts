/**
 * lib/auth-options.ts
 *
 * NextAuth.js configuration decoupled from the route handler.
 * This is required for compatibility with Next.js 13+ App Router
 * and allows importing authOptions in other server components/routes.
 */

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { adminLoginLimiter, getClientIp } from '@/lib/ratelimit';
import { supabase } from '@/lib/supabase-admin';
import { checkIsAdmin } from '@/lib/auth-utils';

export const authOptions: NextAuthOptions = {
  // ── Session Strategy ─────────────────────────────────────────────────────
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60, // 1 hour — auto-logout after inactivity
  },

  // ── Providers ────────────────────────────────────────────────────────────
  providers: [
    // ── Admin Credentials Provider ─────────────────────────────────────────
    CredentialsProvider({
      id: 'admin-credentials',
      name: 'Admin Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        // req here is the normalized internal request object, not the raw NextRequest
        const ip = getClientIp(req as { headers: Record<string, string> });
        // Safely extract user agent without 'any'
        const headers = req?.headers as Record<string, string> | undefined;
        const userAgent = headers?.['user-agent'] || 'unknown';

        // ── 1. Rate Limiting ─────────────────────────────────────────────
        const { success: rateLimitOk } = await adminLoginLimiter.limit();
        if (!rateLimitOk) {
          await logAdminAttempt('ADMIN_LOGIN_FAILURE', credentials?.email ?? 'unknown', ip, userAgent, 'TOO_MANY_ATTEMPTS');
          throw new Error('TOO_MANY_ATTEMPTS');
        }

        // ── 2. Credential Verification ───────────────────────────────────
        const isValidEmail = checkIsAdmin(credentials?.email);
        const isValidPassword = credentials?.password === process.env.ADMIN_PASSWORD;

        if (!isValidEmail || !isValidPassword) {
          await logAdminAttempt('ADMIN_LOGIN_FAILURE', credentials?.email ?? 'unknown', ip, userAgent, 'INVALID_CREDENTIALS');
          return null;
        }

        // ── 3. Success Audit ─────────────────────────────────────────────
        await logAdminAttempt('ADMIN_LOGIN_SUCCESS', credentials!.email, ip, userAgent, 'OK');

        return {
          id: 'admin',
          email: credentials!.email,
          name: 'HackO\'Clock Admin',
        };
      },
    }),
  ],

  // ── JWT Callbacks ────────────────────────────────────────────────────────
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.isAdmin = checkIsAdmin(user.email);
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
  },

  // ── Pages ────────────────────────────────────────────────────────────────
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  // ── Security ─────────────────────────────────────────────────────────────
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

// ── Audit Log Helper ─────────────────────────────────────────────────────────

async function logAdminAttempt(
  event: 'ADMIN_LOGIN_SUCCESS' | 'ADMIN_LOGIN_FAILURE',
  email: string,
  ip: string,
  userAgent: string,
  reason: string
) {
  try {
    await supabase.from('audit_logs').insert([{
      event,
      email,
      ip,
      user_agent: userAgent,
      reason,
      timestamp: new Date().toISOString()
    }]);
  } catch (err) {
    console.error('[audit] Failed to write audit log:', err);
  }
}
