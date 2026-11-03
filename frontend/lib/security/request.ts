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
