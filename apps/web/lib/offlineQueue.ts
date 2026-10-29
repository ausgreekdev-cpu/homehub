'use client';
const KEY = 'homehub.offlineQueue';

export interface QueuedMutation {
  id: string;
  type: string;
  payload: any;
  createdAt: string;
  attempts: number;
}

function read(): QueuedMutation[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; }
}
function write(q: QueuedMutation[]) { localStorage.setItem(KEY, JSON.stringify(q)); }

export function enqueue(type: string, payload: any): QueuedMutation {
  const item: QueuedMutation = { id: crypto.randomUUID(), type, payload, createdAt: new Date().toISOString(), attempts: 0 };
  const q = read(); q.push(item); write(q);
  notify();
  return item;
}

export function getQueue(): QueuedMutation[] { return read(); }
export function getQueueSize(): number { return read().length; }

export function remove(id: string) {
  write(read().filter((q) => q.id !== id));
  notify();
}

export function incrementAttempts(id: string) {
  const q = read().map((m) => m.id === id ? { ...m, attempts: m.attempts + 1 } : m);
  write(q);
}

type Listener = (size: number) => void;
const listeners = new Set<Listener>();
export function subscribe(fn: Listener) { listeners.add(fn); return () => listeners.delete(fn); }
function notify() { const s = read().length; listeners.forEach((l) => l(s)); }

export async function flush(handler: (m: QueuedMutation) => Promise<boolean>) {
  const q = read();
  for (const m of q) {
    try {
      const ok = await handler(m);
      if (ok) remove(m.id);
      else incrementAttempts(m.id);
    } catch {
      incrementAttempts(m.id);
    }
  }
  notify();
}
