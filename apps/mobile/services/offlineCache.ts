import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'homehub_cache_';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export async function cacheSet<T>(key: string, data: T, ttl: number = CACHE_TTL): Promise<void> {
  const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttl };
  await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > entry.ttl) {
      await AsyncStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export async function cacheRemove(key: string): Promise<void> {
  await AsyncStorage.removeItem(CACHE_PREFIX + key);
}

export async function cacheClear(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
  await AsyncStorage.multiRemove(cacheKeys);
}

export async function cacheKeys(): Promise<string[]> {
  const keys = await AsyncStorage.getAllKeys();
  return keys.filter((k) => k.startsWith(CACHE_PREFIX)).map((k) => k.replace(CACHE_PREFIX, ''));
}
