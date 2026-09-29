// components/admin/ActivityTimeline.tsx — B13: Status history timeline
import { ENQUIRY_STATUS_DOT_COLORS, ENQUIRY_STATUS_LABELS, EnquiryStatus } from '@/types/enquiry';

interface TimelineEntry {
  id: string;
  status: string;
  note?: string;
  created_at: string;
  changed_by?: string;
}

interface ActivityTimelineProps {
  entries: TimelineEntry[];
}

export default function ActivityTimeline({ entries }: ActivityTimelineProps) {
  if (entries.length === 0) {
    return (
      <p className="font-body text-sm text-[var(--color-brown-400)]">No activity recorded yet.</p>
    );
  }

  return (
    <ol className="relative border-l border-[var(--color-ivory-300)] space-y-6 ml-2">
      {entries.map((entry, idx) => {
        const isKnownStatus = entry.status in ENQUIRY_STATUS_DOT_COLORS;
        const colorClass = isKnownStatus
          ? ENQUIRY_STATUS_DOT_COLORS[entry.status as EnquiryStatus]
          : 'bg-[var(--color-brown-300)]';
        const displayLabel = isKnownStatus
          ? ENQUIRY_STATUS_LABELS[entry.status as EnquiryStatus]
          : entry.status;

        return (
          <li key={entry.id} className="ml-4">
            {/* Dot */}
            <span
              className={`absolute -left-1.5 w-3 h-3 rounded-full border-2 border-white ${colorClass}`}
            />

            <div>
              <p className="font-body text-sm font-semibold text-[var(--color-brown-900)] capitalize">
                Status → {displayLabel}
                {idx === 0 && (
                  <span className="ml-2 text-xs font-normal text-[var(--color-gold-700)]">(current)</span>
                )}
              </p>
              {entry.note && (
                <p className="font-body text-xs text-[var(--color-brown-600)] mt-0.5 italic">
                  {entry.note}
                </p>
              )}
              <p className="font-body text-xs text-[var(--color-brown-400)] mt-1">
                {new Date(entry.created_at).toLocaleString('en-IN')}
                {entry.changed_by && ` · by ${entry.changed_by}`}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
