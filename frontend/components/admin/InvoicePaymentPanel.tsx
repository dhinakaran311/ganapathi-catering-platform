'use client';

// components/admin/InvoicePaymentPanel.tsx
// Client component that manages the payment state for an invoice detail page.
// Shows: Payment Summary, Record Payment button, Payment History with verify/reject.

import { useState, useCallback } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import RecordPaymentModal from './RecordPaymentModal';
import PaymentHistory from './PaymentHistory';
import type { Payment, InvoicePaymentSummary } from '@/types/payment';

interface Props {
  invoiceId: string;
  invoiceNumber: string;
  totalAmount: number;
  initialPayments: Payment[];
  initialSummary: InvoicePaymentSummary;
}

export default function InvoicePaymentPanel({
  invoiceId,
  invoiceNumber,
  totalAmount,
  initialPayments,
  initialSummary,
}: Props) {
  const [payments, setPayments]   = useState<Payment[]>(initialPayments);
  const [summary, setSummary]     = useState<InvoicePaymentSummary>(initialSummary);
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [paymentsRes, summaryRes] = await Promise.all([
        fetch(`/api/admin/payments?invoice_id=${invoiceId}`),
        fetch(`/api/admin/payments/summary?invoice_id=${invoiceId}`),
      ]);
      if (paymentsRes.ok) setPayments(await paymentsRes.json());
      if (summaryRes.ok) setSummary(await summaryRes.json());
    } finally {
      setRefreshing(false);
    }
  }, [invoiceId]);

  const handlePaymentSuccess = () => {
    setShowModal(false);
    refresh();
  };

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-[var(--color-brown-900)]">
          Payments
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={refreshing}
            className="p-2 rounded-lg text-[var(--color-brown-400)] hover:text-[var(--color-brown-900)] hover:bg-[var(--color-ivory-100)] transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-body text-sm font-semibold text-white bg-[var(--color-green-800)] hover:bg-[var(--color-green-900)] transition-colors"
          >
            <Plus size={16} /> Record Payment
          </button>
        </div>
      </div>

      {/* Payment History + Summary */}
      <PaymentHistory
        payments={payments}
        summary={summary}
        onAction={refresh}
      />

      {/* Record Payment Modal */}
      {showModal && (
        <RecordPaymentModal
          invoiceId={invoiceId}
          invoiceNumber={invoiceNumber}
          totalAmount={totalAmount}
          alreadyReceived={summary.amount_received}
          onClose={() => setShowModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
