// types/payment.ts — Payment system type definitions
// Source of truth for all payment-related enums, labels, and colors.

export const PAYMENT_TYPES = ['ADVANCE', 'PARTIAL', 'FINAL', 'OTHER'] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  ADVANCE: 'Advance Payment',
  PARTIAL: 'Partial Payment',
  FINAL:   'Final Payment',
  OTHER:   'Other Payment',
};

export const PAYMENT_METHODS = ['UPI', 'CASH', 'BANK_TRANSFER', 'CHEQUE', 'OTHER'] as const;
export type PaymentMethodType = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodType, string> = {
  UPI:           'UPI',
  CASH:          'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  CHEQUE:        'Cheque',
  OTHER:         'Other',
};

export const PAYMENT_METHOD_ICONS: Record<PaymentMethodType, string> = {
  UPI:           '📱',
  CASH:          '💵',
  BANK_TRANSFER: '🏦',
  CHEQUE:        '📝',
  OTHER:         '💳',
};

export const PAYMENT_STATUSES = ['PENDING', 'VERIFIED', 'REJECTED'] as const;
export type PaymentStatusType = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatusType, string> = {
  PENDING:  'Pending',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatusType, string> = {
  PENDING:  'bg-yellow-100 text-yellow-800 border-yellow-200',
  VERIFIED: 'bg-green-100 text-green-800 border-green-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
};

// Payment lifecycle states for an invoice (derived, not stored)
export const INVOICE_PAYMENT_STATUSES = ['UNPAID', 'PARTIALLY_PAID', 'PAID'] as const;
export type InvoicePaymentStatus = (typeof INVOICE_PAYMENT_STATUSES)[number];

export const INVOICE_PAYMENT_STATUS_LABELS: Record<InvoicePaymentStatus, string> = {
  UNPAID:         'Unpaid',
  PARTIALLY_PAID: 'Partially Paid',
  PAID:           'Paid',
};

export const INVOICE_PAYMENT_STATUS_COLORS: Record<InvoicePaymentStatus, string> = {
  UNPAID:         'bg-red-100 text-red-700 border-red-200',
  PARTIALLY_PAID: 'bg-orange-100 text-orange-700 border-orange-200',
  PAID:           'bg-green-100 text-green-700 border-green-200',
};

// Full payment record as returned from DB
export interface Payment {
  id: string;
  invoice_id: string;
  enquiry_id: string | null;
  customer_id: string | null;
  amount: number;
  payment_type: PaymentType;
  payment_method: PaymentMethodType;
  transaction_reference: string | null;
  payment_date: string;
  status: PaymentStatusType;
  verified_by: string | null;
  verified_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  notes: string | null;
  is_deleted: boolean;
  is_legacy_migrated: boolean;
  created_at: string;
  updated_at: string;
}

// Invoice payment summary (from the DB view invoice_payment_summary)
export interface InvoicePaymentSummary {
  invoice_id: string;
  invoice_number: string;
  total_amount: number;
  invoice_status: string;
  amount_received: number;
  balance_due: number;
  payment_status: InvoicePaymentStatus;
  overpaid_amount: number;
  total_payment_count: number;
  pending_payment_count: number;
}
