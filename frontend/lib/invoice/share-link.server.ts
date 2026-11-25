// lib/invoice/share-link.server.ts — Signed, expiring links to an invoice PDF
// that a customer can open from WhatsApp without logging in.
//
// Token = <invoice id hex>.<expiry, base36 seconds>.<HMAC-SHA256 signature>
// The signature covers the id + expiry, so links can't be guessed or edited
// to reach another invoice, and they stop working after LINK_TTL_DAYS.
//
// Signing key: INVOICE_LINK_SECRET if set (rotate it to revoke every link),
// otherwise derived from SUPABASE_SERVICE_ROLE_KEY (server-only, already
// configured) — so no extra setup is required.

import 'server-only';
import { createHmac, timingSafeEqual } from 'crypto';

export const LINK_TTL_DAYS = 60;

function signingKey(): string {
  const base = process.env.INVOICE_LINK_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base) throw new Error('No signing secret configured for invoice links');
  return createHmac('sha256', base).update('sgm-invoice-link-v1').digest('hex');
}

function sign(payload: string): string {
  return createHmac('sha256', signingKey()).update(payload).digest('base64url').slice(0, 24);
}

export function createInvoiceToken(invoiceId: string, ttlDays = LINK_TTL_DAYS): string {
  const id = invoiceId.replace(/-/g, '').toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(id)) throw new Error('Invalid invoice id');
  const exp = Math.floor(Date.now() / 1000) + ttlDays * 86_400;
  const payload = `${id}.${exp.toString(36)}`;
  return `${payload}.${sign(payload)}`;
}

export type TokenCheck =
  | { ok: true; invoiceId: string }
  | { ok: false; reason: 'invalid' | 'expired' };

export function verifyInvoiceToken(token: string): TokenCheck {
  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, reason: 'invalid' };
  const [id, expB36, sig] = parts;
  if (!/^[0-9a-f]{32}$/.test(id) || !/^[0-9a-z]{1,10}$/.test(expB36)) return { ok: false, reason: 'invalid' };

  const expected = Buffer.from(sign(`${id}.${expB36}`));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return { ok: false, reason: 'invalid' };
  }
  if (parseInt(expB36, 36) < Math.floor(Date.now() / 1000)) return { ok: false, reason: 'expired' };

  const uuid = `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;
  return { ok: true, invoiceId: uuid };
}
