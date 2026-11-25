// components/admin/Pagination.tsx — Server-rendered pager for admin lists.
// Keeps every existing filter in the URL and only changes ?page=. Renders
// nothing when everything fits on one page, so short lists look unchanged.

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  /** e.g. "/admin/enquiries" */
  basePath: string;
  /** Current filters to preserve (falsy / "all" values are dropped). */
  params?: Record<string, string | undefined>;
}

function hrefFor(basePath: string, params: Record<string, string | undefined>, page: number) {
  const parts = Object.entries({ ...params, page: page > 1 ? String(page) : undefined })
    .filter(([, v]) => v && v !== 'all')
    .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`);
  return `${basePath}${parts.length ? '?' + parts.join('&') : ''}`;
}

/** Page numbers to show: first, last, current ±1, with gaps as null. */
function pageList(page: number, last: number): (number | null)[] {
  const set = new Set([1, last, page - 1, page, page + 1].filter((n) => n >= 1 && n <= last));
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push(null);
    out.push(n);
  });
  return out;
}

export default function Pagination({ page, pageSize, total, basePath, params = {} }: PaginationProps) {
  const last = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize && page <= 1) return null;

  const current = Math.min(page, last);
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const to = Math.min(total, current * pageSize);

  const btn =
    'inline-flex items-center justify-center min-w-[40px] h-10 px-3 rounded-lg font-body text-sm font-medium border border-[var(--color-ivory-300)] transition-colors';
  const idle = `${btn} bg-white text-[var(--color-brown-700)] hover:bg-[var(--color-ivory-100)]`;
  const active = `${btn} bg-[var(--color-green-800)] text-white border-transparent`;
  const disabled = `${btn} bg-white text-[var(--color-brown-300)] cursor-not-allowed`;

  return (
    <nav aria-label="Pagination" className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <p className="font-body text-sm text-[var(--color-brown-500)]">
        Showing <span className="font-semibold text-[var(--color-brown-900)]">{from}–{to}</span> of{' '}
        <span className="font-semibold text-[var(--color-brown-900)]">{total}</span>
      </p>

      <div className="flex items-center gap-1.5 flex-wrap">
        {current > 1 ? (
          <Link href={hrefFor(basePath, params, current - 1)} className={idle} aria-label="Previous page">
            <ChevronLeft size={16} />
          </Link>
        ) : (
          <span className={disabled} aria-hidden="true"><ChevronLeft size={16} /></span>
        )}

        {pageList(current, last).map((n, i) =>
          n === null ? (
            <span key={`gap-${i}`} className="px-1 font-body text-sm text-[var(--color-brown-400)]">…</span>
          ) : n === current ? (
            <span key={n} className={active} aria-current="page">{n}</span>
          ) : (
            <Link key={n} href={hrefFor(basePath, params, n)} className={idle}>{n}</Link>
          )
        )}

        {current < last ? (
          <Link href={hrefFor(basePath, params, current + 1)} className={idle} aria-label="Next page">
            <ChevronRight size={16} />
          </Link>
        ) : (
          <span className={disabled} aria-hidden="true"><ChevronRight size={16} /></span>
        )}
      </div>
    </nav>
  );
}
