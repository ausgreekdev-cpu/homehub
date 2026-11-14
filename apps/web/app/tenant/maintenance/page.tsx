'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AccessibleInput } from '@/components/AccessibleInput'
import { AccessibleTextarea } from '@/components/AccessibleTextarea'

export default function TenantMaintenance() {
  const [tickets, setTickets] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data: mems } = await supabase.from('property_memberships').select('property_id').eq('user_id', user.id)
    if (mems && mems.length > 0 && mems[0]) {
      const { data } = await supabase.from('maintenance_tickets').select('*').eq('property_id', mems[0]!.property_id).order('created_at', { ascending: false })
      setTickets(data ?? [])
    }
    setLoading(false)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: mems } = await supabase.from('property_memberships').select('property_id').eq('user_id', user.id)
    if (!mems || mems.length === 0) return
    await supabase.from('maintenance_tickets').insert({
      property_id: mems[0]!.property_id, title, description: desc, reported_by: user.id, status: 'open',
    })
    setTitle(''); setDesc('')
    load()
  }

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <a href="/tenant" className="text-sm text-slate-600 underline">← Back</a>
      <h1 className="text-2xl font-bold mt-2 mb-6">Report an Issue</h1>
      <form onSubmit={submit} className="space-y-4 mb-6" aria-label="Report a maintenance issue">
        <AccessibleInput
          label="Issue Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          placeholder="Brief description of the issue"
        />
        <AccessibleTextarea
          label="Description"
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Detailed description of the issue"
          rows={3}
        />
        <button className="px-4 py-2 bg-slate-900 text-white rounded" type="submit" aria-busy={false}>
          Submit Request
        </button>
      </form>
      <h2 className="font-semibold mb-3">Your Requests</h2>
      {loading ? <p className="text-slate-500" role="status" aria-live="polite">Loading requests...</p> : tickets.length === 0 ? <p className="text-slate-500">No requests yet.</p> : (
        <ul className="divide-y border rounded">
          {tickets.map(t => (
            <li key={t.id} className="p-3">
              <div className="font-semibold">{t.title}</div>
              <div className="text-sm text-slate-600">{t.description}</div>
              <span className={`text-xs px-2 py-0.5 rounded ${t.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{t.status}</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
