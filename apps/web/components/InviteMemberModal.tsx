'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function InviteMemberModal({ propertyId, onClose }: { propertyId: string; onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('tenant')
  const [loading, setLoading] = useState(false)

  async function invite() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    
    const { error } = await supabase.from('invites').insert({
      property_id: propertyId,
      email,
      role,
      invited_by: user.id,
      status: 'pending',
    })
    
    if (error) { alert(error.message) } else { alert('Invite sent (demo)'); onClose() }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <h2 className="text-lg font-semibold mb-4">Invite Member</h2>
        <input
          className="w-full border rounded p-2 mb-3"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <select className="w-full border rounded p-2 mb-4" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="tenant">Tenant</option>
          <option value="agent">Agent</option>
          <option value="contractor">Contractor</option>
          <option value="landlord">Landlord</option>
        </select>
        <div className="flex gap-2">
          <button onClick={invite} disabled={loading || !email} className="flex-1 bg-slate-900 text-white rounded p-2 disabled:opacity-50">
            {loading ? 'Sending...' : 'Send Invite'}
          </button>
          <button onClick={onClose} className="flex-1 border rounded p-2">Cancel</button>
        </div>
      </div>
    </div>
  )
}
