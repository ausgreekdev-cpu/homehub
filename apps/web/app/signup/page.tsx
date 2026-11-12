'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('tenant');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    const supabase = createClient();
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { display_name: displayName, default_role: role } },
    });
    setLoading(false);
    if (error) setError(error.message);
    else router.push('/dashboard');
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4" aria-label="Create a new account">
        <h1 className="text-2xl font-bold">Create account</h1>
        <div className="flex flex-col gap-1">
          <label htmlFor="signup-name" className="text-sm font-medium text-slate-700">Display name</label>
          <input
            id="signup-name"
            className="w-full border rounded p-2"
            placeholder="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            aria-required="true"
            autoComplete="name"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="signup-email" className="text-sm font-medium text-slate-700">Email</label>
          <input
            id="signup-email"
            className="w-full border rounded p-2"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-required="true"
            autoComplete="email"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="signup-password" className="text-sm font-medium text-slate-700">Password</label>
          <input
            id="signup-password"
            className="w-full border rounded p-2"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            aria-required="true"
            autoComplete="new-password"
            minLength={6}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="signup-role" className="text-sm font-medium text-slate-700">I am a...</label>
          <select
            id="signup-role"
            className="w-full border rounded p-2"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="tenant">Tenant</option>
            <option value="landlord">Landlord</option>
            <option value="agent">Real Estate Agent</option>
            <option value="contractor">Contractor</option>
          </select>
        </div>
        {error && (
          <p className="text-red-600 text-sm" role="alert" aria-live="assertive">
            {error}
          </p>
        )}
        <button
          className="w-full bg-slate-900 text-white rounded p-2"
          disabled={loading}
          aria-busy={loading}
          type="submit"
        >
          {loading ? 'Creating…' : 'Create account'}
        </button>
        <p className="text-sm text-slate-600">
          Already have an account?{' '}
          <a href="/login" className="underline focus:outline-2 focus:outline-slate-900">
            Sign in
          </a>
        </p>
      </form>
    </main>
  );
}
