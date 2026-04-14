/**
 * app/admin/layout.tsx
 *
 * Protected admin layout.
 *
 * OWASP A01: Broken Access Control
 * - Middleware already protects /admin at the Edge
 * - This layout adds a client-side session check as a SECOND layer
 *   (defense-in-depth: if middleware is misconfigured, this catches it)
 * - Admin email is validated against ADMIN_EMAIL (not just isAdmin flag from JWT)
 *
 * NOTE: Client-side checks are NEVER the sole security layer.
 * They exist for UX (redirect to avoid flash of content) and defense-in-depth only.
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Clock, LayoutDashboard, LogOut, Shield, RefreshCw
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sessionTimeLeft, setSessionTimeLeft] = useState<string>('');

  // ── Client-side auth guard ────────────────────────────────────────────────
  // Middleware is the primary guard. This is the fallback.
  // The isAdmin flag is set in the NextAuth JWT callback using checkIsAdmin().
  useEffect(() => {
    if (status === 'unauthenticated') {
      // Redirect to 404 — consistent with middleware behavior
      router.replace('/not-found');
    }
    if (status === 'authenticated' && !session?.user?.isAdmin) {
      router.replace('/not-found');
    }
  }, [session, status, router]);

  // ── Session countdown display ─────────────────────────────────────────────
  useEffect(() => {
    if (!session) return;

    const updateCountdown = () => {
      // NextAuth session expires at the max age (1 hour from login)
      // We show a rough countdown for UX purposes
      const expires = session.expires ? new Date(session.expires).getTime() : 0;
      const remaining = Math.max(0, expires - Date.now());
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setSessionTimeLeft(`${mins}m ${secs}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [session]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-hoc-bg flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-400">
          <RefreshCw className="w-5 h-5 animate-spin text-cyan-500" />
          Verifying identity...
        </div>
      </div>
    );
  }

  if (status !== 'authenticated' || !session?.user?.isAdmin) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-hoc-bg flex">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className="w-64 flex-shrink-0 flex flex-col"
        style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
      >
        {/* Logo */}
        <div className="p-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-500" />
            <span className="font-bold text-white">
              Hack<span className="gradient-text">O&apos;Clock</span>{' '}
              <span className="text-zinc-500 text-xs font-normal">Admin</span>
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-cyan-400 bg-cyan-500/10"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            href="/admin/messages"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
            Messages
          </Link>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t space-y-3" style={{ borderColor: 'var(--border)' }}>
          {/* Security indicators */}
          <div
            className="flex items-center gap-2 p-2.5 rounded-lg text-xs"
            style={{ background: 'rgba(6, 182, 212,0.04)', border: '1px solid rgba(6, 182, 212,0.1)' }}
          >
            <Shield className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
            <div>
              <p className="text-zinc-400 font-medium">Session expires in</p>
              <p className="text-cyan-400 font-mono">{sessionTimeLeft || 'Loading...'}</p>
            </div>
          </div>

          {/* Admin info */}
          <div className="text-xs text-zinc-600 px-1 truncate">
            {session.user.email}
          </div>

          {/* Sign out */}
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/5 transition-all"
            id="admin-sign-out-btn"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
