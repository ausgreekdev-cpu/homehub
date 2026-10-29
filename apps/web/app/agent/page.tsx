'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function AgentDashboardPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [stats, setStats] = useState<Record<string, { tickets: number; overdue: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data: mems } = await supabase.from('property_memberships').select('property_id').eq('user_id', user.id).eq('role', 'agent').eq('status', 'active') as { data: any };
      const ids = (mems ?? []).map((m: any) => m.property_id);
      if (ids.length === 0) { setLoading(false); return; }
      const { data: props } = await supabase.from('properties').select('*').in('id', ids) as { data: any };
      setProperties(props ?? []);
      const st: Record<string, { tickets: number; overdue: number }> = {};
      for (const p of props ?? []) {
        const { count: t } = await supabase.from('maintenance_tickets').select('id', { count: 'exact', head: true }).eq('property_id', p.id).in('status', ['open', 'triaged', 'quoted', 'approved', 'scheduled', 'in_progress']);
        const { count: o } = await supabase.from('expenses').select('id', { count: 'exact', head: true }).eq('property_id', p.id).eq('status', 'overdue');
        st[p.id] = { tickets: t ?? 0, overdue: o ?? 0 };
      }
      setStats(st);
      setLoading(false);
    })();
  }, []);

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Agent dashboard</h1>
      {loading ? <p>Loading…</p> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(properties).map((p) => (
            <Link key={p.id} href={`/properties/${p.id}`} className="border rounded p-4 hover:bg-slate-50">
              <div className="font-semibold">{p.name}</div>
              <div className="text-sm text-slate-600">{p.address}</div>
              <div className="mt-2 text-xs flex gap-3">
                <span>🔧 {stats[p.id]?.tickets ?? 0} open tickets</span>
                <span>💸 {stats[p.id]?.overdue ?? 0} overdue bills</span>
              </div>
            </Link>
          ))}
          {properties.length === 0 && <p className="text-slate-500">No properties assigned to you as agent.</p>}
        </div>
      )}
    </main>
  );
}
