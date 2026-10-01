'use client';

// components/admin/CancelInvoiceModal.tsx
// Soft-cancels an invoice via DELETE /api/admin/invoices (which now does a soft delete).
// The invoice record is preserved in the database with status=CANCELLED and is_deleted=true.

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface Props {
  invoiceId: string;
  invoiceNumber: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CancelInvoiceModal({
  invoiceId,
  invoiceNumber,
  onClose,
  onSuccess,
}: Props) {
  const [reason, setReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');

  const handleCancel = async () => {
    setCancelling(true);
    setError('');

    try {
      const params = new URLSearchParams({ id: invoiceId });
      if (reason.trim()) params.set('reason', reason.trim());

      const res = await fetch(`/api/admin/invoices?${params.toString()}`, {
        method: 'DELETE',
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to cancel invoice');

      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to cancel invoice');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-ivory-300)]">
          <h2 className="font-display text-xl font-bold text-[var(--color-brown-900)]">
            Cancel Invoice
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--color-ivory-100)] transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {/* Warning notice */}
          <div className="flex items-start gap-3 mb-5 p-4 rounded-lg bg-orange-50 border border-orange-200">
            <AlertTriangle className="text-orange-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-body text-sm font-semibold text-orange-800 mb-1">
                Cancel Invoice {invoiceNumber}?
              </p>
              <p className="font-body text-xs text-orange-700">
                This invoice will be marked as <strong>Cancelled</strong> and remain in your records.
                All payment history will be preserved for audit purposes.
              </p>
            </div>
          </div>

          {/* Reason input */}
          <div>
            <label className="block font-body text-xs font-semibold text-[var(--color-brown-600)] mb-2 uppercase tracking-wide">
              Cancellation Reason <span className="font-normal normal-case">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Customer cancelled event, incorrect details, duplicate invoice…"
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-ivory-300)] bg-white font-body text-sm text-[var(--color-brown-900)] focus:outline-none focus:ring-2 focus:ring-[var(--color-green-800)] focus:border-transparent resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="mt-3 font-body text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-5">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl font-body text-sm font-semibold border border-[var(--color-ivory-300)] text-[var(--color-brown-700)] hover:bg-[var(--color-ivory-100)] transition-colors"
            >
              Keep Invoice
            </button>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex-1 px-4 py-3 rounded-xl font-body text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {cancelling ? 'Cancelling…' : 'Cancel Invoice'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
