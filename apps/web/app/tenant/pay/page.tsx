'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TenantPay() {
  const [splits, setSplits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase.from('expense_splits').select('*, expenses(title, property_id)').eq('user_id', user.id).eq('status', 'pending')
    setSplits(data ?? [])
    setLoading(false)
  }

  async function pay(splitId: string) {
    const supabase = createClient()
    const { data } = await supabase.functions.invoke('create-payment-intent', { body: { splitId } })
    if (data?.clientSecret) {
      alert(`PaymentIntent created. Amount: $${(data.amountCents / 100).toFixed(2)}\nConfirm via Stripe.js in production.`)
    }
  }

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <a href="/tenant" className="text-sm text-slate-600 underline">← Back</a>
      <h1 className="text-2xl font-bold mt-2 mb-6">Pay Rent</h1>
      {loading ? <p className="text-slate-500">Loading...</p> : splits.length === 0 ? (
        <p className="text-slate-500">No pending payments.</p>
      ) : (
        <div className="space-y-3">
          {splits.map(s => (
            <div key={s.id} className="border rounded p-4 flex justify-between items-center">
              <div>
                <div className="font-semibold">{(s.expenses as any)?.title}</div>
                <div className="text-sm text-slate-600">${((s.share_cents - (s.paid_cents ?? 0)) / 100).toFixed(2)} due</div>
              </div>
              <button onClick={() => pay(s.id)} className="px-4 py-2 bg-slate-900 text-white rounded">Pay</button>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
