// lib/analytics/track.ts — A9: Client-side analytics event tracker

import { createClient } from '@/lib/supabase/client';

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
 * Track an analytics event to the analytics_events table.
 * Fire-and-forget — never throws.
 */
export async function track(payload: TrackPayload): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.from('analytics_events').insert({
      event_name: payload.event,
      page_path: payload.page ?? (typeof window !== 'undefined' ? window.location.pathname : ''),
      metadata: payload.metadata ?? {},
    });
  } catch {
    // Silently fail — analytics should never break the UI
  }
}
