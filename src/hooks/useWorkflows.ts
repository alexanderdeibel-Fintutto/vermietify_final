import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

type WorkflowRow = Database["public"]["Tables"]["workflows"]["Row"];
type WorkflowInsert = Database["public"]["Tables"]["workflows"]["Insert"];
type WorkflowUpdate = Database["public"]["Tables"]["workflows"]["Update"];
type WorkflowExecutionRow = Database["public"]["Tables"]["workflow_executions"]["Row"];

type WorkflowTriggerType = Database["public"]["Enums"]["workflow_trigger_type"];
type WorkflowActionType = Database["public"]["Enums"]["workflow_action_type"];
type WorkflowExecutionStatus = Database["public"]["Enums"]["workflow_execution_status"];

const WORKFLOWS_KEY = "workflows";
const EXECUTIONS_KEY = "workflow_executions";

// Trigger type labels and categories
export const TRIGGER_TYPES: Record<WorkflowTriggerType, { label: string; category: string; icon: string }> = {
  time_daily: { label: "Täglich", category: "Zeitbasiert", icon: "⏰" },
  time_weekly: { label: "Wöchentlich", category: "Zeitbasiert", icon: "📅" },
  time_monthly: { label: "Monatlich", category: "Zeitbasiert", icon: "📆" },
  time_yearly: { label: "Jährlich", category: "Zeitbasiert", icon: "🗓️" },
  event_tenant_created: { label: "Neuer Mieter angelegt", category: "Ereignisbasiert", icon: "👤" },
  event_contract_created: { label: "Vertrag erstellt", category: "Ereignisbasiert", icon: "📝" },
  event_contract_terminated: { label: "Vertrag gekündigt", category: "Ereignisbasiert", icon: "🚪" },
  event_payment_overdue: { label: "Zahlung überfällig", category: "Ereignisbasiert", icon: "⚠️" },
  event_payment_received: { label: "Zahlung eingegangen", category: "Ereignisbasiert", icon: "💰" },
  event_meter_reading_due: { label: "Zählerablesung fällig", category: "Ereignisbasiert", icon: "📊" },
  event_document_uploaded: { label: "Dokument hochgeladen", category: "Ereignisbasiert", icon: "📄" },
  event_task_created: { label: "Task erstellt", category: "Ereignisbasiert", icon: "✅" },
  event_contract_ending: { label: "Mietvertrag endet bald", category: "Ereignisbasiert", icon: "📋" },
  event_building_created: { label: "Gebäude erstellt", category: "Ereignisbasiert", icon: "🏢" },
  event_unit_created: { label: "Einheit erstellt", category: "Ereignisbasiert", icon: "🏠" },
};

// Action type labels
export const ACTION_TYPES: Record<WorkflowActionType, { label: string; icon: string; description: string }> = {
  send_email: { label: "E-Mail senden", icon: "📧", description: "Sendet eine E-Mail an den ausgewählten Empfänger" },
  create_notification: { label: "Benachrichtigung erstellen", icon: "🔔", description: "Erstellt eine In-App-Benachrichtigung" },
  create_task: { label: "Task erstellen", icon: "✅", description: "Erstellt eine neue Aufgabe" },
  send_letter: { label: "Brief senden", icon: "✉️", description: "Sendet einen Brief über LetterXpress" },
  send_whatsapp: { label: "WhatsApp senden", icon: "💬", description: "Sendet eine WhatsApp-Nachricht" },
  update_field: { label: "Feld aktualisieren", icon: "✏️", description: "Aktualisiert ein Datenfeld" },
  call_webhook: { label: "Webhook aufrufen", icon: "🔗", description: "Ruft einen externen Webhook auf" },
  wait: { label: "Warten", icon: "⏳", description: "Wartet eine bestimmte Zeit bevor es weitergeht" },
};

// Execution status labels
export const EXECUTION_STATUS_LABELS: Record<WorkflowExecutionStatus, { label: string; color: string }> = {
  running: { label: "Läuft", color: "bg-blue-500" },
  completed: { label: "Abgeschlossen", color: "bg-green-500" },
  failed: { label: "Fehlgeschlagen", color: "bg-destructive" },
};

export interface WorkflowFormData {
  name: string;
  description?: string;
  trigger_type: WorkflowTriggerType;
  trigger_config: Record<string, any>;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  is_active?: boolean;
}

export interface WorkflowCondition {
  id: string;
  field: string;
  operator: "equals" | "not_equals" | "greater_than" | "less_than" | "contains" | "in";
  value: any;
  connector?: "AND" | "OR";
}

export interface WorkflowAction {
  id: string;
  type: WorkflowActionType;
  config: Record<string, any>;
}

export function useWorkflows() {
  const { toast } = useToast();
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;
  const queryClient = useQueryClient();

  // Fetch all workflows
  const useWorkflowsList = (includeTemplates = true) => {
    return useQuery({
      queryKey: [WORKFLOWS_KEY, "list", organizationId, includeTemplates],
      queryFn: async () => {
        if (!organizationId) return [];

        let query = supabase
          .from("workflows")
          .select("*")
          .order("created_at", { ascending: false });

        if (includeTemplates) {
          query = query.or(`organization_id.eq.${organizationId},is_template.eq.true`);
        } else {
          query = query.eq("organization_id", organizationId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as WorkflowRow[];
      },
      enabled: !!organizationId,
    });
  };

  // Fetch user workflows only (no templates)
  const useUserWorkflows = () => {
    return useQuery({
      queryKey: [WORKFLOWS_KEY, "user", organizationId],
      queryFn: async () => {
        if (!organizationId) return [];

        const { data, error } = await supabase
          .from("workflows")
          .select("*")
          .eq("organization_id", organizationId)
          .eq("is_template", false)
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data as WorkflowRow[];
      },
      enabled: !!organizationId,
    });
  };

  // Fetch templates only
  const useWorkflowTemplates = () => {
    return useQuery({
      queryKey: [WORKFLOWS_KEY, "templates"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("workflows")
          .select("*")
          .eq("is_template", true)
          .order("template_category", { ascending: true });

        if (error) throw error;
        return data as WorkflowRow[];
      },
    });
  };

  // Fetch single workflow
  const useWorkflow = (id: string | undefined) => {
    return useQuery({
      queryKey: [WORKFLOWS_KEY, "detail", id],
      queryFn: async () => {
        if (!id) throw new Error("Workflow ID required");

        const { data, error } = await supabase
          .from("workflows")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        return data as WorkflowRow;
      },
      enabled: !!id,
    });
  };

  // Create workflow
  const createWorkflow = useMutation({
    mutationFn: async (data: WorkflowFormData) => {
      if (!organizationId) throw new Error("Organization required");

      const insertData: WorkflowInsert = {
        organization_id: organizationId,
        name: data.name,
        description: data.description,
        trigger_type: data.trigger_type,
        trigger_config: data.trigger_config,
        conditions: data.conditions as unknown as any[],
        actions: data.actions as unknown as any[],
        is_active: data.is_active ?? false,
        is_template: false,
      };

      const { data: workflow, error } = await supabase
        .from("workflows")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return workflow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WORKFLOWS_KEY] });
      toast({
        title: "Workflow erstellt",
        description: "Der Workflow wurde erfolgreich angelegt.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message || "Der Workflow konnte nicht erstellt werden.",
        variant: "destructive",
      });
    },
  });

  // Update workflow
  const updateWorkflow = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<WorkflowFormData> }) => {
      const updateData: WorkflowUpdate = {};

      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.trigger_type !== undefined) updateData.trigger_type = data.trigger_type;
      if (data.trigger_config !== undefined) updateData.trigger_config = data.trigger_config;
      if (data.conditions !== undefined) updateData.conditions = data.conditions as unknown as any[];
      if (data.actions !== undefined) updateData.actions = data.actions as unknown as any[];
      if (data.is_active !== undefined) updateData.is_active = data.is_active;

      const { data: workflow, error } = await supabase
        .from("workflows")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return workflow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WORKFLOWS_KEY] });
      toast({
        title: "Workflow aktualisiert",
        description: "Die Änderungen wurden gespeichert.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message || "Die Änderungen konnten nicht gespeichert werden.",
        variant: "destructive",
      });
    },
  });

  // Delete workflow
  const deleteWorkflow = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workflows").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WORKFLOWS_KEY] });
      toast({
        title: "Workflow gelöscht",
        description: "Der Workflow wurde erfolgreich gelöscht.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message || "Der Workflow konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
  });

  // Toggle workflow active status
  const toggleWorkflowStatus = useMutation({
    mutationFn: async (id: string) => {
      // Get current status
      const { data: workflow, error: fetchError } = await supabase
        .from("workflows")
        .select("is_active")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from("workflows")
        .update({ is_active: !workflow.is_active })
        .eq("id", id);

      if (error) throw error;
      return !workflow.is_active;
    },
    onSuccess: (newStatus) => {
      queryClient.invalidateQueries({ queryKey: [WORKFLOWS_KEY] });
      toast({
        title: newStatus ? "Workflow aktiviert" : "Workflow pausiert",
        description: newStatus
          ? "Der Workflow wird jetzt ausgeführt."
          : "Der Workflow wurde pausiert.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message || "Der Status konnte nicht geändert werden.",
        variant: "destructive",
      });
    },
  });

  // Create workflow from template
  const createFromTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      if (!organizationId) throw new Error("Organization required");

      // Get template
      const { data: template, error: fetchError } = await supabase
        .from("workflows")
        .select("*")
        .eq("id", templateId)
        .eq("is_template", true)
        .single();

      if (fetchError) throw fetchError;

      // Create new workflow from template
      const { data: workflow, error } = await supabase
        .from("workflows")
        .insert({
          organization_id: organizationId,
          name: template.name,
          description: template.description,
          trigger_type: template.trigger_type,
          trigger_config: template.trigger_config,
          conditions: template.conditions,
          actions: template.actions,
          is_active: false,
          is_template: false,
        })
        .select()
        .single();

      if (error) throw error;
      return workflow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WORKFLOWS_KEY] });
      toast({
        title: "Workflow erstellt",
        description: "Der Workflow wurde aus der Vorlage erstellt.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message || "Der Workflow konnte nicht erstellt werden.",
        variant: "destructive",
      });
    },
  });

  // Duplicate workflow
  const duplicateWorkflow = useMutation({
    mutationFn: async (id: string) => {
      if (!organizationId) throw new Error("Organization required");

      // Get original workflow
      const { data: original, error: fetchError } = await supabase
        .from("workflows")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      // Create duplicate
      const { data: workflow, error } = await supabase
        .from("workflows")
        .insert({
          organization_id: organizationId,
          name: `${original.name} (Kopie)`,
          description: original.description,
          trigger_type: original.trigger_type,
          trigger_config: original.trigger_config,
          conditions: original.conditions,
          actions: original.actions,
          is_active: false,
          is_template: false,
        })
        .select()
        .single();

      if (error) throw error;
      return workflow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WORKFLOWS_KEY] });
      toast({
        title: "Workflow dupliziert",
        description: "Eine Kopie wurde erstellt.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message || "Der Workflow konnte nicht dupliziert werden.",
        variant: "destructive",
      });
    },
  });

  // Fetch executions
  const useExecutionsList = (workflowId?: string, status?: WorkflowExecutionStatus) => {
    return useQuery({
      queryKey: [EXECUTIONS_KEY, "list", organizationId, workflowId, status],
      queryFn: async () => {
        if (!organizationId) return [];

        let query = supabase
          .from("workflow_executions")
          .select(`
            *,
            workflows!inner(name)
          `)
          .eq("organization_id", organizationId)
          .order("triggered_at", { ascending: false })
          .limit(100);

        if (workflowId) {
          query = query.eq("workflow_id", workflowId);
        }

        if (status) {
          query = query.eq("status", status);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
      },
      enabled: !!organizationId,
    });
  };

  // Get statistics
  const useWorkflowStats = () => {
    return useQuery({
      queryKey: [WORKFLOWS_KEY, "stats", organizationId],
      queryFn: async () => {
        if (!organizationId) return null;

        // Get active workflows count
        const { count: activeCount } = await supabase
          .from("workflows")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", organizationId)
          .eq("is_active", true);

        // Get today's executions
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { count: todayExecutions } = await supabase
          .from("workflow_executions")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", organizationId)
          .gte("triggered_at", today.toISOString());

        // Get failed executions today
        const { count: failedToday } = await supabase
          .from("workflow_executions")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", organizationId)
          .eq("status", "failed")
          .gte("triggered_at", today.toISOString());

        return {
          activeWorkflows: activeCount || 0,
          executionsToday: todayExecutions || 0,
          failedToday: failedToday || 0,
        };
      },
      enabled: !!organizationId,
    });
  };

  return {
    useWorkflowsList,
    useUserWorkflows,
    useWorkflowTemplates,
    useWorkflow,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    toggleWorkflowStatus,
    createFromTemplate,
    duplicateWorkflow,
    useExecutionsList,
    useWorkflowStats,
  };
}
