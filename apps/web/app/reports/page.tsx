'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ReportsPage() {
  const [propertyId, setPropertyId] = useState('')
  const [loading, setLoading] = useState(false)
  const [csv, setCsv] = useState('')

  async function exportXero() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.functions.invoke('export-xero', { body: { propertyId } })
    setCsv(data?.csv || '')
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

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Reports & Exports</h1>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div className="border rounded p-4">
          <h2 className="font-semibold mb-2">Rent Roll</h2>
          <p className="text-sm text-slate-600 mb-4">All tenants and rent amounts</p>
          <button className="px-4 py-2 border rounded text-sm">Generate</button>
        </div>
        <div className="border rounded p-4">
          <h2 className="font-semibold mb-2">P&L Statement</h2>
          <p className="text-sm text-slate-600 mb-4">Income vs expenses</p>
          <button className="px-4 py-2 border rounded text-sm">Generate</button>
        </div>
        <div className="border rounded p-4">
          <h2 className="font-semibold mb-2">Owner Statement</h2>
          <p className="text-sm text-slate-600 mb-4">Per-owner summary</p>
          <button className="px-4 py-2 border rounded text-sm">Generate</button>
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
    </main>
  )
}
