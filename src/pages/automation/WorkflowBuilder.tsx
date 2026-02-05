import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Zap, 
  Filter, 
  Play, 
  Plus, 
  Trash2, 
  ChevronRight,
  Save,
  TestTube,
  ArrowLeft,
  GripVertical
} from "lucide-react";
import { 
  useWorkflows, 
  TRIGGER_TYPES, 
  ACTION_TYPES, 
  WorkflowFormData,
  WorkflowCondition,
  WorkflowAction
} from "@/hooks/useWorkflows";
import { useBuildings } from "@/hooks/useBuildings";
import { useEmailTemplates } from "@/hooks/useEmailTemplates";
import type { Database } from "@/integrations/supabase/types";

type WorkflowTriggerType = Database["public"]["Enums"]["workflow_trigger_type"];
type WorkflowActionType = Database["public"]["Enums"]["workflow_action_type"];

const WEEKDAYS = [
  { value: "1", label: "Montag" },
  { value: "2", label: "Dienstag" },
  { value: "3", label: "Mittwoch" },
  { value: "4", label: "Donnerstag" },
  { value: "5", label: "Freitag" },
  { value: "6", label: "Samstag" },
  { value: "0", label: "Sonntag" },
];

const CONDITION_OPERATORS = [
  { value: "equals", label: "ist gleich" },
  { value: "not_equals", label: "ist ungleich" },
  { value: "greater_than", label: "größer als" },
  { value: "less_than", label: "kleiner als" },
  { value: "contains", label: "enthält" },
];

const CONDITION_FIELDS = [
  { value: "building_id", label: "Gebäude" },
  { value: "tenant_status", label: "Mieter-Status" },
  { value: "amount", label: "Betrag" },
  { value: "category", label: "Kategorie" },
];

export default function WorkflowBuilder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState<WorkflowFormData>({
    name: "",
    description: "",
    trigger_type: "event_tenant_created",
    trigger_config: {},
    conditions: [],
    actions: [],
    is_active: false,
  });

  const { useWorkflow, createWorkflow, updateWorkflow } = useWorkflows();
  const { data: existingWorkflow, isLoading: workflowLoading } = useWorkflow(id);
  const { useBuildingsList } = useBuildings();
  const { data: buildingsData } = useBuildingsList();
  const buildings = buildingsData?.buildings || [];
  const { templates: emailTemplates } = useEmailTemplates();

  // Load existing workflow data
  useEffect(() => {
    if (existingWorkflow) {
      setFormData({
        name: existingWorkflow.name,
        description: existingWorkflow.description || "",
        trigger_type: existingWorkflow.trigger_type,
        trigger_config: existingWorkflow.trigger_config as Record<string, any>,
        conditions: (existingWorkflow.conditions as unknown as WorkflowCondition[]) || [],
        actions: (existingWorkflow.actions as unknown as WorkflowAction[]) || [],
        is_active: existingWorkflow.is_active,
      });
    }
  }, [existingWorkflow]);

  const updateFormData = (updates: Partial<WorkflowFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const updateTriggerConfig = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      trigger_config: { ...prev.trigger_config, [key]: value },
    }));
  };

  // Conditions management
  const addCondition = () => {
    const newCondition: WorkflowCondition = {
      id: crypto.randomUUID(),
      field: "building_id",
      operator: "equals",
      value: "",
      connector: formData.conditions.length > 0 ? "AND" : undefined,
    };
    updateFormData({ conditions: [...formData.conditions, newCondition] });
  };

  const updateCondition = (id: string, updates: Partial<WorkflowCondition>) => {
    updateFormData({
      conditions: formData.conditions.map(c => 
        c.id === id ? { ...c, ...updates } : c
      ),
    });
  };

  const removeCondition = (id: string) => {
    updateFormData({
      conditions: formData.conditions.filter(c => c.id !== id),
    });
  };

  // Actions management
  const addAction = (type: WorkflowActionType) => {
    const newAction: WorkflowAction = {
      id: crypto.randomUUID(),
      type,
      config: {},
    };
    updateFormData({ actions: [...formData.actions, newAction] });
  };

  const updateAction = (id: string, updates: Partial<WorkflowAction>) => {
    updateFormData({
      actions: formData.actions.map(a => 
        a.id === id ? { ...a, ...updates } : a
      ),
    });
  };

  const updateActionConfig = (id: string, key: string, value: any) => {
    updateFormData({
      actions: formData.actions.map(a => 
        a.id === id ? { ...a, config: { ...a.config, [key]: value } } : a
      ),
    });
  };

  const removeAction = (id: string) => {
    updateFormData({
      actions: formData.actions.filter(a => a.id !== id),
    });
  };

  const handleSave = async (activate: boolean) => {
    const dataToSave = { ...formData, is_active: activate };
    
    if (isEditing && id) {
      await updateWorkflow.mutateAsync({ id, data: dataToSave });
    } else {
      await createWorkflow.mutateAsync(dataToSave);
    }
    
    navigate("/automatisierung");
  };

  // Group triggers by category
  const triggersByCategory = Object.entries(TRIGGER_TYPES).reduce((acc, [key, value]) => {
    if (!acc[value.category]) acc[value.category] = [];
    acc[value.category].push({ key: key as WorkflowTriggerType, ...value });
    return acc;
  }, {} as Record<string, Array<{ key: WorkflowTriggerType; label: string; category: string; icon: string }>>);

  const renderTriggerConfig = () => {
    switch (formData.trigger_type) {
      case "time_daily":
        return (
          <div className="space-y-2">
            <Label>Uhrzeit</Label>
            <Input
              type="time"
              value={formData.trigger_config.time || "09:00"}
              onChange={(e) => updateTriggerConfig("time", e.target.value)}
            />
          </div>
        );
      case "time_weekly":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Wochentag</Label>
              <Select
                value={formData.trigger_config.weekday || "1"}
                onValueChange={(v) => updateTriggerConfig("weekday", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEKDAYS.map(day => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Uhrzeit</Label>
              <Input
                type="time"
                value={formData.trigger_config.time || "09:00"}
                onChange={(e) => updateTriggerConfig("time", e.target.value)}
              />
            </div>
          </div>
        );
      case "time_monthly":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tag des Monats</Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={formData.trigger_config.day || 1}
                onChange={(e) => updateTriggerConfig("day", parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Uhrzeit</Label>
              <Input
                type="time"
                value={formData.trigger_config.time || "09:00"}
                onChange={(e) => updateTriggerConfig("time", e.target.value)}
              />
            </div>
          </div>
        );
      case "time_yearly":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monat</Label>
                <Input
                  type="number"
                  min="1"
                  max="12"
                  value={formData.trigger_config.month || 1}
                  onChange={(e) => updateTriggerConfig("month", parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Tag</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.trigger_config.day || 1}
                  onChange={(e) => updateTriggerConfig("day", parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>
        );
      case "event_payment_overdue":
        return (
          <div className="space-y-2">
            <Label>Tage überfällig</Label>
            <Input
              type="number"
              min="1"
              value={formData.trigger_config.days_overdue || 7}
              onChange={(e) => updateTriggerConfig("days_overdue", parseInt(e.target.value))}
            />
          </div>
        );
      case "event_contract_ending":
        return (
          <div className="space-y-2">
            <Label>Tage vor Vertragsende</Label>
            <Input
              type="number"
              min="1"
              value={formData.trigger_config.days_before || 90}
              onChange={(e) => updateTriggerConfig("days_before", parseInt(e.target.value))}
            />
          </div>
        );
      default:
        return (
          <p className="text-sm text-muted-foreground">
            Keine zusätzliche Konfiguration erforderlich
          </p>
        );
    }
  };

  const renderActionConfig = (action: WorkflowAction) => {
    switch (action.type) {
      case "send_email":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Empfänger</Label>
              <Select
                value={action.config.recipient || "tenant"}
                onValueChange={(v) => updateActionConfig(action.id, "recipient", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tenant">Auslösender Mieter</SelectItem>
                  <SelectItem value="landlord">Vermieter</SelectItem>
                  <SelectItem value="custom">Benutzerdefiniert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {action.config.recipient === "custom" && (
              <div className="space-y-2">
                <Label>E-Mail-Adresse</Label>
                <Input
                  type="email"
                  value={action.config.email || ""}
                  onChange={(e) => updateActionConfig(action.id, "email", e.target.value)}
                  placeholder="beispiel@domain.de"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>E-Mail-Vorlage</Label>
              <Select
                value={action.config.template || ""}
                onValueChange={(v) => updateActionConfig(action.id, "template", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vorlage wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {emailTemplates?.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case "create_notification":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titel</Label>
              <Input
                value={action.config.title || ""}
                onChange={(e) => updateActionConfig(action.id, "title", e.target.value)}
                placeholder="Benachrichtigungstitel"
              />
            </div>
            <div className="space-y-2">
              <Label>Nachricht</Label>
              <Textarea
                value={action.config.message || ""}
                onChange={(e) => updateActionConfig(action.id, "message", e.target.value)}
                placeholder="Benachrichtigungstext"
                rows={3}
              />
            </div>
          </div>
        );
      case "create_task":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Aufgabentitel</Label>
              <Input
                value={action.config.title || ""}
                onChange={(e) => updateActionConfig(action.id, "title", e.target.value)}
                placeholder="Titel der Aufgabe"
              />
            </div>
            <div className="space-y-2">
              <Label>Beschreibung</Label>
              <Textarea
                value={action.config.description || ""}
                onChange={(e) => updateActionConfig(action.id, "description", e.target.value)}
                placeholder="Aufgabenbeschreibung"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Priorität</Label>
              <Select
                value={action.config.priority || "medium"}
                onValueChange={(v) => updateActionConfig(action.id, "priority", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Niedrig</SelectItem>
                  <SelectItem value="medium">Mittel</SelectItem>
                  <SelectItem value="high">Hoch</SelectItem>
                  <SelectItem value="urgent">Dringend</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case "wait":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Wartezeit</Label>
                <Input
                  type="number"
                  min="1"
                  value={action.config.duration || 1}
                  onChange={(e) => updateActionConfig(action.id, "duration", parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Einheit</Label>
                <Select
                  value={action.config.unit || "days"}
                  onValueChange={(v) => updateActionConfig(action.id, "unit", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Minuten</SelectItem>
                    <SelectItem value="hours">Stunden</SelectItem>
                    <SelectItem value="days">Tage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      case "call_webhook":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <Input
                type="url"
                value={action.config.url || ""}
                onChange={(e) => updateActionConfig(action.id, "url", e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>HTTP-Methode</Label>
              <Select
                value={action.config.method || "POST"}
                onValueChange={(v) => updateActionConfig(action.id, "method", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      default:
        return (
          <p className="text-sm text-muted-foreground">
            Konfiguration für diesen Aktionstyp folgt
          </p>
        );
    }
  };

  if (workflowLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Laden...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? "Workflow bearbeiten" : "Neuer Workflow"}
        subtitle="Erstellen Sie automatisierte Abläufe für Ihre Immobilienverwaltung"
        breadcrumbs={[
          { label: "Automatisierung", href: "/automatisierung" },
          { label: isEditing ? "Bearbeiten" : "Neu" },
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate("/automatisierung")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
        }
      />

      {/* Workflow Name */}
      <Card>
        <CardHeader>
          <CardTitle>Grundeinstellungen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Workflow-Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => updateFormData({ name: e.target.value })}
                placeholder="z.B. Zahlungserinnerung"
              />
            </div>
            <div className="space-y-2">
              <Label>Beschreibung</Label>
              <Input
                value={formData.description}
                onChange={(e) => updateFormData({ description: e.target.value })}
                placeholder="Kurze Beschreibung des Workflows"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visual Workflow Builder */}
      <div className="space-y-4">
        {/* Step 1: Trigger */}
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                1
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Trigger (Wann?)
                </CardTitle>
                <CardDescription>Wählen Sie aus, wann der Workflow ausgelöst werden soll</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Trigger-Typ</Label>
              <Select
                value={formData.trigger_type}
                onValueChange={(v) => updateFormData({ trigger_type: v as WorkflowTriggerType, trigger_config: {} })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(triggersByCategory).map(([category, triggers]) => (
                    <SelectGroup key={category}>
                      <SelectLabel>{category}</SelectLabel>
                      {triggers.map(trigger => (
                        <SelectItem key={trigger.key} value={trigger.key}>
                          <span className="flex items-center gap-2">
                            <span>{trigger.icon}</span>
                            <span>{trigger.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div>
              <Label className="text-muted-foreground text-sm mb-2 block">Trigger-Konfiguration</Label>
              {renderTriggerConfig()}
            </div>
          </CardContent>
        </Card>

        {/* Arrow connector */}
        <div className="flex justify-center">
          <ChevronRight className="h-8 w-8 text-muted-foreground rotate-90" />
        </div>

        {/* Step 2: Conditions */}
        <Card className="border-l-4 border-l-warning">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-warning text-warning-foreground text-sm font-bold">
                2
              </div>
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Bedingungen (Wenn?)
                </CardTitle>
                <CardDescription>Optional: Filtern Sie, wann der Workflow ausgeführt werden soll</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={addCondition}>
                <Plus className="h-4 w-4 mr-2" />
                Bedingung hinzufügen
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {formData.conditions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Keine Bedingungen - Workflow wird immer ausgeführt
              </p>
            ) : (
              <div className="space-y-3">
                {formData.conditions.map((condition, index) => (
                  <div key={condition.id} className="flex items-center gap-2">
                    {index > 0 && (
                      <Select
                        value={condition.connector || "AND"}
                        onValueChange={(v) => updateCondition(condition.id, { connector: v as "AND" | "OR" })}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AND">UND</SelectItem>
                          <SelectItem value="OR">ODER</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <Select
                      value={condition.field}
                      onValueChange={(v) => updateCondition(condition.id, { field: v })}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDITION_FIELDS.map(field => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={condition.operator}
                      onValueChange={(v) => updateCondition(condition.id, { operator: v as any })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDITION_OPERATORS.map(op => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {condition.field === "building_id" ? (
                      <Select
                        value={condition.value}
                        onValueChange={(v) => updateCondition(condition.id, { value: v })}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Gebäude wählen..." />
                        </SelectTrigger>
                        <SelectContent>
                          {buildings.map(building => (
                            <SelectItem key={building.id} value={building.id}>
                              {building.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        className="flex-1"
                        value={condition.value}
                        onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                        placeholder="Wert eingeben..."
                      />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCondition(condition.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Arrow connector */}
        <div className="flex justify-center">
          <ChevronRight className="h-8 w-8 text-muted-foreground rotate-90" />
        </div>

        {/* Step 3: Actions */}
        <Card className="border-l-4 border-l-success">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-success text-success-foreground text-sm font-bold">
                3
              </div>
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Aktionen (Dann?)
                </CardTitle>
                <CardDescription>Definieren Sie, was ausgeführt werden soll</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Action list */}
            <Accordion type="multiple" className="space-y-2">
              {formData.actions.map((action, index) => {
                const actionType = ACTION_TYPES[action.type];
                return (
                  <AccordionItem key={action.id} value={action.id} className="border rounded-lg">
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="text-lg">{actionType.icon}</span>
                        <span>{actionType.label}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-4">
                        {renderActionConfig(action)}
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAction(action.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                            Aktion entfernen
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>

            {/* Add action buttons */}
            <div className="border-2 border-dashed rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-3">Aktion hinzufügen:</p>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(ACTION_TYPES) as [WorkflowActionType, typeof ACTION_TYPES[WorkflowActionType]][]).map(([type, info]) => (
                  <Button
                    key={type}
                    variant="outline"
                    size="sm"
                    onClick={() => addAction(type)}
                  >
                    <span className="mr-2">{info.icon}</span>
                    {info.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={() => navigate("/automatisierung")}>
              Abbrechen
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleSave(false)}
                disabled={!formData.name || formData.actions.length === 0 || createWorkflow.isPending || updateWorkflow.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                Als Entwurf speichern
              </Button>
              <Button
                onClick={() => handleSave(true)}
                disabled={!formData.name || formData.actions.length === 0 || createWorkflow.isPending || updateWorkflow.isPending}
              >
                <Zap className="h-4 w-4 mr-2" />
                Aktivieren
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
