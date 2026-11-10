const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const recommended = ['NEXT_PUBLIC_APP_URL', 'SUPABASE_SERVICE_ROLE_KEY'];

const missing = required.filter((k) => !process.env[k]);
const missingRecommended = recommended.filter((k) => !process.env[k]);

if (missing.length) {
  console.error(`\n❌ Missing required env vars: ${missing.join(', ')}`);
  console.error('Set them in Netlify (Site settings → Environment variables) or locally in .env.local.\n');
  process.exit(1);
}
if (missingRecommended.length) {
  console.warn(`\n⚠️  Missing recommended env vars: ${missingRecommended.join(', ')}\n`);
}
console.log('✅ Env check passed');
