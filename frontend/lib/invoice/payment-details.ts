// lib/invoice/payment-details.ts — The hotel's payment details for invoices.
//
// Source of truth: Admin → Settings → Payment (hotels.upi_id / bank_* columns,
// migration 025). Invoices previously used a hard-coded UPI id and a
// placeholder bank block ("A/C: XXXXXXXXXXXXX"), which could be sent to
// customers. These helpers let the invoice builder, PDF and WhatsApp share
// use the real saved settings.
//
// Client-safe (pure functions). The DB read lives in payment-settings.server.ts.

import type { InvoiceData } from '@/types/invoice';

export interface PaymentDetails {
  upiId: string;
  bankDetails: string;
}

interface HotelPaymentRow {
  upi_id?: string | null;
  bank_name?: string | null;
  bank_account_name?: string | null;
  bank_account_number?: string | null;
  bank_ifsc?: string | null;
}

/** The old hard-coded placeholder (never real details). */
export function isPlaceholderBankDetails(text: string | null | undefined): boolean {
  return !text || /X{4,}/i.test(text);
}

/** Format the saved bank fields as the multi-line block invoices print. */
export function formatBankDetails(row: HotelPaymentRow | null | undefined): string {
  if (!row) return '';
  return [
    row.bank_name,
    row.bank_account_name ? `A/C name: ${row.bank_account_name}` : null,
    row.bank_account_number ? `A/C: ${row.bank_account_number}` : null,
    row.bank_ifsc ? `IFSC: ${row.bank_ifsc}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Details to print on a specific invoice: what was saved on the invoice,
 * falling back to the current settings (placeholder bank text is ignored).
 */
export function resolvePaymentDetails(
  data: Pick<InvoiceData, 'upiId' | 'bankDetails'> | null | undefined,
  settings: PaymentDetails
): PaymentDetails {
  const upiId = data?.upiId?.trim() || settings.upiId;
  const bankDetails = !isPlaceholderBankDetails(data?.bankDetails)
    ? data!.bankDetails!.trim()
    : settings.bankDetails;
  return { upiId, bankDetails };
}
