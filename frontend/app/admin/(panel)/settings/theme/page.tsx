// app/admin/settings/theme/page.tsx — A4: Theme customizer
// Loads the (single) theme_settings row and renders the editor form.
// OWNER/ADMIN only.

import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUserWithRole } from '@/lib/auth/roles';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Palette } from 'lucide-react';
import ThemeSettingsForm from '@/components/admin/ThemeSettingsForm';

const DEFAULTS = {
  primary_color: '#1a3d20',
  secondary_color: '#b8860b',
  accent_color: '#25D366',
  font_heading: 'Playfair Display',
  font_body: 'Noto Sans',
  logo_url: '',
};

export default async function ThemeSettingsPage() {
  const { role } = await getCurrentUserWithRole();
  if (role !== 'OWNER' && role !== 'ADMIN') {
    redirect('/admin/settings');
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from('theme_settings')
    .select('id, primary_color, secondary_color, accent_color, font_heading, font_body, logo_url')
    .limit(1)
    .maybeSingle();

  const initial = {
    id: data?.id ?? null,
    primary_color: data?.primary_color ?? DEFAULTS.primary_color,
    secondary_color: data?.secondary_color ?? DEFAULTS.secondary_color,
    accent_color: data?.accent_color ?? DEFAULTS.accent_color,
    font_heading: data?.font_heading ?? DEFAULTS.font_heading,
    font_body: data?.font_body ?? DEFAULTS.font_body,
    logo_url: data?.logo_url ?? DEFAULTS.logo_url,
  };

  return (
    <div>
      <Link
        href="/admin/settings"
        className="inline-flex items-center gap-1.5 font-body text-sm text-[var(--color-brown-500)] hover:text-[var(--color-brown-900)] mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Settings
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Palette size={22} className="text-[var(--color-gold-600)]" />
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-brown-900)]">
            Theme & Branding
          </h1>
        </div>
        <p className="font-body text-sm text-[var(--color-brown-500)]">
          Customise colours, fonts and logo shown on the public website.
        </p>
      </div>

      <ThemeSettingsForm initial={initial} />
    </div>
  );
}
