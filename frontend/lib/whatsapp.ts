/**
 * lib/whatsapp.ts
 * Typed WhatsApp message generator
 * Keeps message format consistent across all entry points
 */

export interface WhatsAppFormData {
  name: string;
  phone: string;
  event?: string;
  guests?: string;
  eventDate?: string;
  eventLocation?: string;
  foodType?: string;
  customItems?: string;
  message?: string;
  /** Added once the enquiry is saved — lets either side open its status page. */
  trackingCode?: string;
  trackingUrl?: string;
}

export const WHATSAPP_NUMBER = '919942351280';

/** wa.me number: 10-digit Indian numbers get the 91 prefix; null if unusable. */
export function toWaNumber(phone: string | null | undefined): string | null {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (digits.length < 10) return null;
  return digits.length === 10 ? `91${digits}` : digits;
}

/** Public status page for an enquiry, e.g. https://site/en/track/B93E3D7A */
export function buildTrackingUrl(origin: string, locale: string, code: string): string {
  return `${origin.replace(/\/$/, '')}/${locale}/track/${encodeURIComponent(code)}`;
}

/**
 * Generate a pre-filled WhatsApp message from enquiry form data
 */
export function generateWhatsAppMessage(data: WhatsAppFormData): string {
  const lines: string[] = [
    'NEW ENQUIRY | Shri Ganapathi Mess',
    '=================================',
    `Name:  ${data.name}`,
    `Phone: ${data.phone}`,
  ];

  if (data.event || data.guests || data.eventDate || data.eventLocation || data.foodType || data.customItems) {
    lines.push('---------------------------------');
    lines.push('EVENT DETAILS:');
    
    if (data.event) lines.push(`* Type:     ${data.event}`);
    if (data.guests) lines.push(`* Guests:   ${data.guests}`);
    if (data.eventDate) lines.push(`* Date:     ${data.eventDate}`);
    if (data.eventLocation) lines.push(`* Location: ${data.eventLocation}`);
    if (data.foodType) lines.push(`* Food:     ${data.foodType}`);
    if (data.customItems) lines.push(`* Special:  ${data.customItems}`);
  }

  if (data.message) {
    lines.push('---------------------------------');
    lines.push('MESSAGE:');
    lines.push(data.message);
  }

  if (data.trackingCode) {
    lines.push('---------------------------------');
    lines.push(`Tracking code: ${data.trackingCode}`);
    if (data.trackingUrl) lines.push(`To track: ${data.trackingUrl}`);
  }

  return lines.join('\n');
}

/**
 * Build a wa.me URL with the given pre-filled text, to the business number
 * by default or to another wa.me number (e.g. the customer's — see toWaNumber).
 */
export function buildWhatsAppUrl(message: string, toNumber: string = WHATSAPP_NUMBER): string {
  return `https://wa.me/${toNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * Quick WhatsApp link for direct (no pre-fill) contact
 */
export const WHATSAPP_DIRECT_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
