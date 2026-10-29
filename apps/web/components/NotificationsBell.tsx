'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function NotificationsBell() {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const unread = items.filter((n) => !n.read_at).length;

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20) as { data: any };
    setItems(data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function markRead(id: string) {
    const supabase = createClient();
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
    setItems((p) => p.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="relative p-2 rounded hover:bg-slate-100">
        🔔
        {unread > 0 && <span className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-full px-1">{unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow-lg z-10 max-h-96 overflow-y-auto">
          {items.length === 0 && <div className="p-3 text-sm text-slate-500">No notifications.</div>}
          {items.map((n) => (
            <div key={n.id} className={`p-3 border-b text-sm ${n.read_at ? 'opacity-60' : ''}`}>
              <div className="font-semibold">{n.title}</div>
              {n.body && <div className="text-slate-600">{n.body}</div>}
              {!n.read_at && <button onClick={() => markRead(n.id)} className="text-xs text-indigo-600 mt-1">Mark read</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}