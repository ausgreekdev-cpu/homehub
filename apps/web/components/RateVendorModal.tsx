'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function RateVendorModal({ ticketId, contractorId, onClose, onRated }: {
  ticketId: string
  contractorId: string
  onClose: () => void
  onRated: () => void
}) {
  const [rating, setRating] = useState(5)
  const [review, setReview] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { error } = await supabase.from('vendor_ratings').insert({
      ticket_id: ticketId,
      contractor_id: contractorId,
      rating,
      review: review || null,
      created_by: user.id,
    })

    if (error) {
      alert(error.message)
    } else {
      onRated()
      onClose()
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <h2 className="text-lg font-semibold mb-4">Rate Contractor</h2>
        <div className="flex gap-1 mb-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setRating(n)}
              className={`text-2xl ${n <= rating ? 'text-yellow-500' : 'text-slate-300'}`}
            >
              ★
            </button>
          ))}
        </div>
        <textarea
          className="w-full border rounded p-2 mb-4"
          placeholder="Review (optional)"
          value={review}
          onChange={(e) => setReview(e.target.value)}
          rows={3}
        />
        <div className="flex gap-2">
          <button onClick={submit} disabled={loading} className="flex-1 bg-slate-900 text-white rounded p-2 disabled:opacity-50">
            {loading ? 'Submitting...' : 'Submit Rating'}
          </button>
          <button onClick={onClose} className="flex-1 border rounded p-2">Cancel</button>
        </div>
      </div>
    </div>
  )
}
