export type Locale = 'en' | 'es' | 'fr'

const dict: Record<Locale, Record<string, string>> = {
  en: {
    dashboard: 'Dashboard',
    properties: 'Properties',
    bills: 'Bills',
    inventory: 'Inventory',
    maintenance: 'Maintenance',
    messages: 'Messages',
    tenancy: 'Tenancy',
    chores: 'Chores',
    rules: 'Rules',
    pay: 'Pay',
    add: 'Add',
    save: 'Save',
    cancel: 'Cancel',
    loading: 'Loading...',
  },
  es: {
    dashboard: 'Panel',
    properties: 'Propiedades',
    bills: 'Facturas',
    inventory: 'Inventario',
    maintenance: 'Mantenimiento',
    messages: 'Mensajes',
    tenancy: 'Alquiler',
    chores: 'Tareas',
    rules: 'Reglas',
    pay: 'Pagar',
    add: 'Añadir',
    save: 'Guardar',
    cancel: 'Cancelar',
    loading: 'Cargando...',
  },
  fr: {
    dashboard: 'Tableau de bord',
    properties: 'Propriétés',
    bills: 'Factures',
    inventory: 'Inventaire',
    maintenance: 'Maintenance',
    messages: 'Messages',
    tenancy: 'Bail',
    chores: 'Tâches',
    rules: 'Règles',
    pay: 'Payer',
    add: 'Ajouter',
    save: 'Enregistrer',
    cancel: 'Annuler',
    loading: 'Chargement...',
  },
}

export function t(locale: Locale, key: string): string {
  return dict[locale]?.[key] || dict.en[key] || key
}

export function getLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  const stored = localStorage.getItem('locale') as Locale
  return stored && ['en', 'es', 'fr'].includes(stored) ? stored : 'en'
}

export function setLocale(locale: Locale) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('locale', locale)
  }
}
