'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AccessibleInput } from '@/components/AccessibleInput'

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [accountId, setAccountId] = useState('')
  const [amount, setAmount] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const supabase = createClient()
    const { data } = await supabase
      .from('payouts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    
    setPayouts(data ?? [])
    setLoading(false)
  }

  async function createPayout() {
    const supabase = createClient()
    const { data } = await supabase.functions.invoke('create-payout', {
      body: { stripeAccountId: accountId, amountCents: Math.round(Number(amount) * 100) }
    })
    alert('Payout initiated')
    load()
  }

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Payouts & Reconciliation</h1>
      
      <div className="border rounded p-4 mb-6 flex gap-2 items-end">
        <div className="flex-1">
          <AccessibleInput
            label="Stripe Connect Account ID"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            placeholder="Stripe Connect Account ID"
          />
        </div>
        <div className="w-32">
          <AccessibleInput
            label="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            type="number"
          />
        </div>
        <button onClick={createPayout} className="px-4 py-2 bg-slate-900 text-white rounded h-10" aria-label="Create payout">
          Create Payout
        </button>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : payouts.length === 0 ? (
        <p className="text-slate-500">No payouts yet.</p>
      ) : (
        <div className="border rounded overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3" scope="col">Payout ID</th>
                <th className="text-left p-3" scope="col">Account</th>
                <th className="text-right p-3" scope="col">Amount</th>
                <th className="text-center p-3" scope="col">Status</th>
                <th className="text-left p-3" scope="col">Date</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3 font-mono text-xs">{p.stripe_payout_id?.slice(0, 20)}...</td>
                  <td className="p-3 font-mono text-xs">{p.stripe_account_id?.slice(0, 20)}...</td>
                  <td className="p-3 text-right">${(p.amount_cents / 100).toFixed(2)}</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">{p.status}</span>
                  </td>
                  <td className="p-3">{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
