/**
 * app/layout.tsx
 *
 * Root layout — sets global metadata, fonts, and body classes.
 * Security headers are applied via next.config.js (applies to all routes).
 * This layout sets the HTML lang attribute and canonical meta tags.
 */

import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import '@/lib/env';
import NextAuthProvider from '@/components/SessionProvider';

// ── Google Fonts (loaded server-side, no external requests from browser) ─────
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

// ── Metadata ──────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Hack0'Clock — Where Time Meets Innovation",
  description: "Hack0'Clock — 18-Hour Team Hackathon. Build, innovate, and compete for ₹20,000 in prizes. Register your team now!",
  keywords: ["Hack0'Clock", 'hackathon', '18-hour hackathon', 'team hackathon', 'coding competition', 'innovation'],
  authors: [{ name: "Hack0'Clock Team" }],
  robots: 'index, follow',
  openGraph: {
    title: "Hack0'Clock — Where Time Meets Innovation",
    description: "18-Hour Team Hackathon | ₹20,000 Prize Pool | Register Now",
    type: 'website',
    locale: 'en_IN',
    siteName: "Hack0'Clock",
  },
  twitter: {
    card: 'summary_large_image',
    title: "Hack0'Clock — 18-Hour Team Hackathon",
    description: '₹20,000 Prize Pool | Register your team now!',
  },
  // Prevent search engines from indexing admin pages
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#06b6d4',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-hoc-bg text-white antialiased min-h-screen`}
      >
        <NextAuthProvider>{children}</NextAuthProvider>
      </body>
    </html>
  );
}
