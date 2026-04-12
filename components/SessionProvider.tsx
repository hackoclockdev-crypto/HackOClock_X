/**
 * components/SessionProvider.tsx
 *
 * Thin wrapper around NextAuth's SessionProvider.
 * Must be a Client Component because SessionProvider uses React context.
 * Used in app/layout.tsx to make session available throughout the app.
 */

'use client';

import { SessionProvider } from 'next-auth/react';

export default function NextAuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
