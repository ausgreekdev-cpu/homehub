'use client';
import { useEffect, useState } from 'react';
import { useOnlineStatus } from '@/lib/useOnlineStatus';
import { getQueueSize, subscribe, flush } from '@/lib/offlineQueue';
import { createClient } from '@/lib/supabase/client';

export function OfflineBanner() {
  const online = useOnlineStatus();
  const [size, setSize] = useState(0);
  useEffect(() => { setSize(getQueueSize()); const unsub = subscribe(setSize); return () => { unsub(); }; }, []);

  async function syncNow() {
    const supabase = createClient();
    await flush(async (m) => {
      try {
        if (m.type === 'message') {
          const { error } = await supabase.from('messages').insert(m.payload);
          return !error;
        }
        if (m.type === 'expense') {
          const { error } = await supabase.from('expenses').insert(m.payload);
          return !error;
        }
        return false;
      } catch { return false; }
    });
  }

  if (online && size === 0) return null;
  return (
    <div className={`px-4 py-2 text-sm flex justify-between items-center ${online ? 'bg-amber-100 text-amber-900' : 'bg-red-100 text-red-900'}`}>
      <span>{online ? `Online — ${size} pending change(s)` : `Offline — changes will sync when back online (${size} queued)`}</span>
      {online && size > 0 && <button onClick={syncNow} className="border rounded px-2 py-0.5">Sync now</button>}
    </div>
  );
}
