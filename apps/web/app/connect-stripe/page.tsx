'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ConnectStripePage() {
  const [loading, setLoading] = useState(false)
  const [propertyId, setPropertyId] = useState('')

  async function connect() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { alert('Sign in required'); setLoading(false); return }

    const { data } = await supabase.functions.invoke('stripe-connect-onboard', {
      body: { userId: user.id, propertyId }
    })
    
    if (data?.url) {
      window.location.href = data.url
    }
    setLoading(false)
  }

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Connect Stripe Account</h1>
      <p className="text-slate-600 mb-6">Connect your bank account to receive rent payments directly</p>
      
      <div className="border rounded p-6 space-y-4">
        <input
          className="w-full border rounded p-2"
          placeholder="Property ID"
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
        />
        <button
          onClick={connect}
          disabled={loading || !propertyId}
          className="w-full px-4 py-2 bg-[#635BFF] text-white rounded disabled:opacity-50"
        >
          {loading ? 'Connecting...' : 'Connect with Stripe'}
        </button>
        <p className="text-xs text-slate-500 text-center">
          You'll be redirected to Stripe to complete onboarding
        </p>
      </div>
    </main>
  )
}
