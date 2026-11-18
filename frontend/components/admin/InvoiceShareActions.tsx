// components/admin/InvoiceShareActions.tsx
// H69: Quick actions on a saved invoice — download the PDF, or send the PDF
// to the customer on WhatsApp (share sheet on phones; download + open chat
// elsewhere). Renders only when an invoice exists.

'use client';

import { useState } from 'react';
import { FileDown, MessageCircle, Loader2 } from 'lucide-react';
import type { Invoice, InvoiceData } from '@/types/invoice';
import { useInvoicePdfShare } from '@/components/admin/useInvoicePdfShare';

interface InvoiceShareActionsProps {
  invoice: Invoice;
}

const NOTES: Record<string, string> = {
  preparing: 'Preparing the invoice PDF…',
  'tap-again': 'The PDF is ready — tap “Send PDF via WhatsApp” again to choose the chat.',
  shared: '✅ Invoice PDF handed to WhatsApp. Choose the customer’s chat and send.',
  downloaded: '✅ PDF downloaded and WhatsApp opened — attach the downloaded PDF in the customer’s chat.',
  error: 'Could not prepare the invoice PDF. Please try again.',
};

export default function InvoiceShareActions({ invoice }: InvoiceShareActionsProps) {
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);
  const pdfShare = useInvoicePdfShare();

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

  const handleWhatsApp = async () => {
    setSending(true);
    try {
      const sent = await pdfShare.share({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        customerPhone: data.customerPhone,
      });
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

  const note = NOTES[pdfShare.state];

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
          disabled={sending}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-lg font-body text-sm font-semibold bg-[#25D366] text-white hover:bg-[#1da851] transition-colors disabled:opacity-60"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
          {sending ? 'Preparing PDF…' : pdfShare.state === 'tap-again' ? 'Tap to send PDF' : 'Send PDF via WhatsApp'}
        </button>
      </div>

      {note && (
        <p
          role={pdfShare.state === 'error' ? 'alert' : 'status'}
          className={`mt-2 font-body text-sm ${pdfShare.state === 'error' ? 'text-red-700' : 'text-[var(--color-brown-600)]'}`}
        >
          {note}
          {pdfShare.state === 'downloaded' && pdfShare.chatUrl && (
            <>
              {' '}
              <a href={pdfShare.chatUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
                Open WhatsApp chat
              </a>
            </>
          )}
        </p>
      )}
    </div>
  );
}
