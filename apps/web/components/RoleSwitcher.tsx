'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function RoleSwitcher() {
  const [memberships, setMemberships] = useState<any[]>([])
  const [current, setCurrent] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const { data } = await supabase
      .from('property_memberships')
      .select('*, properties(name)')
      .eq('user_id', user.id)
    
    setMemberships(data ?? [])
    if (data && data.length > 0) {
      setCurrent(data[0])
    }
  }

  if (memberships.length <= 1) return null

  return (
    <select
      value={current?.property_id || ''}
      onChange={(e) => {
        router.push(`/properties/${e.target.value}`)
      }}
      className="border rounded px-2 py-1 text-sm"
    >
      {memberships.map((m) => (
        <option key={m.id} value={m.property_id}>
          {(m.properties as any)?.name} ({m.role})
        </option>
      ))}
    </select>
  )
}
