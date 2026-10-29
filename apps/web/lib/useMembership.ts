'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useMembership(propertyId: string) {
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }: { data: any }) => {
      const uid = data?.user?.id;
      setUserId(uid ?? null);
      if (!uid) return;
      supabase.from('property_memberships').select('role').eq('property_id', propertyId).eq('user_id', uid).single()
        .then(({ data: m }: { data: any }) => setRole(m?.role ?? null));
    });
  }, [propertyId]);
  return { role, userId };
}
