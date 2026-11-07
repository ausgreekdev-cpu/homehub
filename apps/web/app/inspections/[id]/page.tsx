'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ImageUpload } from '@/components/ImageUpload'

export default function InspectionDetailPage() {
  const params = useParams()
  const inspectionId = params.id as string
  const [inspection, setInspection] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newItem, setNewItem] = useState({ room: '', item_name: '', condition: 'good', notes: '' })

  useEffect(() => { load() }, [inspectionId])

  async function load() {
    const supabase = createClient()
    const { data: insp } = await supabase.from('inspections').select('*').eq('id', inspectionId).single()
    setInspection(insp)
    const { data: its } = await supabase.from('inspection_items').select('*').eq('inspection_id', inspectionId).order('created_at')
    setItems(its ?? [])
    setLoading(false)
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    await supabase.from('inspection_items').insert({ inspection_id: inspectionId, ...newItem })
    setNewItem({ room: '', item_name: '', condition: 'good', notes: '' })
    load()
  }

  async function uploadPhoto(itemId: string, file: File, field: 'photo_path' | 'move_in_photo_path' | 'move_out_photo_path') {
    const supabase = createClient()
    const path = `${inspection?.property_id}/inspections/${inspectionId}/${itemId}-${Date.now()}.jpg`
    await supabase.storage.from('condition-reports').upload(path, file)
    await supabase.from('inspection_items').update({ [field]: path }).eq('id', itemId)
    load()
  }

  async function getPhotoUrl(path: string): Promise<string | null> {
    const supabase = createClient()
    const { data } = await supabase.storage.from('condition-reports').createSignedUrl(path, 3600)
    return data?.signedUrl ?? null
  }

  if (loading) return <main className="p-8"><p className="text-slate-500">Loading...</p></main>

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <a href="/inspections" className="text-sm text-slate-600 underline">← Back to inspections</a>
      <h1 className="text-2xl font-bold mt-2 mb-2">
        {inspection?.type?.replace('_', ' ')} Inspection
      </h1>
      <p className="text-slate-600 mb-6">Status: {inspection?.status}</p>

      <form onSubmit={addItem} className="border rounded p-4 mb-6 flex flex-wrap gap-2">
        <input className="border rounded p-2" placeholder="Room" value={newItem.room} onChange={e => setNewItem({...newItem, room: e.target.value})} required />
        <input className="border rounded p-2" placeholder="Item" value={newItem.item_name} onChange={e => setNewItem({...newItem, item_name: e.target.value})} required />
        <select className="border rounded p-2" value={newItem.condition} onChange={e => setNewItem({...newItem, condition: e.target.value})}>
          <option value="excellent">Excellent</option>
          <option value="good">Good</option>
          <option value="fair">Fair</option>
          <option value="poor">Poor</option>
          <option value="damaged">Damaged</option>
        </select>
        <input className="border rounded p-2 flex-1" placeholder="Notes" value={newItem.notes} onChange={e => setNewItem({...newItem, notes: e.target.value})} />
        <button className="px-4 py-2 bg-slate-900 text-white rounded">Add Item</button>
      </form>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="border rounded p-4">
            <div className="flex justify-between mb-2">
              <div>
                <span className="font-semibold">{item.room}</span>
                <span className="text-slate-600 ml-2">{item.item_name}</span>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${
                item.condition === 'excellent' ? 'bg-green-100 text-green-800' :
                item.condition === 'good' ? 'bg-blue-100 text-blue-800' :
                item.condition === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                item.condition === 'poor' ? 'bg-orange-100 text-orange-800' :
                'bg-red-100 text-red-800'
              }`}>{item.condition}</span>
            </div>
            {item.notes && <p className="text-sm text-slate-600 mb-2">{item.notes}</p>}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="text-xs text-slate-500 mb-1">Move-in Photo</div>
                {item.move_in_photo_path ? (
                  <img src={`/api/storage/condition-reports/${item.move_in_photo_path}`} alt="Move-in" className="w-full h-32 object-cover rounded border" />
                ) : (
                  <ImageUpload onUpload={(f) => uploadPhoto(item.id, f, 'move_in_photo_path')} />
                )}
              </div>
              <div className="flex-1">
                <div className="text-xs text-slate-500 mb-1">Move-out Photo</div>
                {item.move_out_photo_path ? (
                  <img src={`/api/storage/condition-reports/${item.move_out_photo_path}`} alt="Move-out" className="w-full h-32 object-cover rounded border" />
                ) : (
                  <ImageUpload onUpload={(f) => uploadPhoto(item.id, f, 'move_out_photo_path')} />
                )}
              </div>
            </div>
            {item.move_in_photo_path && item.move_out_photo_path && (
              <div className="mt-3 p-2 bg-slate-50 rounded text-xs text-slate-600">
                Side-by-side comparison available
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && <p className="text-slate-500">No items yet. Add items above.</p>}
      </div>
    </main>
  )
}
