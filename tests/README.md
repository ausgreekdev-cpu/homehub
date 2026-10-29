# RLS tests

Run against a live Supabase project:

```bash
export SUPABASE_URL=...
export SUPABASE_ANON_KEY=...
export SUPABASE_SERVICE_ROLE_KEY=...
pnpm test
```

Tests are skipped automatically when env vars are missing. They create and clean up test users/properties.
