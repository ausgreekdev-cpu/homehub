'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const supabase = createClient()
    const { data } = await supabase
      .from('applications')
      .select('*, listings(title)')
      .order('created_at', { ascending: false })
    
    setApplications(data ?? [])
    setLoading(false)
  }

  async function requestScreening(appId: string) {
    const supabase = createClient()
    await supabase.functions.invoke('request-screening', { body: { applicationId: appId } })
    alert('Screening requested')
    load()
  }

  async function updateStatus(appId: string, status: string) {
    const supabase = createClient()
    await supabase.from('applications').update({ status }).eq('id', appId)
    load()
  }

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Applications</h1>
      
      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : applications.length === 0 ? (
        <p className="text-slate-500">No applications yet.</p>
      ) : (
        <div className="border rounded overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3">Applicant</th>
                <th className="text-left p-3">Listing</th>
                <th className="text-left p-3">Email</th>
                <th className="text-right p-3">Income</th>
                <th className="text-center p-3">Status</th>
                <th className="text-center p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} className="border-t">
                  <td className="p-3">{app.first_name} {app.last_name}</td>
                  <td className="p-3">{(app.listings as any)?.title}</td>
                  <td className="p-3">{app.email}</td>
                  <td className="p-3 text-right">${((app.income_cents || 0) / 100).toLocaleString()}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs ${
                      app.status === 'approved' ? 'bg-green-100 text-green-800' :
                      app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="p-3 text-center flex gap-2 justify-center">
                    <button onClick={() => requestScreening(app.id)} className="px-2 py-1 border rounded text-xs">Screen</button>
                    <button onClick={() => updateStatus(app.id, 'approved')} className="px-2 py-1 bg-green-600 text-white rounded text-xs">Approve</button>
                    <button onClick={() => updateStatus(app.id, 'rejected')} className="px-2 py-1 bg-red-600 text-white rounded text-xs">Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
