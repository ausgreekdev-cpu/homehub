import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const metadata: Metadata = {
  title: 'HomeHub — Property & Household Management',
  description: 'Coordinate bills, inventory, maintenance, and tenancy in one place.',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-slate-900 focus:rounded focus:shadow-lg focus:outline-2 focus:outline-slate-900"
        >
          Skip to main content
        </a>
        <ErrorBoundary>
          <Providers>
            <div id="main-content" role="main" tabIndex={-1}>
              {children}
            </div>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
