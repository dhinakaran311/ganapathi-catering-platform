/**
 * lib/whatsapp.ts
 * Typed WhatsApp message generator
 * Keeps message format consistent across all entry points (Hero, Contact form, MobileNav)
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
}

const WHATSAPP_NUMBER = '919942351280';

/**
 * Generate a pre-filled WhatsApp message from enquiry form data
 */
export function generateWhatsAppMessage(data: WhatsAppFormData): string {
  const lines: string[] = [
    '🌿 *New Enquiry - Sri Ganapathi Mess*',
    '',
    `👤 *Name:* ${data.name}`,
    `📱 *Phone:* ${data.phone}`,
  ];

  if (data.event) lines.push(`🎉 *Event:* ${data.event}`);
  if (data.guests) lines.push(`👥 *Guests:* ${data.guests}`);
  if (data.eventDate) lines.push(`📅 *Date:* ${data.eventDate}`);
  if (data.eventLocation) lines.push(`📍 *Location:* ${data.eventLocation}`);
  if (data.foodType) lines.push(`🍛 *Food Type:* ${data.foodType}`);
  if (data.customItems) lines.push(`🍽️ *Special Items:* ${data.customItems}`);
  if (data.message) {
    lines.push('');
    lines.push(`💬 *Message:*\n${data.message}`);
  }

  return lines.join('\n');
}

/**
 * Build a wa.me URL with the given pre-filled text
 */
export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/**
 * Quick WhatsApp link for direct (no pre-fill) contact
 */
export const WHATSAPP_DIRECT_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
