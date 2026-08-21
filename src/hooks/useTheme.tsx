import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme';

function readStored(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    /* ignore */
  }
  return 'system';
}

function systemPrefersDark() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function resolveTheme(theme: Theme): 'light' | 'dark' {
  return theme === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : theme;
}

export function applyTheme(theme: Theme) {
  const resolved = resolveTheme(theme);
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  document.documentElement.style.colorScheme = resolved;
}

/** Call once on app start (before React renders) to avoid a flash of the wrong theme. */
export function initTheme() {
  applyTheme(readStored());
}

const listeners = new Set<(t: Theme) => void>();

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(readStored);

  useEffect(() => {
    const fn = (t: Theme) => setThemeState(t);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    applyTheme(next);
    listeners.forEach((l) => l(next));
  }, []);

  const resolved = resolveTheme(theme);
  const toggle = useCallback(() => {
    setTheme(resolveTheme(readStored()) === 'dark' ? 'light' : 'dark');
  }, [setTheme]);

  return { theme, resolvedTheme: resolved, setTheme, toggle };
}
