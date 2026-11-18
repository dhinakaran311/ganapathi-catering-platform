// components/admin/useInvoicePdfShare.ts — Send an invoice to WhatsApp as a
// PDF document (no text invoice).
//
// How it works
//   • Phones and browsers that can share files (Web Share API, Level 2):
//     the invoice PDF is handed to the system share sheet → pick WhatsApp →
//     pick the customer → it is sent as a PDF document.
//   • Browsers that can't share files (some desktops): the PDF is downloaded
//     and WhatsApp opens straight to the customer's chat — attach the file.
//
// Browsers only allow the share sheet shortly after a tap. If saving +
// generating the PDF takes longer, the PDF is kept ready and the caller shows
// "tap again", which then shares instantly.
//
// WhatsApp cannot be told which chat to open from a shared file, so on the
// share-sheet path the staff member chooses the customer in WhatsApp.

'use client';

import { useCallback, useRef, useState } from 'react';

export type PdfShareState =
  | 'idle'
  | 'preparing'      // fetching the PDF
  | 'tap-again'      // PDF ready, browser needs a fresh tap to open the share sheet
  | 'shared'         // handed to the share sheet
  | 'downloaded'     // fallback: PDF downloaded + WhatsApp chat opened
  | 'error';

interface ShareTarget {
  invoiceId: string;
  invoiceNumber: string;
  /** Customer phone (any format) — used for the fallback chat link. */
  customerPhone?: string | null;
}

/** wa.me number: 10-digit Indian numbers get the 91 prefix. */
export function toWaNumber(phone: string | null | undefined): string | null {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (!digits) return null;
  return digits.length === 10 ? `91${digits}` : digits;
}

async function fetchPdf(invoiceId: string, invoiceNumber: string): Promise<File> {
  const res = await fetch(`/api/admin/invoices/${invoiceId}/pdf`, { cache: 'no-store' });
  if (!res.ok) throw new Error('PDF generation failed');
  const blob = await res.blob();
  // Prefer the server's filename (e.g. SGM-2026-0012.pdf) from Content-Disposition.
  const fromHeader = /filename="?([^";]+)"?/i.exec(res.headers.get('content-disposition') ?? '')?.[1];
  const name = fromHeader || `${invoiceNumber || 'invoice'}.pdf`;
  return new File([blob], name, { type: 'application/pdf' });
}

function canShareFile(file: File): boolean {
  try {
    return typeof navigator !== 'undefined' && !!navigator.canShare?.({ files: [file] });
  } catch {
    return false;
  }
}

function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function useInvoicePdfShare() {
  const [state, setState] = useState<PdfShareState>('idle');
  const [chatUrl, setChatUrl] = useState<string | null>(null);
  const cached = useRef<{ key: string; file: File } | null>(null);

  /** Drop the prepared PDF (call after the invoice is edited/saved again). */
  const reset = useCallback(() => {
    cached.current = null;
    setState('idle');
    setChatUrl(null);
  }, []);

  /**
   * Share the invoice PDF. Resolves true when it was handed to WhatsApp
   * (share sheet or download fallback) — callers then mark it SENT.
   */
  const share = useCallback(async ({ invoiceId, invoiceNumber, customerPhone }: ShareTarget): Promise<boolean> => {
    const key = `${invoiceId}:${invoiceNumber}`;
    try {
      let file = cached.current?.key === key ? cached.current.file : null;
      if (!file) {
        setState('preparing');
        file = await fetchPdf(invoiceId, invoiceNumber);
        cached.current = { key, file };
      }

      if (canShareFile(file)) {
        try {
          await navigator.share({ files: [file], title: `Invoice ${invoiceNumber}` });
          setState('shared');
          return true;
        } catch (err) {
          const name = err instanceof Error ? err.name : '';
          if (name === 'AbortError') { setState('idle'); return false; }      // user closed the sheet
          if (name === 'NotAllowedError') { setState('tap-again'); return false; } // tap expired
          throw err;
        }
      }

      // Fallback: download + open the customer's chat (no text).
      downloadFile(file);
      const wa = toWaNumber(customerPhone);
      const url = wa ? `https://wa.me/${wa}` : 'https://wa.me/';
      setChatUrl(url);
      window.open(url, '_blank', 'noopener');
      setState('downloaded');
      return true;
    } catch (err) {
      console.error('[invoice share] failed:', err);
      setState('error');
      return false;
    }
  }, []);

  return { state, chatUrl, share, reset };
}
