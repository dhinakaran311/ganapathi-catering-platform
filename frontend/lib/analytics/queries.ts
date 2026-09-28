// lib/analytics/queries.ts — E33: Analytics query functions for the admin dashboard

import { createClient } from '@/lib/supabase/server';

export interface DashboardStats {
  totalEnquiries: number;
  pendingEnquiries: number;
  confirmedThisMonth: number;
  totalCustomers: number;
  enquiriesThisWeek: number;
  enquiriesLastWeek: number;
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
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfThisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const startOfLastWeek = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const [totalRes, pendingRes, confirmedMonthRes, customersRes, thisWeekRes, lastWeekRes] =
    await Promise.all([
      supabase.from('enquiries').select('id', { count: 'exact', head: true }),
      supabase.from('enquiries').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase
        .from('enquiries')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'confirmed')
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
    ]);

  return {
    totalEnquiries: totalRes.count ?? 0,
    pendingEnquiries: pendingRes.count ?? 0,
    confirmedThisMonth: confirmedMonthRes.count ?? 0,
    totalCustomers: customersRes.count ?? 0,
    enquiriesThisWeek: thisWeekRes.count ?? 0,
    enquiriesLastWeek: lastWeekRes.count ?? 0,
  };
}

export async function getRecentEnquiries(limit = 10): Promise<EnquirySummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('enquiries')
    .select('id, name, phone, event_type, guest_count, event_date, status, created_at')
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
