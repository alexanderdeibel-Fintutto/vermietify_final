 import "jsr:@supabase/functions-js/edge-runtime.d.ts";
 import { createClient } from "jsr:@supabase/supabase-js@2";
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 };
 
 interface SendMessageRequest {
   contactPhone: string;
   messageType: 'text' | 'template';
   content?: string;
   templateName?: string;
   templateParams?: string[];
 }
 
 Deno.serve(async (req) => {
   if (req.method === 'OPTIONS') {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
     const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
     const supabase = createClient(supabaseUrl, supabaseServiceKey);
 
     const authHeader = req.headers.get('Authorization');
     if (!authHeader) {
       throw new Error('Missing authorization header');
     }
 
     // Get user from token
     const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
       global: { headers: { Authorization: authHeader } }
     });
     const { data: { user }, error: userError } = await userClient.auth.getUser();
     if (userError || !user) throw new Error('Unauthorized');
 
     // Get user's organization
     const { data: profile } = await supabase
       .from('profiles')
       .select('organization_id')
       .eq('user_id', user.id)
       .single();
 
     if (!profile?.organization_id) throw new Error('No organization found');
 
     const { contactPhone, messageType, content, templateName, templateParams } = await req.json() as SendMessageRequest;
 
     // Get WhatsApp settings
     const { data: settings } = await supabase
       .from('whatsapp_settings')
       .select('*')
       .eq('organization_id', profile.organization_id)
       .single();
 
     // Get or create contact
     let { data: contact } = await supabase
       .from('whatsapp_contacts')
       .select('*')
       .eq('organization_id', profile.organization_id)
       .eq('phone', contactPhone)
       .single();
 
     if (!contact) {
       const { data: newContact } = await supabase
         .from('whatsapp_contacts')
         .insert({
           organization_id: profile.organization_id,
           phone: contactPhone,
         })
         .select()
         .single();
       contact = newContact;
     }
 
     // Create message record
     const { data: message, error: msgError } = await supabase
       .from('whatsapp_messages')
       .insert({
         organization_id: profile.organization_id,
         contact_id: contact?.id,
         contact_phone: contactPhone,
         direction: 'outbound',
         message_type: messageType,
         content: content || null,
         template_name: templateName || null,
         template_params: templateParams || [],
         status: 'pending',
       })
       .select()
       .single();
 
     if (msgError) throw msgError;
 
     // In production, call WhatsApp Business API here
     // For now, simulate sending
     if (settings?.phone_number_id && settings?.access_token_encrypted) {
       // Real WhatsApp API call would go here
       // const response = await fetch(`https://graph.facebook.com/v18.0/${settings.phone_number_id}/messages`, {
       //   method: 'POST',
       //   headers: {
       //     'Authorization': `Bearer ${settings.access_token_encrypted}`,
       //     'Content-Type': 'application/json',
       //   },
       //   body: JSON.stringify({
       //     messaging_product: 'whatsapp',
       //     to: contactPhone,
       //     type: messageType,
       //     ...(messageType === 'text' ? { text: { body: content } } : {}),
       //     ...(messageType === 'template' ? {
       //       template: {
       //         name: templateName,
       //         language: { code: 'de' },
       //         components: templateParams?.map((p, i) => ({
       //           type: 'body',
       //           parameters: [{ type: 'text', text: p }]
       //         }))
       //       }
       //     } : {})
       //   })
       // });
     }
 
     // Update message status to sent (simulated)
     await supabase
       .from('whatsapp_messages')
       .update({ status: 'sent', whatsapp_message_id: `sim_${message.id}` })
       .eq('id', message.id);
 
     // Update contact last message time
     await supabase
       .from('whatsapp_contacts')
       .update({ last_message_at: new Date().toISOString() })
       .eq('id', contact?.id);
 
     return new Response(JSON.stringify({
       success: true,
       messageId: message.id,
     }), {
       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
     });
 
   } catch (error: unknown) {
     console.error('Error sending WhatsApp message:', error);
     const errorMessage = error instanceof Error ? error.message : 'Unknown error';
     return new Response(JSON.stringify({ 
       success: false, 
       error: errorMessage 
     }), {
       status: 400,
       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
     });
   }
 });