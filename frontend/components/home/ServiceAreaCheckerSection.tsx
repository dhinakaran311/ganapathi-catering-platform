// components/home/ServiceAreaCheckerSection.tsx
// Server wrapper that fetches active service areas and renders the client
// ServiceAreaChecker. Kept separate so the fetch stays server-side and only
// the interactive checker ships to the browser.

import { createClient } from '@/lib/supabase/server';
import ServiceAreaChecker, { type ServiceArea } from './ServiceAreaChecker';

export default async function ServiceAreaCheckerSection() {
  let areas: ServiceArea[] = [];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('service_areas')
      .select('id, name_en, name_ta, delivery_available, delivery_charge, distance_km')
      .eq('is_active', true)
      .order('distance_km', { ascending: true });

    areas = (data ?? []) as ServiceArea[];
  } catch {
    areas = [];
  }

  // No rows (seed not applied) → render nothing rather than an empty box.
  if (areas.length === 0) return null;

  return <ServiceAreaChecker areas={areas} />;
}
