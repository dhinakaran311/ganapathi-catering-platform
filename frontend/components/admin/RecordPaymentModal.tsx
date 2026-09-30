'use client';

// components/admin/RecordPaymentModal.tsx
// Modal for recording a new payment against an invoice.
// Opens when the admin clicks "Record Payment" on an invoice detail or list.

import { useState } from 'react';
import { X, IndianRupee, AlertTriangle } from 'lucide-react';
import {
  PAYMENT_TYPES,
  PAYMENT_TYPE_LABELS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_ICONS,
  type PaymentType,
  type PaymentMethodType,
} from '@/types/payment';

interface Props {
  invoiceId: string;
  invoiceNumber: string;
  totalAmount: number;
  alreadyReceived: number;
  onClose: () => void;
  onSuccess: () => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function RecordPaymentModal({
  invoiceId,
  invoiceNumber,
  totalAmount,
  alreadyReceived,
  onClose,
  onSuccess,
}: Props) {
  const balanceDue = Math.max(totalAmount - alreadyReceived, 0);

  const [amount, setAmount]                   = useState('');
  const [paymentType, setPaymentType]         = useState<PaymentType>('ADVANCE');
  const [paymentMethod, setPaymentMethod]     = useState<PaymentMethodType>('CASH');
  const [txnRef, setTxnRef]                   = useState('');
  const [paymentDate, setPaymentDate]         = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes]                     = useState('');
  const [saving, setSaving]                   = useState(false);
  const [error, setError]                     = useState('');
  const [overpayWarning, setOverpayWarning]   = useState<number | null>(null);
  const [confirmOverpay, setConfirmOverpay]   = useState(false);

  const parsedAmount = Number(amount);
  const isOverpay = parsedAmount > 0 && parsedAmount > balanceDue;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!parsedAmount || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than ₹0.');
      return;
    }

    if (isOverpay && !confirmOverpay) {
      setOverpayWarning(parsedAmount - balanceDue);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id:            invoiceId,
          amount:                parsedAmount,
          payment_type:          paymentType,
          payment_method:        paymentMethod,
          transaction_reference: txnRef.trim() || null,
          payment_date:          new Date(paymentDate).toISOString(),
          notes:                 notes.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to record payment');
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-3 py-2.5 rounded-lg border border-[var(--color-ivory-300)] bg-white font-body text-sm text-[var(--color-brown-900)] focus:outline-none focus:ring-2 focus:ring-[var(--color-green-800)] focus:border-transparent';
  const labelCls = 'block font-body text-xs font-semibold text-[var(--color-brown-600)] mb-1.5 uppercase tracking-wide';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-[var(--color-ivory-300)] sticky top-0 bg-white z-10">
          <div className="flex-1 min-w-0 mr-2">
            <h2 className="font-display text-lg sm:text-xl font-bold text-[var(--color-brown-900)] truncate">
              Record Payment
            </h2>
            <p className="font-body text-xs sm:text-sm text-[var(--color-brown-500)] mt-0.5 truncate">
              Invoice {invoiceNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--color-brown-400)] hover:text-[var(--color-brown-900)] hover:bg-[var(--color-ivory-100)] transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Financial summary strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:divide-x sm:divide-[var(--color-ivory-300)] bg-[var(--color-ivory-100)] p-4">
          {[
            { label: 'Invoice Total', val: totalAmount, cls: 'text-[var(--color-brown-900)]' },
            { label: 'Received',      val: alreadyReceived, cls: 'text-green-700' },
            { label: 'Balance Due',   val: balanceDue,  cls: balanceDue > 0 ? 'text-orange-600' : 'text-green-700' },
          ].map(({ label, val, cls }) => (
            <div key={label} className="text-center sm:px-4 py-2">
              <p className="font-body text-xs text-[var(--color-brown-500)] mb-1">{label}</p>
              <p className={`font-display text-lg sm:text-xl font-bold ${cls}`}>{fmt(val)}</p>
            </div>
          ))}
        </div>

        {/* Overpayment confirmation */}
        {overpayWarning !== null && !confirmOverpay && (
          <div className="mx-4 sm:mx-6 mt-4 rounded-xl bg-orange-50 border border-orange-200 p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <AlertTriangle className="text-orange-500 flex-shrink-0 mt-0.5" size={18} />
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm font-semibold text-orange-800">Overpayment Warning</p>
                <p className="font-body text-xs sm:text-sm text-orange-700 mt-1">
                  Balance due is {fmt(balanceDue)}, but you entered {fmt(parsedAmount)}.
                  This will result in an overpayment of <strong>{fmt(overpayWarning)}</strong>.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-3">
                  <button
                    onClick={() => setOverpayWarning(null)}
                    className="px-4 py-2.5 rounded-lg font-body text-sm font-semibold border border-orange-300 text-orange-700 hover:bg-orange-100 transition-colors min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { setConfirmOverpay(true); setOverpayWarning(null); }}
                    className="px-4 py-2.5 rounded-lg font-body text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 transition-colors min-h-[44px]"
                  >
                    Confirm Anyway
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">

          {/* Amount */}
          <div>
            <label className={labelCls}>Amount *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-sm text-[var(--color-brown-500)]">
                <IndianRupee size={14} />
              </span>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setConfirmOverpay(false); setOverpayWarning(null); }}
                placeholder="0"
                className={`${inputCls} pl-8`}
              />
            </div>
            {isOverpay && confirmOverpay && (
              <p className="mt-1 font-body text-xs text-orange-600">⚠ Overpayment confirmed</p>
            )}
          </div>

          {/* Payment Type + Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Payment Type *</label>
              <select
                required
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                className={inputCls}
              >
                {PAYMENT_TYPES.map((t) => (
                  <option key={t} value={t}>{PAYMENT_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Payment Method *</label>
              <select
                required
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)}
                className={inputCls}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{PAYMENT_METHOD_ICONS[m]} {PAYMENT_METHOD_LABELS[m]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Reference + Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                {paymentMethod === 'UPI' ? 'UPI / UTR Reference' :
                 paymentMethod === 'CHEQUE' ? 'Cheque Number' :
                 paymentMethod === 'BANK_TRANSFER' ? 'Transaction / UTR' :
                 'Reference (optional)'}
              </label>
              <input
                type="text"
                value={txnRef}
                onChange={(e) => setTxnRef(e.target.value)}
                placeholder={paymentMethod === 'UPI' ? 'UTR or TXN ID' : 'Optional reference'}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Payment Date *</label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls}>Notes (optional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional details about this payment..."
              className={inputCls}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="font-body text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl font-body text-sm font-semibold border border-[var(--color-ivory-300)] text-[var(--color-brown-700)] hover:bg-[var(--color-ivory-100)] transition-colors min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-3 rounded-xl font-body text-sm font-semibold text-white bg-[var(--color-green-800)] hover:bg-[var(--color-green-900)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
            >
              {saving ? 'Recording…' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
