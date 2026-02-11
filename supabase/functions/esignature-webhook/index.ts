 import "jsr:@supabase/functions-js/edge-runtime.d.ts";
 import { createClient } from "jsr:@supabase/supabase-js@2";
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
 };
 
 interface SignatureEvent {
   orderId: string;
   eventType: 'viewed' | 'signed' | 'declined' | 'expired';
   signerEmail?: string;
   signedAt?: string;
   signedDocumentUrl?: string;
   ipAddress?: string;
   userAgent?: string;
 }
 
 Deno.serve(async (req) => {
   if (req.method === 'OPTIONS') {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
     const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
     const supabase = createClient(supabaseUrl, supabaseServiceKey);
 
      const event = await req.json() as SignatureEvent;
      const webhookSecret = req.headers.get('x-webhook-secret');
      const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
      const userAgent = req.headers.get('user-agent') || 'unknown';

      console.log('Received signature event:', event);

      // Get the order with organization settings for webhook secret validation
      const { data: order, error: orderError } = await supabase
        .from('esignature_orders')
        .select('*')
        .eq('id', event.orderId)
        .single();

      if (orderError || !order) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Order not found' 
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify webhook secret against organization's esignature settings
      const { data: esigSettings } = await supabase
        .from('esignature_settings')
        .select('webhook_secret')
        .eq('organization_id', order.organization_id)
        .maybeSingle();

      if (esigSettings?.webhook_secret) {
        if (!webhookSecret || esigSettings.webhook_secret !== webhookSecret) {
          console.error('Invalid webhook secret for esignature order:', order.id);
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Invalid webhook secret' 
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
 
     // Log event
     await supabase.from('esignature_events').insert({
       order_id: event.orderId,
       event_type: event.eventType,
       signer_email: event.signerEmail,
       ip_address: event.ipAddress || clientIp,
       user_agent: event.userAgent || userAgent,
       metadata: { signed_at: event.signedAt },
     });
 
     // Update signer status
     if (event.signerEmail) {
       const signers = (order.signers as Array<{
         email: string;
         status: string;
         signed_at?: string;
         viewed_at?: string;
       }>).map(signer => {
         if (signer.email === event.signerEmail) {
           return {
             ...signer,
             status: event.eventType,
             ...(event.eventType === 'signed' && { signed_at: event.signedAt || new Date().toISOString() }),
             ...(event.eventType === 'viewed' && { viewed_at: new Date().toISOString() }),
           };
         }
         return signer;
       });
 
       // Check if all signers have signed
       const allSigned = signers.every(s => s.status === 'signed');
       const anyDeclined = signers.some(s => s.status === 'declined');
 
       let newStatus = order.status;
       let completedAt = null;
 
       if (allSigned) {
         newStatus = 'signed';
         completedAt = new Date().toISOString();
       } else if (anyDeclined) {
         newStatus = 'declined';
       } else if (event.eventType === 'viewed' && order.status === 'sent') {
         newStatus = 'viewed';
       }
 
       // Update order
       const updateData: Record<string, unknown> = {
         signers,
         status: newStatus,
       };
 
       if (completedAt) {
         updateData.completed_at = completedAt;
       }
 
       if (event.signedDocumentUrl) {
         updateData.signed_document_path = event.signedDocumentUrl;
       }
 
       await supabase
         .from('esignature_orders')
         .update(updateData)
         .eq('id', event.orderId);
     }
 
     return new Response(JSON.stringify({ 
       success: true,
       orderId: event.orderId,
       eventType: event.eventType
     }), {
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