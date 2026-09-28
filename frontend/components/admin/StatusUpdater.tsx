// components/admin/StatusUpdater.tsx — E38: Inline status updater for enquiries
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'] as const;
type Status = typeof STATUSES[number];

const statusStyles: Record<Status, string> = {
  pending:   'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  completed: 'bg-[var(--color-ivory-300)] text-[var(--color-brown-700)] border-[var(--color-ivory-400)]',
};

interface StatusUpdaterProps {
  enquiryId: string;
  currentStatus: Status;
}

export default function StatusUpdater({ enquiryId, currentStatus }: StatusUpdaterProps) {
  const [status, setStatus] = useState<Status>(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = async (next: Status) => {
    if (next === status) return;
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from('enquiries')
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq('id', enquiryId);

    if (updateError) {
      setError('Failed to update status. Please try again.');
    } else {
      setStatus(next);
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            id={`status-btn-${s}`}
            disabled={loading}
            onClick={() => handleChange(s)}
            className={`px-3 py-1.5 rounded-full font-body text-xs font-semibold border capitalize transition-all ${
              status === s
                ? statusStyles[s] + ' ring-2 ring-offset-1 ring-current'
                : 'bg-white text-[var(--color-brown-500)] border-[var(--color-ivory-300)] hover:bg-[var(--color-ivory-100)]'
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {s}
          </button>
        ))}
      </div>
      {error && (
        <p className="mt-2 font-body text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
