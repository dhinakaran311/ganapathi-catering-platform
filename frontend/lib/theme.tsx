// lib/theme.tsx — A3: Dark mode provider
//
// Owns the light/dark preference for the ADMIN panel, persists it to
// localStorage, and syncs the `data-theme` attribute on <html>. The dark
// palette is applied in app/globals.css via [data-theme="dark"] token overrides.
// The public site does not use this provider — it is always light.
//
// Note: an inline script in the admin panel layout sets data-theme before
// paint to avoid a flash of the wrong theme on load; this provider keeps it in
// sync afterwards (including across tabs).
//
// Hydration: the server cannot read localStorage, so it always renders
// "light". The stored theme is read through useSyncExternalStore with a
// "light" server snapshot — React hydrates with the same value the server
// used and then re-renders with the stored one. (Reading localStorage in a
// useState initializer made the toggle icon differ between server and
// client, which failed hydration and re-rendered the whole admin shell.)

'use client';

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'sgm-theme';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

// ── Tiny external store over localStorage ────────────────────────────────────
const listeners = new Set<() => void>();
let memoryTheme: Theme | null = null; // used when storage is unavailable

function readStoredTheme(): Theme {
  try {
    // Dark is opt-in only — no saved choice means light (matches the
    // pre-paint script in the admin layout).
    return window.localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return memoryTheme ?? 'light';
  }
}

function writeTheme(t: Theme) {
  memoryTheme = t;
  try {
    window.localStorage.setItem(STORAGE_KEY, t);
  } catch {
    // storage may be unavailable (private mode) — memory + attribute still apply
  }
  listeners.forEach((l) => l());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Keep tabs in sync.
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) onChange();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onStorage);
  };
}

const getServerTheme = (): Theme => 'light';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, readStoredTheme, getServerTheme);

  // Keep the <html data-theme> attribute in sync with the current theme.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => writeTheme(t), []);
  const toggleTheme = useCallback(
    () => writeTheme(readStoredTheme() === 'light' ? 'dark' : 'light'),
    []
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
