// lib/analytics/track.ts — A9: Client-side analytics event tracker
//
// Sends events to our own /api/track endpoint (validated + rate-limited on the
// server). Uses navigator.sendBeacon so the event survives the page opening
// WhatsApp in a new tab or navigating away. No Supabase client is shipped to
// the browser for this anymore.

type EventName =
  | 'page_view'
  | 'enquiry_submit'
  | 'whatsapp_open'
  | 'menu_filter'
  | 'gallery_view'
  | 'service_area_check';

interface TrackPayload {
  event: EventName;
  page?: string;
  metadata?: Record<string, string | number | boolean>;
}

/**
 * Track an analytics event. Fire-and-forget — never throws, never blocks.
 */
export function track(payload: TrackPayload): void {
  try {
    if (typeof window === 'undefined') return;

    const body = JSON.stringify({
      event: payload.event,
      page: payload.page ?? window.location.pathname,
      metadata: payload.metadata ?? {},
    });

    if (navigator.sendBeacon?.('/api/track', body)) return;

    void fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Silently fail — analytics should never break the UI
  }
}
