// lib/invoice/payment-settings.server.ts — Server-only read of the hotel's
// saved payment settings (Admin → Settings → Payment). Never import this from
// a client component.

import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatBankDetails, type PaymentDetails } from './payment-details';

export async function getHotelPaymentDetails(): Promise<PaymentDetails> {
  try {
    const { data } = await createAdminClient()
      .from('hotels')
      .select('upi_id, bank_name, bank_account_name, bank_account_number, bank_ifsc')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    return { upiId: data?.upi_id?.trim() ?? '', bankDetails: formatBankDetails(data) };
  } catch {
    return { upiId: '', bankDetails: '' };
  }
}
