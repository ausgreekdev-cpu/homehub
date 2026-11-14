import type { NextConfig } from 'next';
import withPWAInit from 'next-pwa';
import { withSentryConfig } from '@sentry/nextjs';
const withBundleAnalyzer = process.env.ANALYZE === 'true' ? require('@next/bundle-analyzer')({ enabled: true }) : (c: any) => c;

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const baseConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@homehub/shared'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

const configWithPWA = withPWA(baseConfig as any);

const configWithAnalyzer = withBundleAnalyzer(configWithPWA);

export default withSentryConfig(configWithAnalyzer, {
  // Only upload sourcemaps when auth token is configured
  silent: true,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
    deleteSourcemapsAfterUpload: true,
  },
  hideSourceMaps: true,
});
