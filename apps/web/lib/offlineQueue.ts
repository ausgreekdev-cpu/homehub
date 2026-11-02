import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface OfflineQueueDB extends DBSchema {
  queue: {
    key: string
    value: {
      id: string
      action: string
      type?: string
      payload: any
      timestamp: number
      retries: number
    }
  }
}

let dbPromise: Promise<IDBPDatabase<OfflineQueueDB>> | null = null
const listeners = new Set<(size: number) => void>()

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<OfflineQueueDB>('homehub-offline', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('queue')) {
          db.createObjectStore('queue', { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

async function notify() {
  const size = await getQueueSize()
  listeners.forEach(l => l(size))
}

export async function enqueue(action: string, payload: any) {
  const db = await getDB()
  const id = crypto.randomUUID()
  await db.add('queue', {
    id,
    action,
    type: action,
    payload,
    timestamp: Date.now(),
    retries: 0,
  })
  await notify()
  return id
}

export async function getQueue() {
  const db = await getDB()
  return db.getAll('queue')
}

export async function getQueueSize() {
  const db = await getDB()
  return db.count('queue')
}

export function subscribe(cb: (size: number) => void) {
  listeners.add(cb)
  getQueueSize().then(cb)
  return () => listeners.delete(cb)
}

export async function removeFromQueue(id: string) {
  const db = await getDB()
  await db.delete('queue', id)
  await notify()
}

export async function flush(handler?: (item: any) => Promise<boolean>) {
  const items = await getQueue()
  for (const item of items) {
    try {
      if (handler) {
        const ok = await handler(item)
        if (ok) await removeFromQueue(item.id)
      } else {
        await removeFromQueue(item.id)
      }
    } catch (err) {
      console.error('Failed to flush:', err)
    }
  }
  await notify()
}

export async function flushQueue() {
  await flush()
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => flush())
}
