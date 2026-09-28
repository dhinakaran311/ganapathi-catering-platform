// components/admin/ActivityTimeline.tsx — B13: Status history timeline

interface TimelineEntry {
  id: string;
  status: string;
  note?: string;
  created_at: string;
  changed_by?: string;
}

const statusColors: Record<string, string> = {
  pending:   'bg-yellow-400',
  confirmed: 'bg-green-500',
  cancelled: 'bg-red-500',
  completed: 'bg-[var(--color-brown-400)]',
};

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
      {entries.map((entry, idx) => (
        <li key={entry.id} className="ml-4">
          {/* Dot */}
          <span
            className={`absolute -left-1.5 w-3 h-3 rounded-full border-2 border-white ${
              statusColors[entry.status] ?? 'bg-[var(--color-brown-300)]'
            }`}
          />

          <div>
            <p className="font-body text-sm font-semibold text-[var(--color-brown-900)] capitalize">
              Status → {entry.status}
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
      ))}
    </ol>
  );
}
