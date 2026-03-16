import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader, DataTable, EmptyState, LoadingState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Mail,
  Plus,
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Eye,
  Lock,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  useEmailTemplates,
  EmailTemplate,
  EMAIL_CATEGORIES,
  CreateTemplateInput,
} from "@/hooks/useEmailTemplates";
import { TemplateEditorDialog } from "@/components/email/TemplateEditorDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

const CATEGORY_COLORS: Record<string, string> = {
  contract: "bg-purple-100 text-purple-800",
  payment: "bg-green-100 text-green-800",
  operating_costs: "bg-blue-100 text-blue-800",
  maintenance: "bg-orange-100 text-orange-800",
  general: "bg-gray-100 text-gray-800",
};

export default function EmailTemplates() {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });

  const {
    templates,
    systemTemplates,
    userTemplates,
    templatesLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
  } = useEmailTemplates();

  const handleSave = (data: CreateTemplateInput) => {
    if (editingTemplate && !editingTemplate.is_system) {
      updateTemplate.mutate(
        { id: editingTemplate.id, updates: data },
        {
          onSuccess: () => {
            setEditorOpen(false);
            setEditingTemplate(null);
          },
        }
      );
    } else {
      createTemplate.mutate(data, {
        onSuccess: () => {
          setEditorOpen(false);
          setEditingTemplate(null);
        },
      });
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setEditorOpen(true);
  };

  const handleDuplicate = (id: string) => {
    duplicateTemplate.mutate(id);
  };

  const handleDelete = () => {
    if (deleteDialog.id) {
      deleteTemplate.mutate(deleteDialog.id);
      setDeleteDialog({ open: false, id: null });
    }
  };

  const columns: ColumnDef<EmailTemplate>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.name}</span>
          {row.original.is_system && (
            <Lock className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Kategorie",
      cell: ({ row }) => (
        <Badge className={CATEGORY_COLORS[row.original.category]}>
          {EMAIL_CATEGORIES[row.original.category]}
        </Badge>
      ),
    },
    {
      accessorKey: "subject",
      header: "Betreff",
      cell: ({ row }) => (
        <span className="text-sm truncate max-w-[300px] block">
          {row.original.subject}
        </span>
      ),
    },
    {
      accessorKey: "updated_at",
      header: "Zuletzt geändert",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.original.updated_at), "dd.MM.yyyy", { locale: de })}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const template = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setPreviewTemplate(template)}>
                <Eye className="mr-2 h-4 w-4" />
                Vorschau
              </DropdownMenuItem>
              {!template.is_system && (
                <DropdownMenuItem onClick={() => handleEdit(template)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Bearbeiten
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => handleDuplicate(template.id)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplizieren
              </DropdownMenuItem>
              {!template.is_system && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setDeleteDialog({ open: true, id: template.id })}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Löschen
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (templatesLoading) {
    return (
      <MainLayout title="E-Mail-Vorlagen">
        <LoadingState />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="E-Mail-Vorlagen">
      <div className="space-y-6">
        <PageHeader
          title="E-Mail-Vorlagen"
          subtitle="Verwalten Sie Ihre E-Mail-Vorlagen mit Platzhaltern"
          breadcrumbs={[
            { label: "Kommunikation", href: "/kommunikation" },
            { label: "Vorlagen" },
          ]}
          actions={
            <Button onClick={() => {
              setEditingTemplate(null);
              setEditorOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Neue Vorlage
            </Button>
          }
        />

        <Tabs defaultValue="user" className="space-y-4">
          <TabsList>
            <TabsTrigger value="user">
              Meine Vorlagen
              <Badge variant="secondary" className="ml-2">
                {userTemplates.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="system">
              System-Vorlagen
              <Badge variant="secondary" className="ml-2">
                {systemTemplates.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="user">
            {userTemplates.length === 0 ? (
              <EmptyState
                icon={Mail}
                title="Keine eigenen Vorlagen"
                description="Erstellen Sie Ihre erste E-Mail-Vorlage oder duplizieren Sie eine System-Vorlage"
                action={
                  <Button onClick={() => {
                    setEditingTemplate(null);
                    setEditorOpen(true);
                  }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Vorlage erstellen
                  </Button>
                }
              />
            ) : (
              <DataTable columns={columns} data={userTemplates} searchable={false} />
            )}
          </TabsContent>

          <TabsContent value="system">
            <DataTable columns={columns} data={systemTemplates} searchable={false} />
          </TabsContent>
        </Tabs>
      </div>

      <TemplateEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        template={editingTemplate}
        onSave={handleSave}
        isSaving={createTemplate.isPending || updateTemplate.isPending}
      />

      {/* Preview Dialog */}
      {previewTemplate && (
        <TemplateEditorDialog
          open={!!previewTemplate}
          onOpenChange={() => setPreviewTemplate(null)}
          template={previewTemplate}
          onSave={() => {}}
          isSaving={false}
        />
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Vorlage löschen?"
        description="Diese Vorlage wird unwiderruflich gelöscht."
        onConfirm={handleDelete}
        confirmLabel="Löschen"
        destructive
      />
    </MainLayout>
  );
}
