'use client';
import { useEffect, useState } from 'react';
import type { Locale } from '@homehub/shared';
import { DEFAULT_LOCALE } from '@homehub/shared';

const KEY = 'homehub.locale';

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  useEffect(() => {
    const v = (localStorage.getItem(KEY) as Locale) ?? DEFAULT_LOCALE;
    setLocaleState(v);
  }, []);
  const setLocale = (l: Locale) => {
    localStorage.setItem(KEY, l);
    setLocaleState(l);
  };
  return { locale, setLocale };
}
