'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function NoticesPage() {
  const [notices, setNotices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ property_id: '', type: 'entry_notice', title: '', content: '', effective_date: '' })

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data } = await supabase.from('notices').select('*, properties(name)').order('created_at', { ascending: false })
    setNotices(data ?? [])
    setLoading(false)
  }

  async function create(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    await supabase.from('notices').insert(form)
    setShowForm(false)
    setForm({ property_id: '', type: 'entry_notice', title: '', content: '', effective_date: '' })
    load()
  }

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Compliance Notices</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-slate-900 text-white rounded">
          {showForm ? 'Cancel' : 'Create Notice'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="border rounded p-4 mb-6 space-y-3">
          <input className="w-full border rounded p-2" placeholder="Property ID" value={form.property_id} onChange={e => setForm({...form, property_id: e.target.value})} required />
          <select className="w-full border rounded p-2" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
            <option value="entry_notice">Entry Notice (24h)</option>
            <option value="rent_increase">Rent Increase</option>
            <option value="termination">Termination</option>
            <option value="breach">Breach Notice</option>
            <option value="general">General</option>
          </select>
          <input className="w-full border rounded p-2" placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
          <textarea className="w-full border rounded p-2" placeholder="Content" value={form.content} onChange={e => setForm({...form, content: e.target.value})} rows={4} />
          <input className="w-full border rounded p-2" type="date" value={form.effective_date} onChange={e => setForm({...form, effective_date: e.target.value})} />
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
                <th className="text-left p-3">Title</th>
                <th className="text-left p-3">Effective</th>
                <th className="text-center p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {notices.map(n => (
                <tr key={n.id} className="border-t">
                  <td className="p-3">{(n.properties as any)?.name || n.property_id}</td>
                  <td className="p-3 capitalize">{n.type.replace('_', ' ')}</td>
                  <td className="p-3">{n.title}</td>
                  <td className="p-3">{n.effective_date || '-'}</td>
                  <td className="p-3 text-center"><span className="px-2 py-1 bg-slate-100 rounded text-xs">{n.status}</span></td>
                </tr>
              ))}
              {notices.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-slate-500">No notices.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
