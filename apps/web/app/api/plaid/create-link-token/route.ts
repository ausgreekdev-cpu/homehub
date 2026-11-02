import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { propertyId } = await req.json()
    
    // In production, call Plaid API. For now, return a dummy token for dev.
    const link_token = 'link-sandbox-' + Math.random().toString(36).substr(2, 9)
    
    return NextResponse.json({ link_token })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create link token' }, { status: 500 })
  }
}
