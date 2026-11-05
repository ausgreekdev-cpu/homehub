'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toCsv } from '@homehub/shared'

interface RentRollRow {
  property: string
  tenant: string
  email: string
  rent: number
  status: string
}

export default function ReportsPage() {
  const [propertyId, setPropertyId] = useState('')
  const [loading, setLoading] = useState(false)
  const [csv, setCsv] = useState('')
  const [rentRoll, setRentRoll] = useState<RentRollRow[]>([])
  const [ownerStatement, setOwnerStatement] = useState<any>(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))

  useEffect(() => {
    loadRentRoll()
  }, [])

  async function loadRentRoll() {
    const supabase = createClient()
    const { data: expenses } = await supabase.from('expenses').select('*, properties(name)').order('created_at', { ascending: false })
    const { data: splits } = await supabase.from('expense_splits').select('*')
    const { data: profiles } = await supabase.from('profiles').select('*')

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))

    const roll: RentRollRow[] = (expenses || []).map((e: any) => {
      const split = (splits || []).find((s: any) => s.expense_id === e.id)
      const profile = split ? profileMap.get(split.user_id) : null
      return {
        property: (e.properties as any)?.name || 'Unknown',
        tenant: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Unassigned',
        email: profile?.email || '',
        rent: e.amount_cents,
        status: e.status || 'pending',
      }
    })

    setRentRoll(roll)
  }

  async function exportXero() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.functions.invoke('export-xero', { body: { propertyId } })
    setCsv(data?.csv || '')
    setLoading(false)
  }

  async function generateOwnerStatement() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.functions.invoke('generate-owner-statement', {
      body: { propertyId, ownerId: '', month: selectedMonth }
    })
    setOwnerStatement(data?.statement || null)
    setLoading(false)
  }

  async function downloadCsv() {
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'xero-export.csv'
    a.click()
  }

  async function downloadRentRoll() {
    const rows = rentRoll.map(r => ({
      Property: r.property,
      Tenant: r.tenant,
      Email: r.email,
      'Rent (cents)': r.rent,
      Status: r.status,
    }))
    const csvStr = toCsv(rows)
    const blob = new Blob([csvStr], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'rent-roll.csv'
    a.click()
  }

  const totalRent = rentRoll.reduce((sum, r) => sum + r.rent, 0)

  return (
    <main className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Reports & Exports</h1>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="border rounded p-4">
          <h2 className="font-semibold mb-2">Rent Roll</h2>
          <p className="text-sm text-slate-600 mb-4">All tenants and rent amounts</p>
          <button onClick={downloadRentRoll} className="px-4 py-2 border rounded text-sm">Download CSV</button>
        </div>
        <div className="border rounded p-4">
          <h2 className="font-semibold mb-2">P&L Statement</h2>
          <p className="text-sm text-slate-600 mb-4">Income vs expenses</p>
          <button className="px-4 py-2 border rounded text-sm">Generate</button>
        </div>
        <div className="border rounded p-4">
          <h2 className="font-semibold mb-2">Owner Statement</h2>
          <p className="text-sm text-slate-600 mb-4">Per-owner summary</p>
          <div className="flex gap-2 mb-2">
            <input
              className="border rounded p-1 flex-1 text-sm"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
            <button onClick={generateOwnerStatement} disabled={loading} className="px-3 py-1 bg-slate-900 text-white rounded text-sm disabled:opacity-50">
              {loading ? '...' : 'Generate'}
            </button>
          </div>
          {ownerStatement && (
            <div className="text-sm bg-slate-50 p-3 rounded">
              <div>Rent collected: ${(ownerStatement.rentCollected / 100).toFixed(2)}</div>
              <div>Expenses: ${(ownerStatement.totalExpenses / 100).toFixed(2)}</div>
              <div className="font-semibold">Net: ${(ownerStatement.net / 100).toFixed(2)}</div>
            </div>
          )}
        </div>
        <div className="border rounded p-4">
          <h2 className="font-semibold mb-2">Xero Export</h2>
          <p className="text-sm text-slate-600 mb-4">CSV export for Xero/QuickBooks</p>
          <div className="flex gap-2 mb-2">
            <input
              className="border rounded p-1 flex-1 text-sm"
              placeholder="Property ID"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
            />
            <button onClick={exportXero} disabled={loading || !propertyId} className="px-3 py-1 bg-slate-900 text-white rounded text-sm disabled:opacity-50">
              {loading ? '...' : 'Export'}
            </button>
          </div>
          {csv && <button onClick={downloadCsv} className="text-sm text-blue-600 underline">Download CSV</button>}
        </div>
      </div>

      <div className="border rounded overflow-hidden">
        <div className="bg-slate-50 px-4 py-3 flex justify-between">
          <h2 className="font-semibold">Rent Roll</h2>
          <span className="text-sm text-slate-600">Total: ${(totalRent / 100).toFixed(2)}</span>
        </div>
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left p-3">Property</th>
              <th className="text-left p-3">Tenant</th>
              <th className="text-left p-3">Email</th>
              <th className="text-right p-3">Rent</th>
              <th className="text-center p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rentRoll.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="p-3">{r.property}</td>
                <td className="p-3">{r.tenant}</td>
                <td className="p-3 text-sm">{r.email}</td>
                <td className="p-3 text-right">${(r.rent / 100).toFixed(2)}</td>
                <td className="p-3 text-center">
                  <span className={`px-2 py-1 rounded text-xs ${r.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
            {rentRoll.length === 0 && (
              <tr><td colSpan={5} className="p-4 text-center text-slate-500">No rent data yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}
