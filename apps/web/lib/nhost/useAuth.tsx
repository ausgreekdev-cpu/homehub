'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createNhostClient } from './client';
import type { NhostClient } from '@nhost/nhost-js';

const nhost = createNhostClient();
const Ctx = createContext<{ nhost: NhostClient; user: any; loading: boolean }>({ nhost, user: null, loading: true });

export function NhostAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setUser(nhost.auth.getUser());
    setLoading(false);
  }, []);
  return <Ctx.Provider value={{ nhost, user, loading }}>{children}</Ctx.Provider>;
}

export function useNhostAuth() { return useContext(Ctx); }
export { nhost };
