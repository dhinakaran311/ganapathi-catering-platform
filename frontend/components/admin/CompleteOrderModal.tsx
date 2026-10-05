// components/admin/CompleteOrderModal.tsx
// Confirmation dialog for completing an order.
// Fetches real balance from the server before showing — never trusts browser state.
// Two-step: (1) GET preview to show accurate numbers, (2) POST to complete.

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, X, AlertTriangle, IndianRupee, Loader2 } from 'lucide-react';

interface CompleteOrderPreview {
  enquiry_status:  string;
  customer_name:   string;
  event_type:      string | null;
  event_date:      string | null;
  invoice_number:  string | null;
  total_amount:    number;
  amount_received: number;
  balance_due:     number;
  payment_status:  string;
  will_mark_paid:  boolean;
}

interface CompleteOrderModalProps {
  enquiryId:     string;
  customerName:  string;
  onClose:       () => void;
  onSuccess:     () => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function CompleteOrderModal({
  enquiryId,
  customerName,
  onClose,
  onSuccess,
}: CompleteOrderModalProps) {
  const router = useRouter();
  const [preview, setPreview]     = useState<CompleteOrderPreview | null>(null);
  const [loading, setLoading]     = useState(true);
  const [completing, setCompleting] = useState(false);
  const [notes, setNotes]         = useState('');
  const [error, setError]         = useState('');
  const [previewError, setPreviewError] = useState('');

  // Step 1: Fetch accurate financial preview from server
  useEffect(() => {
    setLoading(true);
    setPreviewError('');

    fetch(`/api/admin/enquiries/${enquiryId}/complete`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setPreviewError(data.error);
        } else {
          setPreview(data as CompleteOrderPreview);
        }
      })
      .catch(() => setPreviewError('Failed to load order details. Please try again.'))
      .finally(() => setLoading(false));
  }, [enquiryId]);

  // Step 2: Submit completion
  const handleComplete = async () => {
    setCompleting(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/enquiries/${enquiryId}/complete`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ notes: notes.trim() || null }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error ?? 'Order completion failed. Please try again.');
        return;
      }

      onSuccess();
      router.refresh();
    } catch {
      setError('Network error — please try again.');
    } finally {
      setCompleting(false);
    }
  };

  const hasBalance = preview ? preview.balance_due > 0 : false;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Complete Order"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-ivory-300)]">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={20} className="text-[var(--color-green-700)]" />
            <h2 className="font-display text-xl font-bold text-[var(--color-brown-900)]">
              Complete Order
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--color-ivory-100)] transition-colors"
            aria-label="Close"
          >
            <X size={20} className="text-[var(--color-brown-400)]" />
          </button>
        </div>

        <div className="px-6 py-5">
          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center gap-3 py-8 text-[var(--color-brown-400)]">
              <Loader2 size={20} className="animate-spin" />
              <span className="font-body text-sm">Loading order details…</span>
            </div>
          )}

          {/* Preview error */}
          {previewError && !loading && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-center">
              <p className="font-body text-sm text-red-700">{previewError}</p>
              <button
                onClick={onClose}
                className="mt-3 font-body text-xs font-semibold text-red-600 hover:underline"
              >
                Close
              </button>
            </div>
          )}

          {/* Preview loaded */}
          {preview && !loading && (
            <>
              <p className="font-body text-sm text-[var(--color-brown-500)] mb-4">
                Completing order for <strong className="text-[var(--color-brown-900)]">{customerName}</strong>
                {preview.event_type ? ` · ${preview.event_type}` : ''}
                {preview.event_date ? ` · ${new Date(preview.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
              </p>

              {/* Financial summary */}
              <div className="rounded-xl border border-[var(--color-ivory-300)] bg-[var(--color-ivory-100)] p-4 mb-4 space-y-2.5">
                {preview.invoice_number && (
                  <div className="flex justify-between text-sm">
                    <span className="font-body text-[var(--color-brown-500)]">Invoice</span>
                    <span className="font-body font-semibold text-[var(--color-green-800)]">{preview.invoice_number}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="font-body text-[var(--color-brown-500)]">Invoice Total</span>
                  <span className="font-body font-bold text-[var(--color-brown-900)]">
                    {preview.total_amount > 0 ? fmt(preview.total_amount) : '—'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-body text-[var(--color-brown-500)]">Amount Received</span>
                  <span className="font-body font-bold text-green-700">{fmt(preview.amount_received)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-[var(--color-ivory-300)] pt-2">
                  <span className="font-body font-semibold text-[var(--color-brown-700)]">Balance Due</span>
                  <span className={`font-body font-bold ${hasBalance ? 'text-orange-600' : 'text-green-700'}`}>
                    {hasBalance ? fmt(preview.balance_due) : '✅ ₹0 — Cleared'}
                  </span>
                </div>
              </div>

              {/* What will happen */}
              <div className="rounded-xl border p-4 mb-4 space-y-2">
                <p className="font-body text-xs font-semibold uppercase tracking-wide text-[var(--color-brown-400)] mb-2">
                  What will happen
                </p>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="font-body text-sm text-[var(--color-brown-700)]">
                    Event status → <strong>COMPLETED</strong>
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  {preview.will_mark_paid ? (
                    <CheckCircle2 size={14} className="text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertTriangle size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
                  )}
                  <p className="font-body text-sm text-[var(--color-brown-700)]">
                    {preview.will_mark_paid
                      ? <>Invoice status → <strong>PAID</strong> (balance is ₹0)</>
                      : <>Invoice remains <strong>{preview.payment_status}</strong> · balance {fmt(preview.balance_due)} outstanding</>
                    }
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="font-body text-sm text-[var(--color-brown-700)]">
                    Audit entry created — <strong>ORDER_COMPLETED</strong>
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <X size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="font-body text-sm text-[var(--color-brown-400)]">
                    No new payment created
                  </p>
                </div>
              </div>

              {/* Balance warning */}
              {hasBalance && (
                <div className="flex items-start gap-3 mb-4 p-3 rounded-lg bg-orange-50 border border-orange-200">
                  <AlertTriangle size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
                  <p className="font-body text-xs text-orange-700">
                    <strong>{fmt(preview.balance_due)}</strong> remains outstanding. The event can still be completed with a balance — record the payment separately when received.
                  </p>
                </div>
              )}

              {/* Notes */}
              <div className="mb-4">
                <label className="block font-body text-xs font-semibold text-[var(--color-brown-600)] mb-1.5">
                  Notes (optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={hasBalance ? 'e.g., Customer will pay balance next week' : 'e.g., Event completed successfully'}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--color-ivory-300)] bg-white font-body text-sm text-[var(--color-brown-900)] focus:outline-none focus:ring-2 focus:ring-[var(--color-green-700)] resize-none"
                />
              </div>

              {/* API error */}
              {error && (
                <p className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 font-body text-sm text-red-700">
                  {error}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={completing}
                  className="flex-1 px-4 py-3 rounded-xl font-body text-sm font-semibold border border-[var(--color-ivory-300)] text-[var(--color-brown-700)] hover:bg-[var(--color-ivory-100)] transition-colors disabled:opacity-50 min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleComplete}
                  disabled={completing}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-body text-sm font-semibold text-white transition-colors disabled:opacity-50 min-h-[44px] ${
                    hasBalance
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'bg-[var(--color-green-800)] hover:bg-[var(--color-green-900)]'
                  }`}
                >
                  {completing ? (
                    <><Loader2 size={15} className="animate-spin" /> Completing…</>
                  ) : (
                    <><CheckCircle2 size={15} /> Complete Order</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
