'use client'

import { useState, useEffect } from 'react'
import { getLocale, setLocale, Locale } from '@/lib/i18n'

export function LanguageSwitcher() {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    setLocaleState(getLocale())
  }, [])

  function changeLocale(l: Locale) {
    setLocale(l)
    setLocaleState(l)
    window.location.reload()
  }

  return (
    <select
      value={locale}
      onChange={(e) => changeLocale(e.target.value as Locale)}
      className="border rounded px-2 py-1 text-sm"
    >
      <option value="en">EN</option>
      <option value="es">ES</option>
      <option value="fr">FR</option>
    </select>
  )
}
