'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TenantMessages() {
  const [messages, setMessages] = useState<any[]>([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data: mems } = await supabase.from('property_memberships').select('property_id').eq('user_id', user.id)
    if (mems && mems.length > 0 && mems[0]) {
      const { data } = await supabase.from('messages').select('*').eq('property_id', mems[0]!.property_id).order('created_at', { ascending: false })
      setMessages(data ?? [])
    }
    setLoading(false)
  }

  async function send(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: mems } = await supabase.from('property_memberships').select('property_id').eq('user_id', user.id)
    if (!mems || mems.length === 0) return
    await supabase.from('messages').insert({ property_id: mems[0]!.property_id, sender_id: user.id, content })
    setContent('')
    load()
  }

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <a href="/tenant" className="text-sm text-slate-600 underline">← Back</a>
      <h1 className="text-2xl font-bold mt-2 mb-6">Messages</h1>
      <form onSubmit={send} className="flex gap-2 mb-6">
        <input className="flex-1 border rounded p-2" placeholder="Type a message..." value={content} onChange={e => setContent(e.target.value)} required />
        <button className="px-4 py-2 bg-slate-900 text-white rounded">Send</button>
      </form>
      {loading ? <p className="text-slate-500">Loading...</p> : (
        <ul className="space-y-3">
          {messages.map(m => (
            <li key={m.id} className="border rounded p-3">
              <div className="text-xs text-slate-500 mb-1">{new Date(m.created_at).toLocaleString()}</div>
              <div>{m.content}</div>
            </li>
          ))}
          {messages.length === 0 && <p className="text-slate-500">No messages yet.</p>}
        </ul>
      )}
    </main>
  )
}
