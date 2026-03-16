import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader, StatCard, DataTable, EmptyState, LoadingState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  FileText,
  Upload,
  Folder,
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  Download,
  Building,
  Calendar,
  Euro,
  Sparkles,
  Filter,
} from "lucide-react";
import { useDocuments, DOCUMENT_TYPES, Document } from "@/hooks/useDocuments";
import { DocumentUploadDialog } from "@/components/documents/DocumentUploadDialog";
import { DocumentOCRPreview } from "@/components/documents/DocumentOCRPreview";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const CATEGORY_ICONS: Record<string, { icon: typeof FileText; color: string }> = {
  invoice: { icon: Euro, color: "text-green-600" },
  tax_notice: { icon: FileText, color: "text-blue-600" },
  contract: { icon: FileText, color: "text-purple-600" },
  letter: { icon: FileText, color: "text-orange-600" },
  receipt: { icon: Euro, color: "text-emerald-600" },
  energy_certificate: { icon: FileText, color: "text-yellow-600" },
  protocol: { icon: FileText, color: "text-cyan-600" },
  other: { icon: FileText, color: "text-gray-600" },
  unknown: { icon: FileText, color: "text-gray-400" },
};

export default function Documents() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { documents, documentsLoading, stats, deleteDocument, searchDocuments } = useDocuments();

  // Filter documents
  const filteredDocuments = searchDocuments(searchTerm).filter((doc) => {
    if (typeFilter === "all") return true;
    return doc.ocr_result?.detected_type === typeFilter;
  });

  const handleDelete = () => {
    if (deleteDialog.id) {
      deleteDocument.mutate(deleteDialog.id);
      setDeleteDialog({ open: false, id: null });
    }
  };

  const columns: ColumnDef<Document>[] = [
    {
      accessorKey: "title",
      header: "Dokument",
      cell: ({ row }) => {
        const doc = row.original;
        const typeInfo = CATEGORY_ICONS[doc.ocr_result?.detected_type || "unknown"];
        const Icon = typeInfo.icon;
        return (
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-muted ${typeInfo.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium">{doc.title}</div>
              <div className="text-sm text-muted-foreground">
                {format(new Date(doc.created_at), "dd.MM.yyyy", { locale: de })}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "detected_type",
      header: "Typ",
      cell: ({ row }) => {
        const type = row.original.ocr_result?.detected_type || "unknown";
        return (
          <Badge variant="outline">
            {DOCUMENT_TYPES[type as keyof typeof DOCUMENT_TYPES]}
          </Badge>
        );
      },
    },
    {
      accessorKey: "building",
      header: "Gebäude",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.buildings?.name || "-"}
        </span>
      ),
    },
    {
      accessorKey: "extracted_data",
      header: "Extrahiert",
      cell: ({ row }) => {
        const ocr = row.original.ocr_result;
        if (!ocr) return <span className="text-muted-foreground">-</span>;
        return (
          <div className="text-sm space-y-1">
            {ocr.extracted_data?.sender && (
              <div className="flex items-center gap-1">
                <Building className="h-3 w-3" />
                <span className="truncate max-w-[150px]">{ocr.extracted_data.sender}</span>
              </div>
            )}
            {ocr.extracted_data?.amounts?.[0] && (
              <div className="flex items-center gap-1 text-green-600">
                <Euro className="h-3 w-3" />
                {(ocr.extracted_data.amounts[0].value / 100).toLocaleString("de-DE", {
                  style: "currency",
                  currency: "EUR",
                })}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "confidence",
      header: "KI-Konfidenz",
      cell: ({ row }) => {
        const confidence = row.original.ocr_result?.confidence_score;
        if (!confidence) return <span className="text-muted-foreground">-</span>;
        return (
          <Badge
            variant="outline"
            className={
              confidence >= 80
                ? "border-green-500 text-green-600"
                : confidence >= 50
                ? "border-yellow-500 text-yellow-600"
                : "border-red-500 text-red-600"
            }
          >
            <Sparkles className="h-3 w-3 mr-1" />
            {confidence.toFixed(0)}%
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setPreviewDoc(row.original)}>
              <Eye className="mr-2 h-4 w-4" />
              Details anzeigen
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={row.original.file_url} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" />
                Herunterladen
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setDeleteDialog({ open: true, id: row.original.id })}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Löschen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (documentsLoading) {
    return (
      <MainLayout title="Dokumente">
        <LoadingState />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Dokumente">
      <div className="space-y-6">
        <PageHeader
          title="Dokumente"
          subtitle="Verwalten Sie alle wichtigen Dokumente mit KI-Erkennung"
          actions={
            <Button onClick={() => setUploadOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Dokument hochladen
            </Button>
          }
        />

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Gesamt"
            value={stats.total.toString()}
            icon={FileText}
            description="Dokumente"
          />
          <StatCard
            title="Analysiert"
            value={stats.processed.toString()}
            icon={Sparkles}
            description="Mit KI verarbeitet"
          />
          <StatCard
            title="Rechnungen"
            value={stats.byType.find(t => t.type === "invoice")?.count.toString() || "0"}
            icon={Euro}
            description="Erkannt"
          />
          <StatCard
            title="Verträge"
            value={stats.byType.find(t => t.type === "contract")?.count.toString() || "0"}
            icon={FileText}
            description="Gespeichert"
          />
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">Alle Dokumente</TabsTrigger>
            <TabsTrigger value="categories">Nach Kategorie</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Dokumente durchsuchen..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Nach Typ filtern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Typen</SelectItem>
                  {Object.entries(DOCUMENT_TYPES).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Documents Table */}
            {filteredDocuments.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="Keine Dokumente"
                description={
                  searchTerm || typeFilter !== "all"
                    ? "Keine Dokumente gefunden. Versuchen Sie andere Filter."
                    : "Laden Sie Ihr erstes Dokument hoch, um zu beginnen"
                }
                action={
                  !searchTerm && typeFilter === "all" && (
                    <Button onClick={() => setUploadOpen(true)}>
                      <Upload className="mr-2 h-4 w-4" />
                      Dokument hochladen
                    </Button>
                  )
                }
              />
            ) : (
              <DataTable
                columns={columns}
                data={filteredDocuments}
                searchable={false}
              />
            )}
          </TabsContent>

          <TabsContent value="categories">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Object.entries(DOCUMENT_TYPES)
                .filter(([key]) => key !== "unknown")
                .map(([key, label]) => {
                  const count = stats.byType.find(t => t.type === key)?.count || 0;
                  const typeInfo = CATEGORY_ICONS[key];
                  const Icon = typeInfo.icon;
                  return (
                    <Card
                      key={key}
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => {
                        setTypeFilter(key);
                      }}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-muted ${typeInfo.color}`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="font-medium">{label}</p>
                            <p className="text-sm text-muted-foreground">{count} Dateien</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <DocumentUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      
      <DocumentOCRPreview
        document={previewDoc}
        open={!!previewDoc}
        onOpenChange={(open) => !open && setPreviewDoc(null)}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Dokument löschen?"
        description="Dieses Dokument wird unwiderruflich gelöscht."
        onConfirm={handleDelete}
        confirmLabel="Löschen"
        destructive
      />
    </MainLayout>
  );
}
