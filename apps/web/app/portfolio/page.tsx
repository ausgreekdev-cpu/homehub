'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { VirtualizedList } from '@/components/VirtualizedList'

export default function PortfolioPage() {
  const [properties, setProperties] = useState<any[]>([])
  const [stats, setStats] = useState({ totalRent: 0, occupancy: 0, arrears: 0, expenses: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const supabase = createClient()
    const { data: props } = await supabase.from('properties').select('*')
    const { data: expenses } = await supabase.from('expenses').select('amount_cents')
    const { data: arrears } = await supabase.from('arrears').select('amount_due_cents').eq('status', 'open')
    
    setProperties(props ?? [])
    setStats({
      totalRent: 0,
      occupancy: props?.length ? 100 : 0,
      arrears: (arrears || []).reduce((sum, a) => sum + (a.amount_due_cents || 0), 0),
      expenses: (expenses || []).reduce((sum, e) => sum + e.amount_cents, 0),
    })
    setLoading(false)
  }

  return (
    <main className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Portfolio Overview</h1>
      
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 border rounded">
          <div className="text-sm text-slate-600">Properties</div>
          <div className="text-2xl font-bold">{properties.length}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-slate-600">Occupancy</div>
          <div className="text-2xl font-bold">{stats.occupancy}%</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-slate-600">Total Arrears</div>
          <div className="text-2xl font-bold text-red-600">${(stats.arrears / 100).toFixed(2)}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-slate-600">Total Expenses</div>
          <div className="text-2xl font-bold">${(stats.expenses / 100).toFixed(2)}</div>
        </div>
      </div>

      <div className="border rounded overflow-hidden">
        <div className="grid grid-cols-[1.5fr_2fr_1fr_1fr] bg-slate-50 px-3 py-3 text-sm font-semibold">
          <div>Property</div>
          <div>Address</div>
          <div className="text-center">Status</div>
          <div className="text-center">Action</div>
        </div>
        <VirtualizedList
          items={properties}
          itemHeight={48}
          height={Math.min(properties.length * 48, 500)}
          renderItem={(p) => (
            <div className="grid grid-cols-[1.5fr_2fr_1fr_1fr] items-center border-t px-3 py-3 text-sm">
              <div className="font-semibold">{p.name}</div>
              <div>{p.address}</div>
              <div className="text-center">
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Active</span>
              </div>
              <div className="text-center">
                <a href={`/properties/${p.id}`} className="text-blue-600 text-sm underline">View</a>
              </div>
            </div>
          )}
        />
      </div>
    </main>
  )
}
