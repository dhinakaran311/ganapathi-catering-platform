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
