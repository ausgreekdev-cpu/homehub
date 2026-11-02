'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [role, setRole] = useState('tenant')
  const [propertyName, setPropertyName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)

  async function createProperty() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    
    const { data: prop, error } = await supabase.from('properties').insert({ name: propertyName }).select().single()
    if (error) { alert(error.message); setLoading(false); return }
    
    await supabase.from('property_memberships').insert({ property_id: prop.id, user_id: user.id, role: 'landlord' })
    router.push(`/properties/${prop.id}`)
  }

  async function joinProperty() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    
    alert('Invite code accepted (demo)')
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-2">Welcome to HomeHub</h1>
        <p className="text-slate-600 mb-6">Let's get you set up</p>

        {step === 1 && (
          <div className="space-y-4">
            <button onClick={() => { setRole('landlord'); setStep(2) }} className="w-full p-4 border rounded text-left hover:bg-slate-50">
              <div className="font-semibold">I'm a Landlord/Agent</div>
              <div className="text-sm text-slate-500">Manage properties and tenants</div>
            </button>
            <button onClick={() => { setRole('tenant'); setStep(3) }} className="w-full p-4 border rounded text-left hover:bg-slate-50">
              <div className="font-semibold">I'm a Tenant</div>
              <div className="text-sm text-slate-500">Join an existing property</div>
            </button>
            <button onClick={() => { setRole('contractor'); setStep(3) }} className="w-full p-4 border rounded text-left hover:bg-slate-50">
              <div className="font-semibold">I'm a Contractor</div>
              <div className="text-sm text-slate-500">Join to handle maintenance jobs</div>
            </button>
          </div>
        )}

        {step === 2 && role === 'landlord' && (
          <div className="space-y-4">
            <input
              className="w-full border rounded p-2"
              placeholder="Property name"
              value={propertyName}
              onChange={(e) => setPropertyName(e.target.value)}
            />
            <button onClick={createProperty} disabled={loading || !propertyName} className="w-full bg-slate-900 text-white rounded p-2 disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Property'}
            </button>
            <button onClick={() => setStep(1)} className="w-full text-sm text-slate-500">Back</button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <input
              className="w-full border rounded p-2"
              placeholder="Invite code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
            />
            <button onClick={joinProperty} disabled={loading || !inviteCode} className="w-full bg-slate-900 text-white rounded p-2 disabled:opacity-50">
              {loading ? 'Joining...' : 'Join Property'}
            </button>
            <button onClick={() => setStep(1)} className="w-full text-sm text-slate-500">Back</button>
          </div>
        )}
      </div>
    </div>
  )
}
