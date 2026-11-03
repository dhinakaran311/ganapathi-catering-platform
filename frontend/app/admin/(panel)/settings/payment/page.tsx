// app/admin/settings/payment/page.tsx — H69: Payment settings
// Loads the active hotel's UPI/bank details into the editor form.
// OWNER/ADMIN only.

import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUserWithRole } from '@/lib/auth/roles';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CreditCard } from 'lucide-react';
import PaymentSettingsForm from '@/components/admin/PaymentSettingsForm';

export default async function PaymentSettingsPage() {
  const { role } = await getCurrentUserWithRole();
  if (role !== 'OWNER' && role !== 'ADMIN') {
    redirect('/admin/settings');
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from('hotels')
    .select('id, upi_id, bank_name, bank_account_name, bank_account_number, bank_ifsc')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  const initial = {
    upi_id: data?.upi_id ?? '',
    bank_name: data?.bank_name ?? '',
    bank_account_name: data?.bank_account_name ?? '',
    bank_account_number: data?.bank_account_number ?? '',
    bank_ifsc: data?.bank_ifsc ?? '',
  };

  return (
    <div>
      <Link
        href="/admin/settings"
        className="inline-flex items-center gap-1.5 font-body text-sm text-[var(--color-brown-500)] hover:text-[var(--color-brown-900)] mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Settings
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <CreditCard size={22} className="text-[var(--color-green-700)]" />
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-brown-900)]">
            Payment Settings
          </h1>
        </div>
        <p className="font-body text-sm text-[var(--color-brown-500)]">
          UPI and bank details shown on invoices and WhatsApp payment requests.
        </p>
      </div>

      <PaymentSettingsForm initial={initial} />
    </div>
  );
}
