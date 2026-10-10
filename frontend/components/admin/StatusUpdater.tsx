// components/admin/StatusUpdater.tsx
// Compact dropdown status selector — no overflow with 9 statuses.
// Calls the server API route (writes enquiry_status_history + audit_logs).

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import {
  ENQUIRY_STATUSES,
  ENQUIRY_STATUS_LABELS,
  ENQUIRY_STATUS_COLORS,
  type EnquiryStatus,
} from '@/types/enquiry';

interface StatusUpdaterProps {
  enquiryId: string;
  currentStatus: EnquiryStatus;
  canEdit?: boolean;
}

export default function StatusUpdater({
  enquiryId,
  currentStatus,
  canEdit = true,
}: StatusUpdaterProps) {
  const [status, setStatus]   = useState<EnquiryStatus>(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const router = useRouter();

  const handleChange = async (next: EnquiryStatus) => {
    if (next === status || !canEdit) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/enquiries/${enquiryId}/status`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: next }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Failed to update status.');
        return;
      }

      setStatus(next);
      router.refresh();
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Read-only badge for VIEWER
  if (!canEdit) {
    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-full font-body text-xs font-semibold border ${ENQUIRY_STATUS_COLORS[status]}`}>
        {ENQUIRY_STATUS_LABELS[status]}
      </span>
    );
  }

  // Editable: compact dropdown — no overflow regardless of status count
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <div className="relative inline-flex items-center">
        {/* Colour dot */}
        <span className={`absolute left-3 w-2 h-2 rounded-full pointer-events-none ${ENQUIRY_STATUS_COLORS[status].split(' ')[0].replace('bg-', 'bg-')}`} />

        <select
          value={status}
          disabled={loading}
          onChange={(e) => handleChange(e.target.value as EnquiryStatus)}
          aria-label="Update enquiry status"
          className={`
            appearance-none pl-7 pr-8 py-2 rounded-full font-body text-xs font-semibold border
            cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-current
            disabled:opacity-60 disabled:cursor-not-allowed transition-colors
            ${ENQUIRY_STATUS_COLORS[status]}
          `}
        >
          {ENQUIRY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ENQUIRY_STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        <ChevronDown
          size={12}
          className="absolute right-3 pointer-events-none"
        />
      </div>

      {loading && (
        <p className="font-body text-[10px] text-[var(--color-brown-400)] pl-1">Updating…</p>
      )}
      {error && (
        <p className="font-body text-[10px] text-red-600 pl-1">{error}</p>
      )}
    </div>
  );
}
