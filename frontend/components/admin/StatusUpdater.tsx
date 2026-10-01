// components/admin/StatusUpdater.tsx
// Calls the server API route instead of updating Supabase directly from the browser.
// The API route writes enquiry_status_history + audit_logs atomically.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ENQUIRY_STATUSES, ENQUIRY_STATUS_LABELS, ENQUIRY_STATUS_COLORS, EnquiryStatus } from '@/types/enquiry';

interface StatusUpdaterProps {
  enquiryId: string;
  currentStatus: EnquiryStatus;
  /** Roles that are allowed to update status. UI hides buttons for VIEWER. */
  canEdit?: boolean;
}

export default function StatusUpdater({
  enquiryId,
  currentStatus,
  canEdit = true,
}: StatusUpdaterProps) {
  const [status, setStatus] = useState<EnquiryStatus>(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = async (next: EnquiryStatus) => {
    if (next === status || !canEdit) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/enquiries/${enquiryId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? 'Failed to update status.');
        return;
      }

      setStatus(next);
      router.refresh(); // re-fetch server component data (ActivityTimeline etc.)
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!canEdit) {
    // VIEWER: show read-only badge
    return (
      <span
        className={`inline-flex items-center px-3 py-1.5 rounded-full font-body text-xs font-semibold border ${ENQUIRY_STATUS_COLORS[status]}`}
      >
        {ENQUIRY_STATUS_LABELS[status]}
      </span>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {ENQUIRY_STATUSES.map((s) => (
          <button
            key={s}
            id={`status-btn-${s}`}
            disabled={loading}
            onClick={() => handleChange(s)}
            aria-pressed={status === s}
            className={`px-4 py-2.5 rounded-full font-body text-xs font-semibold border transition-all min-h-[44px] ${
              status === s
                ? ENQUIRY_STATUS_COLORS[s] + ' ring-2 ring-offset-1 ring-current'
                : 'bg-white text-[var(--color-brown-500)] border-[var(--color-ivory-300)] hover:bg-[var(--color-ivory-100)]'
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {loading && status !== s ? ENQUIRY_STATUS_LABELS[s] : ENQUIRY_STATUS_LABELS[s]}
          </button>
        ))}
      </div>
      {loading && (
        <p className="mt-2 font-body text-xs text-[var(--color-brown-400)]">Updating…</p>
      )}
      {error && (
        <p className="mt-2 font-body text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
