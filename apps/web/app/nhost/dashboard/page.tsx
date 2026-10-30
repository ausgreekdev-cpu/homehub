'use client';
import { useEffect, useState } from 'react';
import { nhost } from '@/lib/nhost/useAuth';

export default function NhostDashboardPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await nhost.graphql.request<{ properties: any[] }>({
          query: `query { properties { id name address } }`,
        });
        setProperties(res.body?.data?.properties ?? []);
      } catch (e: any) {
        setError(e?.message ?? String(e));
      }
      setLoading(false);
    })();
  }, []);

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Nhost dashboard</h1>
      {loading && <p>Loading…</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <ul className="divide-y border rounded">
        {properties.map((p: any) => (
          <li key={p.id} className="p-3">
            <div className="font-semibold">{p.name}</div>
            <div className="text-sm text-slate-600">{p.address}</div>
          </li>
        ))}
        {!loading && properties.length === 0 && <li className="p-3 text-slate-500">No properties (configure Hasura permissions).</li>}
      </ul>
    </main>
  );
}
