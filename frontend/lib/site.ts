// lib/site.ts — Single source of truth for public business facts used by the
// public website, SEO metadata and invoices (previously hardcoded in many
// files, which let them drift apart — e.g. "free delivery within 5 km" in one
// place and "15 km" in another).
//
// Translated marketing copy lives in messages/*.json; keep the numbers there
// consistent with these values.

import { WHATSAPP_DIRECT_URL } from '@/lib/whatsapp';

export const SITE = {
  nameEn: 'Shri Ganapathi Mess',
  nameTa: 'ஸ்ரீ கணபதி மெஸ்',
  city: 'Tiruppur',
  addressEn: '5, Esswara Moorthy Nagar, 4th Street, Velliyangadu, Tiruppur - 641604',

  phoneDisplay: '+91 99423 51280',
  phoneLocal: '9942351280',
  phoneTel: 'tel:+919942351280',
  whatsappUrl: WHATSAPP_DIRECT_URL,

  yearsExperience: '10+',
  minGuests: 100,
  maxGuests: 500,
  /** Free delivery radius from Velliyangadu (matches the Pricing table). */
  freeDeliveryKm: 5,
  /** Charge beyond the free radius. */
  deliveryChargePerKm: 100,
  maxDeliveryKm: 30,
} as const;
