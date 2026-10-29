'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { NotificationsBell } from '@/components/NotificationsBell';
import { OfflineBanner } from '@/components/OfflineBanner';
import Link from 'next/link';

export default function DashboardPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from('properties').select('*').order('created_at', { ascending: false }) as { data: any };
    setProperties(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createProperty(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('properties').insert({ name, address, owner_id: user.id });
    if (error) { alert(error.message); return; }
    setName(''); setAddress('');
    load();
  }

  return (
    <>
      <OfflineBanner />
      <main className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Your properties</h1>
        <div className="flex items-center gap-3">
          <NotificationsBell />
          <button onClick={async () => { const s = createClient(); await s.auth.signOut(); window.location.href = '/'; }} className="text-sm text-slate-600 underline">Sign out</button>
        </div>
      </div>

      <form onSubmit={createProperty} className="mb-8 flex gap-2">
        <input className="border rounded p-2 flex-1" placeholder="Property name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="border rounded p-2 flex-1" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} required />
        <button className="bg-slate-900 text-white rounded px-4">Add</button>
      </form>

      {loading ? <p>Loading…</p> : (
        <ul className="space-y-3">
          {properties.map((p) => (
            <li key={p.id} className="border rounded p-4 hover:bg-slate-50">
              <Link href={`/properties/${p.id}`} className="block">
                <div className="font-semibold">{p.name}</div>
                <div className="text-sm text-slate-600">{p.address}</div>
              </Link>
            </li>
          ))}
          {properties.length === 0 && <li className="text-slate-500">No properties yet. Add one above.</li>}
        </ul>
      )}
    </main>
    </>
  );
}
