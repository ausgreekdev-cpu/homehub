#!/usr/bin/env node
/**
 * Fail-fast check for required environment variables.
 *
 * Run in CI / Netlify before `next build` so a missing variable aborts the
 * build with a clear, actionable message instead of shipping a broken bundle.
 *
 * Usage:
 *   node scripts/check-env.mjs              # web (default)
 *   node scripts/check-env.mjs --target=mobile
 */
const target = (process.argv.find((a) => a.startsWith('--target=')) || '--target=web').split('=')[1];

const WEB_REQUIRED = [
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    validate: (v) => /^https?:\/\/.+/.test(v),
    hint: 'https://<project-ref>.supabase.co',
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    validate: (v) => v.length > 0,
    hint: 'the anon/publishable key from your Supabase project',
  },
];

const MOBILE_REQUIRED = [
  {
    name: 'EXPO_PUBLIC_SUPABASE_URL',
    validate: (v) => /^https?:\/\/.+/.test(v),
    hint: 'https://<project-ref>.supabase.co',
  },
  {
    name: 'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    validate: (v) => v.length > 0,
    hint: 'the anon/publishable key from your Supabase project',
  },
];

const WEB_OPTIONAL = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_SENTRY_DSN',
];

const MOBILE_OPTIONAL = ['EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY'];

const isWeb = target === 'web';
const required = isWeb ? WEB_REQUIRED : MOBILE_REQUIRED;
const optional = isWeb ? WEB_OPTIONAL : MOBILE_OPTIONAL;

let ok = true;
console.log(`Checking ${target} environment variables...`);

for (const r of required) {
  const v = process.env[r.name];
  if (!v) {
    console.error(`❌ Missing required env var: ${r.name} (expected: ${r.hint})`);
    ok = false;
    continue;
  }
  if (r.validate && !r.validate(v)) {
    console.error(`❌ Invalid ${r.name}: "${v}" (expected: ${r.hint})`);
    ok = false;
  } else {
    console.log(`   ✅ ${r.name}`);
  }
}

for (const name of optional) {
  if (!process.env[name]) {
    console.warn(`   ⚠️  Optional env var not set: ${name}`);
  }
}

if (!ok) {
  console.error('');
  console.error('Fix: set the missing variable(s) in your hosting provider / .env file.');
  if (isWeb) console.error('See docs/deploy.md for the full list of environment variables.');
  if (!isWeb) console.error('See apps/mobile/.env.example for the full list.');
  process.exit(1);
}

console.log('✅ All required environment variables present.');
