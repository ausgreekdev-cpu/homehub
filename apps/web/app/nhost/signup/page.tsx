'use client';
import { useState } from 'react';
import { nhost } from '@/lib/nhost/useAuth';
import { useRouter } from 'next/navigation';

export default function NhostSignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await nhost.auth.signUpEmailPassword({ email, password, options: { displayName } });
      router.push('/nhost/dashboard');
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Create account (Nhost)</h1>
        <input className="w-full border rounded p-2" placeholder="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        <input className="w-full border rounded p-2" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full border rounded p-2" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="w-full bg-slate-900 text-white rounded p-2" disabled={loading}>{loading ? 'Creating…' : 'Create account'}</button>
      </form>
    </main>
  );
}
