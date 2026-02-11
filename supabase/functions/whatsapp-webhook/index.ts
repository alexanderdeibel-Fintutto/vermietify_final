 import "jsr:@supabase/functions-js/edge-runtime.d.ts";
 import { createClient } from "jsr:@supabase/supabase-js@2";
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 };
 
 Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle webhook verification (GET request from WhatsApp)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      if (mode === 'subscribe' && token) {
        // Validate token against stored webhook_verify_token
        const { data: settings } = await supabase
          .from('whatsapp_settings')
          .select('webhook_verify_token')
          .limit(1)
          .maybeSingle();

        if (settings?.webhook_verify_token && settings.webhook_verify_token === token) {
          console.log('Webhook verified');
          return new Response(challenge, { status: 200 });
        }
        console.error('Webhook verification failed: token mismatch');
        return new Response('Forbidden', { status: 403 });
      }
      return new Response('Forbidden', { status: 403 });
    }

    try {
      const payload = await req.json();
      console.log('WhatsApp webhook payload:', JSON.stringify(payload));
 
     // Process incoming messages
     const entry = payload.entry?.[0];
     const changes = entry?.changes?.[0];
     const value = changes?.value;
 
     if (value?.messages) {
       for (const message of value.messages) {
         const contactPhone = message.from;
         const messageId = message.id;
         const timestamp = message.timestamp;
 
         // Find the contact and organization
         const { data: contact } = await supabase
           .from('whatsapp_contacts')
           .select('*, organization_id')
           .eq('phone', contactPhone)
           .single();
 
         if (!contact) {
           console.log('Unknown contact:', contactPhone);
           continue;
         }
 
         // Determine message type and content
         let messageType = 'text';
         let content = '';
         let mediaUrl = null;
 
         if (message.type === 'text') {
           content = message.text?.body || '';
         } else if (message.type === 'image') {
           messageType = 'image';
           mediaUrl = message.image?.id;
           content = message.image?.caption || '';
         } else if (message.type === 'document') {
           messageType = 'document';
           mediaUrl = message.document?.id;
           content = message.document?.filename || '';
         } else if (message.type === 'audio') {
           messageType = 'audio';
           mediaUrl = message.audio?.id;
         } else if (message.type === 'video') {
           messageType = 'video';
           mediaUrl = message.video?.id;
           content = message.video?.caption || '';
         } else if (message.type === 'location') {
           messageType = 'location';
           content = JSON.stringify({
             latitude: message.location?.latitude,
             longitude: message.location?.longitude,
             name: message.location?.name,
             address: message.location?.address,
           });
         }
 
         // Save incoming message
         await supabase.from('whatsapp_messages').insert({
           organization_id: contact.organization_id,
           contact_id: contact.id,
           contact_phone: contactPhone,
           direction: 'inbound',
           message_type: messageType,
           content,
           media_url: mediaUrl,
           status: 'delivered',
           whatsapp_message_id: messageId,
           created_at: new Date(parseInt(timestamp) * 1000).toISOString(),
         });
 
         // Update contact last message time
         await supabase
           .from('whatsapp_contacts')
           .update({ last_message_at: new Date().toISOString() })
           .eq('id', contact.id);
       }
     }
 
     // Process status updates
     if (value?.statuses) {
       for (const status of value.statuses) {
         const messageId = status.id;
         const statusValue = status.status; // sent, delivered, read
 
         // Find message by whatsapp_message_id and update status
         await supabase
           .from('whatsapp_messages')
           .update({ status: statusValue })
           .eq('whatsapp_message_id', messageId);
       }
     }
 
     return new Response(JSON.stringify({ success: true }), {
       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
     });
 
    } catch (error: unknown) {
      console.error('Webhook error:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Webhook processing failed' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
 });