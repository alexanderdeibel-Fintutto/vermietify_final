import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared";
import { 
  FolderOpen, 
  Upload, 
  FileText,
  Download,
  Eye,
  Trash2,
  Filter,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface UnitDocumentsTabProps {
  unitId: string;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  contract: "Vertrag",
  protocol: "Protokoll",
  invoice: "Rechnung",
  insurance: "Versicherung",
  tax: "Steuer",
  correspondence: "Korrespondenz",
  other: "Sonstiges",
};

export function UnitDocumentsTab({ unitId }: UnitDocumentsTabProps) {
  const [selectedType, setSelectedType] = useState<string>("all");

  // Note: We'd need to add a unit_id column to documents table or use a different approach
  // For now, this is a placeholder implementation
  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents", "unit", unitId, selectedType],
    queryFn: async () => {
      // Placeholder - documents table doesn't have unit_id yet
      // This would need a schema update
      return [] as any[];
    },
  });

  const filteredDocuments = documents?.filter(
    (doc) => selectedType === "all" || doc.document_type === selectedType
  ) || [];

  return (
    <div className="space-y-4">
      {/* Filters & Actions */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter:</span>
            </div>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Dokumenttyp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Typen</SelectItem>
                {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="ml-auto">
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Dokument hochladen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Dokumente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 p-4 border rounded-lg">
                  <div className="h-10 w-10 bg-muted rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredDocuments.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="Keine Dokumente vorhanden"
              description="Laden Sie Dokumente wie Übergabeprotokolle oder Fotos hoch."
              action={
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Dokument hochladen
                </Button>
              }
            />
          ) : (
            <div className="space-y-2">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{doc.title}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(doc.created_at), "dd.MM.yyyy", { locale: de })}
                      </span>
                      {doc.file_size && (
                        <span>{(doc.file_size / 1024).toFixed(0)} KB</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Upload Categories */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardContent className="py-6 text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="font-medium">Übergabeprotokoll</p>
            <p className="text-sm text-muted-foreground">
              Einzug- oder Auszugsprotokolle
            </p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardContent className="py-6 text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="font-medium">Fotos</p>
            <p className="text-sm text-muted-foreground">
              Wohnungsfotos dokumentieren
            </p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardContent className="py-6 text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="font-medium">Sonstiges</p>
            <p className="text-sm text-muted-foreground">
              Andere Dokumente
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
