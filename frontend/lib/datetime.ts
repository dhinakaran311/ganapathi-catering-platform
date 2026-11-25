// lib/datetime.ts — pure-ish date helpers shared by admin views.
//
// Why this file exists: the React Compiler lint rule (`react-hooks/purity`)
// forbids calling impure functions such as `Date.now()` directly inside a
// component body. Computing the value in a module-scope helper keeps the
// render output of these server-rendered admin views correct while making
// the impurity explicit and in one place.

const MS_PER_DAY = 86_400_000;

/**
 * Whole days from "now" until the given ISO date (positive = upcoming,
 * 0 = today, negative = in the past).
 */
export function daysUntilDate(isoDate: string): number {
  return Math.ceil((new Date(isoDate).getTime() - Date.now()) / MS_PER_DAY);
}

/** ISO timestamp for `daysAgo` days before now. */
export function isoDaysAgo(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * MS_PER_DAY).toISOString();
}

// ── India Standard Time (UTC+05:30, no DST) ──────────────────────────────────
// Servers (Vercel) run in UTC; the business runs in IST. Use these for
// anything that means "a day in Tiruppur" (event dates, reminders, cut-offs).

const IST_OFFSET_MS = 330 * 60_000;

/** Today's calendar date in IST as YYYY-MM-DD. */
export function todayInIST(now: Date = new Date()): string {
  return new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * The instant at `hh:mm` IST on a calendar date (YYYY-MM-DD), optionally
 * shifted by whole days. e.g. istDateTime('2026-12-15', 9, 0, -1) is
 * 9:00 AM IST on 14 Dec 2026.
 */
export function istDateTime(date: string, hour = 0, minute = 0, dayOffset = 0): Date {
  const [y, m, d] = date.slice(0, 10).split('-').map(Number);
  const utcMs = Date.UTC(y, m - 1, d + dayOffset, hour, minute) - IST_OFFSET_MS;
  return new Date(utcMs);
}
