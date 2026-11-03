// components/admin/PaymentSettingsForm.tsx
// H69: Edit the hotel's standard payment details (UPI + bank) shown on
// invoices and WhatsApp payment requests. OWNER/ADMIN only.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Loader2 } from 'lucide-react';

interface PaymentSettings {
  upi_id: string;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_ifsc: string;
}

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-[var(--color-ivory-300)] bg-white font-body text-sm text-[var(--color-brown-900)] focus:outline-none focus:ring-2 focus:ring-[var(--color-green-800)]';

const FIELD_LABELS: Record<keyof PaymentSettings, string> = {
  upi_id: 'UPI ID',
  bank_name: 'Bank name',
  bank_account_name: 'Account holder name',
  bank_account_number: 'Account number',
  bank_ifsc: 'IFSC code',
};

export default function PaymentSettingsForm({ initial }: { initial: PaymentSettings }) {
  const router = useRouter();
  const [form, setForm] = useState<PaymentSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const set = (k: keyof PaymentSettings, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/settings/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setMsg({ ok: true, text: 'Payment details saved.' });
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard size={20} className="text-[var(--color-gold-600)]" />
        <h2 className="font-display text-base font-bold text-[var(--color-brown-900)]">Payment Details</h2>
      </div>

      <p className="font-body text-xs text-[var(--color-brown-500)] mb-4">
        These details appear on invoices and in WhatsApp payment requests.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        {(Object.keys(FIELD_LABELS) as (keyof PaymentSettings)[]).map((key) => (
          <div key={key}>
            <label className="block font-body text-xs font-semibold uppercase tracking-wide text-[var(--color-brown-500)] mb-1">
              {FIELD_LABELS[key]}
            </label>
            <input
              type={key === 'bank_account_number' ? 'text' : 'text'}
              value={form[key]}
              onChange={(e) => set(key, e.target.value)}
              className={inputClass}
              autoComplete="off"
            />
          </div>
        ))}
      </div>

      {msg && (
        <p className={`font-body text-sm mb-3 ${msg.ok ? 'text-green-700' : 'text-red-600'}`} role="alert">
          {msg.text}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 px-6 h-11 rounded-lg font-body text-sm font-semibold bg-[var(--color-green-800)] text-white hover:bg-[var(--color-green-900)] transition-colors disabled:opacity-60"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
        {saving ? 'Saving…' : 'Save Payment Details'}
      </button>
    </form>
  );
}
