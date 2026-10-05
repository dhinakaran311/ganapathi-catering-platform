// lib/analytics/queries.ts — E33: Analytics query functions for the admin dashboard
// Statuses stored in DB (uppercase): NEW, CONTACTED, DISCUSSION, QUOTE_SENT,
//   FOLLOW_UP, CONFIRMED, COMPLETED, CANCELLED

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface DashboardStats {
  totalEnquiries: number;
  newEnquiries: number;          // status = 'NEW' (needs action)
  confirmedThisMonth: number;    // status = 'CONFIRMED'
  totalCustomers: number;
  enquiriesThisWeek: number;
  enquiriesLastWeek: number;
  // Financial metrics (from verified payments — source of truth)
  totalInvoiced: number;         // sum of all invoice total_amount
  totalReceived: number;         // sum of VERIFIED payments
  totalOutstanding: number;      // totalInvoiced - totalReceived
}

export interface EnquirySummary {
  id: string;
  name: string;
  phone: string;
  event_type: string;
  guest_count: string;
  event_date: string | null;
  status: string;
  created_at: string;
  source: string;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase      = await createClient();
  const adminSupabase = createAdminClient();

  const now = new Date();
  const startOfMonth   = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfThisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const startOfLastWeek = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const [
    totalRes,
    newRes,
    confirmedMonthRes,
    customersRes,
    thisWeekRes,
    lastWeekRes,
    invoicesRes,
    paymentsRes,
  ] = await Promise.all([
    supabase.from('enquiries').select('id', { count: 'exact', head: true }),
    supabase.from('enquiries').select('id', { count: 'exact', head: true }).eq('status', 'NEW'),
    supabase
      .from('enquiries')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'CONFIRMED')
      .gte('created_at', startOfMonth),
    supabase.from('customers').select('id', { count: 'exact', head: true }),
    supabase
      .from('enquiries')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startOfThisWeek),
    supabase
      .from('enquiries')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startOfLastWeek)
      .lt('created_at', startOfThisWeek),
    // All non-cancelled invoices (canonical uppercase status from 014_invoice_status_canonical.sql)
    adminSupabase
      .from('invoices')
      .select('total_amount')
      .neq('status', 'CANCELLED'),
    // Only VERIFIED payments (source of truth for amount received)
    adminSupabase
      .from('payments')
      .select('amount')
      .eq('status', 'VERIFIED')
      .eq('is_deleted', false),
  ]);

  const totalInvoiced = (invoicesRes.data ?? []).reduce(
    (s: number, r: { total_amount: number }) => s + (r.total_amount ?? 0), 0
  );
  const totalReceived = (paymentsRes.data ?? []).reduce(
    (s: number, r: { amount: number }) => s + Number(r.amount ?? 0), 0
  );

  return {
    totalEnquiries:    totalRes.count ?? 0,
    newEnquiries:      newRes.count ?? 0,
    confirmedThisMonth: confirmedMonthRes.count ?? 0,
    totalCustomers:    customersRes.count ?? 0,
    enquiriesThisWeek: thisWeekRes.count ?? 0,
    enquiriesLastWeek: lastWeekRes.count ?? 0,
    totalInvoiced,
    totalReceived,
    totalOutstanding:  Math.max(totalInvoiced - totalReceived, 0),
  };
}


export async function getRecentEnquiries(limit = 10): Promise<EnquirySummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('enquiries')
    .select('id, name, phone, event_type, guest_count, event_date, status, created_at, source')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[analytics] getRecentEnquiries error:', error.message);
    return [];
  }
  return (data as EnquirySummary[]) ?? [];
}

export async function getEnquiriesByStatus(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('enquiries')
    .select('status');

  if (error || !data) return {};

  const counts: Record<string, number> = {};
  data.forEach(({ status }) => {
    counts[status] = (counts[status] ?? 0) + 1;
  });
  return counts;
}

export interface FollowupSummary {
  overdue: number;
  due_today: number;
  upcoming: number;
}

export async function getFollowupSummary(): Promise<FollowupSummary> {
  const adminSupabase = createAdminClient();
  const { data, error } = await adminSupabase
    .from('followup_summary')
    .select('overdue, due_today, upcoming')
    .single();

  if (error || !data) return { overdue: 0, due_today: 0, upcoming: 0 };

  return {
    overdue:   Number(data.overdue ?? 0),
    due_today: Number(data.due_today ?? 0),
    upcoming:  Number(data.upcoming ?? 0),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Upcoming catering events (by event_date — NOT follow-up task dates)
// Used by the dashboard Upcoming Events widget.
// Source: upcoming_catering_events DB view (migration 022).
// ─────────────────────────────────────────────────────────────────────────────

export interface UpcomingEvent {
  enquiry_id:      string;
  customer_name:   string;
  phone:           string;
  event_type:      string | null;
  event_date:      string;
  guest_count:     string | null;
  enquiry_status:  string;
  invoice_id:      string | null;
  invoice_number:  string | null;
  total_amount:    number;
  amount_received: number;
  balance_due:     number;
  payment_status:  string;
}

export async function getUpcomingEvents(limit = 8): Promise<UpcomingEvent[]> {
  const adminSupabase = createAdminClient();

  const { data, error } = await adminSupabase
    .from('upcoming_catering_events')
    .select('*')
    .limit(limit);

  if (error) {
    console.error('[analytics] getUpcomingEvents error:', error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    enquiry_id:      row.enquiry_id,
    customer_name:   row.customer_name,
    phone:           row.phone,
    event_type:      row.event_type ?? null,
    event_date:      row.event_date,
    guest_count:     row.guest_count ?? null,
    enquiry_status:  row.enquiry_status,
    invoice_id:      row.invoice_id ?? null,
    invoice_number:  row.invoice_number ?? null,
    total_amount:    Number(row.total_amount ?? 0),
    amount_received: Number(row.amount_received ?? 0),
    balance_due:     Number(row.balance_due ?? 0),
    payment_status:  row.payment_status ?? 'UNPAID',
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Monthly payment summary — uses payment_date NOT invoice_date
// Source: monthly_payment_summary DB view (migration 022).
// ─────────────────────────────────────────────────────────────────────────────

export interface MonthlyFinancial {
  month_start:      string;
  month_label:      string;
  year:             number;
  month_num:        number;
  payment_count:    number;
  amount_received:  number;
}

export async function getMonthlyFinancials(months = 6): Promise<MonthlyFinancial[]> {
  const adminSupabase = createAdminClient();

  const { data, error } = await adminSupabase
    .from('monthly_payment_summary')
    .select('*')
    .limit(months);

  if (error) {
    console.error('[analytics] getMonthlyFinancials error:', error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    month_start:     row.month_start,
    month_label:     row.month_label,
    year:            Number(row.year),
    month_num:       Number(row.month_num),
    payment_count:   Number(row.payment_count ?? 0),
    amount_received: Number(row.amount_received ?? 0),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Financial overview for Reports page
// Provides: totalQuoted, totalConfirmed, amountReceived, outstanding, cancelledValue
// All from verified payments + invoice data — single parallel query set.
// ─────────────────────────────────────────────────────────────────────────────

export interface FinancialOverview {
  totalQuoted:      number;  // sum of all non-cancelled invoice totals
  totalConfirmed:   number;  // sum of invoices linked to CONFIRMED/COMPLETED enquiries
  amountReceived:   number;  // sum of VERIFIED payments
  outstanding:      number;  // totalQuoted - amountReceived
  cancelledValue:   number;  // sum of CANCELLED invoice totals
}

export async function getFinancialOverview(): Promise<FinancialOverview> {
  const adminSupabase = createAdminClient();

  const [invoicesRes, paymentsRes, confirmedRes, cancelledRes] = await Promise.all([
    // All active (non-cancelled) invoices
    adminSupabase
      .from('invoices')
      .select('total_amount')
      .eq('is_deleted', false)
      .neq('status', 'CANCELLED'),

    // All verified payments
    adminSupabase
      .from('payments')
      .select('amount')
      .eq('status', 'VERIFIED')
      .eq('is_deleted', false),

    // Invoices linked to CONFIRMED or COMPLETED enquiries
    adminSupabase
      .from('invoices')
      .select('total_amount, enquiry_id')
      .eq('is_deleted', false)
      .neq('status', 'CANCELLED')
      .not('enquiry_id', 'is', null),

    // Cancelled invoices
    adminSupabase
      .from('invoices')
      .select('total_amount')
      .eq('status', 'CANCELLED'),
  ]);

  const totalQuoted = (invoicesRes.data ?? []).reduce(
    (s, r) => s + Number(r.total_amount ?? 0), 0
  );
  const amountReceived = (paymentsRes.data ?? []).reduce(
    (s, r) => s + Number(r.amount ?? 0), 0
  );
  const cancelledValue = (cancelledRes.data ?? []).reduce(
    (s, r) => s + Number(r.total_amount ?? 0), 0
  );

  // For confirmed value: need enquiry statuses
  // Fetch enquiry statuses in one query for the enquiry_ids we have
  const enquiryIds = (confirmedRes.data ?? [])
    .map((i) => i.enquiry_id)
    .filter(Boolean) as string[];

  let totalConfirmed = 0;
  if (enquiryIds.length > 0) {
    const { data: enquiries } = await adminSupabase
      .from('enquiries')
      .select('id, status')
      .in('id', enquiryIds)
      .in('status', ['CONFIRMED', 'COMPLETED']);

    const confirmedEnqIds = new Set((enquiries ?? []).map((e) => e.id));
    totalConfirmed = (confirmedRes.data ?? []).reduce((s, inv) => {
      return confirmedEnqIds.has(inv.enquiry_id) ? s + Number(inv.total_amount ?? 0) : s;
    }, 0);
  }

  return {
    totalQuoted,
    totalConfirmed,
    amountReceived,
    outstanding:   Math.max(totalQuoted - amountReceived, 0),
    cancelledValue,
  };
}
