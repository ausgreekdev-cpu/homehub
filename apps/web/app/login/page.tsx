'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else router.push('/dashboard');
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4" aria-label="Sign in to your account">
        <h1 className="text-2xl font-bold">Sign in</h1>
        <div className="flex flex-col gap-1">
          <label htmlFor="login-email" className="text-sm font-medium text-slate-700">Email</label>
          <input
            id="login-email"
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
          <label htmlFor="login-password" className="text-sm font-medium text-slate-700">Password</label>
          <input
            id="login-password"
            className="w-full border rounded p-2"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            aria-required="true"
            autoComplete="current-password"
          />
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
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="text-sm text-slate-600">
          No account?{' '}
          <a href="/signup" className="underline focus:outline-2 focus:outline-slate-900">
            Sign up
          </a>
        </p>
      </form>
    </main>
  );
}
