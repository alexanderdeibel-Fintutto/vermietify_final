import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
 import type { TaskFormData, TaskStatus, TaskCategory, TaskPriority, TaskSource } from "@/types/database";
import type { Database } from "@/integrations/supabase/types";

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];

const TASKS_KEY = "tasks";

interface TaskFilters {
  status?: TaskStatus | TaskStatus[];
  priority?: string;
  buildingId?: string;
  unitId?: string;
   category?: TaskCategory;
   source?: TaskSource;
}

export interface TaskComment {
  id: string;
  task_id: string;
  content: string;
  created_by: string;
  created_at: string;
}

export function useTasks() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile, user } = useAuth();

  // Fetch all tasks with optional filters
  const useTasksList = (filters?: TaskFilters) => {
    return useQuery({
      queryKey: [TASKS_KEY, "list", filters],
      queryFn: async () => {
        let query = supabase
          .from("tasks")
          .select(`
            *,
            buildings(id, name),
            units(id, unit_number)
          `)
          .order("created_at", { ascending: false });

         if (filters?.status) {
           if (Array.isArray(filters.status)) {
             query = query.in("status", filters.status);
           } else {
             query = query.eq("status", filters.status);
           }
        }

        if (filters?.priority) {
          query = query.eq("priority", filters.priority);
        }

        if (filters?.buildingId) {
          query = query.eq("building_id", filters.buildingId);
        }

        if (filters?.unitId) {
          query = query.eq("unit_id", filters.unitId);
        }
 
         if (filters?.category) {
           query = query.eq("category", filters.category);
         }
 
         if (filters?.source) {
           query = query.eq("source", filters.source);
         }

        const { data, error } = await query;

        if (error) throw error;
        return data;
      },
      enabled: !!profile?.organization_id,
    });
  };

  // Fetch single task with attachments
  const useTask = (id: string | undefined) => {
    return useQuery({
      queryKey: [TASKS_KEY, "detail", id],
      queryFn: async () => {
        if (!id) throw new Error("Task ID required");

        const { data: task, error: taskError } = await supabase
          .from("tasks")
          .select(`
            *,
            buildings(id, name, address),
            units(id, unit_number)
          `)
          .eq("id", id)
          .maybeSingle();

        if (taskError) throw taskError;
        if (!task) throw new Error("Task not found");

        return {
          ...task,
          attachments: [],
          building: task.buildings,
          unit: task.units,
        };
      },
      enabled: !!id,
    });
  };

  // Create task mutation
  const createTask = useMutation({
    mutationFn: async (data: TaskFormData) => {
      if (!profile?.organization_id) {
        throw new Error("No organization found");
      }

       // Use raw insert since auto-generated types may not have new columns yet
       const insertData: Record<string, any> = {
        organization_id: profile.organization_id,
        building_id: data.building_id || null,
        unit_id: data.unit_id || null,
        title: data.title,
        description: data.description,
         priority: data.priority || 'normal',
         category: data.category || 'other',
         status: data.status || 'open',
         source: data.source || 'landlord',
         assigned_to: data.assigned_to || null,
         created_by: user?.id || null,
        due_date: data.due_date,
         is_completed: data.status === 'completed' ? true : false,
      };

      const { data: task, error } = await supabase
        .from("tasks")
         .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;
      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY] });
      toast({
        title: "Aufgabe erstellt",
        description: "Die Aufgabe wurde erfolgreich angelegt.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message || "Die Aufgabe konnte nicht erstellt werden.",
        variant: "destructive",
      });
    },
  });

  // Update task mutation
  const updateTask = useMutation({
     mutationFn: async ({ id, data }: { id: string; data: Partial<TaskFormData & { is_completed?: boolean }> }) => {
       // Use raw update since auto-generated types may not have new columns yet
       const updateData: Record<string, any> = {};
      
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.due_date !== undefined) updateData.due_date = data.due_date;
      if (data.building_id !== undefined) updateData.building_id = data.building_id;
      if (data.unit_id !== undefined) updateData.unit_id = data.unit_id;
      if (data.is_completed !== undefined) updateData.is_completed = data.is_completed;
       if (data.category !== undefined) updateData.category = data.category;
       if (data.status !== undefined) updateData.status = data.status;
       if (data.source !== undefined) updateData.source = data.source;
       if (data.assigned_to !== undefined) updateData.assigned_to = data.assigned_to;

      const { data: task, error } = await supabase
        .from("tasks")
         .update(updateData as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return task;
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: [TASKS_KEY, "detail", id] });
      const previousTask = queryClient.getQueryData([TASKS_KEY, "detail", id]);
      return { previousTask };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY] });
      toast({
        title: "Aufgabe aktualisiert",
        description: "Die Änderungen wurden gespeichert.",
      });
    },
    onError: (error: Error, { id }, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData([TASKS_KEY, "detail", id], context.previousTask);
      }
      toast({
        title: "Fehler",
        description: error.message || "Die Änderungen konnten nicht gespeichert werden.",
        variant: "destructive",
      });
    },
  });

  // Complete task mutation (shorthand)
  const completeTask = useMutation({
    mutationFn: async (id: string) => {
      const { data: task, error } = await supabase
        .from("tasks")
         .update({ status: 'completed', is_completed: true } as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY] });
      toast({
        title: "Aufgabe erledigt",
        description: "Die Aufgabe wurde als erledigt markiert.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message || "Status konnte nicht geändert werden.",
        variant: "destructive",
      });
    },
  });

  // Delete task mutation
  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY] });
      toast({
        title: "Aufgabe gelöscht",
        description: "Die Aufgabe wurde erfolgreich gelöscht.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message || "Die Aufgabe konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
  });

  // Add comment to task (placeholder)
  const addComment = useMutation({
    mutationFn: async ({ taskId, content }: { taskId: string; content: string }) => {
      toast({
        title: "Info",
        description: "Kommentar-Funktion wird in einer zukünftigen Version verfügbar sein.",
      });
      return null;
    },
  });

  // Add attachment to task (placeholder)
  const addAttachment = useMutation({
    mutationFn: async ({ taskId, file }: { taskId: string; file: File }) => {
      toast({
        title: "Info",
        description: "Anhang-Funktion wird in einer zukünftigen Version verfügbar sein.",
      });
      return null;
    },
  });

  return {
    useTasksList,
    useTask,
    createTask,
    updateTask,
    completeTask,
    deleteTask,
    addComment,
    addAttachment,
  };
}
