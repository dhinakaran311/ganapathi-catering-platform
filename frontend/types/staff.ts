// types/staff.ts — Role and next-action type definitions

export type StaffRole = 'OWNER' | 'ADMIN' | 'STAFF' | 'VIEWER';

export const STAFF_ROLES: StaffRole[] = ['OWNER', 'ADMIN', 'STAFF', 'VIEWER'];

export const ROLE_LABELS: Record<StaffRole, string> = {
  OWNER:  'Owner',
  ADMIN:  'Admin',
  STAFF:  'Staff',
  VIEWER: 'Viewer',
};

export const ROLE_DESCRIPTIONS: Record<StaffRole, string> = {
  OWNER:  'Full access including role management and settings',
  ADMIN:  'Full business access, limited settings',
  STAFF:  'Manage enquiries, customers, create invoices, record payments',
  VIEWER: 'Read-only access to all business data',
};

export const ROLE_BADGE_COLORS: Record<StaffRole, string> = {
  OWNER:  'bg-purple-100 text-purple-800 border-purple-200',
  ADMIN:  'bg-blue-100 text-blue-800 border-blue-200',
  STAFF:  'bg-green-100 text-green-800 border-green-200',
  VIEWER: 'bg-gray-100 text-gray-600 border-gray-200',
};

// ─────────────────────────────────────────────────────────────────────────────
// Next Action types
// ─────────────────────────────────────────────────────────────────────────────

export type NextActionType =
  | 'CALL_CUSTOMER'
  | 'SEND_QUOTATION'
  | 'FOLLOW_UP'
  | 'COLLECT_ADVANCE'
  | 'CONFIRM_EVENT'
  | 'COLLECT_BALANCE'
  | 'OTHER';

export const NEXT_ACTION_TYPES: NextActionType[] = [
  'CALL_CUSTOMER',
  'SEND_QUOTATION',
  'FOLLOW_UP',
  'COLLECT_ADVANCE',
  'CONFIRM_EVENT',
  'COLLECT_BALANCE',
  'OTHER',
];

export const NEXT_ACTION_LABELS: Record<NextActionType, string> = {
  CALL_CUSTOMER:   'Call Customer',
  SEND_QUOTATION:  'Send Quotation',
  FOLLOW_UP:       'Follow Up',
  COLLECT_ADVANCE: 'Collect Advance',
  CONFIRM_EVENT:   'Confirm Event',
  COLLECT_BALANCE: 'Collect Balance',
  OTHER:           'Other',
};

export const NEXT_ACTION_ICONS: Record<NextActionType, string> = {
  CALL_CUSTOMER:   '📞',
  SEND_QUOTATION:  '📄',
  FOLLOW_UP:       '🔔',
  COLLECT_ADVANCE: '💰',
  CONFIRM_EVENT:   '✅',
  COLLECT_BALANCE: '💳',
  OTHER:           '📝',
};

// ─────────────────────────────────────────────────────────────────────────────
// Enquiry source values (post-migration 020)
// ─────────────────────────────────────────────────────────────────────────────
export type EnquirySource = 'WEBSITE' | 'WHATSAPP' | 'PHONE' | 'REFERRAL' | 'OTHER';

export const ENQUIRY_SOURCES: EnquirySource[] = [
  'WEBSITE', 'WHATSAPP', 'PHONE', 'REFERRAL', 'OTHER',
];

export const SOURCE_LABELS: Record<EnquirySource, string> = {
  WEBSITE:  '🌐 Website',
  WHATSAPP: '💬 WhatsApp',
  PHONE:    '📞 Phone',
  REFERRAL: '🤝 Referral',
  OTHER:    '📋 Other',
};

// ─────────────────────────────────────────────────────────────────────────────
// Staff profile shape
// ─────────────────────────────────────────────────────────────────────────────
export interface StaffProfile {
  id: string;
  user_id: string;
  role: StaffRole;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  email?: string; // joined from auth.users
}
