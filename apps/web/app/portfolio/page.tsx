'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3">Property</th>
              <th className="text-left p-3">Address</th>
              <th className="text-center p-3">Status</th>
              <th className="text-center p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3 font-semibold">{p.name}</td>
                <td className="p-3">{p.address}</td>
                <td className="p-3 text-center">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Active</span>
                </td>
                <td className="p-3 text-center">
                  <a href={`/properties/${p.id}`} className="text-blue-600 text-sm underline">View</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
