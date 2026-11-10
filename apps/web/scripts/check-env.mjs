// Resolve env var names: support both legacy (NEXT_PUBLIC_SUPABASE_ANON_KEY)
// and new Supabase naming (SUPABASE_PUBLISHABLE_KEY / SUPABASE_SECRET_KEY).
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;

const errors = [];
if (!supabaseUrl) errors.push('NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)');
if (!anonKey) errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_PUBLISHABLE_KEY)');
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_PUBLISHABLE_KEY) {
  console.warn('\n⚠️  SUPABASE_PUBLISHABLE_KEY is set but NEXT_PUBLIC_SUPABASE_ANON_KEY is not.');
  console.warn('   Client-side Supabase requires NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  console.warn('   Set NEXT_PUBLIC_SUPABASE_ANON_KEY = your publishable key value in Netlify.\n');
}

if (errors.length) {
  console.error(`\n❌ Missing required env vars: ${errors.join(', ')}`);
  console.error('Set them in Netlify (Site settings → Environment variables).\n');
  process.exit(1);
}

// Warn about service role key (server-side only, needed for admin operations)
if (!serviceKey) {
  console.warn('\n⚠️  No service role/secret key found (SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY).');
  console.warn('   Some server-side operations (admin writes, Edge Function calls) may fail.\n');
}

console.log('✅ Env check passed');
