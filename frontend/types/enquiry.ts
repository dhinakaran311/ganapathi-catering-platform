export const ENQUIRY_STATUSES = [
  'NEW',
  'CONTACTED',
  'DISCUSSION',
  'QUOTE_SENT',
  'FOLLOW_UP',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
] as const;

export type EnquiryStatus = typeof ENQUIRY_STATUSES[number];

export const ENQUIRY_STATUS_LABELS: Record<EnquiryStatus, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  DISCUSSION: 'Discussion',
  QUOTE_SENT: 'Quote Sent',
  FOLLOW_UP: 'Follow Up',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
} as const;

export const ENQUIRY_STATUS_COLORS: Record<EnquiryStatus, string> = {
  NEW: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONTACTED: 'bg-blue-100 text-blue-800 border-blue-200',
  DISCUSSION: 'bg-purple-100 text-purple-800 border-purple-200',
  QUOTE_SENT: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  FOLLOW_UP: 'bg-orange-100 text-orange-800 border-orange-200',
  CONFIRMED: 'bg-green-100 text-green-800 border-green-200',
  COMPLETED: 'bg-[var(--color-ivory-300)] text-[var(--color-brown-700)] border-[var(--color-ivory-400)]',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
} as const;

export const ENQUIRY_STATUS_DOT_COLORS: Record<EnquiryStatus, string> = {
  NEW: 'bg-yellow-400',
  CONTACTED: 'bg-blue-400',
  DISCUSSION: 'bg-purple-400',
  QUOTE_SENT: 'bg-indigo-400',
  FOLLOW_UP: 'bg-orange-400',
  CONFIRMED: 'bg-green-500',
  COMPLETED: 'bg-[var(--color-brown-400)]',
  CANCELLED: 'bg-red-500',
} as const;
