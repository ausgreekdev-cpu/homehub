'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ property_id: '', title: '', content: '' })

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data } = await supabase.from('announcements').select('*, properties(name)').order('created_at', { ascending: false })
    setAnnouncements(data ?? [])
    setLoading(false)
  }

  async function create(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('announcements').insert({ ...form, sent_by: user?.id })
    setShowForm(false)
    setForm({ property_id: '', title: '', content: '' })
    load()
  }

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Announcements</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-slate-900 text-white rounded">
          {showForm ? 'Cancel' : 'New Announcement'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="border rounded p-4 mb-6 space-y-3">
          <input className="w-full border rounded p-2" placeholder="Property ID" value={form.property_id} onChange={e => setForm({...form, property_id: e.target.value})} required />
          <input className="w-full border rounded p-2" placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
          <textarea className="w-full border rounded p-2" placeholder="Message" value={form.content} onChange={e => setForm({...form, content: e.target.value})} rows={4} required />
          <button className="px-4 py-2 bg-slate-900 text-white rounded">Send to All Tenants</button>
        </form>
      )}

      {loading ? <p className="text-slate-500">Loading...</p> : (
        <div className="space-y-3">
          {announcements.map(a => (
            <div key={a.id} className="border rounded p-4">
              <div className="flex justify-between">
                <h3 className="font-semibold">{a.title}</h3>
                <span className="text-sm text-slate-500">{new Date(a.sent_at).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-slate-600 mt-1">{a.content}</p>
              <p className="text-xs text-slate-400 mt-2">{(a.properties as any)?.name}</p>
            </div>
          ))}
          {announcements.length === 0 && <p className="text-slate-500">No announcements yet.</p>}
        </div>
      )}
    </main>
  )
}
