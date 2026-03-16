 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/hooks/useAuth";
 import { toast } from "sonner";
 import { useEffect } from "react";
 
 export interface WhatsAppContact {
   id: string;
   organization_id: string;
   phone: string;
   tenant_id: string | null;
   display_name: string | null;
   opted_in: boolean;
   opted_in_at: string | null;
   opt_out_at: string | null;
   last_message_at: string | null;
   created_at: string;
   updated_at: string;
   tenant?: {
     first_name: string;
     last_name: string;
   };
 }
 
 export interface WhatsAppMessage {
   id: string;
   organization_id: string;
   contact_id: string | null;
   contact_phone: string;
   direction: 'inbound' | 'outbound';
   message_type: 'text' | 'template' | 'image' | 'document' | 'audio' | 'video' | 'location';
   content: string | null;
   template_name: string | null;
   template_params: string[];
   media_url: string | null;
   status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
   whatsapp_message_id: string | null;
   error_message: string | null;
   created_at: string;
 }
 
 export interface WhatsAppTemplate {
   id: string;
   organization_id: string;
   name: string;
   category: 'utility' | 'marketing' | 'authentication';
   language: string;
   status: 'pending' | 'approved' | 'rejected';
   header_type: 'none' | 'text' | 'image' | 'document' | 'video' | null;
   header_content: string | null;
   body: string;
   footer: string | null;
   buttons: unknown[];
   whatsapp_template_id: string | null;
   rejection_reason: string | null;
   is_system: boolean;
   created_at: string;
   updated_at: string;
 }
 
 export interface WhatsAppBroadcast {
   id: string;
   organization_id: string;
   name: string;
   template_id: string | null;
   recipient_filter: Record<string, unknown>;
   recipient_count: number;
   sent_count: number;
   delivered_count: number;
   read_count: number;
   failed_count: number;
   status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'cancelled';
   scheduled_at: string | null;
   started_at: string | null;
   completed_at: string | null;
   created_at: string;
   created_by: string | null;
 }
 
 export interface WhatsAppSettings {
   id: string;
   organization_id: string;
   phone_number_id: string | null;
   business_account_id: string | null;
   access_token_encrypted: string | null;
   webhook_verify_token: string | null;
   business_name: string | null;
   business_description: string | null;
   business_address: string | null;
   greeting_message: string | null;
   away_message: string | null;
   away_enabled: boolean;
   created_at: string;
   updated_at: string;
 }
 
 export function useWhatsApp() {
   const { profile } = useAuth();
   const queryClient = useQueryClient();
   const organizationId = profile?.organization_id;
 
   // Fetch contacts
   const { data: contacts = [], isLoading: contactsLoading } = useQuery({
     queryKey: ['whatsapp-contacts', organizationId],
     queryFn: async () => {
       if (!organizationId) return [];
       const { data, error } = await supabase
         .from('whatsapp_contacts')
         .select('*, tenant:tenants(first_name, last_name)')
         .eq('organization_id', organizationId)
         .order('last_message_at', { ascending: false, nullsFirst: false });
       if (error) throw error;
       return data as unknown as WhatsAppContact[];
     },
     enabled: !!organizationId,
   });
 
   // Fetch messages for a contact
   const useMessages = (contactId: string | null) => {
     return useQuery({
       queryKey: ['whatsapp-messages', contactId],
       queryFn: async () => {
         if (!contactId) return [];
         const { data, error } = await supabase
           .from('whatsapp_messages')
           .select('*')
           .eq('contact_id', contactId)
           .order('created_at', { ascending: true });
         if (error) throw error;
         return data as unknown as WhatsAppMessage[];
       },
       enabled: !!contactId,
     });
   };
 
   // Fetch templates
   const { data: templates = [], isLoading: templatesLoading } = useQuery({
     queryKey: ['whatsapp-templates', organizationId],
     queryFn: async () => {
       if (!organizationId) return [];
       const { data, error } = await supabase
         .from('whatsapp_templates')
         .select('*')
         .eq('organization_id', organizationId)
         .order('created_at', { ascending: false });
       if (error) throw error;
       return data as unknown as WhatsAppTemplate[];
     },
     enabled: !!organizationId,
   });
 
   // Fetch broadcasts
   const { data: broadcasts = [], isLoading: broadcastsLoading } = useQuery({
     queryKey: ['whatsapp-broadcasts', organizationId],
     queryFn: async () => {
       if (!organizationId) return [];
       const { data, error } = await supabase
         .from('whatsapp_broadcasts')
         .select('*')
         .eq('organization_id', organizationId)
         .order('created_at', { ascending: false });
       if (error) throw error;
       return data as unknown as WhatsAppBroadcast[];
     },
     enabled: !!organizationId,
   });
 
   // Fetch settings
   const { data: settings, isLoading: settingsLoading } = useQuery({
     queryKey: ['whatsapp-settings', organizationId],
     queryFn: async () => {
       if (!organizationId) return null;
       const { data, error } = await supabase
         .from('whatsapp_settings')
         .select('*')
         .eq('organization_id', organizationId)
         .single();
       if (error && error.code !== 'PGRST116') throw error;
       return data as unknown as WhatsAppSettings | null;
     },
     enabled: !!organizationId,
   });
 
   // Send message
   const sendMessage = useMutation({
     mutationFn: async ({ contactPhone, content, templateName, templateParams }: {
       contactPhone: string;
       content?: string;
       templateName?: string;
       templateParams?: string[];
     }) => {
       const { data, error } = await supabase.functions.invoke('send-whatsapp', {
         body: {
           contactPhone,
           messageType: templateName ? 'template' : 'text',
           content,
           templateName,
           templateParams,
         },
       });
       if (error) throw error;
       if (!data.success) throw new Error(data.error);
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['whatsapp-messages'] });
       queryClient.invalidateQueries({ queryKey: ['whatsapp-contacts'] });
     },
     onError: (error) => {
       toast.error('Fehler beim Senden: ' + error.message);
     },
   });
 
   // Create template
   const createTemplate = useMutation({
     mutationFn: async (template: Partial<WhatsAppTemplate>) => {
       if (!organizationId) throw new Error('No organization');
       const { data, error } = await supabase
         .from('whatsapp_templates')
         .insert({ ...template, organization_id: organizationId } as never)
         .select()
         .single();
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
       toast.success('Vorlage erstellt');
     },
   });
 
   // Update template
   const updateTemplate = useMutation({
     mutationFn: async ({ id, ...updates }: Partial<WhatsAppTemplate> & { id: string }) => {
       const { data, error } = await supabase
         .from('whatsapp_templates')
         .update(updates as never)
         .eq('id', id)
         .select()
         .single();
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
       toast.success('Vorlage aktualisiert');
     },
   });
 
   // Delete template
   const deleteTemplate = useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase
         .from('whatsapp_templates')
         .delete()
         .eq('id', id);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
       toast.success('Vorlage gelöscht');
     },
   });
 
   // Create broadcast
   const createBroadcast = useMutation({
     mutationFn: async (broadcast: Partial<WhatsAppBroadcast>) => {
       if (!organizationId) throw new Error('No organization');
       const { data, error } = await supabase
         .from('whatsapp_broadcasts')
         .insert({ ...broadcast, organization_id: organizationId } as never)
         .select()
         .single();
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['whatsapp-broadcasts'] });
       toast.success('Broadcast erstellt');
     },
   });
 
   // Update settings
   const updateSettings = useMutation({
     mutationFn: async (updates: Partial<WhatsAppSettings>) => {
       if (!organizationId) throw new Error('No organization');
       
       // Upsert settings
       const { data, error } = await supabase
         .from('whatsapp_settings')
         .upsert({ ...updates, organization_id: organizationId } as never, {
           onConflict: 'organization_id',
         })
         .select()
         .single();
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['whatsapp-settings'] });
       toast.success('Einstellungen gespeichert');
     },
   });
 
   // Subscribe to realtime messages
   useEffect(() => {
     if (!organizationId) return;
 
     const channel = supabase
       .channel('whatsapp-messages')
       .on(
         'postgres_changes',
         {
           event: '*',
           schema: 'public',
           table: 'whatsapp_messages',
           filter: `organization_id=eq.${organizationId}`,
         },
         () => {
           queryClient.invalidateQueries({ queryKey: ['whatsapp-messages'] });
           queryClient.invalidateQueries({ queryKey: ['whatsapp-contacts'] });
         }
       )
       .subscribe();
 
     return () => {
       supabase.removeChannel(channel);
     };
   }, [organizationId, queryClient]);
 
   // Stats
   const today = new Date();
   today.setHours(0, 0, 0, 0);
 
   const stats = {
     messagesToday: 0, // Would need to query with date filter
     activeChats: contacts.filter(c => c.last_message_at).length,
     templatesCount: templates.filter(t => t.status === 'approved').length,
   };
 
   return {
     contacts,
     templates,
     broadcasts,
     settings,
     stats,
     isLoading: contactsLoading || templatesLoading || broadcastsLoading || settingsLoading,
     useMessages,
     sendMessage,
     createTemplate,
     updateTemplate,
     deleteTemplate,
     createBroadcast,
     updateSettings,
   };
 }