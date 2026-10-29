export type Locale = 'en' | 'es' | 'fr';

const dict: Record<Locale, Record<string, string>> = {
  en: {
    'app.name': 'HomeHub',
    'nav.dashboard': 'Dashboard',
    'nav.properties': 'Properties',
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.delete': 'Delete',
    'bills.title': 'Bills',
    'inventory.title': 'Inventory',
    'maintenance.title': 'Maintenance',
    'tenancy.title': 'Tenancy',
  },
  es: {
    'app.name': 'HomeHub',
    'nav.dashboard': 'Panel',
    'nav.properties': 'Propiedades',
    'action.save': 'Guardar',
    'action.cancel': 'Cancelar',
    'action.delete': 'Eliminar',
    'bills.title': 'Facturas',
    'inventory.title': 'Inventario',
    'maintenance.title': 'Mantenimiento',
    'tenancy.title': 'Arrendamiento',
  },
  fr: {
    'app.name': 'HomeHub',
    'nav.dashboard': 'Tableau de bord',
    'nav.properties': 'Propriétés',
    'action.save': 'Enregistrer',
    'action.cancel': 'Annuler',
    'action.delete': 'Supprimer',
    'bills.title': 'Factures',
    'inventory.title': 'Inventaire',
    'maintenance.title': 'Maintenance',
    'tenancy.title': 'Location',
  },
};

export function t(key: string, locale: Locale = 'en'): string {
  return dict[locale]?.[key] ?? dict.en[key] ?? key;
}

export function availableLocales(): Locale[] { return Object.keys(dict) as Locale[]; }
export const DEFAULT_LOCALE: Locale = 'en';
