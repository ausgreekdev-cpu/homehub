'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ArrearsPage() {
  const [arrears, setArrears] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const supabase = createClient()
    const { data } = await supabase
      .from('arrears')
      .select('*, properties(name)')
      .eq('status', 'open')
      .order('days_overdue', { ascending: false })
    
    setArrears(data ?? [])
    setLoading(false)
  }

  async function applyLateFees() {
    const supabase = createClient()
    const { data } = await supabase.functions.invoke('apply-late-fees')
    alert(`Applied late fees to ${data?.applied || 0} items`)
    load()
  }

  const total = arrears.reduce((sum, a) => sum + (a.amount_due_cents || 0) + (a.late_fee_applied_cents || 0), 0)

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Arrears Dashboard</h1>
          <p className="text-slate-600">Track overdue rent and late fees</p>
        </div>
        <button onClick={applyLateFees} className="px-4 py-2 bg-slate-900 text-white rounded">
          Apply Late Fees
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 border rounded">
          <div className="text-sm text-slate-600">Total Outstanding</div>
          <div className="text-2xl font-bold">${(total / 100).toFixed(2)}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-slate-600">Overdue Accounts</div>
          <div className="text-2xl font-bold">{arrears.length}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-slate-600">30+ Days</div>
          <div className="text-2xl font-bold">{arrears.filter(a => a.days_overdue >= 30).length}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-slate-600">60+ Days</div>
          <div className="text-2xl font-bold">{arrears.filter(a => a.days_overdue >= 60).length}</div>
        </div>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : arrears.length === 0 ? (
        <p className="text-slate-500">No arrears. All rent is up to date!</p>
      ) : (
        <div className="border rounded overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3">Property</th>
                <th className="text-left p-3">Tenant</th>
                <th className="text-right p-3">Amount Due</th>
                <th className="text-right p-3">Late Fee</th>
                <th className="text-right p-3">Total</th>
                <th className="text-right p-3">Days Overdue</th>
                <th className="text-center p-3">Status</th>
                <th className="text-center p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {arrears.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="p-3">{(a.properties as any)?.name}</td>
                  <td className="p-3">{a.user_id?.slice(0, 8)}...</td>
                  <td className="p-3 text-right">${(a.amount_due_cents / 100).toFixed(2)}</td>
                  <td className="p-3 text-right">${(a.late_fee_applied_cents / 100).toFixed(2)}</td>
                  <td className="p-3 text-right font-semibold">${((a.amount_due_cents + a.late_fee_applied_cents) / 100).toFixed(2)}</td>
                  <td className="p-3 text-right">{a.days_overdue} days</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs ${
                      a.days_overdue >= 60 ? 'bg-red-100 text-red-800' :
                      a.days_overdue >= 30 ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {a.days_overdue >= 60 ? 'Critical' : a.days_overdue >= 30 ? 'Serious' : 'Late'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button className="px-3 py-1 border rounded text-sm">Send Reminder</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
