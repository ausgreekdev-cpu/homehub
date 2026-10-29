import type { NextConfig } from 'next';
import withPWA from 'next-pwa';

const baseConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@homehub/shared'],
  images: { remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }] },
};

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})(baseConfig);
