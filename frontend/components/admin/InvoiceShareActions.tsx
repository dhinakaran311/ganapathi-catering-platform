// components/admin/InvoiceShareActions.tsx
// H69: Quick actions on a saved invoice — download the PDF and share a
// pre-filled summary over WhatsApp. Renders only when an invoice exists.

'use client';

import { useState } from 'react';
import { FileDown, MessageCircle, Loader2 } from 'lucide-react';
import { buildInvoiceWhatsAppUrl } from '@/lib/invoice/whatsapp';
import type { Invoice, InvoiceData } from '@/types/invoice';

interface InvoiceShareActionsProps {
  invoice: Invoice;
}

export default function InvoiceShareActions({ invoice }: InvoiceShareActionsProps) {
  const [downloading, setDownloading] = useState(false);

  const data = (invoice.invoice_data ?? {}) as InvoiceData;
  const waUrl = buildInvoiceWhatsAppUrl(invoice, data);

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

  return (
    <div className="flex flex-wrap items-center gap-2 mt-4">
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="inline-flex items-center gap-2 px-4 h-10 rounded-lg font-body text-sm font-semibold bg-[var(--color-green-800)] text-white hover:bg-[var(--color-green-900)] transition-colors disabled:opacity-60"
      >
        {downloading ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
        {downloading ? 'Generating…' : 'Download PDF'}
      </button>

      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 h-10 rounded-lg font-body text-sm font-semibold bg-[#25D366] text-white hover:bg-[#1da851] transition-colors"
      >
        <MessageCircle size={16} />
        Share via WhatsApp
      </a>
    </div>
  );
}
