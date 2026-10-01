// app/admin/enquiries/[id]/page.tsx — Enquiry detail with CRM pipeline + Next Action

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUserWithRole } from '@/lib/auth/roles';
import { hasMinRole } from '@/lib/auth/roles';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Phone, MessageCircle, Calendar, MapPin, Users, FileText } from 'lucide-react';
import StatusUpdater from '@/components/admin/StatusUpdater';
import ActivityTimeline from '@/components/admin/ActivityTimeline';
import BusinessPipeline from '@/components/admin/BusinessPipeline';
import NextActionPanel from '@/components/admin/NextActionPanel';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import type { EnquiryStatus } from '@/types/enquiry';
import { SOURCE_LABELS, ROLE_BADGE_COLORS, type EnquirySource } from '@/types/staff';

const infoCard = (icon: React.ReactNode, label: string, value: string | null) =>
  value ? (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--color-ivory-200)] text-[var(--color-brown-500)] flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-body text-xs text-[var(--color-brown-400)] mb-0.5">{label}</p>
        <p className="font-body text-sm font-semibold text-[var(--color-brown-900)]">{value}</p>
      </div>
    </div>
  ) : null;

export default async function EnquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const adminClient = createAdminClient();

  // Get current user + role
  const { role } = await getCurrentUserWithRole();
  const canEdit = hasMinRole(role, 'STAFF');
  const canViewAudit = hasMinRole(role, 'ADMIN');

  // Fetch enquiry
  const { data: enq, error } = await supabase
    .from('enquiries')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !enq) notFound();

  // Fetch status history (feeds ActivityTimeline)
  const { data: history } = await adminClient
    .from('enquiry_status_history')
    .select('id, old_status, new_status, change_reason, changed_by, automated, created_at')
    .eq('enquiry_id', id)
    .order('created_at', { ascending: false });

  // Fetch staff list for assigned-to dropdown
  const { data: staffProfiles } = await adminClient
    .from('staff_profiles')
    .select('user_id, full_name, is_active')
    .eq('is_active', true)
    .order('full_name');

  // Get emails for staff
  const { data: authUsers } = await adminClient.auth.admin.listUsers();
  const emailMap: Record<string, string> = {};
  authUsers?.users?.forEach((u) => { emailMap[u.id] = u.email ?? ''; });

  const staffList = (staffProfiles ?? []).map((s) => ({
    user_id:   s.user_id,
    full_name: s.full_name,
    email:     emailMap[s.user_id] ?? null,
  }));

  // Resolve assigned-to name
  const assignedToProfile = staffList.find((s) => s.user_id === enq.assigned_to);
  const assignedToName = assignedToProfile?.full_name ?? assignedToProfile?.email ?? null;

  // Build WhatsApp URL
  const waUrl = buildWhatsAppUrl(
    `Hi ${enq.name}! Regarding your enquiry for ${enq.event_type || 'your event'} on ${enq.event_date || 'the requested date'} — `
  );

  // Format timeline entries from enquiry_status_history
  const timelineEntries = (history ?? []).map((h) => ({
    id:         h.id,
    status:     h.new_status,
    note:       h.change_reason ?? undefined,
    created_at: h.created_at,
    changed_by: undefined, // Don't expose user IDs in UI
  }));

  const sourceLabel = enq.source
    ? SOURCE_LABELS[enq.source as EnquirySource] ?? enq.source
    : null;

  return (
    <div>
      {/* Back link */}
      <Link
        href="/admin/enquiries"
        className="inline-flex items-center gap-1.5 font-body text-sm text-[var(--color-brown-500)] hover:text-[var(--color-brown-900)] mb-4 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Enquiries
      </Link>

      {/* ── Business Pipeline ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-4 mb-4">
        <BusinessPipeline currentStatus={enq.status as EnquiryStatus} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* ── Left col: main info ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Header card */}
          <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
              <div className="flex-1 min-w-0">
                <h1 className="font-display text-xl md:text-2xl font-bold text-[var(--color-brown-900)] mb-0.5 truncate">
                  {enq.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-body text-xs text-[var(--color-brown-500)]">
                    #{enq.id.slice(0, 8).toUpperCase()}
                  </p>
                  {sourceLabel && (
                    <span className="font-body text-xs text-[var(--color-brown-500)] bg-[var(--color-ivory-200)] px-2 py-0.5 rounded-full">
                      {sourceLabel}
                    </span>
                  )}
                  {role && (
                    <span className={`font-body text-[10px] font-semibold px-2 py-0.5 rounded-full border ${ROLE_BADGE_COLORS[role]}`}>
                      {role}
                    </span>
                  )}
                </div>
              </div>
              <StatusUpdater
                enquiryId={enq.id}
                currentStatus={enq.status as EnquiryStatus}
                canEdit={canEdit}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {infoCard(<Phone size={16} />, 'Phone', enq.phone)}
              {infoCard(
                <Calendar size={16} />,
                'Event Date',
                enq.event_date
                  ? new Date(enq.event_date).toLocaleDateString('en-IN', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                    })
                  : null
              )}
              {infoCard(<Users size={16} />, 'Guest Count', enq.guest_count)}
              {infoCard(<MapPin size={16} />, 'Event Location', enq.event_location)}
              {infoCard(<span className="text-xs">🎉</span>, 'Event Type', enq.event_type)}
              {infoCard(<span className="text-xs">🍛</span>, 'Food Type', enq.food_type)}
            </div>

            {(enq.custom_items || enq.message) && (
              <div className="mt-5 pt-5 border-t border-[var(--color-ivory-300)] space-y-4">
                {enq.custom_items && (
                  <div>
                    <p className="font-body text-xs font-semibold uppercase tracking-wide text-[var(--color-brown-400)] mb-1">
                      Special Food Requests
                    </p>
                    <p className="font-body text-sm text-[var(--color-brown-800)]">{enq.custom_items}</p>
                  </div>
                )}
                {enq.message && (
                  <div>
                    <p className="font-body text-xs font-semibold uppercase tracking-wide text-[var(--color-brown-400)] mb-1">
                      Message
                    </p>
                    <p className="font-body text-sm text-[var(--color-brown-800)] whitespace-pre-wrap">{enq.message}</p>
                  </div>
                )}
              </div>
            )}

            {enq.admin_notes && (
              <div className="mt-4 pt-4 border-t border-[var(--color-ivory-300)]">
                <p className="font-body text-xs font-semibold uppercase tracking-wide text-[var(--color-brown-400)] mb-1">
                  Admin Notes
                </p>
                <p className="font-body text-sm text-[var(--color-brown-700)] italic whitespace-pre-wrap">{enq.admin_notes}</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          {canEdit && (
            <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-4 md:p-6">
              <h2 className="font-display text-base font-bold text-[var(--color-brown-900)] mb-3">
                Quick Actions
              </h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={`tel:${enq.phone}`}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-body text-sm font-semibold text-[var(--color-green-900)] bg-[var(--color-green-100)] hover:bg-[var(--color-green-200)] transition-colors min-h-[44px]"
                >
                  <Phone size={18} /> Call Customer
                </a>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-body text-sm font-semibold text-white bg-[#25D366] hover:bg-[#1da851] transition-colors min-h-[44px]"
                >
                  <MessageCircle size={18} /> WhatsApp
                </a>
                <Link
                  href={`/admin/enquiries/${enq.id}/invoice`}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-body text-sm font-semibold text-white bg-[var(--color-gold-600)] hover:bg-[var(--color-gold-700)] transition-colors min-h-[44px]"
                >
                  <FileText size={18} /> Create Invoice
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ── Right col: next action + timeline + metadata ──────────────── */}
        <div className="space-y-4">

          {/* Next Action Panel */}
          <NextActionPanel
            enquiryId={enq.id}
            nextAction={enq.next_action ?? null}
            nextActionDate={enq.next_action_date ?? null}
            nextActionNotes={enq.next_action_notes ?? null}
            nextActionDone={enq.next_action_done ?? false}
            nextActionDoneAt={enq.next_action_done_at ?? null}
            assignedTo={enq.assigned_to ?? null}
            assignedToName={assignedToName}
            staffList={staffList}
            canEdit={canEdit}
          />

          {/* Activity Timeline */}
          <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-4">
            <h2 className="font-display text-base font-bold text-[var(--color-brown-900)] mb-4">
              Activity Timeline
            </h2>
            <ActivityTimeline entries={timelineEntries} />
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-4">
            <h2 className="font-display text-base font-bold text-[var(--color-brown-900)] mb-3">
              Metadata
            </h2>
            <div className="space-y-2 font-body text-xs text-[var(--color-brown-500)]">
              <div className="flex justify-between">
                <span>Received</span>
                <span>{new Date(enq.created_at).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Updated</span>
                <span>{enq.updated_at ? new Date(enq.updated_at).toLocaleString('en-IN') : '—'}</span>
              </div>
              {enq.tracking_code && (
                <div className="flex justify-between">
                  <span>Tracking</span>
                  <span className="font-mono font-semibold">{enq.tracking_code}</span>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <span>ID</span>
                <span className="font-mono text-[10px] truncate">{enq.id}</span>
              </div>
              {canViewAudit && (
                <div className="pt-2 border-t border-[var(--color-ivory-200)]">
                  <Link
                    href={`/admin/audit-logs?record_id=${enq.id}`}
                    className="text-[var(--color-green-700)] hover:underline"
                  >
                    View audit trail →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
