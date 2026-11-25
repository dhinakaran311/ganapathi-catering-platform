// lib/theme-settings.ts — A4: map Admin → Settings → Theme to CSS variables
// for the public website (pure, client-safe; the DB read is in
// theme-settings.server.ts).
//
// Only values that DIFFER from the original defaults are applied, so an
// untouched theme leaves the site exactly as designed. Every value is
// validated before it reaches CSS (hex colours, safe font names, local or
// Supabase-hosted logo URLs only).

import type { CSSProperties } from 'react';

const DEFAULTS = {
  primary: '#1a3d20',     // leaf green
  secondary: '#b8860b',   // brass
  accent: '#25d366',      // WhatsApp green
  fontHeading: 'playfair display',
  fontBody: 'noto sans',
};

const HEX = /^#[0-9a-f]{6}$/i;
const FONT_NAME = /^[A-Za-z0-9 \-]{1,60}$/;

export interface SiteTheme {
  /** CSS variables for <body style>. Empty when nothing is customised. */
  style: CSSProperties;
  /** Custom logo URL, or null to keep the bundled logo. */
  logoUrl: string | null;
}

/** Readable text colour (dark ink or white) for a hex background. */
function contrastText(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.45 ? '#0D2611' : '#FFFFFF';
}

function safeLogo(url: string | null | undefined): string | null {
  const u = (url ?? '').trim();
  if (!u || u === '/logos/logo-512.png' || u === '/logos/logo-192.png') return null;
  if (u.startsWith('/') && !u.startsWith('//')) return u;
  if (/^https:\/\/[a-z0-9-]+\.supabase\.co\//i.test(u)) return u;
  return null; // anything else is ignored (also blocked by the CSP)
}

export interface ThemeRow {
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
  font_heading?: string | null;
  font_body?: string | null;
  logo_url?: string | null;
}

/** Pure: theme_settings row → CSS variables + logo (only customised values). */
export function buildSiteTheme(data: ThemeRow | null | undefined): SiteTheme {
  if (!data) return { style: {}, logoUrl: null };
  const vars: Record<string, string> = {};
  const custom = (value: unknown, def: string, re: RegExp) =>
    typeof value === 'string' && re.test(value.trim()) && value.trim().toLowerCase() !== def
      ? value.trim()
      : null;

  const primary = custom(data.primary_color, DEFAULTS.primary, HEX);
  if (primary) {
    vars['--site-leaf'] = primary;
    vars['--site-leaf-deep'] = `color-mix(in srgb, ${primary} 55%, #000)`;
    vars['--site-leaf-bright'] = `color-mix(in srgb, ${primary} 80%, #fff)`;
  }

  const secondary = custom(data.secondary_color, DEFAULTS.secondary, HEX);
  if (secondary) {
    vars['--site-brass'] = secondary;
    vars['--site-brass-text'] = `color-mix(in srgb, ${secondary} 60%, #000)`;
    vars['--site-brass-light'] = `color-mix(in srgb, ${secondary} 55%, #fff)`;
  }

  const accent = custom(data.accent_color, DEFAULTS.accent, HEX);
  if (accent) {
    vars['--site-wa-bg'] = accent;
    vars['--site-wa-bg-hover'] = `color-mix(in srgb, ${accent} 82%, #000)`;
    vars['--site-wa-fg'] = contrastText(accent);
  }

  const heading = custom(data.font_heading, DEFAULTS.fontHeading, FONT_NAME);
  if (heading) {
    vars['--site-serif'] = `"${heading}", var(--font-serif-latin), var(--font-serif-tamil), Georgia, serif`;
  }
  const body = custom(data.font_body, DEFAULTS.fontBody, FONT_NAME);
  if (body) {
    vars['--site-sans'] = `"${body}", var(--font-body), var(--font-tamil), system-ui, sans-serif`;
  }

  return { style: vars as CSSProperties, logoUrl: safeLogo(data.logo_url) };
}
