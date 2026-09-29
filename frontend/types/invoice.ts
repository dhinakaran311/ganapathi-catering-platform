// types/invoice.ts — Invoice type definitions
// Invoice status is SEPARATE from payment status.
//
// INVOICE STATUS (document lifecycle):
//   DRAFT         — created, not yet sent to customer
//   SENT          — sent to customer via WhatsApp/PDF
//   PARTIALLY_PAID— at least one verified payment, but balance remains
//   PAID          — fully paid (balance = 0)
//   CANCELLED     — invoice voided
//
// PAYMENT STATUS (derived from payments table — see types/payment.ts):
//   UNPAID / PARTIALLY_PAID / PAID
//
// Do NOT use lowercase 'draft', 'pending', 'sent', 'paid', 'cancelled'.
// Legacy DB values are migrated in 014_invoice_status_canonical.sql.

export const INVOICE_STATUSES = ['DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT:          'Draft',
  SENT:           'Sent',
  PARTIALLY_PAID: 'Partially Paid',
  PAID:           'Paid',
  CANCELLED:      'Cancelled',
};

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  DRAFT:          'bg-gray-100 text-gray-600',
  SENT:           'bg-blue-100 text-blue-700',
  PARTIALLY_PAID: 'bg-orange-100 text-orange-700',
  PAID:           'bg-green-100 text-green-700',
  CANCELLED:      'bg-red-100 text-red-700',
};

// Legacy lowercase payment method (still used in invoice_data JSONB for historical invoices)
// New payments use PaymentMethodType from types/payment.ts (uppercase)
export type LegacyPaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'cheque';

export interface InvoiceLineItem {
  id: string;
  description: string;
  category: 'food' | 'delivery' | 'service' | 'extra' | 'discount';
  qty: number;
  unit: string; // e.g. "person", "plate", "trip", "item"
  unitPrice: number;
  total: number;
}

export interface InvoiceData {
  // Customer info (editable override on the invoice)
  customerName: string;
  customerPhone: string;
  customerAddress?: string;

  // Event info
  eventType?: string;
  eventDate?: string;
  eventLocation?: string;
  guestCount?: string;
  foodType?: string;

  // Line items
  lineItems: InvoiceLineItem[];

  // Amounts
  subtotal: number;
  deliveryCharge: number;
  discountAmount: number;
  discountNote?: string;
  taxRate: number; // percentage, 0 by default (food exempt from GST typically)
  taxAmount: number;
  total: number;

  // Legacy advance/balance — kept for backward-compat display only.
  // Source of truth is the payments table. Do NOT use this for calculations.
  advancePaid?: number;
  balanceDue?: number;

  // Legacy payment info — kept for backward-compat display only.
  paymentMethod?: LegacyPaymentMethod;
  upiId?: string;
  bankDetails?: string;

  // Notes
  notes?: string;
  terms?: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  enquiry_id: string | null;
  customer_id: string | null;
  subtotal: number;
  tax_amount: number;
  delivery_charge: number;
  discount_amount: number;
  total_amount: number;
  invoice_data: InvoiceData;
  pdf_url: string | null;
  status: InvoiceStatus;
  sent_at: string | null;
  paid_at: string | null;
  // Legacy columns — kept for backward compat; new payment data is in payments table
  payment_method: LegacyPaymentMethod | null;
  upi_reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
