import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/DataTable";
import { 
  Zap, 
  Play, 
  History, 
  FileText,
  Plus,
  Pause,
  Trash2,
  Copy,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  useWorkflows, 
  TRIGGER_TYPES, 
  ACTION_TYPES, 
  EXECUTION_STATUS_LABELS 
} from "@/hooks/useWorkflows";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import type { Database } from "@/integrations/supabase/types";
import type { ColumnDef } from "@tanstack/react-table";

type WorkflowRow = Database["public"]["Tables"]["workflows"]["Row"];
type WorkflowExecutionStatus = Database["public"]["Enums"]["workflow_execution_status"];

export default function AutomationDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("workflows");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const {
    useUserWorkflows,
    useWorkflowTemplates,
    useExecutionsList,
    useWorkflowStats,
    toggleWorkflowStatus,
    deleteWorkflow,
    duplicateWorkflow,
    createFromTemplate,
  } = useWorkflows();

  const { data: workflows, isLoading: workflowsLoading } = useUserWorkflows();
  const { data: templates } = useWorkflowTemplates();
  const { data: executions, isLoading: executionsLoading } = useExecutionsList();
  const { data: stats } = useWorkflowStats();

  // Filter workflows
  const filteredWorkflows = workflows?.filter(workflow => {
    if (statusFilter === "all") return true;
    if (statusFilter === "active") return workflow.is_active;
    if (statusFilter === "paused") return !workflow.is_active;
    return true;
  });

  const handleNewWorkflow = () => {
    navigate("/automatisierung/neu");
  };

  const handleEditWorkflow = (id: string) => {
    navigate(`/automatisierung/${id}`);
  };

  // Workflow columns
  const workflowColumns: ColumnDef<WorkflowRow>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          {row.original.description && (
            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
              {row.original.description}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "trigger_type",
      header: "Trigger",
      cell: ({ row }) => {
        const trigger = TRIGGER_TYPES[row.original.trigger_type];
        return (
          <div className="flex items-center gap-2">
            <span>{trigger.icon}</span>
            <span className="text-sm">{trigger.label}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "actions",
      header: "Aktionen",
      cell: ({ row }) => {
        const actions = (row.original.actions as any[]) || [];
        return (
          <div className="flex gap-1">
            {actions.slice(0, 3).map((action, i) => {
              const actionType = ACTION_TYPES[action.type as keyof typeof ACTION_TYPES];
              return (
                <span key={i} title={actionType?.label}>
                  {actionType?.icon || "❓"}
                </span>
              );
            })}
            {actions.length > 3 && (
              <Badge variant="outline">+{actions.length - 3}</Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? "default" : "secondary"}>
          {row.original.is_active ? "Aktiv" : "Pausiert"}
        </Badge>
      ),
    },
    {
      accessorKey: "last_executed_at",
      header: "Letzte Ausführung",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.last_executed_at
            ? format(new Date(row.original.last_executed_at), "dd.MM.yyyy HH:mm", { locale: de })
            : "Nie"}
        </span>
      ),
    },
    {
      accessorKey: "execution_count",
      header: "Ausführungen",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.execution_count}</Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const workflow = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEditWorkflow(workflow.id)}>
                Bearbeiten
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleWorkflowStatus.mutateAsync(workflow.id)}>
                {workflow.is_active ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pausieren
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Aktivieren
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => duplicateWorkflow.mutateAsync(workflow.id)}>
                <Copy className="h-4 w-4 mr-2" />
                Duplizieren
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  if (confirm("Möchten Sie diesen Workflow wirklich löschen?")) {
                    deleteWorkflow.mutateAsync(workflow.id);
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Löschen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Execution columns
  const executionColumns: ColumnDef<any>[] = [
    {
      accessorKey: "workflows.name",
      header: "Workflow",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.workflows?.name}</span>
      ),
    },
    {
      accessorKey: "triggered_at",
      header: "Trigger-Zeit",
      cell: ({ row }) => (
        <span className="text-sm">
          {format(new Date(row.original.triggered_at), "dd.MM.yyyy HH:mm:ss", { locale: de })}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status as WorkflowExecutionStatus;
        const statusInfo = EXECUTION_STATUS_LABELS[status];
        return (
          <div className="flex items-center gap-2">
            {status === "running" && <Clock className="h-4 w-4 text-primary animate-spin" />}
            {status === "completed" && <CheckCircle className="h-4 w-4 text-success" />}
            {status === "failed" && <XCircle className="h-4 w-4 text-destructive" />}
            <span>{statusInfo.label}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "duration_ms",
      header: "Dauer",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.duration_ms ? `${row.original.duration_ms}ms` : "-"}
        </span>
      ),
    },
    {
      accessorKey: "error_message",
      header: "Fehler",
      cell: ({ row }) => (
        <span className="text-sm text-destructive truncate max-w-[200px]">
          {row.original.error_message || "-"}
        </span>
      ),
    },
  ];

  // Group templates by category
  const templatesByCategory = templates?.reduce((acc, template) => {
    const category = template.template_category || "Sonstige";
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {} as Record<string, WorkflowRow[]>) || {};

  const categoryLabels: Record<string, string> = {
    payment: "Zahlungen",
    tenant: "Mieter",
    billing: "Abrechnung",
    contract: "Verträge",
    meter: "Zähler",
    Sonstige: "Sonstige",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automatisierung"
        subtitle="Erstellen und verwalten Sie automatisierte Workflows"
        actions={
          <Button onClick={handleNewWorkflow}>
            <Plus className="h-4 w-4 mr-2" />
            Neuer Workflow
          </Button>
        }
      />

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Aktive Workflows"
          value={stats?.activeWorkflows || 0}
          icon={Zap}
        />
        <StatCard
          title="Ausgeführt heute"
          value={stats?.executionsToday || 0}
          icon={Play}
        />
        <StatCard
          title="Fehler heute"
          value={stats?.failedToday || 0}
          icon={AlertTriangle}
          trend={stats?.failedToday && stats.failedToday > 0 
            ? { value: stats.failedToday, isPositive: false } 
            : undefined
          }
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="workflows">
            <Zap className="h-4 w-4 mr-2" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="executions">
            <History className="h-4 w-4 mr-2" />
            Ausführungen
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="h-4 w-4 mr-2" />
            Vorlagen
          </TabsTrigger>
        </TabsList>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <div className="flex justify-end">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="paused">Pausiert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {workflowsLoading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">Laden...</p>
            </div>
          ) : (
            <DataTable
              columns={workflowColumns}
              data={filteredWorkflows || []}
            />
          )}
        </TabsContent>

        {/* Executions Tab */}
        <TabsContent value="executions" className="space-y-4">
          {executionsLoading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">Laden...</p>
            </div>
          ) : (
            <DataTable
              columns={executionColumns}
              data={executions || []}
            />
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
            <div key={category} className="space-y-3">
              <h3 className="text-lg font-semibold">{categoryLabels[category] || category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryTemplates.map((template) => {
                  const trigger = TRIGGER_TYPES[template.trigger_type];
                  const actions = (template.actions as any[]) || [];
                  
                  return (
                    <Card key={template.id} className="hover:border-primary/50 transition-colors">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            <CardDescription className="text-sm mt-1">
                              {template.description}
                            </CardDescription>
                          </div>
                          <span className="text-xl">{trigger.icon}</span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Trigger:</span>
                            <Badge variant="outline">{trigger.label}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Aktionen:</span>
                            <div className="flex gap-1">
                              {actions.map((action, i) => {
                                const actionType = ACTION_TYPES[action.type as keyof typeof ACTION_TYPES];
                                return (
                                  <span key={i} title={actionType?.label}>
                                    {actionType?.icon || "❓"}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                          <Button
                            className="w-full mt-2"
                            variant="outline"
                            onClick={() => createFromTemplate.mutateAsync(template.id)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Vorlage verwenden
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
