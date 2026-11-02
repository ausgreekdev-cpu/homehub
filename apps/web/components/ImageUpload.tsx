'use client'

import { useState } from 'react'
import imageCompression from 'browser-image-compression'

interface ImageUploadProps {
  onUpload: (file: File) => void
  bucket?: string
}

export function ImageUpload({ onUpload, bucket = 'inventory' }: ImageUploadProps) {
  const [compressing, setCompressing] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setCompressing(true)
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      }
      const compressedFile = await imageCompression(file, options)
      onUpload(compressedFile)
    } catch (err) {
      console.error(err)
      onUpload(file)
    } finally {
      setCompressing(false)
    }
  }

  return (
    <label className="cursor-pointer">
      <input type="file" accept="image/*" onChange={handleChange} className="hidden" />
      <span className="px-4 py-2 border rounded-md">
        {compressing ? 'Compressing...' : 'Upload Image'}
      </span>
    </label>
  )
}
