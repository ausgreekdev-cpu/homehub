'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ListingsPage() {
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const supabase = createClient()
    const { data } = await supabase
      .from('listings')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
    
    setListings(data ?? [])
    setLoading(false)
  }

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Available Rentals</h1>
      <p className="text-slate-600 mb-6">Find your next home</p>
      
      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : listings.length === 0 ? (
        <p className="text-slate-500">No listings available.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <Link href={`/apply/${listing.id}`} key={listing.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition">
              <div className="h-48 bg-slate-200"></div>
              <div className="p-4">
                <h2 className="font-semibold text-lg mb-1">{listing.title}</h2>
                <p className="text-2xl font-bold text-green-600 mb-2">${(listing.rent_cents / 100).toFixed(2)}/mo</p>
                <p className="text-sm text-slate-600">
                  {listing.bedrooms} bed • {listing.bathrooms} bath
                </p>
                <p className="text-sm text-slate-500 mt-2">{listing.address}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
