 import { useState } from "react";
 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/hooks/useAuth";
 import { toast } from "sonner";
 
 export interface LetterOrder {
   id: string;
   organization_id: string;
   recipient_type: string;
   recipient_id: string | null;
   recipient_address: {
     name: string;
     street: string;
     postal_code: string;
     city: string;
     country?: string;
   };
   template_id: string | null;
   subject: string;
   content_pdf_path: string | null;
   options: {
     color: boolean;
     duplex: boolean;
     registered: 'none' | 'einwurf' | 'rueckschein';
     priority?: 'standard' | 'express';
   };
   letterxpress_id: string | null;
   status: 'draft' | 'submitted' | 'printing' | 'sent' | 'delivered' | 'error' | 'cancelled';
   tracking_code: string | null;
   cost_cents: number;
   pages: number;
   scheduled_at: string | null;
   sent_at: string | null;
   delivered_at: string | null;
   error_message: string | null;
   created_at: string;
   updated_at: string;
   created_by: string | null;
 }
 
 export interface LetterTemplate {
   id: string;
   organization_id: string | null;
   name: string;
   category: string;
   subject: string | null;
   content: string;
   placeholders: string[];
   is_system: boolean;
   created_at: string;
   updated_at: string;
 }
 
 export interface LetterSettings {
   id: string;
   organization_id: string;
   api_key_encrypted: string | null;
   test_mode: boolean;
   default_sender: {
     name: string;
     street: string;
     postal_code: string;
     city: string;
   } | null;
   letterhead_pdf_path: string | null;
   webhook_secret: string | null;
 }
 
 export function useLetters() {
   const { profile } = useAuth();
   const queryClient = useQueryClient();
   const organizationId = profile?.organization_id;
 
   // Fetch letter orders
   const { data: orders = [], isLoading: ordersLoading } = useQuery({
     queryKey: ['letter-orders', organizationId],
     queryFn: async () => {
       if (!organizationId) return [];
       const { data, error } = await supabase
         .from('letter_orders')
         .select('*')
         .eq('organization_id', organizationId)
         .order('created_at', { ascending: false });
       if (error) throw error;
       return data as unknown as LetterOrder[];
     },
     enabled: !!organizationId,
   });
 
   // Fetch templates
   const { data: templates = [], isLoading: templatesLoading } = useQuery({
     queryKey: ['letter-templates', organizationId],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('letter_templates')
         .select('*')
         .or(`is_system.eq.true,organization_id.eq.${organizationId}`)
         .order('name');
       if (error) throw error;
       return data as unknown as LetterTemplate[];
     },
     enabled: !!organizationId,
   });
 
   // Fetch settings
   const { data: settings, isLoading: settingsLoading } = useQuery({
     queryKey: ['letter-settings', organizationId],
     queryFn: async () => {
       if (!organizationId) return null;
       const { data, error } = await supabase
         .from('letter_settings')
         .select('*')
         .eq('organization_id', organizationId)
         .maybeSingle();
       if (error) throw error;
       return data as unknown as LetterSettings | null;
     },
     enabled: !!organizationId,
   });
 
   // Create letter order
   const createOrder = useMutation({
     mutationFn: async (order: Partial<LetterOrder>) => {
       if (!organizationId) throw new Error('No organization');
       const { data, error } = await supabase
         .from('letter_orders')
         .insert({
           ...order,
           organization_id: organizationId,
         } as never)
         .select()
         .single();
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['letter-orders'] });
       toast.success('Brief erstellt');
     },
     onError: (error) => {
       toast.error('Fehler beim Erstellen: ' + error.message);
     },
   });
 
   // Update letter order
   const updateOrder = useMutation({
     mutationFn: async ({ id, ...updates }: Partial<LetterOrder> & { id: string }) => {
       const { data, error } = await supabase
         .from('letter_orders')
         .update(updates as never)
         .eq('id', id)
         .select()
         .single();
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['letter-orders'] });
     },
   });
 
   // Delete letter order
   const deleteOrder = useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase
         .from('letter_orders')
         .delete()
         .eq('id', id);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['letter-orders'] });
       toast.success('Brief gelöscht');
     },
   });
 
   // Send letter
   const sendLetter = useMutation({
     mutationFn: async (orderId: string) => {
       const { data, error } = await supabase.functions.invoke('send-letter', {
         body: { orderId },
       });
       if (error) throw error;
       if (!data.success) throw new Error(data.error);
       return data;
     },
     onSuccess: (data) => {
       queryClient.invalidateQueries({ queryKey: ['letter-orders'] });
       toast.success(data.testMode 
         ? 'Brief im Testmodus übermittelt' 
         : 'Brief erfolgreich übermittelt'
       );
     },
     onError: (error) => {
       toast.error('Versand fehlgeschlagen: ' + error.message);
     },
   });
 
   // Save settings
   const saveSettings = useMutation({
     mutationFn: async (settingsData: Partial<LetterSettings>) => {
       if (!organizationId) throw new Error('No organization');
       
       const { data: existing } = await supabase
         .from('letter_settings')
         .select('id')
         .eq('organization_id', organizationId)
         .maybeSingle();
 
       if (existing) {
         const { data, error } = await supabase
           .from('letter_settings')
           .update(settingsData as never)
           .eq('organization_id', organizationId)
           .select()
           .single();
         if (error) throw error;
         return data;
       } else {
         const { data, error } = await supabase
           .from('letter_settings')
           .insert({
             ...settingsData,
             organization_id: organizationId,
           } as never)
           .select()
           .single();
         if (error) throw error;
         return data;
       }
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['letter-settings'] });
       toast.success('Einstellungen gespeichert');
     },
     onError: (error) => {
       toast.error('Fehler beim Speichern: ' + error.message);
     },
   });
 
   // Calculate letter cost
   const calculateCost = (options: LetterOrder['options'], pages: number = 1) => {
     let baseCost = 85; // 0.85€ base
     if (options.color) baseCost += 20;
     if (options.duplex) baseCost += 10;
     if (options.registered === 'einwurf') baseCost += 250;
     if (options.registered === 'rueckschein') baseCost += 450;
     if (options.priority === 'express') baseCost += 150;
     const pageCost = pages * 5;
     return baseCost + pageCost;
   };
 
   // Stats
   const stats = {
     thisMonth: orders.filter(o => {
       const created = new Date(o.created_at);
       const now = new Date();
       return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
     }).length,
     totalCost: orders.reduce((sum, o) => sum + (o.cost_cents || 0), 0),
     inDelivery: orders.filter(o => ['submitted', 'printing', 'sent'].includes(o.status)).length,
     delivered: orders.filter(o => o.status === 'delivered').length,
   };
 
   return {
     orders,
     templates,
     settings,
     stats,
     isLoading: ordersLoading || templatesLoading || settingsLoading,
     createOrder,
     updateOrder,
     deleteOrder,
     sendLetter,
     saveSettings,
     calculateCost,
   };
 }