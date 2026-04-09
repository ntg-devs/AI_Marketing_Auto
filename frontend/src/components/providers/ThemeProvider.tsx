'use client';

import { useEffect, useState } from 'react';
import { useUIStore } from '@/store/useUIStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useUIStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    // Clean up all theme markers first
    root.removeAttribute('data-theme');
    root.classList.remove('dark');

    if (theme === 'quite-light') {
      // Light theme: set data-theme attribute, NO dark class
      root.setAttribute('data-theme', 'quite-light');
    } else if (theme === 'dark') {
      // Dark theme: add dark class for Tailwind dark: prefix
      root.classList.add('dark');
    } else if (theme === 'light') {
      // Standard light: nothing extra needed
    } else if (theme === 'system') {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      }
    }
  }, [theme, mounted]);

  // Prevent flash of incorrect theme
  if (!mounted) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
