// types/invoice.ts — Phase 5: Invoice type definitions

export type InvoiceStatus = 'draft' | 'pending' | 'sent' | 'paid' | 'cancelled';
export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'cheque';

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

  // Advance / balance
  advancePaid: number;
  balanceDue: number;

  // Payment info
  paymentMethod?: PaymentMethod;
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
  payment_method: PaymentMethod | null;
  upi_reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
