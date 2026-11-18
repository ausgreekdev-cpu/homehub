'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { announce } from '@/components/AccessibilityAnnouncer'
import { AccessibleInput } from '@/components/AccessibleInput'

export default function TenantMessages() {
  const [messages, setMessages] = useState<any[]>([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data: mems } = await supabase.from('property_memberships').select('property_id').eq('user_id', user.id)
    if (mems && mems.length > 0 && mems[0]) {
      const { data } = await supabase.from('messages').select('*').eq('property_id', mems[0]!.property_id).order('created_at', { ascending: true })
      setMessages(data ?? [])
    }
    setLoading(false)
  }

  // Real-time subscription
  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function setup() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: mems } = await supabase.from('property_memberships').select('property_id').eq('user_id', user.id)
      if (!mems || mems.length === 0 || !mems[0]) return

      const propertyId = mems[0].property_id
      channel = supabase
        .channel(`tenant-messages:${propertyId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `property_id=eq.${propertyId}`,
        }, (payload: any) => {
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            announce('New message received');
            return [...prev, payload.new];
          });
        })
        .subscribe();
    }

    setup();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSending(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSending(false); return }
    const { data: mems } = await supabase.from('property_memberships').select('property_id').eq('user_id', user.id)
    if (!mems || mems.length === 0) { setSending(false); return }
    const { error } = await supabase.from('messages').insert({
      property_id: mems[0]!.property_id,
      sender_id: user.id,
      content: content.trim(),
    })
    setSending(false)
    if (error) {
      alert(error.message);
      return;
    }
    setContent('')
    // Real-time subscription will handle adding the message
  }

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <a href="/tenant" className="text-sm text-slate-600 underline">← Back</a>
      <h1 className="text-2xl font-bold mt-2 mb-6">Messages</h1>
      <form onSubmit={send} className="flex gap-2 mb-6" aria-label="Send a message">
        <div className="flex-1">
          <AccessibleInput
            label="Message"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Type a message..."
            required
          />
        </div>
        <button
          className="px-4 py-2 bg-slate-900 text-white rounded"
          type="submit"
          disabled={sending || !content.trim()}
          aria-busy={sending}
          aria-label="Send message"
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
      {loading ? (
        <p className="text-slate-500" role="status" aria-live="polite">Loading messages...</p>
      ) : (
        <ul className="space-y-3" aria-live="polite" aria-label="Message list">
          {messages.map(m => (
            <li key={m.id} className="border rounded p-3">
              <div className="text-xs text-slate-500 mb-1">{new Date(m.created_at).toLocaleString()}</div>
              <div>{m.content}</div>
            </li>
          ))}
          {messages.length === 0 && <p className="text-slate-500">No messages yet.</p>}
          <div ref={bottomRef} />
        </ul>
      )}
    </main>
  )
}
