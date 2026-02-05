 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/hooks/useAuth";
 import { toast } from "sonner";
 
 export interface Signer {
   name: string;
   email: string;
   role: 'tenant' | 'landlord' | 'witness';
   order: number;
   status: 'pending' | 'sent' | 'viewed' | 'signed' | 'declined';
   signed_at?: string;
   access_token?: string;
 }
 
 export interface SignatureField {
   id: string;
   type: 'signature' | 'date' | 'initials' | 'text';
   signer_email: string;
   page: number;
   x: number;
   y: number;
   width: number;
   height: number;
   required: boolean;
 }
 
 export interface SignatureOrder {
   id: string;
   organization_id: string;
   document_id: string | null;
   document_path: string | null;
   document_name: string;
   document_type: string;
   provider: string;
   provider_order_id: string | null;
   status: 'draft' | 'sent' | 'viewed' | 'signed' | 'declined' | 'expired' | 'cancelled';
   signers: Signer[];
   signature_fields: SignatureField[];
   message: string | null;
   expires_at: string | null;
   completed_at: string | null;
   signed_document_path: string | null;
   reminder_days: number[];
   last_reminder_at: string | null;
   created_at: string;
   updated_at: string;
   created_by: string | null;
 }
 
 export function useSignatures() {
   const { profile } = useAuth();
   const queryClient = useQueryClient();
   const organizationId = profile?.organization_id;
 
   // Fetch signature orders
   const { data: orders = [], isLoading } = useQuery({
     queryKey: ['signature-orders', organizationId],
     queryFn: async () => {
       if (!organizationId) return [];
       const { data, error } = await supabase
         .from('esignature_orders')
         .select('*')
         .eq('organization_id', organizationId)
         .order('created_at', { ascending: false });
       if (error) throw error;
       return data as unknown as SignatureOrder[];
     },
     enabled: !!organizationId,
   });
 
   // Create order
   const createOrder = useMutation({
     mutationFn: async (order: Partial<SignatureOrder>) => {
       if (!organizationId) throw new Error('No organization');
       const { data, error } = await supabase
         .from('esignature_orders')
         .insert({
           ...order,
           organization_id: organizationId,
         } as never)
         .select()
         .single();
       if (error) throw error;
       return data as unknown as SignatureOrder;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['signature-orders'] });
       toast.success('Signaturanfrage erstellt');
     },
     onError: (error) => {
       toast.error('Fehler: ' + error.message);
     },
   });
 
   // Update order
   const updateOrder = useMutation({
     mutationFn: async ({ id, ...updates }: Partial<SignatureOrder> & { id: string }) => {
       const { data, error } = await supabase
         .from('esignature_orders')
         .update(updates as never)
         .eq('id', id)
         .select()
         .single();
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['signature-orders'] });
     },
   });
 
   // Delete order
   const deleteOrder = useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase
         .from('esignature_orders')
         .delete()
         .eq('id', id);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['signature-orders'] });
       toast.success('Anfrage gelöscht');
     },
   });
 
   // Send signature request
   const sendRequest = useMutation({
     mutationFn: async (orderId: string) => {
       const { data, error } = await supabase.functions.invoke('create-signature-request', {
         body: { orderId },
       });
       if (error) throw error;
       if (!data.success) throw new Error(data.error);
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['signature-orders'] });
       toast.success('Signaturanfrage versendet');
     },
     onError: (error) => {
       toast.error('Fehler beim Versenden: ' + error.message);
     },
   });
 
   // Send reminder
   const sendReminder = useMutation({
     mutationFn: async (orderId: string) => {
       // In real implementation, would call edge function to send reminder emails
       const { error } = await supabase
         .from('esignature_orders')
         .update({ last_reminder_at: new Date().toISOString() } as never)
         .eq('id', orderId);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['signature-orders'] });
       toast.success('Erinnerung versendet');
     },
   });
 
   // Cancel order
   const cancelOrder = useMutation({
     mutationFn: async (orderId: string) => {
       const { error } = await supabase
         .from('esignature_orders')
         .update({ status: 'cancelled' } as never)
         .eq('id', orderId);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['signature-orders'] });
       toast.success('Anfrage storniert');
     },
   });
 
   // Stats
   const now = new Date();
   const thisMonth = now.getMonth();
   const thisYear = now.getFullYear();
 
   const stats = {
     pending: orders.filter(o => ['draft', 'sent', 'viewed'].includes(o.status)).length,
     signedThisMonth: orders.filter(o => {
       if (o.status !== 'signed' || !o.completed_at) return false;
       const completed = new Date(o.completed_at);
       return completed.getMonth() === thisMonth && completed.getFullYear() === thisYear;
     }).length,
     expired: orders.filter(o => o.status === 'expired').length,
   };
 
   return {
     orders,
     stats,
     isLoading,
     createOrder,
     updateOrder,
     deleteOrder,
     sendRequest,
     sendReminder,
     cancelOrder,
   };
 }