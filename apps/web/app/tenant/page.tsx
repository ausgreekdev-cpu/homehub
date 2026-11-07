'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function TenantPortal() {
  const [user, setUser] = useState<any>(null)
  const [memberships, setMemberships] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [tickets, setTickets] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user: u } } = await supabase.auth.getUser()
    setUser(u)
    if (!u) { setLoading(false); return }

    const { data: mems } = await supabase.from('property_memberships').select('*, properties(name, address)').eq('user_id', u.id)
    setMemberships(mems ?? [])

    if (mems && mems.length > 0) {
      const propId = mems[0].property_id
      const { data: exp } = await supabase.from('expenses').select('*').eq('property_id', propId).order('created_at', { ascending: false }).limit(5)
      setExpenses(exp ?? [])
      const { data: tix } = await supabase.from('maintenance_tickets').select('*').eq('property_id', propId).order('created_at', { ascending: false }).limit(5)
      setTickets(tix ?? [])
      const { data: msgs } = await supabase.from('messages').select('*').eq('property_id', propId).order('created_at', { ascending: false }).limit(5)
      setMessages(msgs ?? [])
    }
    setLoading(false)
  }

  if (loading) return <main className="p-8"><p className="text-slate-500">Loading...</p></main>

  const property = memberships[0]?.properties

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Tenant Portal</h1>
      {property && <p className="text-slate-600 mb-6">{property.name} — {property.address}</p>}

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="border rounded p-4">
          <h2 className="font-semibold mb-3">Quick Actions</h2>
          <div className="space-y-2">
            <Link href="/tenant/pay" className="block px-4 py-2 bg-slate-900 text-white rounded text-center">Pay Rent</Link>
            <Link href="/tenant/maintenance" className="block px-4 py-2 border rounded text-center">Report Issue</Link>
            <Link href="/tenant/messages" className="block px-4 py-2 border rounded text-center">Messages</Link>
          </div>
        </div>
        <div className="border rounded p-4">
          <h2 className="font-semibold mb-3">Recent Bills</h2>
          {expenses.length === 0 ? <p className="text-slate-500 text-sm">No bills yet.</p> : (
            <ul className="space-y-2">
              {expenses.map(e => (
                <li key={e.id} className="flex justify-between text-sm">
                  <span>{e.title}</span>
                  <span className="font-mono">${(e.amount_cents / 100).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="border rounded p-4 mb-6">
        <h2 className="font-semibold mb-3">Maintenance Requests</h2>
        {tickets.length === 0 ? <p className="text-slate-500 text-sm">No requests yet.</p> : (
          <ul className="space-y-2">
            {tickets.map(t => (
              <li key={t.id} className="flex justify-between text-sm">
                <span>{t.title}</span>
                <span className={`px-2 py-0.5 rounded text-xs ${
                  t.status === 'completed' ? 'bg-green-100 text-green-800' :
                  t.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>{t.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border rounded p-4">
        <h2 className="font-semibold mb-3">Recent Messages</h2>
        {messages.length === 0 ? <p className="text-slate-500 text-sm">No messages.</p> : (
          <ul className="space-y-2">
            {messages.map(m => (
              <li key={m.id} className="text-sm">
                <span className="text-slate-500">{new Date(m.created_at).toLocaleDateString()}:</span> {m.content?.slice(0, 80)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
