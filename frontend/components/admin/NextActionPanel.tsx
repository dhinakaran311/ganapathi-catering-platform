// components/admin/NextActionPanel.tsx
// Displays and manages the "Next Action" for an enquiry.
// STAFF+ can edit; VIEWER sees read-only.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, CheckCircle2, Edit3, Save, X } from 'lucide-react';
import {
  NEXT_ACTION_TYPES,
  NEXT_ACTION_LABELS,
  NEXT_ACTION_ICONS,
  type NextActionType,
} from '@/types/staff';

interface NextActionPanelProps {
  enquiryId: string;
  nextAction:      NextActionType | null;
  nextActionDate:  string | null;   // ISO date string (DATE only)
  nextActionNotes: string | null;
  nextActionDone:  boolean;
  nextActionDoneAt: string | null;
  assignedTo:      string | null;
  assignedToName:  string | null;
  staffList: { user_id: string; full_name: string | null; email: string | null }[];
  canEdit: boolean;
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isOverdue(dateStr: string | null, done: boolean) {
  if (!dateStr || done) return false;
  return new Date(dateStr) < new Date(new Date().toDateString());
}

function isDueToday(dateStr: string | null, done: boolean) {
  if (!dateStr || done) return false;
  return new Date(dateStr).toDateString() === new Date().toDateString();
}

export default function NextActionPanel({
  enquiryId,
  nextAction,
  nextActionDate,
  nextActionNotes,
  nextActionDone,
  nextActionDoneAt,
  assignedTo,
  assignedToName,
  staffList,
  canEdit,
}: NextActionPanelProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [formAction, setFormAction]   = useState<NextActionType | ''>(nextAction ?? '');
  const [formDate, setFormDate]       = useState(nextActionDate ?? '');
  const [formNotes, setFormNotes]     = useState(nextActionNotes ?? '');
  const [formAssigned, setFormAssigned] = useState(assignedTo ?? '');

  const overdue   = isOverdue(nextActionDate, nextActionDone);
  const dueToday  = isDueToday(nextActionDate, nextActionDone);

  const urgencyBadge = nextActionDone
    ? null
    : overdue
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 font-body text-[10px] font-semibold">⚠ Overdue</span>
    : dueToday
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 font-body text-[10px] font-semibold">📅 Due Today</span>
    : nextActionDate
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-body text-[10px] font-semibold">📌 Upcoming</span>
    : null;

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/enquiries/${enquiryId}/next-action`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          next_action:       formAction || null,
          next_action_date:  formDate   || null,
          next_action_notes: formNotes  || null,
          assigned_to:       formAssigned || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Failed to save'); return; }
      setEditing(false);
      router.refresh();
    } catch {
      setError('Network error — please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkDone = async () => {
    setCompleting(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/enquiries/${enquiryId}/next-action`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Failed to mark done'); return; }
      router.refresh();
    } catch {
      setError('Network error — please try again.');
    } finally {
      setCompleting(false);
    }
  };

  const handleCancel = () => {
    setFormAction(nextAction ?? '');
    setFormDate(nextActionDate ?? '');
    setFormNotes(nextActionNotes ?? '');
    setFormAssigned(assignedTo ?? '');
    setEditing(false);
    setError('');
  };

  /* ── Edit form ─────────────────────────────────────────────────────────── */
  if (editing) {
    return (
      <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-base font-bold text-[var(--color-brown-900)]">
            Next Action
          </h2>
          <button onClick={handleCancel} className="p-1.5 rounded-lg hover:bg-[var(--color-ivory-100)]" aria-label="Cancel editing">
            <X size={16} className="text-[var(--color-brown-400)]" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Action type */}
          <div>
            <label className="block font-body text-xs font-semibold text-[var(--color-brown-600)] mb-1.5">
              Action Type
            </label>
            <select
              value={formAction}
              onChange={(e) => setFormAction(e.target.value as NextActionType)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-ivory-300)] bg-white font-body text-sm text-[var(--color-brown-900)] focus:outline-none focus:ring-2 focus:ring-[var(--color-green-700)] min-h-[44px]"
            >
              <option value="">— Select action —</option>
              {NEXT_ACTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {NEXT_ACTION_ICONS[t]} {NEXT_ACTION_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          {/* Due date */}
          <div>
            <label className="block font-body text-xs font-semibold text-[var(--color-brown-600)] mb-1.5">
              Due Date
            </label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-ivory-300)] bg-white font-body text-sm text-[var(--color-brown-900)] focus:outline-none focus:ring-2 focus:ring-[var(--color-green-700)] min-h-[44px]"
            />
          </div>

          {/* Assign staff */}
          {staffList.length > 0 && (
            <div>
              <label className="block font-body text-xs font-semibold text-[var(--color-brown-600)] mb-1.5">
                Assigned To
              </label>
              <select
                value={formAssigned}
                onChange={(e) => setFormAssigned(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-ivory-300)] bg-white font-body text-sm text-[var(--color-brown-900)] focus:outline-none focus:ring-2 focus:ring-[var(--color-green-700)] min-h-[44px]"
              >
                <option value="">— Unassigned —</option>
                {staffList.map((s) => (
                  <option key={s.user_id} value={s.user_id}>
                    {s.full_name ?? s.email ?? s.user_id}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block font-body text-xs font-semibold text-[var(--color-brown-600)] mb-1.5">
              Notes (optional)
            </label>
            <textarea
              rows={2}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Add context for the next action…"
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-ivory-300)] bg-white font-body text-sm text-[var(--color-brown-900)] focus:outline-none focus:ring-2 focus:ring-[var(--color-green-700)] resize-none"
            />
          </div>

          {error && <p className="font-body text-xs text-red-600">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2.5 rounded-lg font-body text-sm font-semibold border border-[var(--color-ivory-300)] text-[var(--color-brown-700)] hover:bg-[var(--color-ivory-100)] transition-colors min-h-[44px]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-body text-sm font-semibold text-white bg-[var(--color-green-800)] hover:bg-[var(--color-green-900)] transition-colors disabled:opacity-50 min-h-[44px]"
            >
              <Save size={14} /> {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Read view ─────────────────────────────────────────────────────────── */
  return (
    <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-4 md:p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-base font-bold text-[var(--color-brown-900)]">
          Next Action
        </h2>
        <div className="flex items-center gap-2">
          {urgencyBadge}
          {canEdit && (
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg hover:bg-[var(--color-ivory-100)] transition-colors"
              aria-label="Edit next action"
            >
              <Edit3 size={15} className="text-[var(--color-brown-400)]" />
            </button>
          )}
        </div>
      </div>

      {nextAction ? (
        <div className="space-y-2.5">
          {/* Action type */}
          <div className="flex items-center gap-2">
            <span className="text-lg">{NEXT_ACTION_ICONS[nextAction]}</span>
            <span className={`font-body text-sm font-semibold ${nextActionDone ? 'text-[var(--color-brown-400)] line-through' : 'text-[var(--color-brown-900)]'}`}>
              {NEXT_ACTION_LABELS[nextAction]}
            </span>
            {nextActionDone && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 font-body text-[10px] font-semibold">
                <CheckCircle2 size={10} /> Done
              </span>
            )}
          </div>

          {/* Due date */}
          {nextActionDate && (
            <div className="flex items-center gap-2 font-body text-xs text-[var(--color-brown-500)]">
              <CalendarDays size={13} />
              <span className={overdue ? 'text-red-600 font-semibold' : dueToday ? 'text-orange-600 font-semibold' : ''}>
                {overdue ? 'Was due ' : dueToday ? 'Due today' : 'Due '}
                {!dueToday && formatDate(nextActionDate)}
              </span>
            </div>
          )}

          {/* Assigned to */}
          {(assignedToName || assignedTo) && (
            <div className="font-body text-xs text-[var(--color-brown-500)]">
              Assigned to: <span className="font-semibold text-[var(--color-brown-700)]">{assignedToName ?? assignedTo}</span>
            </div>
          )}

          {/* Notes */}
          {nextActionNotes && (
            <p className="font-body text-xs text-[var(--color-brown-600)] bg-[var(--color-ivory-100)] rounded-lg px-3 py-2 mt-1">
              {nextActionNotes}
            </p>
          )}

          {/* Done timestamp */}
          {nextActionDone && nextActionDoneAt && (
            <p className="font-body text-xs text-[var(--color-brown-400)]">
              Completed {formatDate(nextActionDoneAt)}
            </p>
          )}

          {/* Mark done button */}
          {canEdit && !nextActionDone && (
            <button
              onClick={handleMarkDone}
              disabled={completing}
              className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-body text-sm font-semibold text-[var(--color-green-800)] bg-[var(--color-green-100)] hover:bg-[var(--color-green-200)] border border-[var(--color-green-200)] transition-colors disabled:opacity-50 min-h-[44px]"
            >
              <CheckCircle2 size={15} />
              {completing ? 'Marking done…' : 'Mark Done'}
            </button>
          )}

          {error && <p className="font-body text-xs text-red-600 mt-1">{error}</p>}
        </div>
      ) : (
        <div className="py-2">
          <p className="font-body text-sm text-[var(--color-brown-400)] mb-3">
            No next action set.
          </p>
          {canEdit && (
            <button
              onClick={() => setEditing(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-body text-sm font-semibold text-[var(--color-green-800)] bg-[var(--color-green-100)] hover:bg-[var(--color-green-200)] border border-[var(--color-green-200)] transition-colors min-h-[44px]"
            >
              + Set Next Action
            </button>
          )}
        </div>
      )}
    </div>
  );
}
