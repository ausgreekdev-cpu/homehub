'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AuditPage() {
  const params = useParams()
  const propertyId = params.propertyId as string
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [propertyId])

  async function load() {
    const supabase = createClient()
    const { data } = await supabase
      .from('audit_log')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })
      .limit(100)
    
    setLogs(data ?? [])
    setLoading(false)
  }

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <a href={`/properties/${propertyId}`} className="text-sm text-slate-600 underline">← Back to property</a>
      <h1 className="text-2xl font-bold mt-2 mb-6">Audit Log</h1>
      
      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : logs.length === 0 ? (
        <p className="text-slate-500">No audit entries yet.</p>
      ) : (
        <div className="border rounded divide-y">
          {logs.map((log) => (
            <div key={log.id} className="p-3">
              <div className="flex justify-between">
                <span className="font-semibold">{log.action} {log.entity_type}</span>
                <span className="text-sm text-slate-500">{new Date(log.created_at).toLocaleString()}</span>
              </div>
              <p className="text-sm text-slate-600">By {log.user_id?.slice(0, 8)}...</p>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
