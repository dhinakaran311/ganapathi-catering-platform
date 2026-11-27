// components/admin/useInvoiceWhatsApp.ts — Send an invoice to the CUSTOMER'S
// OWN WhatsApp chat in one tap.
//
// Opens wa.me/<customer number> with a short message and a secure link to the
// invoice PDF already filled in, so the admin only taps "Send" in WhatsApp.
// (WhatsApp does not let a website attach a file into a specific chat, so
// the PDF travels as a signed, expiring link — see share-link.server.ts.)
//
// Pop-up blockers only allow a new tab during the click, so callers open the
// tab synchronously with openWhatsAppTab() BEFORE any await, and pass it in.

'use client';

import { useCallback, useState } from 'react';
// Shared with the enquiry WhatsApp links; re-exported for existing imports.
import { toWaNumber } from '@/lib/whatsapp';

export { toWaNumber };

export type WhatsAppSendState = 'idle' | 'preparing' | 'opened' | 'blocked' | 'error';

/** Call synchronously inside the click handler (before any await). */
export function openWhatsAppTab(): Window | null {
  try {
    return window.open('', '_blank');
  } catch {
    return null;
  }
}

const fmtINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

interface SendArgs {
  invoiceId: string;
  invoiceNumber?: string;
  customerPhone: string;
  customerName?: string;
  total?: number;
}

export function useInvoiceWhatsApp() {
  const [state, setState] = useState<WhatsAppSendState>('idle');
  const [chatUrl, setChatUrl] = useState<string | null>(null);

  /** Resolves true once the customer's chat was opened (callers mark SENT). */
  const send = useCallback(async (args: SendArgs, tab: Window | null): Promise<boolean> => {
    const wa = toWaNumber(args.customerPhone);
    if (!wa) {
      tab?.close();
      setState('error');
      return false;
    }

    setState('preparing');
    try {
      const res = await fetch(`/api/admin/invoices/${args.invoiceId}/share-link`, { method: 'POST' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.url) throw new Error(json.error || 'Could not create the invoice link');

      const lines = [
        args.customerName ? `Hello ${args.customerName},` : 'Hello,',
        `Your invoice${args.invoiceNumber ? ` ${args.invoiceNumber}` : ''} from Shri Ganapathi Mess is ready.`,
        typeof args.total === 'number' ? `Total: ${fmtINR(args.total)}` : '',
        '',
        `View / download the PDF: ${json.url}`,
        '',
        'Thank you!',
      ].filter((l, i, all) => l !== '' || (i > 0 && all[i - 1] !== ''));

      const url = `https://wa.me/${wa}?text=${encodeURIComponent(lines.join('\n'))}`;
      setChatUrl(url);

      if (tab && !tab.closed) {
        tab.location.href = url;
        setState('opened');
      } else if (window.open(url, '_blank')) {
        setState('opened');
      } else {
        setState('blocked'); // show a tap-to-open link instead
      }
      return true;
    } catch (err) {
      console.error('[invoice whatsapp] failed:', err);
      tab?.close();
      setState('error');
      return false;
    }
  }, []);

  return { state, chatUrl, send };
}
