'use client';

// components/admin/PaymentHistory.tsx
// Displays the full payment history for an invoice with verify/reject actions.

import { useState } from 'react';
import { CheckCircle, XCircle, Clock, IndianRupee, Calendar, Hash } from 'lucide-react';
import {
  PAYMENT_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_ICONS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  INVOICE_PAYMENT_STATUS_LABELS,
  INVOICE_PAYMENT_STATUS_COLORS,
  type Payment,
  type InvoicePaymentSummary,
} from '@/types/payment';

interface Props {
  payments: Payment[];
  summary: InvoicePaymentSummary;
  onAction: () => void; // called after verify/reject to refresh
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function PaymentHistory({ payments, summary, onAction }: Props) {
  const [actionId, setActionId]         = useState<string | null>(null);
  const [actionType, setActionType]     = useState<'verify' | 'reject' | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [loadingId, setLoadingId]       = useState<string | null>(null);
  const [error, setError]               = useState('');

  const handleAction = async (id: string, action: 'verify' | 'reject') => {
    setError('');
    setLoadingId(id);
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          action,
          rejection_reason: action === 'reject' ? rejectReason.trim() || 'Rejected by admin' : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Action failed');
      setActionId(null);
      setActionType(null);
      setRejectReason('');
      onAction();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoadingId(null);
    }
  };

  const psColor = INVOICE_PAYMENT_STATUS_COLORS[summary.payment_status];
  const psLabel = INVOICE_PAYMENT_STATUS_LABELS[summary.payment_status];

  return (
    <div className="space-y-4">

      {/* Payment Summary Banner */}
      <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--color-ivory-300)] flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-[var(--color-brown-900)]">
            Payment Summary
          </h3>
          <span className={`inline-flex items-center px-3 py-1 rounded-full font-body text-xs font-bold border ${psColor}`}>
            {psLabel}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-[var(--color-ivory-200)]">
          {[
            { label: 'Invoice Total',   val: summary.total_amount,   cls: 'text-[var(--color-brown-900)]' },
            { label: 'Amount Received', val: summary.amount_received, cls: 'text-green-700' },
            { label: 'Balance Due',     val: summary.balance_due,    cls: summary.balance_due > 0 ? 'text-orange-600 font-bold' : 'text-green-700' },
            { label: 'Overpaid',        val: summary.overpaid_amount, cls: summary.overpaid_amount > 0 ? 'text-purple-600' : 'text-[var(--color-brown-400)]' },
          ].map(({ label, val, cls }) => (
            <div key={label} className="px-4 py-4 text-center">
              <p className="font-body text-xs text-[var(--color-brown-400)] mb-1">{label}</p>
              <p className={`font-display text-xl font-bold ${cls}`}>{fmt(val)}</p>
            </div>
          ))}
        </div>

        {summary.pending_payment_count > 0 && (
          <div className="px-6 py-2 bg-yellow-50 border-t border-yellow-100">
            <p className="font-body text-xs text-yellow-700">
              ⏳ {summary.pending_payment_count} payment{summary.pending_payment_count !== 1 ? 's' : ''} pending verification
            </p>
          </div>
        )}
      </div>

      {/* Payment History List */}
      <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--color-ivory-300)]">
          <h3 className="font-display text-base font-bold text-[var(--color-brown-900)]">
            Payment History
          </h3>
        </div>

        {payments.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <IndianRupee size={32} className="mx-auto text-[var(--color-ivory-400)] mb-3" />
            <p className="font-body text-sm text-[var(--color-brown-400)]">
              No payments recorded yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-ivory-200)]">
            {payments.map((p) => {
              const statusColor = PAYMENT_STATUS_COLORS[p.status];
              const isExpanded  = actionId === p.id;

              return (
                <div key={p.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">

                    {/* Left: date + type + method */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-display text-lg font-bold text-[var(--color-brown-900)]">
                          {fmt(Number(p.amount))}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-body text-xs font-semibold border ${statusColor}`}>
                          {PAYMENT_STATUS_LABELS[p.status]}
                        </span>
                        {p.is_legacy_migrated && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full font-body text-xs bg-purple-50 text-purple-600 border border-purple-200">
                            Legacy
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 font-body text-sm text-[var(--color-brown-600)]">
                        <span>{PAYMENT_TYPE_LABELS[p.payment_type]}</span>
                        <span className="text-[var(--color-brown-300)]">·</span>
                        <span>{PAYMENT_METHOD_ICONS[p.payment_method]} {PAYMENT_METHOD_LABELS[p.payment_method]}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-1.5 font-body text-xs text-[var(--color-brown-400)]">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} /> {fmtDate(p.payment_date)}
                        </span>
                        {p.transaction_reference && (
                          <span className="flex items-center gap-1">
                            <Hash size={11} /> {p.transaction_reference}
                          </span>
                        )}
                        {p.verified_at && (
                          <span className="text-green-600">
                            Verified {fmtDate(p.verified_at)}
                          </span>
                        )}
                        {p.rejected_at && (
                          <span className="text-red-500">
                            Rejected {fmtDate(p.rejected_at)}
                            {p.rejection_reason && `: ${p.rejection_reason}`}
                          </span>
                        )}
                      </div>

                      {p.notes && (
                        <p className="mt-1.5 font-body text-xs text-[var(--color-brown-500)] italic">
                          {p.notes}
                        </p>
                      )}
                    </div>

                    {/* Right: verify / reject actions (only for PENDING) */}
                    {p.status === 'PENDING' && (
                      <div className="flex-shrink-0 flex gap-2">
                        <button
                          onClick={() => handleAction(p.id, 'verify')}
                          disabled={!!loadingId}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body text-xs font-semibold text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle size={14} />
                          {loadingId === p.id && actionType === 'verify' ? '…' : 'Verify'}
                        </button>
                        <button
                          onClick={() => { setActionId(p.id); setActionType('reject'); }}
                          disabled={!!loadingId}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body text-xs font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Reject reason input (inline) */}
                  {isExpanded && actionType === 'reject' && (
                    <div className="mt-4 pl-2 border-l-2 border-red-200">
                      <label className="block font-body text-xs font-semibold text-red-700 mb-1.5 uppercase">
                        Rejection Reason
                      </label>
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="e.g. Incorrect transaction reference"
                        className="w-full px-3 py-2 rounded-lg border border-red-200 bg-white font-body text-sm text-[var(--color-brown-900)] focus:outline-none focus:ring-2 focus:ring-red-400"
                      />
                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={() => { setActionId(null); setActionType(null); }}
                          className="px-4 py-1.5 rounded-lg font-body text-xs font-semibold border border-[var(--color-ivory-300)] text-[var(--color-brown-600)] hover:bg-[var(--color-ivory-100)] transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleAction(p.id, 'reject')}
                          disabled={!!loadingId}
                          className="px-4 py-1.5 rounded-lg font-body text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          {loadingId === p.id ? 'Rejecting…' : 'Confirm Rejection'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <p className="font-body text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </p>
      )}
    </div>
  );
}
