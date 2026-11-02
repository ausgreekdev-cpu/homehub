import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { public_token, propertyId } = await req.json()
    
    // In production, exchange public_token for access_token with Plaid
    // For now, just acknowledge
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to exchange token' }, { status: 500 })
  }
}
