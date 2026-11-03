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

'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

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

function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  try {
    // Dark is opt-in only — no saved choice means light (matches the
    // pre-paint script in the admin layout).
    return window.localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Read the stored theme lazily on the client. The pre-paint inline script in
  // the layout has already set data-theme, so there is no flash; the lazy
  // initializer avoids a setState-in-effect cascade.
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme());

  // Apply attribute + persist whenever theme changes.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // storage may be unavailable (private mode) — attribute still applies
    }
  }, [theme]);

  // Keep tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === 'light' || e.newValue === 'dark')) {
        setThemeState(e.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggleTheme = useCallback(
    () => setThemeState((prev) => (prev === 'light' ? 'dark' : 'light')),
    []
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
