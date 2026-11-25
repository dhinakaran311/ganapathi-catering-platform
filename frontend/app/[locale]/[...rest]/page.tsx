// app/[locale]/[...rest]/page.tsx — Catch-all for unknown public URLs
// (/ta/anything, /en/anything) so they render the branded, translated
// app/[locale]/not-found.tsx instead of the framework's default 404.

import { notFound } from 'next/navigation';

export default function CatchAllNotFound() {
  notFound();
}
