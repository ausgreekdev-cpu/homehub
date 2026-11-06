'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ property_id: '', type: 'routine', scheduled_date: '', notes: '' })

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data } = await supabase.from('inspections').select('*, properties(name)').order('created_at', { ascending: false })
    setInspections(data ?? [])
    setLoading(false)
  }

  async function create(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    await supabase.from('inspections').insert(form)
    setShowForm(false)
    setForm({ property_id: '', type: 'routine', scheduled_date: '', notes: '' })
    load()
  }

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inspections</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-slate-900 text-white rounded">
          {showForm ? 'Cancel' : 'Schedule Inspection'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="border rounded p-4 mb-6 space-y-3">
          <input className="w-full border rounded p-2" placeholder="Property ID" value={form.property_id} onChange={e => setForm({...form, property_id: e.target.value})} required />
          <select className="w-full border rounded p-2" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
            <option value="move_in">Move-in</option>
            <option value="move_out">Move-out</option>
            <option value="routine">Routine</option>
            <option value="interim">Interim</option>
          </select>
          <input className="w-full border rounded p-2" type="date" value={form.scheduled_date} onChange={e => setForm({...form, scheduled_date: e.target.value})} />
          <textarea className="w-full border rounded p-2" placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          <button className="px-4 py-2 bg-slate-900 text-white rounded">Create</button>
        </form>
      )}

      {loading ? <p className="text-slate-500">Loading...</p> : (
        <div className="border rounded overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3">Property</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Date</th>
                <th className="text-center p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {inspections.map(i => (
                <tr key={i.id} className="border-t">
                  <td className="p-3">{(i.properties as any)?.name || i.property_id}</td>
                  <td className="p-3 capitalize">{i.type.replace('_', ' ')}</td>
                  <td className="p-3">{i.scheduled_date || '-'}</td>
                  <td className="p-3 text-center"><span className="px-2 py-1 bg-slate-100 rounded text-xs">{i.status}</span></td>
                </tr>
              ))}
              {inspections.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-slate-500">No inspections scheduled.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
