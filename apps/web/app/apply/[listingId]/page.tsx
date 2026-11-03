'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ApplyPage() {
  const params = useParams()
  const router = useRouter()
  const listingId = params.listingId as string
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    employment_status: '',
    income_cents: 0,
  })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    
    const { data } = await supabase.functions.invoke('submit-application', {
      body: { listing_id: listingId, ...form }
    })
    
    if (data?.success) {
      alert('Application submitted successfully!')
      router.push('/listings')
    }
    setLoading(false)
  }

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Rental Application</h1>
      
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input
            className="border rounded p-2"
            placeholder="First Name"
            value={form.first_name}
            onChange={(e) => setForm({...form, first_name: e.target.value})}
            required
          />
          <input
            className="border rounded p-2"
            placeholder="Last Name"
            value={form.last_name}
            onChange={(e) => setForm({...form, last_name: e.target.value})}
            required
          />
        </div>
        <input
          className="w-full border rounded p-2"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({...form, email: e.target.value})}
          required
        />
        <input
          className="w-full border rounded p-2"
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({...form, phone: e.target.value})}
          required
        />
        <select
          className="w-full border rounded p-2"
          value={form.employment_status}
          onChange={(e) => setForm({...form, employment_status: e.target.value})}
          required
        >
          <option value="">Employment Status</option>
          <option value="employed">Employed</option>
          <option value="self-employed">Self-Employed</option>
          <option value="student">Student</option>
          <option value="retired">Retired</option>
        </select>
        <input
          className="w-full border rounded p-2"
          type="number"
          placeholder="Annual Income (cents)"
          value={form.income_cents}
          onChange={(e) => setForm({...form, income_cents: Number(e.target.value)})}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-slate-900 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </main>
  )
}
