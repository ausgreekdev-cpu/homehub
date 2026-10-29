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
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Create account</h1>
        <input className="w-full border rounded p-2" placeholder="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        <input className="w-full border rounded p-2" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full border rounded p-2" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <select className="w-full border rounded p-2" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="tenant">Tenant</option>
          <option value="landlord">Landlord</option>
          <option value="agent">Real Estate Agent</option>
          <option value="contractor">Contractor</option>
        </select>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="w-full bg-slate-900 text-white rounded p-2" disabled={loading}>{loading ? 'Creating…' : 'Create account'}</button>
      </form>
    </main>
  );
}
