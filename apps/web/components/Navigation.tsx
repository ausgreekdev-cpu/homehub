'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

interface NavItem {
  href: string;
  label: string;
  icon?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/properties', label: 'Properties' },
  { href: '/listings', label: 'Listings' },
  { href: '/applications', label: 'Applications' },
  { href: '/reports', label: 'Reports' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/autopay', label: 'Autopay' },
  { href: '/payouts', label: 'Payouts' },
  { href: '/arrears', label: 'Arrears' },
  { href: '/inspections', label: 'Inspections' },
  { href: '/notices', label: 'Notices' },
  { href: '/announcements', label: 'Announcements' },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav role="navigation" aria-label="Main navigation" className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <ul className="flex gap-1 overflow-x-auto py-2" role="menubar">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.href} role="none">
                <Link
                  href={item.href}
                  role="menuitem"
                  aria-current={isActive ? 'page' : undefined}
                  className={clsx(
                    'block px-3 py-2 text-sm rounded-md transition-colors whitespace-nowrap',
                    'focus:outline-2 focus:outline-slate-900 focus:outline-offset-2',
                    isActive
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
