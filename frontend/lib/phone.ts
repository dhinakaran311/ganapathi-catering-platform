// lib/phone.ts — Canonical form for Indian mobile numbers.
//
// "+91 98765 43210", "919876543210", "09876543210" and "9876543210" are the
// same person. Customers are keyed by the last 10 digits so they are never
// split into duplicates (migration 028 applies the same rule to existing
// rows and enforces it with the unique phone column).

export function normalizeIndianPhone(input: string | null | undefined): string {
  const digits = (input ?? '').replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

/** Legacy stored forms of a canonical number (rows saved before 028). */
export function legacyPhoneForms(canonical: string): string[] {
  if (canonical.length !== 10) return [canonical];
  return [canonical, `91${canonical}`, `0${canonical}`];
}
