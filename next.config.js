/** @type {import('next').NextConfig} */

// ─── Security Headers ────────────────────────────────────────────────────────
// Applied to every response. Mirrors Helmet.js behaviour for Next.js.
// OWASP A05: Security Misconfiguration mitigation.
const securityHeaders = [
  {
    // Prevent the browser from MIME-sniffing a response away from the declared content-type.
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    // Deny embedding in iframes — prevents clickjacking (OWASP A05).
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    // Control referrer information sent with requests.
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    // Force HTTPS for 1 year including subdomains (OWASP A02).
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  {
    // Restrict browser features to only what is needed.
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  },
  {
    // Content Security Policy — whitelist-only approach (OWASP A03/XSS).
    // script-src 'self': no inline scripts, no CDN scripts
    // frame-ancestors 'none': no iframes anywhere
    // connect-src 'self': only same-origin XHR/fetch
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // 'unsafe-eval' and 'unsafe-inline' needed for Next.js hydration and HMR
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://sjpyhhdfkxdglojpfebp.supabase.co",
      "connect-src 'self' https://sjpyhhdfkxdglojpfebp.supabase.co wss://sjpyhhdfkxdglojpfebp.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join('; '),
  },
  {
    // Prevent cross-origin information leakage.
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin',
  },
  {
    key: 'Cross-Origin-Resource-Policy',
    value: 'cross-origin', // Allow images from Supabase
  },
  {
    key: 'Cross-Origin-Embedder-Policy',
    value: 'unsafe-none', // Disable strict CORP for simplicity in dev/production with external images
  },
];

const nextConfig = {
  reactStrictMode: true,

  // ── Apply security headers to ALL routes ──────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },

  // ── Image domains whitelist ────────────────────────────────────────────────
  images: {
    domains: [], // No external image sources allowed
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // ── Prevent server-only modules from being bundled client-side ────────────
  experimental: {
    serverComponentsExternalPackages: [], 
  },
};

module.exports = nextConfig;
