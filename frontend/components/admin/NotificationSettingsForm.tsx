// components/admin/NotificationSettingsForm.tsx
// E35: Notification preferences. Stored in localStorage (per-browser) since
// there is no per-user notification-preferences column yet. Controls whether
// the admin bell plays a sound and shows a desktop notification when a new
// enquiry arrives in realtime.

'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';

interface Prefs {
  sound: boolean;
  desktop: boolean;
  email: boolean;
}

const STORAGE_KEY = 'sgm_notification_prefs';

const DEFAULT_PREFS: Prefs = { sound: true, desktop: true, email: false };

const ROWS: { key: keyof Prefs; label: string; desc: string }[] = [
  { key: 'sound', label: 'Sound alert', desc: 'Play a chime when a new enquiry arrives.' },
  { key: 'desktop', label: 'Desktop notification', desc: 'Show a browser notification when a new enquiry arrives.' },
  { key: 'email', label: 'Email digest', desc: 'Daily summary of new enquiries (email service not yet connected).' },
];

function readStoredPrefs(): Prefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export default function NotificationSettingsForm() {
  // Lazy-initialize from localStorage (client-only) to avoid setState-in-effect.
  const [prefs, setPrefs] = useState<Prefs>(readStoredPrefs);
  const [saved, setSaved] = useState(false);

  const toggle = (key: keyof Prefs) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);

    // Ask for permission when desktop notifications are switched on.
    if (key === 'desktop' && next.desktop && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Bell size={20} className="text-[var(--color-brown-600)]" />
        <h2 className="font-display text-base font-bold text-[var(--color-brown-900)]">Notification Preferences</h2>
      </div>

      <div className="divide-y divide-[var(--color-ivory-200)]">
        {ROWS.map((row) => (
          <div key={row.key} className="flex items-center justify-between py-3">
            <div className="pr-4">
              <p className="font-body text-sm font-semibold text-[var(--color-brown-900)]">{row.label}</p>
              <p className="font-body text-xs text-[var(--color-brown-500)]">{row.desc}</p>
            </div>
            <button
              role="switch"
              aria-checked={prefs[row.key]}
              aria-label={row.label}
              onClick={() => toggle(row.key)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
                prefs[row.key] ? 'bg-[var(--color-green-800)]' : 'bg-[var(--color-ivory-400)]'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5 ${
                  prefs[row.key] ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {saved && (
        <p className="font-body text-xs text-green-700 mt-3" role="status">Preferences saved.</p>
      )}
    </div>
  );
}
