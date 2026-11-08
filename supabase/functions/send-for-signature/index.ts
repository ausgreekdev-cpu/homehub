import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

async function getDocuSignAccessToken() {
  // Production DocuSign integration commonly uses JWT Grant. This implementation supports
  // a pre-provisioned access token for simplicity and a JWT flow hook via env config.
  if (Deno.env.get('DOCUSIGN_ACCESS_TOKEN')) return Deno.env.get('DOCUSIGN_ACCESS_TOKEN')
  // JWT grant requires RS256 signing with integration key/user id/private key - non-trivial in edge runtime without deps.
  // If not provided, return null and we use a safe stub/manual path.
  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { global: { headers: authHeader ? { Authorization: authHeader } : {} } })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { leaseId, signers = [], documentBase64, documentName = 'Lease Agreement', emailSubject = 'Please sign your lease' } = await req.json()
    if (!leaseId) throw new Error('leaseId required')

    const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

    // Verify access via lease -> property membership if possible
    const { data: lease } = await admin.from('leases').select('id, property_id').eq('id', leaseId).maybeSingle()
    if (lease?.property_id) {
      const { data: mem } = await admin.from('property_memberships').select('role').eq('property_id', lease.property_id).eq('user_id', user.id).maybeSingle()
      if (!mem || !['landlord', 'agent', 'tenant'].includes(mem.role)) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const provider = Deno.env.get('ESIGN_PROVIDER') || 'docusign'
    const dsBase = Deno.env.get('DOCUSIGN_BASE_URL') // e.g. https://na4.docusign.net/restapi
    const dsAccount = Deno.env.get('DOCUSIGN_ACCOUNT_ID')
    const dsToken = await getDocuSignAccessToken()

    let status = 'sent'
    let envelopeId: string | null = null
    let result: any = {}

    if (provider === 'docusign' && dsBase && dsAccount && dsToken && documentBase64) {
      const recipients = {
        signers: (signers as any[]).map((s, i) => ({
          email: s.email, name: s.name || s.email, recipientId: String(i + 1), routingOrder: String(i + 1),
          tabs: { signHereTabs: [{ anchorString: '/sig' + (i + 1) + '/', anchorUnits: 'pixels', anchorXOffset: '0', anchorYOffset: '0' }] }
        }))
      }
      const envelope = {
        emailSubject,
        documents: [{ documentBase64, name: documentName, fileExtension: 'pdf', documentId: '1' }],
        recipients,
        status: 'sent',
      }
      const resp = await fetch(`${dsBase.replace(/\/$/, '')}/v2.1/accounts/${dsAccount}/envelopes`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${dsToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(envelope),
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) throw new Error(data?.message || data?.errorCode || 'DocuSign error')
      envelopeId = data.envelopeId || null
      status = data.status || 'sent'
      result = data
    } else {
      status = (dsBase && dsAccount) ? 'pending_config' : 'stub'
      envelopeId = `env_${crypto.randomUUID().slice(0, 8)}`
      result = { message: 'E-sign stub/pending config. Set ESIGN_PROVIDER=docusign with DOCUSIGN_BASE_URL, DOCUSIGN_ACCOUNT_ID, DOCUSIGN_ACCESS_TOKEN (or JWT grant setup) and provide documentBase64.' }
    }

    const { data, error } = await admin.from('lease_documents').insert({
      lease_id: leaseId,
      signers: signers || [],
      status,
      document_url: envelopeId ? `docusign:envelope:${envelopeId}` : null,
    }).select().single()
    if (error) throw error

    return new Response(JSON.stringify({ success: true, document: data, provider, envelopeId, result, live: !!envelopeId && status !== 'stub' && status !== 'pending_config' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || String(error) }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})
