// lib/site.ts — Single source of truth for public business details used by the
// public website components (previously hardcoded in many files).

import { WHATSAPP_DIRECT_URL } from '@/lib/whatsapp';

export const SITE = {
  phoneDisplay: '+91 99423 51280',
  phoneTel: 'tel:+919942351280',
  whatsappUrl: WHATSAPP_DIRECT_URL,
} as const;
