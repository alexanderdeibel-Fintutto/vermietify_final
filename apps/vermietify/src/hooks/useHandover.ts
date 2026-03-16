 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/hooks/useAuth";
 import { toast } from "@/hooks/use-toast";
 import type { Json } from "@/integrations/supabase/types";
 
 export type HandoverStatus = "planned" | "in_progress" | "completed" | "signed";
 export type HandoverType = "move_in" | "move_out";
 export type DefectSeverity = "light" | "medium" | "severe";
 export type KeyType = "front_door" | "apartment" | "basement" | "mailbox" | "garage" | "other";
 export type SignerType = "landlord" | "tenant" | "witness" | "caretaker";
 
 export interface HandoverProtocol {
   id: string;
   organization_id: string;
   unit_id: string;
   tenant_id: string | null;
   type: HandoverType;
   scheduled_at: string;
   completed_at: string | null;
   participants: any[];
   status: HandoverStatus;
   pdf_path: string | null;
   notes: string | null;
   created_by: string | null;
   created_at: string;
   updated_at: string;
   unit?: any;
   tenant?: any;
 }
 
 export interface HandoverRoom {
   id: string;
   protocol_id: string;
   room_name: string;
   order_index: number;
   items: RoomItem[];
   photos: string[];
   notes: string | null;
   overall_status: string;
   created_at: string;
 }
 
 export interface RoomItem {
   id: string;
   name: string;
   status: "ok" | "defect" | "pending";
   defect?: {
     description: string;
     severity: DefectSeverity;
     is_tenant_responsible: boolean;
     photo_paths: string[];
   };
 }
 
 export interface HandoverDefect {
   id: string;
   protocol_id: string;
   room_id: string | null;
   description: string;
   severity: DefectSeverity;
   photo_paths: string[];
   is_tenant_responsible: boolean;
   estimated_cost_cents: number;
   resolved_at: string | null;
   created_at: string;
 }
 
 export interface HandoverSignature {
   id: string;
   protocol_id: string;
   signer_type: SignerType;
   signer_name: string;
   signature_path: string;
   signed_at: string;
 }
 
 export interface HandoverKey {
   id: string;
   protocol_id: string;
   key_type: KeyType;
   key_label: string | null;
   quantity: number;
   handed_over: boolean;
   notes: string | null;
   created_at: string;
 }
 
 export const DEFAULT_ROOMS = [
   { name: "Flur", items: ["Wände & Decke", "Boden", "Türen", "Elektro", "Garderobe"] },
   { name: "Wohnzimmer", items: ["Wände & Decke", "Boden", "Fenster", "Türen", "Elektro", "Heizung"] },
   { name: "Schlafzimmer", items: ["Wände & Decke", "Boden", "Fenster", "Türen", "Elektro", "Heizung"] },
   { name: "Küche", items: ["Wände & Decke", "Boden", "Fenster", "Türen", "Elektro", "Heizung", "Herd/Backofen", "Spüle", "Kühlschrank", "Dunstabzug"] },
   { name: "Bad", items: ["Wände & Decke", "Boden", "Fenster", "Türen", "Elektro", "Heizung", "Waschbecken", "WC", "Dusche/Badewanne", "Spiegel", "Armaturen"] },
   { name: "Balkon/Terrasse", items: ["Boden", "Geländer", "Markise"] },
   { name: "Keller", items: ["Wände & Decke", "Boden", "Türen", "Elektro"] },
 ];
 
 export const DEFAULT_KEYS: { type: KeyType; label: string }[] = [
   { type: "front_door", label: "Haustürschlüssel" },
   { type: "apartment", label: "Wohnungsschlüssel" },
   { type: "basement", label: "Kellerschlüssel" },
   { type: "mailbox", label: "Briefkastenschlüssel" },
 ];
 
 export function useHandover() {
   const { profile } = useAuth();
   const organizationId = profile?.organization_id;
   const queryClient = useQueryClient();
 
   const protocolsQuery = useQuery({
     queryKey: ["handover-protocols", organizationId],
     queryFn: async () => {
       if (!organizationId) return [];
       const { data, error } = await supabase
         .from("handover_protocols")
         .select(`
           *,
           unit:units(id, unit_number, building:buildings(id, name, address)),
           tenant:tenants(id, first_name, last_name)
         `)
         .eq("organization_id", organizationId)
         .order("scheduled_at", { ascending: false });
       if (error) throw error;
       return data as HandoverProtocol[];
     },
     enabled: !!organizationId,
   });
 
   const createProtocol = useMutation({
     mutationFn: async (data: {
       unit_id: string;
       tenant_id?: string;
       type: HandoverType;
       scheduled_at: string;
       participants: any[];
     }) => {
       if (!organizationId) throw new Error("Keine Organisation");
       const { data: protocol, error } = await supabase
         .from("handover_protocols")
         .insert({
           organization_id: organizationId,
           ...data,
         })
         .select()
         .single();
       if (error) throw error;
       return protocol;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["handover-protocols"] });
       toast({ title: "Übergabe erstellt" });
     },
     onError: (error: any) => {
       toast({ title: "Fehler", description: error.message, variant: "destructive" });
     },
   });
 
   const updateProtocol = useMutation({
     mutationFn: async ({ id, ...data }: Partial<HandoverProtocol> & { id: string }) => {
       const { error } = await supabase
         .from("handover_protocols")
         .update({ ...data, updated_at: new Date().toISOString() })
         .eq("id", id);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["handover-protocols"] });
     },
   });
 
   const deleteProtocol = useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase.from("handover_protocols").delete().eq("id", id);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["handover-protocols"] });
       toast({ title: "Übergabe gelöscht" });
     },
   });
 
   return {
     protocols: protocolsQuery.data || [],
     isLoading: protocolsQuery.isLoading,
     createProtocol,
     updateProtocol,
     deleteProtocol,
   };
 }
 
 export function useHandoverProtocol(protocolId: string | undefined) {
   const queryClient = useQueryClient();
 
   const protocolQuery = useQuery({
     queryKey: ["handover-protocol", protocolId],
     queryFn: async () => {
       if (!protocolId) return null;
       const { data, error } = await supabase
         .from("handover_protocols")
         .select(`
           *,
           unit:units(id, unit_number, building:buildings(id, name, address)),
           tenant:tenants(id, first_name, last_name, email, phone)
         `)
         .eq("id", protocolId)
         .single();
       if (error) throw error;
       return data as HandoverProtocol;
     },
     enabled: !!protocolId,
   });
 
   const roomsQuery = useQuery({
     queryKey: ["handover-rooms", protocolId],
     queryFn: async () => {
       if (!protocolId) return [];
       const { data, error } = await supabase
         .from("handover_rooms")
         .select("*")
         .eq("protocol_id", protocolId)
         .order("order_index");
       if (error) throw error;
       return (data || []).map((room) => ({
         ...room,
         items: (room.items as unknown as RoomItem[]) || [],
       })) as HandoverRoom[];
     },
     enabled: !!protocolId,
   });
 
   const defectsQuery = useQuery({
     queryKey: ["handover-defects", protocolId],
     queryFn: async () => {
       if (!protocolId) return [];
       const { data, error } = await supabase
         .from("handover_defects")
         .select("*")
         .eq("protocol_id", protocolId);
       if (error) throw error;
       return data as HandoverDefect[];
     },
     enabled: !!protocolId,
   });
 
   const signaturesQuery = useQuery({
     queryKey: ["handover-signatures", protocolId],
     queryFn: async () => {
       if (!protocolId) return [];
       const { data, error } = await supabase
         .from("handover_signatures")
         .select("*")
         .eq("protocol_id", protocolId);
       if (error) throw error;
       return data as HandoverSignature[];
     },
     enabled: !!protocolId,
   });
 
   const keysQuery = useQuery({
     queryKey: ["handover-keys", protocolId],
     queryFn: async () => {
       if (!protocolId) return [];
       const { data, error } = await supabase
         .from("handover_keys")
         .select("*")
         .eq("protocol_id", protocolId);
       if (error) throw error;
       return data as HandoverKey[];
     },
     enabled: !!protocolId,
   });
 
   const createRoom = useMutation({
     mutationFn: async (data: Omit<HandoverRoom, "id" | "created_at">) => {
       const insertData = {
         ...data,
         items: data.items as unknown as Json,
       };
       const { error } = await supabase.from("handover_rooms").insert(insertData);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["handover-rooms", protocolId] });
     },
   });
 
   const updateRoom = useMutation({
     mutationFn: async ({ id, ...data }: Partial<HandoverRoom> & { id: string }) => {
       const updateData = {
         ...data,
         items: data.items ? (data.items as unknown as Json) : undefined,
       };
       const { error } = await supabase.from("handover_rooms").update(updateData).eq("id", id);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["handover-rooms", protocolId] });
     },
   });
 
   const createDefect = useMutation({
     mutationFn: async (data: Omit<HandoverDefect, "id" | "created_at">) => {
       const { error } = await supabase.from("handover_defects").insert(data);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["handover-defects", protocolId] });
     },
   });
 
   const createSignature = useMutation({
     mutationFn: async (data: Omit<HandoverSignature, "id" | "signed_at">) => {
       const { error } = await supabase.from("handover_signatures").insert(data);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["handover-signatures", protocolId] });
     },
   });
 
   const createKey = useMutation({
     mutationFn: async (data: Omit<HandoverKey, "id" | "created_at">) => {
       const { error } = await supabase.from("handover_keys").insert(data);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["handover-keys", protocolId] });
     },
   });
 
   const updateKey = useMutation({
     mutationFn: async ({ id, ...data }: Partial<HandoverKey> & { id: string }) => {
       const { error } = await supabase.from("handover_keys").update(data).eq("id", id);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["handover-keys", protocolId] });
     },
   });
 
   const uploadFile = async (file: Blob, path: string): Promise<string> => {
     const { data, error } = await supabase.storage
       .from("handover-files")
       .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: signedData } = await supabase.storage.from("handover-files").createSignedUrl(data.path, 3600);
      return signedData?.signedUrl || data.path;
   };
 
   return {
     protocol: protocolQuery.data,
     rooms: roomsQuery.data || [],
     defects: defectsQuery.data || [],
     signatures: signaturesQuery.data || [],
     keys: keysQuery.data || [],
     isLoading: protocolQuery.isLoading || roomsQuery.isLoading,
     createRoom,
     updateRoom,
     createDefect,
     createSignature,
     createKey,
     updateKey,
     uploadFile,
     refetch: () => {
       queryClient.invalidateQueries({ queryKey: ["handover-protocol", protocolId] });
       queryClient.invalidateQueries({ queryKey: ["handover-rooms", protocolId] });
       queryClient.invalidateQueries({ queryKey: ["handover-defects", protocolId] });
       queryClient.invalidateQueries({ queryKey: ["handover-signatures", protocolId] });
       queryClient.invalidateQueries({ queryKey: ["handover-keys", protocolId] });
     },
   };
 }