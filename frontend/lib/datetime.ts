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
