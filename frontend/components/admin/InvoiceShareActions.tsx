// components/admin/InvoiceShareActions.tsx
// H69: Quick actions on a saved invoice — download the PDF, or open the
// customer's own WhatsApp chat with a short message and a secure link to the
// invoice PDF already filled in (the admin only taps Send). Renders only when
// an invoice exists.

'use client';

import { useState } from 'react';
import { FileDown, MessageCircle, Loader2 } from 'lucide-react';
import type { Invoice, InvoiceData } from '@/types/invoice';
import { useInvoiceWhatsApp, openWhatsAppTab, toWaNumber } from '@/components/admin/useInvoiceWhatsApp';

interface InvoiceShareActionsProps {
  invoice: Invoice;
}

const NOTES: Record<string, string> = {
  preparing: 'Opening the customer’s WhatsApp chat…',
  opened: '✅ The customer’s chat is open with the invoice PDF link — just tap Send in WhatsApp.',
  blocked: 'Your browser blocked the new tab.',
  error: 'Could not open WhatsApp for this invoice. Check the customer’s number and try again.',
};

export default function InvoiceShareActions({ invoice }: InvoiceShareActionsProps) {
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);
  const whatsapp = useInvoiceWhatsApp();

  const data = (invoice.invoice_data ?? {}) as InvoiceData;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/admin/invoices/${invoice.id}/pdf`);
      if (!res.ok) throw new Error('PDF generation failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoice_number || 'invoice'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[InvoiceShareActions] PDF download failed:', err);
      alert('Could not generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const hasPhone = Boolean(toWaNumber(data.customerPhone));

  const handleWhatsApp = async () => {
    const tab = openWhatsAppTab(); // must happen inside the click
    setSending(true);
    try {
      const sent = await whatsapp.send({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        customerPhone: data.customerPhone ?? '',
        customerName: data.customerName,
        total: data.total ?? invoice.total_amount,
      }, tab);
      // Record that it was sent (INVOICE_SENT audit; never downgrades a paid invoice).
      if (sent) {
        await fetch('/api/admin/invoices', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: invoice.id, status: 'SENT', sent_at: new Date().toISOString() }),
        });
      }
    } finally {
      setSending(false);
    }
  };

  const note = NOTES[whatsapp.state];

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-lg font-body text-sm font-semibold bg-[var(--color-green-800)] text-white hover:bg-[var(--color-green-900)] transition-colors disabled:opacity-60"
        >
          {downloading ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
          {downloading ? 'Generating…' : 'Download PDF'}
        </button>

        <button
          onClick={handleWhatsApp}
          disabled={sending || !hasPhone}
          title={hasPhone ? 'Open the customer’s WhatsApp chat with the invoice PDF link' : 'This invoice has no customer phone number'}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-lg font-body text-sm font-semibold bg-[#25D366] text-white hover:bg-[#1da851] transition-colors disabled:opacity-60"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
          {sending ? 'Opening WhatsApp…' : 'Send via WhatsApp'}
        </button>
      </div>

      {note && (
        <p
          role={whatsapp.state === 'error' ? 'alert' : 'status'}
          className={`mt-2 font-body text-sm ${whatsapp.state === 'error' ? 'text-red-700' : 'text-[var(--color-brown-600)]'}`}
        >
          {note}
          {whatsapp.state === 'blocked' && whatsapp.chatUrl && (
            <>
              {' '}
              <a href={whatsapp.chatUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
                Tap here to open the customer’s chat
              </a>
            </>
          )}
        </p>
      )}
    </div>
  );
}
