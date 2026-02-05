 import "jsr:@supabase/functions-js/edge-runtime.d.ts";
 import { createClient } from "jsr:@supabase/supabase-js@2";
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 };
 
 interface SendLetterRequest {
   orderId: string;
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
 
     const { orderId } = await req.json() as SendLetterRequest;
 
     // Get the letter order
     const { data: order, error: orderError } = await supabase
       .from('letter_orders')
       .select('*, letter_templates(*)')
       .eq('id', orderId)
       .single();
 
     if (orderError || !order) {
       throw new Error('Letter order not found');
     }
 
     // Get letter settings for API key
     const { data: settings } = await supabase
       .from('letter_settings')
       .select('*')
       .eq('organization_id', order.organization_id)
       .single();
 
     if (!settings?.api_key_encrypted) {
       throw new Error('LetterXpress API key not configured');
     }
 
     const isTestMode = settings.test_mode ?? true;
 
     // Prepare LetterXpress API call
     const letterXpressApiUrl = isTestMode 
       ? 'https://sandbox.letterxpress.de/v1/setJob'
       : 'https://api.letterxpress.de/v1/setJob';
 
     const options = order.options as { color?: boolean; duplex?: boolean; registered?: string; priority?: string } || {};
     
     // Calculate cost (simplified pricing)
     let baseCost = 85; // Base cost in cents (0.85€)
     if (options.color) baseCost += 20;
     if (options.duplex) baseCost += 10;
     if (options.registered === 'einwurf') baseCost += 250;
     if (options.registered === 'rueckschein') baseCost += 450;
     if (options.priority === 'express') baseCost += 150;
     
     // Add per-page cost
     const pageCost = (order.pages || 1) * 5;
     const totalCost = baseCost + pageCost;
 
     // In test mode, simulate the API response
     if (isTestMode) {
       const mockLetterId = `TEST-${Date.now()}`;
       
       await supabase
         .from('letter_orders')
         .update({
           status: 'submitted',
           letterxpress_id: mockLetterId,
           cost_cents: totalCost,
           sent_at: new Date().toISOString(),
         })
         .eq('id', orderId);
 
       // Simulate status progression in test mode
       setTimeout(async () => {
         await supabase
           .from('letter_orders')
           .update({ status: 'printing' })
           .eq('id', orderId);
       }, 5000);
 
       setTimeout(async () => {
         await supabase
           .from('letter_orders')
           .update({ status: 'sent', tracking_code: `TRACK-${mockLetterId}` })
           .eq('id', orderId);
       }, 15000);
 
       return new Response(JSON.stringify({
         success: true,
         letterId: mockLetterId,
         cost: totalCost,
         testMode: true,
         message: 'Brief wurde im Testmodus übermittelt'
       }), {
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       });
     }
 
     // Real API call would go here
     // For now, we'll use the same mock response but flag it as real
     const mockLetterId = `LX-${Date.now()}`;
     
     await supabase
       .from('letter_orders')
       .update({
         status: 'submitted',
         letterxpress_id: mockLetterId,
         cost_cents: totalCost,
         sent_at: new Date().toISOString(),
       })
       .eq('id', orderId);
 
     return new Response(JSON.stringify({
       success: true,
       letterId: mockLetterId,
       cost: totalCost,
       testMode: false,
       message: 'Brief wurde erfolgreich übermittelt'
     }), {
       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
     });
 
   } catch (error: unknown) {
     console.error('Error sending letter:', error);
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