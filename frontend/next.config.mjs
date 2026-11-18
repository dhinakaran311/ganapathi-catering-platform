import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const isDev = process.env.NODE_ENV !== 'production';

// ── Content Security Policy ──────────────────────────────────────────────────
// Only our own origin, Supabase (data + realtime websocket) and Cloudflare
// Turnstile (bot check) may load code or be contacted. 'unsafe-inline' is
// needed for Next.js' inline bootstrap scripts and the admin theme script;
// 'unsafe-eval' and ws: are added in development only (React Fast Refresh /
// HMR). wa.me / tel: links are navigations and are not affected by CSP.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self' data:",
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com${isDev ? ' ws: http://localhost:*' : ''}`,
  'frame-src https://challenges.cloudflare.com',
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Don't advertise the framework in every response.
  poweredByHeader: false,

  // Dev-only: extra origins allowed to load the dev server (e.g. a phone via
  // a Cloudflare tunnel). Comma-separated, set in .env.local when needed:
  //   DEV_ALLOWED_ORIGINS=my-tunnel.trycloudflare.com
  allowedDevOrigins: (process.env.DEV_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  // The invoice PDF route reads its fonts from disk (assets/fonts) — make
  // sure they are shipped with that serverless function.
  outputFileTracingIncludes: {
    '/api/admin/invoices/*/pdf': ['./assets/fonts/**/*'],
    '/api/invoice-pdf/*': ['./assets/fonts/**/*'],
  },

  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
