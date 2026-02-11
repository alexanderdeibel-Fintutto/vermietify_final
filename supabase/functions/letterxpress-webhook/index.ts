 import "jsr:@supabase/functions-js/edge-runtime.d.ts";
 import { createClient } from "jsr:@supabase/supabase-js@2";
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
 };
 
 interface WebhookPayload {
   letterId: string;
   status: string;
   trackingCode?: string;
   deliveredAt?: string;
   errorMessage?: string;
 }
 
 Deno.serve(async (req) => {
   if (req.method === 'OPTIONS') {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
     const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
     const supabase = createClient(supabaseUrl, supabaseServiceKey);
 
     const payload = await req.json() as WebhookPayload;
     const webhookSecret = req.headers.get('x-webhook-secret');
 
     console.log('Received webhook:', payload);
 
     // Find the order by letterxpress_id
     const { data: order, error: orderError } = await supabase
       .from('letter_orders')
       .select('*, letter_settings!inner(webhook_secret)')
       .eq('letterxpress_id', payload.letterId)
       .single();
 
     if (orderError || !order) {
       console.error('Order not found for letterId:', payload.letterId);
       return new Response(JSON.stringify({ 
         success: false, 
         error: 'Order not found' 
       }), {
         status: 404,
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       });
     }
 
      // Verify webhook secret if configured
      const settings = order.letter_settings as { webhook_secret?: string };
      if (settings?.webhook_secret) {
        if (!webhookSecret || settings.webhook_secret !== webhookSecret) {
          console.error('Invalid webhook secret for order:', order.id);
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Invalid webhook secret' 
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
 
     // Map LetterXpress status to our status
     const statusMap: Record<string, string> = {
       'queued': 'submitted',
       'processing': 'printing',
       'printed': 'printing',
       'shipped': 'sent',
       'delivered': 'delivered',
       'error': 'error',
       'cancelled': 'cancelled',
     };
 
     const newStatus = statusMap[payload.status] || payload.status;
 
     // Update order status
     const updateData: Record<string, unknown> = {
       status: newStatus,
     };
 
     if (payload.trackingCode) {
       updateData.tracking_code = payload.trackingCode;
     }
 
     if (payload.deliveredAt) {
       updateData.delivered_at = payload.deliveredAt;
     }
 
     if (payload.errorMessage) {
       updateData.error_message = payload.errorMessage;
     }
 
     const { error: updateError } = await supabase
       .from('letter_orders')
       .update(updateData)
       .eq('id', order.id);
 
     if (updateError) {
       throw updateError;
     }
 
     console.log('Order updated:', order.id, 'Status:', newStatus);
 
     return new Response(JSON.stringify({ 
       success: true,
       orderId: order.id,
       newStatus 
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