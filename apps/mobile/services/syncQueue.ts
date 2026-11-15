import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const QUEUE_KEY = 'homehub_sync_queue';

interface QueuedAction {
  id: string;
  type: 'message' | 'maintenance' | 'payment';
  payload: Record<string, unknown>;
  createdAt: string;
  retries: number;
}

export async function enqueueAction(type: QueuedAction['type'], payload: QueuedAction['payload']): Promise<void> {
  const queue = await getQueue();
  queue.push({
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    payload,
    createdAt: new Date().toISOString(),
    retries: 0,
  });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function getQueue(): Promise<QueuedAction[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function processQueue(): Promise<{ processed: number; failed: number }> {
  const queue = await getQueue();
  if (queue.length === 0) return { processed: 0, failed: 0 };

  let processed = 0;
  let failed = 0;
  const remaining: QueuedAction[] = [];

  for (const action of queue) {
    try {
      switch (action.type) {
        case 'message':
          await supabase.from('messages').insert(action.payload);
          break;
        case 'maintenance':
          await supabase.from('maintenance_requests').insert(action.payload);
          break;
        case 'payment':
          // Payments are handled via Stripe; just log
          console.log('Queued payment action:', action.payload);
          break;
        default:
          console.warn('Unknown action type:', action.type);
      }
      processed++;
    } catch (e) {
      console.error('Failed to process queued action:', e);
      action.retries++;
      if (action.retries < 3) {
        remaining.push(action);
      } else {
        failed++;
      }
    }
  }

  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  return { processed, failed };
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

export async function queueSize(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}
