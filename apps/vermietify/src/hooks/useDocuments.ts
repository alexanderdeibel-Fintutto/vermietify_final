import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export const DOCUMENT_TYPES = {
  invoice: "Rechnung",
  tax_notice: "Steuerbescheid",
  contract: "Vertrag",
  letter: "Brief",
  receipt: "Beleg",
  energy_certificate: "Energieausweis",
  protocol: "Protokoll",
  other: "Sonstiges",
  unknown: "Unbekannt",
} as const;

export const DOCUMENT_CATEGORIES = [
  { value: "rent_contract", label: "Mietvertrag" },
  { value: "handover_protocol", label: "Übergabeprotokoll" },
  { value: "invoice_repair", label: "Rechnung - Reparatur" },
  { value: "invoice_insurance", label: "Rechnung - Versicherung" },
  { value: "invoice_utilities", label: "Rechnung - Nebenkosten" },
  { value: "tax_document", label: "Steuerdokument" },
  { value: "correspondence", label: "Korrespondenz" },
  { value: "energy_certificate", label: "Energieausweis" },
  { value: "other", label: "Sonstiges" },
];

export interface Document {
  id: string;
  organization_id: string;
  title: string;
  document_type: string;
  file_url: string;
  file_size: number | null;
  building_id: string | null;
  tenant_id: string | null;
  lease_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  buildings?: { id: string; name: string } | null;
  tenants?: { id: string; first_name: string; last_name: string } | null;
  ocr_result?: DocumentOCRResult | null;
}

export interface DocumentOCRResult {
  id: string;
  document_id: string;
  organization_id: string;
  raw_text: string | null;
  detected_type: keyof typeof DOCUMENT_TYPES;
  confidence_score: number;
  extracted_data: {
    date?: string;
    sender?: string;
    recipient?: string;
    amounts?: { value: number; description?: string }[];
    reference_numbers?: string[];
    subject?: string;
  };
  suggested_building_id: string | null;
  suggested_unit_id: string | null;
  suggested_category: string | null;
  user_feedback: "correct" | "incorrect" | null;
  processed_at: string;
}

export interface UploadDocumentInput {
  file: File;
  title: string;
  document_type?: string;
  building_id?: string;
  tenant_id?: string;
  notes?: string;
}

export interface AnalysisResult {
  date: string | null;
  amount: number | null;
  category: string;
  sender: string | null;
  description: string;
  detected_type: keyof typeof DOCUMENT_TYPES;
  confidence: number;
}

export function useDocuments() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const organizationId = profile?.organization_id;

  // Fetch all documents with OCR results
  const {
    data: documents = [],
    isLoading: documentsLoading,
    error: documentsError,
  } = useQuery({
    queryKey: ["documents", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from("documents")
        .select(`
          *,
          buildings(id, name),
          tenants(id, first_name, last_name)
        `)
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      
      // Fetch OCR results for each document
      const documentIds = data.map(d => d.id);
      const { data: ocrResults } = await supabase
        .from("document_ocr_results")
        .select("*")
        .in("document_id", documentIds);
      
      // Map OCR results to documents
      return data.map(doc => ({
        ...doc,
        ocr_result: ocrResults?.find(ocr => ocr.document_id === doc.id) || null,
      })) as Document[];
    },
    enabled: !!organizationId,
  });

  // Upload and process document
  const uploadDocument = useMutation({
    mutationFn: async (input: UploadDocumentInput) => {
      if (!organizationId) throw new Error("Keine Organisation");

      // 1. Upload file to storage
      const fileExt = input.file.name.split('.').pop();
      const fileName = `${organizationId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, input.file);
      
      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(fileName);

      // 3. Create document record
      const docType = (input.document_type || "other") as "contract" | "correspondence" | "insurance" | "invoice" | "other" | "protocol" | "tax";
      const { data: doc, error: docError } = await supabase
        .from("documents")
        .insert({
          organization_id: organizationId,
          title: input.title,
          document_type: docType,
          file_url: urlData.publicUrl,
          file_size: input.file.size,
          building_id: input.building_id || null,
          tenant_id: input.tenant_id || null,
          notes: input.notes || null,
        })
        .select()
        .single();
      
      if (docError) throw docError;

      return doc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({ title: "Dokument hochgeladen" });
    },
    onError: (error) => {
      toast({ title: "Fehler beim Upload", description: error.message, variant: "destructive" });
    },
  });

  // Analyze document with AI
  const analyzeDocument = useMutation({
    mutationFn: async ({ documentId, imageUrl }: { documentId: string; imageUrl?: string }) => {
      const response = await supabase.functions.invoke("analyze-document", {
        body: { imageUrl },
      });

      if (response.error) throw new Error(response.error.message);
      if (!response.data?.success) throw new Error(response.data?.error || "Analyse fehlgeschlagen");

      const analysisData = response.data.data as AnalysisResult;

      // Map the analysis result to our detected_type
      const detectedType = analysisData.category as keyof typeof DOCUMENT_TYPES;

      // Save OCR result
      const { data: ocrResult, error: ocrError } = await supabase
        .from("document_ocr_results")
        .insert({
          document_id: documentId,
          organization_id: organizationId,
          detected_type: detectedType || "unknown",
          confidence_score: analysisData.confidence || 0,
          extracted_data: {
            date: analysisData.date,
            sender: analysisData.sender,
            amounts: analysisData.amount ? [{ value: analysisData.amount }] : [],
            subject: analysisData.description,
          },
          suggested_category: analysisData.category,
        })
        .select()
        .single();

      if (ocrError) throw ocrError;

      return { analysis: analysisData, ocrResult };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (error) => {
      toast({ title: "Analyse fehlgeschlagen", description: error.message, variant: "destructive" });
    },
  });

  // Update OCR result with user corrections
  const updateOCRResult = useMutation({
    mutationFn: async ({
      ocrId,
      updates,
    }: {
      ocrId: string;
      updates: Partial<DocumentOCRResult>;
    }) => {
      const { data, error } = await supabase
        .from("document_ocr_results")
        .update(updates)
        .eq("id", ocrId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({ title: "Änderungen gespeichert" });
    },
  });

  // Provide feedback on OCR result
  const provideFeedback = useMutation({
    mutationFn: async ({
      ocrId,
      feedback,
    }: {
      ocrId: string;
      feedback: "correct" | "incorrect";
    }) => {
      const { error } = await supabase
        .from("document_ocr_results")
        .update({ user_feedback: feedback })
        .eq("id", ocrId);
      if (error) throw error;
    },
    onSuccess: (_, { feedback }) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({
        title: feedback === "correct" ? "Danke für Ihr Feedback!" : "Feedback gespeichert",
        description: feedback === "correct" ? "Dies hilft uns, die Erkennung zu verbessern." : "",
      });
    },
  });

  // Update document
  const updateDocument = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: { title?: string; building_id?: string | null; tenant_id?: string | null; notes?: string | null };
    }) => {
      const { data, error } = await supabase
        .from("documents")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({ title: "Dokument aktualisiert" });
    },
  });

  // Delete document
  const deleteDocument = useMutation({
    mutationFn: async (id: string) => {
      // Get file URL to delete from storage
      const doc = documents.find((d) => d.id === id);
      if (doc?.file_url) {
        const path = doc.file_url.split("/documents/")[1];
        if (path) {
          await supabase.storage.from("documents").remove([path]);
        }
      }
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({ title: "Dokument gelöscht" });
    },
  });

  // Search documents by text
  const searchDocuments = (searchTerm: string) => {
    if (!searchTerm.trim()) return documents;
    const term = searchTerm.toLowerCase();
    return documents.filter((doc) => {
      const matchesTitle = doc.title.toLowerCase().includes(term);
      const matchesOCR = doc.ocr_result?.raw_text?.toLowerCase().includes(term);
      const matchesSender = doc.ocr_result?.extracted_data?.sender?.toLowerCase().includes(term);
      return matchesTitle || matchesOCR || matchesSender;
    });
  };

  // Stats
  const stats = {
    total: documents.length,
    byType: Object.entries(DOCUMENT_TYPES).map(([key, label]) => ({
      type: key,
      label,
      count: documents.filter((d) => d.ocr_result?.detected_type === key).length,
    })),
    processed: documents.filter((d) => d.ocr_result).length,
    unprocessed: documents.filter((d) => !d.ocr_result).length,
  };

  return {
    documents,
    documentsLoading,
    documentsError,
    stats,
    uploadDocument,
    analyzeDocument,
    updateOCRResult,
    provideFeedback,
    updateDocument,
    deleteDocument,
    searchDocuments,
  };
}
