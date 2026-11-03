'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AutopayPage() {
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    
    const { data } = await supabase
      .from('autopay_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (data) setEnabled(data.enabled)
    setLoading(false)
  }

  async function toggle() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('autopay_settings').upsert({
      user_id: user.id,
      property_id: '00000000-0000-0000-0000-000000000000',
      enabled: !enabled,
    })
    
    if (!error) setEnabled(!enabled)
  }

  async function processNow() {
    setProcessing(true)
    const supabase = createClient()
    const { data } = await supabase.functions.invoke('process-autopay')
    alert(`Processed ${data?.processed || 0} autopay payments`)
    setProcessing(false)
  }

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Autopay Settings</h1>
      <p className="text-slate-600 mb-6">Automatically pay rent on due date</p>
      
      <div className="border rounded p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">Enable Autopay</div>
            <div className="text-sm text-slate-600">Pay rent automatically when due</div>
          </div>
          <button
            onClick={toggle}
            disabled={loading}
            className={`px-4 py-2 rounded ${enabled ? 'bg-green-600 text-white' : 'bg-slate-200'}`}
          >
            {enabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>
        
        <hr />
        
        <button
          onClick={processNow}
          disabled={processing}
          className="w-full px-4 py-2 border rounded disabled:opacity-50"
        >
          {processing ? 'Processing...' : 'Process Due Payments Now'}
        </button>
      </div>
    </main>
  )
}
