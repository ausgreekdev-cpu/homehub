'use client'

import { useCallback, useState } from 'react'
import { usePlaidLink } from 'react-plaid-link'

interface PlaidLinkButtonProps {
  propertyId: string
  onSuccess?: () => void
}

export function PlaidLinkButton({ propertyId, onSuccess }: PlaidLinkButtonProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const getLinkToken = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId }),
      })
      const data = await res.json()
      if (data.link_token) {
        setLinkToken(data.link_token)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const onPlaidSuccess = useCallback(async (public_token: string, metadata: any) => {
    try {
      await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_token, propertyId, metadata }),
      })
      onSuccess?.()
    } catch (err) {
      console.error(err)
    }
  }, [propertyId, onSuccess])

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess as any,
  })

  if (!linkToken) {
    return (
      <button
        onClick={getLinkToken}
        disabled={loading}
        className="px-4 py-2 border rounded-md disabled:opacity-50"
      >
        {loading ? 'Loading...' : 'Link Bank Account'}
      </button>
    )
  }

  return (
    <button
      onClick={() => open()}
      disabled={!ready}
      className="px-4 py-2 border rounded-md disabled:opacity-50"
    >
      Open Plaid Link
    </button>
  )
}
