import type { NextConfig } from 'next';
import withPWAInit from 'next-pwa';
import { withSentryConfig } from '@sentry/nextjs';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const baseConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@homehub/shared'],
  images: { remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }] },
};

const configWithPWA = withPWA(baseConfig as any);

export default withSentryConfig(configWithPWA, {
  // Only upload sourcemaps when auth token is configured
  silent: true,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
    deleteSourcemapsAfterUpload: true,
  },
  hideSourceMaps: true,
});
