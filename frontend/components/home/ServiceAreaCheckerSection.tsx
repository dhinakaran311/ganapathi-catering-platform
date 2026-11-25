// components/home/ServiceAreaCheckerSection.tsx
// Server wrapper that fetches active service areas and renders the client
// ServiceAreaChecker. Kept separate so the fetch stays server-side and only
// the interactive checker ships to the browser. (Query unchanged.)

import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import ServiceAreaChecker, { type ServiceArea } from './ServiceAreaChecker';
import Reveal from '@/components/site/Reveal';

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

  const t = await getTranslations('Site.areas');

  return (
    <section id="areas" aria-labelledby="areas-title" className="s-section">
      <div className="s-container grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <Reveal>
          <h2 id="areas-title" className="s-h2 text-[var(--site-leaf-deep)]">{t('title')}</h2>
          <p className="s-lead mt-5">{t('lead')}</p>
        </Reveal>
        <Reveal delay={100}>
          <ServiceAreaChecker areas={areas} />
        </Reveal>
      </div>
    </section>
  );
}
