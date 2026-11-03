// components/admin/ThemeSettingsForm.tsx
// A4: Theme customizer editor. Edits the single theme_settings row.
// Saving writes the row back; the public site reads these as CSS variables via
// the ThemeProvider (lib/theme.ts) once wired into the [locale] layout.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Palette, Loader2 } from 'lucide-react';

interface ThemeSettings {
  id: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_heading: string;
  font_body: string;
  logo_url: string;
}

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-[var(--color-ivory-300)] bg-white font-body text-sm text-[var(--color-brown-900)] focus:outline-none focus:ring-2 focus:ring-[var(--color-green-800)]';

export default function ThemeSettingsForm({ initial }: { initial: ThemeSettings }) {
  const router = useRouter();
  const [form, setForm] = useState<ThemeSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const set = (k: keyof ThemeSettings, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const payload = {
        id: form.id,
        primary_color: form.primary_color,
        secondary_color: form.secondary_color,
        accent_color: form.accent_color,
        font_heading: form.font_heading,
        font_body: form.font_body,
        logo_url: form.logo_url || null,
      };
      const res = await fetch('/api/admin/settings/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setForm((f) => ({ ...f, id: data.id ?? f.id }));
      setMsg({ ok: true, text: 'Theme saved. Refresh the public site to see changes.' });
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const colorField = (label: string, key: 'primary_color' | 'secondary_color' | 'accent_color') => (
    <div>
      <label className="block font-body text-xs font-semibold uppercase tracking-wide text-[var(--color-brown-500)] mb-1">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={form[key]}
          onChange={(e) => set(key, e.target.value)}
          className="w-10 h-10 rounded cursor-pointer border border-[var(--color-ivory-300)]"
          aria-label={label}
        />
        <input
          type="text"
          value={form[key]}
          onChange={(e) => set(key, e.target.value)}
          className={inputClass}
        />
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSave} className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Palette size={20} className="text-[var(--color-gold-600)]" />
        <h2 className="font-display text-base font-bold text-[var(--color-brown-900)]">Brand Colours</h2>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {colorField('Primary', 'primary_color')}
        {colorField('Secondary', 'secondary_color')}
        {colorField('Accent', 'accent_color')}
      </div>

      <h2 className="font-display text-base font-bold text-[var(--color-brown-900)] mb-4">Typography</h2>
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block font-body text-xs font-semibold uppercase tracking-wide text-[var(--color-brown-500)] mb-1">Heading font</label>
          <input type="text" value={form.font_heading} onChange={(e) => set('font_heading', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block font-body text-xs font-semibold uppercase tracking-wide text-[var(--color-brown-500)] mb-1">Body font</label>
          <input type="text" value={form.font_body} onChange={(e) => set('font_body', e.target.value)} className={inputClass} />
        </div>
      </div>

      <h2 className="font-display text-base font-bold text-[var(--color-brown-900)] mb-4">Logo</h2>
      <div className="mb-6">
        <label className="block font-body text-xs font-semibold uppercase tracking-wide text-[var(--color-brown-500)] mb-1">Logo URL</label>
        <input type="text" value={form.logo_url} onChange={(e) => set('logo_url', e.target.value)} placeholder="/logos/logo-512.png" className={inputClass} />
      </div>

      {msg && (
        <p className={`font-body text-sm mb-3 ${msg.ok ? 'text-green-700' : 'text-red-600'}`} role="alert">
          {msg.text}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 px-6 h-11 rounded-lg font-body text-sm font-semibold bg-[var(--color-green-800)] text-white hover:bg-[var(--color-green-900)] transition-colors disabled:opacity-60"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Palette size={16} />}
        {saving ? 'Saving…' : 'Save Theme'}
      </button>
    </form>
  );
}
