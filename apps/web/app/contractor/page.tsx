'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ContractorPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const supabase = createClient()
    const { data } = await supabase
      .from('maintenance_tickets')
      .select('*')
      .eq('assigned_to_contractor', true)
      .order('created_at', { ascending: false })
    
    setJobs(data ?? [])
    setLoading(false)
  }

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Contractor Portal</h1>
      
      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : jobs.length === 0 ? (
        <p className="text-slate-500">No jobs assigned.</p>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="border rounded p-4">
              <div className="flex justify-between mb-2">
                <h3 className="font-semibold">{job.title}</h3>
                <span className="text-sm px-2 py-1 bg-slate-100 rounded">{job.status}</span>
              </div>
              <p className="text-sm text-slate-600 mb-3">{job.description}</p>
              <div className="flex gap-2">
                <button className="px-3 py-1 border rounded text-sm">Check In</button>
                <button className="px-3 py-1 border rounded text-sm">Check Out</button>
                <button className="px-3 py-1 border rounded text-sm">Upload Photo</button>
                <button className="px-3 py-1 bg-slate-900 text-white rounded text-sm">Submit Invoice</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
