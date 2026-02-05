 import "jsr:@supabase/functions-js/edge-runtime.d.ts";
 import { createClient } from "jsr:@supabase/supabase-js@2";
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 };
 
 interface Signer {
   name: string;
   email: string;
   role: 'tenant' | 'landlord' | 'witness';
   order: number;
   status: 'pending' | 'sent' | 'viewed' | 'signed' | 'declined';
   signed_at?: string;
   access_token?: string;
 }
 
 interface CreateSignatureRequest {
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
 
     const { orderId } = await req.json() as CreateSignatureRequest;
 
     // Get the signature order
     const { data: order, error: orderError } = await supabase
       .from('esignature_orders')
       .select('*')
       .eq('id', orderId)
       .single();
 
     if (orderError || !order) {
       throw new Error('Signature order not found');
     }
 
     // Generate access tokens for each signer
     const signers = (order.signers as Signer[]).map(signer => ({
       ...signer,
       status: 'sent' as const,
       access_token: crypto.randomUUID(),
     }));
 
     // Calculate expiry date (default 14 days)
     const expiresAt = order.expires_at || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
 
     // Update order with tokens and status
     const { error: updateError } = await supabase
       .from('esignature_orders')
       .update({
         status: 'sent',
         signers,
         expires_at: expiresAt,
       })
       .eq('id', orderId);
 
     if (updateError) throw updateError;
 
     // Log event
     await supabase.from('esignature_events').insert({
       order_id: orderId,
       event_type: 'sent',
       metadata: { sent_to: signers.map(s => s.email) },
     });
 
     // In a real implementation, we would:
     // 1. Call DocuSign/Skribble API to create envelope
     // 2. Get provider_order_id
     // 3. Send email notifications with signing links
 
     // For now, generate signing URLs
     const signingLinks = signers.map(signer => ({
       email: signer.email,
       name: signer.name,
       url: `${supabaseUrl.replace('.supabase.co', '')}/sign/${orderId}?token=${signer.access_token}`,
     }));
 
     return new Response(JSON.stringify({
       success: true,
       orderId,
       signingLinks,
       expiresAt,
       message: 'Signaturanfrage wurde versendet'
     }), {
       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
     });
 
   } catch (error: unknown) {
     console.error('Error creating signature request:', error);
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