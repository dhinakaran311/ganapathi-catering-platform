// components/site/TrackedLink.tsx — <a> that fires an analytics event on click
// (keeps the existing whatsapp_open tracking while letting parents stay
// server components).

'use client';

import type { AnchorHTMLAttributes } from 'react';
import { track } from '@/lib/analytics/track';

interface TrackedLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  event: 'whatsapp_open' | 'gallery_view';
  source: string;
}

export default function TrackedLink({ event, source, onClick, ...rest }: TrackedLinkProps) {
  return (
    <a
      {...rest}
      onClick={(e) => {
        track({ event, metadata: { source } });
        onClick?.(e);
      }}
    />
  );
}
