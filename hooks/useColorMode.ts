'use client';

import { useState, useEffect, useCallback } from 'react';

type ColorMode = 'light' | 'dark';

const STORAGE_KEY = 'color-mode';

/**
 * Persists the user's color mode preference to localStorage and keeps
 * document.documentElement in sync with the current mode class.
 *
 * The root layout injects a beforeInteractive script that reads the same
 * STORAGE_KEY and applies the class before first paint, preventing flash.
 */
export function useColorMode(): [ColorMode, (mode: ColorMode) => void] {
  const [colorMode, setColorModeState] = useState<ColorMode>('light');

  // Read saved preference from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ColorMode | null;
      if (stored === 'dark' || stored === 'light') {
        setColorModeState(stored);
      }
    } catch {
      // localStorage blocked (e.g. private browsing in some browsers)
    }
  }, []);

  // Sync to DOM and localStorage whenever mode changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', colorMode === 'dark');
    document.documentElement.classList.toggle('light', colorMode !== 'dark');
    try {
      localStorage.setItem(STORAGE_KEY, colorMode);
    } catch {
      // Ignore write failures
    }
  }, [colorMode]);

  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode);
  }, []);

  return [colorMode, setColorMode];
}
