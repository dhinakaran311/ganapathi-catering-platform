// lib/validation.ts — Shared Zod schemas for API route input validation.
//
// Used by the public /api/enquiries route and the admin invoice routes to
// reject malformed payloads with field-level 422 errors before anything
// touches the database.

import { z } from 'zod';
import { INVOICE_STATUSES } from '@/types/invoice';

// ─────────────────────────────────────────────────────────────────────────────
// Public enquiry
// ─────────────────────────────────────────────────────────────────────────────

// Accepts common Indian mobile formats: 10 digits, optional +91/91/0 prefix.
const phoneRegex = /^(\+?91[- ]?)?[6-9]\d{9}$/;

export const enquirySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(120, 'Name is too long'),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, 'Enter a valid 10-digit Indian mobile number'),
  event: z.string().trim().max(120).optional().or(z.literal('')),
  guests: z.string().trim().max(20).optional().or(z.literal('')),
  eventDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Event date must be YYYY-MM-DD')
    .optional()
    .or(z.literal('')),
  eventLocation: z.string().trim().max(240).optional().or(z.literal('')),
  foodType: z.string().trim().max(40).optional().or(z.literal('')),
  customItems: z.string().trim().max(1000).optional().or(z.literal('')),
  message: z.string().trim().max(2000).optional().or(z.literal('')),
  // Spam protection (see lib/security). `website` is a hidden honeypot field.
  website: z.string().max(200).optional(),
  turnstileToken: z.string().max(4096).optional(),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Invoice line item + invoice payloads (admin)
// ─────────────────────────────────────────────────────────────────────────────

export const invoiceLineItemSchema = z.object({
  id: z.string().max(64),
  description: z.string().trim().min(1, 'Line item description required').max(300),
  category: z.enum(['food', 'delivery', 'service', 'extra', 'discount']),
  qty: z.number().finite().min(0).max(1_000_000),
  unit: z.string().trim().max(40),
  unitPrice: z.number().finite().min(0).max(1_000_000_000),
  total: z.number().finite().min(-1_000_000_000).max(1_000_000_000),
});

const nonNegativeAmount = z.number().finite().min(0).max(1_000_000_000);

export const invoiceDataSchema = z.object({
  customerName: z.string().trim().max(120),
  customerPhone: z.string().trim().max(30),
  customerAddress: z.string().trim().max(300).optional(),
  eventType: z.string().trim().max(120).optional(),
  eventDate: z.string().trim().max(40).optional(),
  eventLocation: z.string().trim().max(240).optional(),
  guestCount: z.string().trim().max(20).optional(),
  foodType: z.string().trim().max(40).optional(),
  lineItems: z.array(invoiceLineItemSchema).max(200),
  subtotal: nonNegativeAmount,
  deliveryCharge: nonNegativeAmount,
  discountAmount: nonNegativeAmount,
  discountNote: z.string().trim().max(200).optional(),
  taxRate: z.number().finite().min(0).max(100),
  taxAmount: nonNegativeAmount,
  total: z.number().finite().min(-1_000_000_000).max(1_000_000_000),
  notes: z.string().trim().max(2000).optional(),
  terms: z.string().trim().max(2000).optional(),
});

const uuidSchema = z.string().uuid('Must be a valid UUID');

export const invoiceCreateSchema = z.object({
  enquiry_id: uuidSchema.optional().nullable(),
  customer_id: uuidSchema.optional().nullable(),
  subtotal: nonNegativeAmount.default(0),
  tax_amount: nonNegativeAmount.default(0),
  delivery_charge: nonNegativeAmount.default(0),
  discount_amount: nonNegativeAmount.default(0),
  total_amount: z.number().finite().min(-1_000_000_000).max(1_000_000_000).default(0),
  invoice_data: invoiceDataSchema.partial().optional().default({}),
  status: z.enum(INVOICE_STATUSES).optional().default('DRAFT'),
  notes: z.string().trim().max(2000).nullable().optional(),
});

export const invoiceUpdateSchema = invoiceCreateSchema.partial().extend({
  id: uuidSchema,
});

export const invoicePatchSchema = z
  .object({
    id: uuidSchema,
    status: z.enum(INVOICE_STATUSES).optional(),
    sent_at: z.string().datetime().nullable().optional(),
    invoice_data: invoiceDataSchema.partial().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
    subtotal: nonNegativeAmount.optional(),
    tax_amount: nonNegativeAmount.optional(),
    delivery_charge: nonNegativeAmount.optional(),
    discount_amount: nonNegativeAmount.optional(),
    total_amount: z.number().finite().min(-1_000_000_000).max(1_000_000_000).optional(),
  })
  .partial()
  .extend({ id: uuidSchema });

// ─────────────────────────────────────────────────────────────────────────────
// Public review submission
// ─────────────────────────────────────────────────────────────────────────────

export const reviewSchema = z.object({
  customer_name: z.string().trim().min(2, 'Please enter your name').max(80),
  customer_phone: z
    .string()
    .trim()
    .regex(phoneRegex, 'Enter a valid 10-digit Indian mobile number')
    .optional()
    .or(z.literal('')),
  event_type: z.string().trim().max(120).optional().or(z.literal('')),
  rating: z.coerce.number().int().min(1, 'Rating must be 1–5').max(5, 'Rating must be 1–5'),
  review: z.string().trim().min(5, 'Please write a short review').max(1000),
  website: z.string().max(200).optional(),
  turnstileToken: z.string().max(4096).optional(),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Public analytics beacon (/api/track)
// ─────────────────────────────────────────────────────────────────────────────

export const ANALYTICS_EVENTS = [
  'page_view', 'enquiry_submit', 'whatsapp_open',
  'menu_filter', 'gallery_view', 'service_area_check',
] as const;

export const trackSchema = z.object({
  event: z.enum(ANALYTICS_EVENTS),
  page: z.string().trim().max(300).optional(),
  metadata: z
    .record(z.string().max(60), z.union([z.string().max(200), z.number().finite(), z.boolean()]))
    .refine((m) => Object.keys(m).length <= 20, 'Too many metadata keys')
    .optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Admin: enquiry status, payments, staff, order completion
// ─────────────────────────────────────────────────────────────────────────────

export const ENQUIRY_STATUSES = [
  'NEW', 'CONTACTED', 'DISCUSSION', 'QUOTE_SENT',
  'FOLLOW_UP', 'CONFIRMED', 'EVENT_SCHEDULED', 'COMPLETED', 'CANCELLED',
] as const;

export const enquiryStatusUpdateSchema = z.object({
  status: z.enum(ENQUIRY_STATUSES),
  reason: z.string().trim().max(500).optional().nullable(),
});

export const completeOrderSchema = z.object({
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const paymentCreateSchema = z.object({
  invoice_id: uuidSchema,
  amount: z.coerce.number().finite().positive('amount must be a positive number').max(1_000_000_000),
  payment_type: z.enum(['ADVANCE', 'PARTIAL', 'FINAL', 'OTHER']),
  payment_method: z.enum(['UPI', 'CASH', 'BANK_TRANSFER', 'CHEQUE', 'OTHER']),
  transaction_reference: z.string().trim().max(120).optional().nullable(),
  payment_date: z.string().trim().max(40).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const paymentActionSchema = z.object({
  id: uuidSchema,
  action: z.enum(['verify', 'reject', 'delete']),
  rejection_reason: z.string().trim().max(500).optional().nullable(),
});

export const STAFF_ROLES = ['OWNER', 'ADMIN', 'STAFF', 'VIEWER'] as const;

export const staffCreateSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email').max(254),
  role: z.enum(STAFF_ROLES),
  full_name: z.string().trim().max(120).optional().nullable(),
});

export const staffUpdateSchema = z.object({
  profile_id: uuidSchema,
  role: z.enum(STAFF_ROLES).optional(),
  full_name: z.string().trim().max(120).optional().nullable(),
  is_active: z.boolean().optional(),
});

/** Turn a ZodError into a { field: message } map for 422 responses. */
export function zodFieldErrors(error: { issues: { path: PropertyKey[]; message: string }[] }): Record<string, string> {
  const details: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join('.') || '_';
    if (!details[key]) details[key] = issue.message;
  }
  return details;
}
