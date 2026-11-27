// lib/security/request.ts — helpers for public API routes (server-only).
//
// Client IPs are never stored raw: they are salted + hashed before being used
// as a rate-limit bucket key.

import { createHash } from 'crypto';
import type { NextRequest } from 'next/server';

/** Best-effort client IP (Vercel sets x-forwarded-for / x-real-ip). */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

/**
 * The site's PUBLIC origin as the browser sees it (e.g.
 * https://ganapathi-catering-platform.onrender.com).
 *
 * Behind Render's proxy the standalone server listens on 0.0.0.0:10000, so
 * req.url / req.nextUrl.origin are that internal address. The proxy passes
 * the real host in x-forwarded-host / host and the scheme in
 * x-forwarded-proto. Falls back to req.nextUrl.origin (local dev).
 */
export function getPublicOrigin(req: NextRequest): string {
  const host = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '').split(',')[0].trim();
  if (!host || host.startsWith('0.0.0.0')) return req.nextUrl.origin;
  const proto = (req.headers.get('x-forwarded-proto') || req.nextUrl.protocol.replace(':', '') || 'https')
    .split(',')[0].trim();
  return `${proto}://${host}`;
}

/** One-way hash so rate-limit rows never contain personal data. */
export function hashIdentifier(value: string): string {
  const salt = process.env.RATE_LIMIT_SALT || 'sgm-rate-limit';
  return createHash('sha256').update(`${salt}:${value}`).digest('hex').slice(0, 32);
}

/**
 * Honeypot check. Forms render a visually hidden "website" field that real
 * users never fill in; bots that auto-fill every input do.
 */
export function isHoneypotTripped(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}
