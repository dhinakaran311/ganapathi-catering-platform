// lib/theme-settings.server.ts — reads the theme_settings row (service role;
// the table is admin-only under RLS) for the public layout.

import 'server-only';
import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildSiteTheme, type SiteTheme } from './theme-settings';

export type { SiteTheme };

export const getSiteTheme = cache(async (): Promise<SiteTheme> => {
  try {
    const { data } = await createAdminClient()
      .from('theme_settings')
      .select('primary_color, secondary_color, accent_color, font_heading, font_body, logo_url')
      .limit(1)
      .maybeSingle();
    return buildSiteTheme(data);
  } catch {
    return { style: {}, logoUrl: null };
  }
});
