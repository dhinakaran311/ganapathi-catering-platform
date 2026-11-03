'use client';

// components/ui/ThemeToggle.tsx — A3: Dark mode toggle button
// Uses the shared useTheme() context (lib/theme.tsx) so the preference stays
// in sync with the public site and across tabs.

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      className="p-2 rounded-lg text-[var(--color-brown-500)] hover:text-[var(--color-brown-900)] hover:bg-[var(--color-ivory-300)] transition-colors"
    >
      {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
