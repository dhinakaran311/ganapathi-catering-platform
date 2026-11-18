// lib/invoice/whatsapp.ts
// H69: WhatsApp invoice sharing.
//
// Builds a plain-text summary of an invoice and a wa.me URL so staff can
// share a quote/invoice with the customer in one tap. Complements the PDF
// route (/api/admin/invoices/{id}/pdf) — the PDF is the document, this is
// the quick message that carries the number + link.

import type { Invoice, InvoiceData } from '@/types/invoice';
import { WHATSAPP_NUMBER } from '@/lib/whatsapp';
import { resolvePaymentDetails, type PaymentDetails } from '@/lib/invoice/payment-details';

/** Strip the leading + and any spaces/dashes for a wa.me deep link. */
export function toWaNumber(phone: string | undefined | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  // Assume 10-digit local number → prefix country code.
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n ?? 0);

/**
 * Build a human-readable invoice summary for WhatsApp.
 */
export function buildInvoiceMessage(
  invoice: Invoice,
  data: InvoiceData,
  paymentDefaults: PaymentDetails = { upiId: '', bankDetails: '' }
): string {
  const lines: string[] = [
    'INVOICE | Shri Ganapathi Mess',
    '==============================',
    `Invoice: ${invoice.invoice_number}`,
  ];

  if (data.customerName) lines.push(`Customer: ${data.customerName}`);
  if (data.eventType) lines.push(`Event: ${data.eventType}`);
  if (data.eventDate) lines.push(`Date: ${data.eventDate}`);
  if (data.guestCount) lines.push(`Guests: ${data.guestCount}`);

  const items = (data.lineItems ?? []).filter((it) => it.total > 0 || it.description);
  if (items.length) {
    lines.push('------------------------------');
    for (const it of items) {
      lines.push(`• ${it.description} × ${it.qty} ${it.unit} = ${fmt(it.total)}`);
    }
  }

  lines.push('------------------------------');
  if ((data.deliveryCharge ?? 0) > 0) lines.push(`Delivery: ${fmt(data.deliveryCharge)}`);
  if ((data.discountAmount ?? 0) > 0) lines.push(`Discount: -${fmt(data.discountAmount)}`);
  if ((data.taxAmount ?? 0) > 0) lines.push(`Tax (${data.taxRate}%): ${fmt(data.taxAmount)}`);
  lines.push(`TOTAL: ${fmt(data.total ?? invoice.total_amount)}`);

  // How to pay — invoice's saved details, else Settings → Payment.
  const pay = resolvePaymentDetails(data, paymentDefaults);
  if (pay.upiId || pay.bankDetails) {
    lines.push('------------------------------');
    if (pay.upiId) lines.push(`Pay via UPI: ${pay.upiId}`);
    if (pay.bankDetails) lines.push(`Bank transfer:\n${pay.bankDetails}`);
  }

  return lines.join('\n');
}

/**
 * Direct wa.me link to the customer with the invoice summary pre-filled.
 * Falls back to the business number if the customer phone is unknown.
 */
export function buildInvoiceWhatsAppUrl(
  invoice: Invoice,
  data: InvoiceData,
  paymentDefaults?: PaymentDetails
): string {
  const message = buildInvoiceMessage(invoice, data, paymentDefaults);
  const recipient = toWaNumber(data.customerPhone);
  const number = recipient ?? WHATSAPP_NUMBER;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
