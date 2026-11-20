'use client';

import { useState, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';

export type Theme = 'light' | 'dark';

function applyThemeWithTransition(applyFn: () => void) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    applyFn();
    return;
  }

  const doc = document as unknown as { startViewTransition?: (cb: () => void) => void };
  // Проверяем, поддерживает ли браузер нативный View Transitions API (Chrome, Edge, Safari 18+)
  if (typeof doc.startViewTransition === 'function') {
    doc.startViewTransition(() => {
      flushSync(() => {
        applyFn();
      });
    });
  } else {
    // Фолбэк для остальных браузеров: вешаем временный CSS-класс плавного перехода
    document.documentElement.classList.add('theme-transition');
    applyFn();
    window.setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
    }, 400);
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('theme') as Theme | null;
      if (saved === 'dark' || saved === 'light') {
        setThemeState(saved);
        document.documentElement.classList.toggle('dark', saved === 'dark');
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setThemeState('dark');
        document.documentElement.classList.add('dark');
      } else {
        setThemeState('light');
        document.documentElement.classList.remove('dark');
      }
    } catch {}
  }, []);

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    try {
      localStorage.setItem('theme', next);
    } catch {}
    applyThemeWithTransition(() => {
      document.documentElement.classList.toggle('dark', next === 'dark');
      setThemeState(next);
    });
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    try {
      localStorage.setItem('theme', newTheme);
    } catch {}
    applyThemeWithTransition(() => {
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
      setThemeState(newTheme);
    });
  }, []);

  return {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setTheme,
    mounted,
  };
}
