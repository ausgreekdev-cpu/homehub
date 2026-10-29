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
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Sign in</h1>
        <input className="w-full border rounded p-2" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full border rounded p-2" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="w-full bg-slate-900 text-white rounded p-2" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
        <p className="text-sm text-slate-600">No account? <a href="/signup" className="underline">Sign up</a></p>
      </form>
    </main>
  );
}
