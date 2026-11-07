import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { propertyId, title, content, sentBy } = await req.json()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all members of the property
    const { data: members } = await supabase
      .from('property_memberships')
      .select('user_id')
      .eq('property_id', propertyId)

    const recipientCount = members?.length || 0

    // Create in-app notifications for each member
    for (const member of members || []) {
      await supabase.from('notifications').insert({
        user_id: member.user_id,
        type: 'announcement',
        title,
        body: content,
        read: false,
      })
    }

    // Store announcement
    const { data: announcement } = await supabase.from('announcements').insert({
      property_id: propertyId,
      title,
      content,
      sent_by: sentBy,
      sent_via: ['in_app'],
      recipient_count: recipientCount,
    }).select().single()

    // Try to send emails via Resend if configured
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (resendKey) {
      // Get member emails
      const { data: profiles } = await supabase
        .from('profiles')
        .select('email')
        .in('id', (members || []).map(m => m.user_id))

      for (const profile of profiles || []) {
        if (profile.email) {
          try {
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${resendKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: 'HomeHub <noreply@homehub.app>',
                to: [profile.email],
                subject: title,
                text: content,
              }),
            })
          } catch (e) {
            console.error('Email failed:', e)
          }
        }
      }
      if (announcement) {
        await supabase.from('announcements').update({ sent_via: ['in_app', 'email'] }).eq('id', announcement.id)
      }
    }

    return new Response(JSON.stringify({ success: true, recipientCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
