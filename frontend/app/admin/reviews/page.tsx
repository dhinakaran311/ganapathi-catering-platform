// app/admin/reviews/page.tsx — J71: Review approval admin page

import { createClient } from '@/lib/supabase/server';
import ReviewApprovalRow from './ReviewApprovalRow';

export default async function ReviewsAdminPage() {
  const supabase = await createClient();

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pending = (reviews ?? []).filter((r: any) => !r.is_approved);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const approved = (reviews ?? []).filter((r: any) => r.is_approved);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-brown-900)] mb-1">
          Reviews
        </h1>
        <p className="font-body text-sm text-[var(--color-brown-500)]">
          Approve or reject customer reviews before they appear on the website
        </p>
      </div>

      {/* Pending approval */}
      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-lg font-bold text-[var(--color-brown-900)] mb-4 flex items-center gap-2">
            Awaiting Approval
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-body font-bold" style={{ backgroundColor: 'var(--color-gold-600)' }}>
              {pending.length}
            </span>
          </h2>
          <div className="space-y-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(pending as any[]).map((r) => (
              <ReviewApprovalRow key={r.id} review={r} />
            ))}
          </div>
        </div>
      )}

      {/* Approved reviews */}
      <div>
        <h2 className="font-display text-lg font-bold text-[var(--color-brown-900)] mb-4">
          Published Reviews ({approved.length})
        </h2>
        {approved.length === 0 ? (
          <p className="font-body text-sm text-[var(--color-brown-400)]">No approved reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(approved as any[]).map((r) => (
              <ReviewApprovalRow key={r.id} review={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
