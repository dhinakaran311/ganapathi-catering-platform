'use client';

// app/admin/reviews/ReviewApprovalRow.tsx — Client component for approve/reject

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Check, X, Star } from 'lucide-react';

interface Review {
  id: string;
  customer_name: string;
  event_type: string;
  rating: number;
  review_en: string;
  review_ta: string;
  is_approved: boolean;
  created_at: string;
}

export default function ReviewApprovalRow({ review }: { review: Review }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const updateApproval = async (approved: boolean) => {
    setLoading(true);
    const supabase = createClient();
    await supabase.from('reviews').update({ is_approved: approved }).eq('id', review.id);
    router.refresh();
    setLoading(false);
  };

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-5 ${review.is_approved ? 'border-[var(--color-ivory-300)]' : 'border-[var(--color-gold-200)]'}`}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-body text-sm font-bold text-[var(--color-brown-900)]">{review.customer_name}</p>
            <span className="font-body text-xs text-[var(--color-brown-500)]">· {review.event_type}</span>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  fill={i < review.rating ? 'var(--color-gold-500)' : 'none'}
                  stroke={i < review.rating ? 'var(--color-gold-500)' : 'var(--color-brown-300)'}
                />
              ))}
            </div>
          </div>
          <p className="font-body text-sm text-[var(--color-brown-700)] mb-1">{review.review_en}</p>
          {review.review_ta && (
            <p className="font-body text-sm text-[var(--color-brown-500)] italic">{review.review_ta}</p>
          )}
          <p className="font-body text-xs text-[var(--color-brown-400)] mt-2">
            {new Date(review.created_at).toLocaleDateString('en-IN')}
          </p>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          {!review.is_approved ? (
            <>
              <button
                id={`approve-review-${review.id}`}
                onClick={() => updateApproval(true)}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-body text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-60"
              >
                <Check size={14} /> Approve
              </button>
              <button
                id={`reject-review-${review.id}`}
                onClick={() => updateApproval(false)}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-body text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-60"
              >
                <X size={14} /> Reject
              </button>
            </>
          ) : (
            <button
              onClick={() => updateApproval(false)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-body text-xs font-medium text-[var(--color-brown-500)] bg-[var(--color-ivory-200)] hover:bg-[var(--color-ivory-300)] transition-colors disabled:opacity-60"
            >
              <X size={12} /> Unpublish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
