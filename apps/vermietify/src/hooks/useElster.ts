 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/hooks/useAuth";
 import { useToast } from "@/hooks/use-toast";
 
 export type ElsterStatus = "draft" | "validating" | "submitted" | "accepted" | "rejected" | "notice_received";
 export type ElsterFormType = "anlage_v" | "anlage_kap" | "anlage_so" | "ust_va" | "ust_jahreserklaerung";
 
 export interface ElsterCertificate {
   id: string;
   organization_id: string;
   certificate_name: string;
   certificate_fingerprint: string;
   valid_from: string;
   valid_until: string;
   is_active: boolean;
   created_at: string;
 }
 
 export interface ElsterSubmission {
   id: string;
   organization_id: string;
   certificate_id: string | null;
   form_type: ElsterFormType;
   tax_year: number;
   building_ids: string[];
   data_json: Record<string, unknown>;
   xml_content: string | null;
   status: ElsterStatus;
   transfer_ticket: string | null;
   submitted_at: string | null;
   response_xml: string | null;
   error_message: string | null;
   protocol_pdf_path: string | null;
   created_at: string;
 }
 
 export interface ElsterNotice {
   id: string;
   submission_id: string;
   notice_date: string;
   notice_pdf_path: string | null;
   assessed_tax_cents: number;
   declared_tax_cents: number;
   difference_cents: number;
   notes: string | null;
   created_at: string;
 }
 
 export interface ElsterSettings {
   id: string;
   organization_id: string;
   tax_number: string | null;
   tax_office_id: string | null;
   tax_office_name: string | null;
   notification_email: string | null;
   test_mode: boolean;
   auto_fetch_notices: boolean;
 }
 
 export const TAX_OFFICES_BY_STATE: Record<string, Array<{ id: string; name: string }>> = {
   "Bayern": [
     { id: "9101", name: "Finanzamt München I" },
     { id: "9102", name: "Finanzamt München II" },
     { id: "9103", name: "Finanzamt München III" },
     { id: "9201", name: "Finanzamt Nürnberg-Nord" },
     { id: "9202", name: "Finanzamt Nürnberg-Süd" },
   ],
   "Berlin": [
     { id: "1116", name: "Finanzamt Charlottenburg" },
     { id: "1117", name: "Finanzamt Friedrichshain-Kreuzberg" },
     { id: "1118", name: "Finanzamt Mitte/Tiergarten" },
     { id: "1119", name: "Finanzamt Neukölln" },
   ],
   "Hamburg": [
     { id: "2214", name: "Finanzamt Hamburg-Mitte" },
     { id: "2215", name: "Finanzamt Hamburg-Nord" },
     { id: "2216", name: "Finanzamt Hamburg-Altona" },
   ],
   "Nordrhein-Westfalen": [
     { id: "5114", name: "Finanzamt Düsseldorf-Mitte" },
     { id: "5214", name: "Finanzamt Köln-Mitte" },
     { id: "5314", name: "Finanzamt Essen-Süd" },
   ],
   "Baden-Württemberg": [
     { id: "2814", name: "Finanzamt Stuttgart I" },
     { id: "2815", name: "Finanzamt Stuttgart II" },
     { id: "2816", name: "Finanzamt Karlsruhe-Stadt" },
   ],
   "Hessen": [
     { id: "2614", name: "Finanzamt Frankfurt am Main I" },
     { id: "2615", name: "Finanzamt Frankfurt am Main II" },
     { id: "2616", name: "Finanzamt Wiesbaden I" },
   ],
   "Niedersachsen": [
     { id: "2314", name: "Finanzamt Hannover-Mitte" },
     { id: "2315", name: "Finanzamt Hannover-Nord" },
     { id: "2316", name: "Finanzamt Braunschweig-Wilhelmstraße" },
   ],
   "Sachsen": [
     { id: "3214", name: "Finanzamt Dresden-Nord" },
     { id: "3215", name: "Finanzamt Leipzig I" },
     { id: "3216", name: "Finanzamt Chemnitz-Süd" },
   ],
 };
 
 export function useElster() {
   const { profile } = useAuth();
   const { toast } = useToast();
   const queryClient = useQueryClient();
 
   // Certificates
   const useCertificates = () => {
     return useQuery({
       queryKey: ["elster-certificates", profile?.organization_id],
       queryFn: async () => {
         if (!profile?.organization_id) return [];
         const { data, error } = await supabase
           .from("elster_certificates")
           .select("*")
           .eq("organization_id", profile.organization_id)
           .order("created_at", { ascending: false });
         if (error) throw error;
         return (data || []) as ElsterCertificate[];
       },
       enabled: !!profile?.organization_id,
     });
   };
 
   // Active certificate
   const useActiveCertificate = () => {
     return useQuery({
       queryKey: ["elster-active-certificate", profile?.organization_id],
       queryFn: async () => {
         if (!profile?.organization_id) return null;
         const { data, error } = await supabase
           .from("elster_certificates")
           .select("*")
           .eq("organization_id", profile.organization_id)
           .eq("is_active", true)
           .gte("valid_until", new Date().toISOString())
           .single();
         if (error && error.code !== "PGRST116") throw error;
         return data as ElsterCertificate | null;
       },
       enabled: !!profile?.organization_id,
     });
   };
 
   // Submissions
   const useSubmissions = () => {
     return useQuery({
       queryKey: ["elster-submissions", profile?.organization_id],
       queryFn: async () => {
         if (!profile?.organization_id) return [];
         const { data, error } = await supabase
           .from("elster_submissions")
           .select("*")
           .eq("organization_id", profile.organization_id)
           .order("created_at", { ascending: false });
         if (error) throw error;
         return (data || []) as ElsterSubmission[];
       },
       enabled: !!profile?.organization_id,
     });
   };
 
   // Single submission
   const useSubmission = (id: string | undefined) => {
     return useQuery({
       queryKey: ["elster-submission", id],
       queryFn: async () => {
         if (!id) return null;
         const { data, error } = await supabase
           .from("elster_submissions")
           .select("*, elster_certificates(*)")
           .eq("id", id)
           .single();
         if (error) throw error;
         return data as ElsterSubmission & { elster_certificates?: ElsterCertificate };
       },
       enabled: !!id,
     });
   };
 
   // Notices
   const useNotices = () => {
     return useQuery({
       queryKey: ["elster-notices", profile?.organization_id],
       queryFn: async () => {
         if (!profile?.organization_id) return [];
         const { data, error } = await supabase
           .from("elster_notices")
           .select("*, elster_submissions!inner(*)")
           .eq("elster_submissions.organization_id", profile.organization_id)
           .order("created_at", { ascending: false });
         if (error) throw error;
         return (data || []) as Array<ElsterNotice & { elster_submissions: ElsterSubmission }>;
       },
       enabled: !!profile?.organization_id,
     });
   };
 
   // Settings
   const useSettings = () => {
     return useQuery({
       queryKey: ["elster-settings", profile?.organization_id],
       queryFn: async () => {
         if (!profile?.organization_id) return null;
         const { data, error } = await supabase
           .from("elster_settings")
           .select("*")
           .eq("organization_id", profile.organization_id)
           .single();
         if (error && error.code !== "PGRST116") throw error;
         return data as ElsterSettings | null;
       },
       enabled: !!profile?.organization_id,
     });
   };
 
   // Create/update settings
   const upsertSettings = useMutation({
     mutationFn: async (settings: Partial<ElsterSettings>) => {
       if (!profile?.organization_id) throw new Error("Nicht authentifiziert");
       
       const { data: existing } = await supabase
         .from("elster_settings")
         .select("id")
         .eq("organization_id", profile.organization_id)
         .single();
 
       if (existing) {
         const { error } = await supabase
           .from("elster_settings")
           .update(settings)
           .eq("organization_id", profile.organization_id);
         if (error) throw error;
       } else {
         const { error } = await supabase
           .from("elster_settings")
           .insert({ ...settings, organization_id: profile.organization_id });
         if (error) throw error;
       }
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["elster-settings"] });
       toast({ title: "Einstellungen gespeichert" });
     },
     onError: (error) => {
       toast({ title: "Fehler", description: error.message, variant: "destructive" });
     },
   });
 
   // Upload certificate (simplified - in production would need proper certificate handling)
   const uploadCertificate = useMutation({
     mutationFn: async (data: { name: string; validFrom: string; validUntil: string }) => {
       if (!profile?.organization_id) throw new Error("Nicht authentifiziert");
       
       // Deactivate other certificates
       await supabase
         .from("elster_certificates")
         .update({ is_active: false })
         .eq("organization_id", profile.organization_id);
 
       const { error } = await supabase.from("elster_certificates").insert({
         organization_id: profile.organization_id,
         certificate_name: data.name,
         certificate_fingerprint: `FP-${Date.now().toString(36).toUpperCase()}`,
         valid_from: data.validFrom,
         valid_until: data.validUntil,
         is_active: true,
       });
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["elster-certificates"] });
       queryClient.invalidateQueries({ queryKey: ["elster-active-certificate"] });
       toast({ title: "Zertifikat hochgeladen" });
     },
     onError: (error) => {
       toast({ title: "Fehler", description: error.message, variant: "destructive" });
     },
   });
 
   // Create submission
   const createSubmission = useMutation({
     mutationFn: async (data: {
       formType: ElsterFormType;
       taxYear: number;
       buildingIds?: string[];
     }) => {
       if (!profile?.organization_id) throw new Error("Nicht authentifiziert");
       
       // Get active certificate
       const { data: cert } = await supabase
         .from("elster_certificates")
         .select("id")
         .eq("organization_id", profile.organization_id)
         .eq("is_active", true)
         .gte("valid_until", new Date().toISOString())
         .single();
 
       const { data: submission, error } = await supabase
         .from("elster_submissions")
         .insert({
           organization_id: profile.organization_id,
           certificate_id: cert?.id || null,
           form_type: data.formType,
           tax_year: data.taxYear,
           building_ids: data.buildingIds || [],
           status: "draft" as ElsterStatus,
         })
         .select()
         .single();
 
       if (error) throw error;
       return submission as ElsterSubmission;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["elster-submissions"] });
     },
     onError: (error) => {
       toast({ title: "Fehler", description: error.message, variant: "destructive" });
     },
   });
 
   // Generate XML
   const generateXml = useMutation({
     mutationFn: async (submissionId: string) => {
       const { data: submission } = await supabase
         .from("elster_submissions")
         .select("*")
         .eq("id", submissionId)
         .single();
 
       if (!submission) throw new Error("Übertragung nicht gefunden");
 
       const response = await supabase.functions.invoke("generate-elster-xml", {
         body: {
           formType: submission.form_type,
           taxYear: submission.tax_year,
           buildingIds: submission.building_ids,
           organizationId: submission.organization_id,
         },
       });
 
       if (response.error || !response.data?.success) {
         throw new Error(response.data?.error || "XML-Generierung fehlgeschlagen");
       }
 
       // Update submission with XML and data
       const { error } = await supabase
         .from("elster_submissions")
         .update({
           xml_content: response.data.xmlContent,
           data_json: response.data.dataJson,
         })
         .eq("id", submissionId);
 
       if (error) throw error;
       return response.data;
     },
     onSuccess: (_, submissionId) => {
       queryClient.invalidateQueries({ queryKey: ["elster-submission", submissionId] });
       queryClient.invalidateQueries({ queryKey: ["elster-submissions"] });
     },
     onError: (error) => {
       toast({ title: "Fehler", description: error.message, variant: "destructive" });
     },
   });
 
   // Validate data
   const validateData = useMutation({
     mutationFn: async (submissionId: string) => {
       const { data: submission } = await supabase
         .from("elster_submissions")
         .select("*")
         .eq("id", submissionId)
         .single();
 
       if (!submission) throw new Error("Übertragung nicht gefunden");
 
       const response = await supabase.functions.invoke("validate-elster-data", {
         body: {
           formType: submission.form_type,
           taxYear: submission.tax_year,
           buildingIds: submission.building_ids,
           organizationId: submission.organization_id,
         },
       });
 
       return response.data;
     },
   });
 
   // Submit to ELSTER
   const submitToElster = useMutation({
     mutationFn: async ({ submissionId, pin }: { submissionId: string; pin: string }) => {
       const response = await supabase.functions.invoke("submit-to-elster", {
         body: { submissionId, certificatePin: pin },
       });
 
       if (response.error || !response.data?.success) {
         throw new Error(response.data?.error || "Übertragung fehlgeschlagen");
       }
 
       return response.data;
     },
     onSuccess: (_, { submissionId }) => {
       queryClient.invalidateQueries({ queryKey: ["elster-submission", submissionId] });
       queryClient.invalidateQueries({ queryKey: ["elster-submissions"] });
       toast({ title: "Erfolgreich übertragen" });
     },
     onError: (error) => {
       toast({ title: "Übertragung fehlgeschlagen", description: error.message, variant: "destructive" });
     },
   });
 
   // Fetch notices
   const fetchNotices = useMutation({
     mutationFn: async () => {
       if (!profile?.organization_id) throw new Error("Nicht authentifiziert");
 
       const response = await supabase.functions.invoke("fetch-elster-notices", {
         body: { organizationId: profile.organization_id },
       });
 
       if (response.error) throw response.error;
       return response.data;
     },
     onSuccess: (data) => {
       queryClient.invalidateQueries({ queryKey: ["elster-notices"] });
       queryClient.invalidateQueries({ queryKey: ["elster-submissions"] });
       if (data?.newNotices?.length > 0) {
         toast({ title: `${data.newNotices.length} neue(r) Bescheid(e) abgerufen` });
       }
     },
   });
 
   // Delete submission
   const deleteSubmission = useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase
         .from("elster_submissions")
         .delete()
         .eq("id", id);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["elster-submissions"] });
       toast({ title: "Übertragung gelöscht" });
     },
   });
 
   return {
     useCertificates,
     useActiveCertificate,
     useSubmissions,
     useSubmission,
     useNotices,
     useSettings,
     upsertSettings,
     uploadCertificate,
     createSubmission,
     generateXml,
     validateData,
     submitToElster,
     fetchNotices,
     deleteSubmission,
   };
 }
 
 // Status display helpers
 export const ELSTER_STATUS_LABELS: Record<ElsterStatus, string> = {
   draft: "Entwurf",
   validating: "Wird geprüft",
   submitted: "Übertragen",
   accepted: "Angenommen",
   rejected: "Abgelehnt",
   notice_received: "Bescheid eingegangen",
 };
 
 export const ELSTER_STATUS_COLORS: Record<ElsterStatus, string> = {
   draft: "secondary",
   validating: "secondary",
   submitted: "default",
   accepted: "default",
   rejected: "destructive",
   notice_received: "default",
 };
 
 export const FORM_TYPE_LABELS: Record<ElsterFormType, string> = {
   anlage_v: "Anlage V",
   anlage_kap: "Anlage KAP",
   anlage_so: "Anlage SO",
   ust_va: "USt-Voranmeldung",
   ust_jahreserklaerung: "USt-Jahreserklärung",
 };