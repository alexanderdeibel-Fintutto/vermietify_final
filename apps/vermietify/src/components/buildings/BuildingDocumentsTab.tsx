import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared";
import {
  Upload,
  FileText,
  Download,
  Eye,
  Trash2,
  Search,
  Filter,
  File,
  FileImage,
} from "lucide-react";

interface BuildingDocumentsTabProps {
  buildingId: string;
}

interface Document {
  id: string;
  title: string;
  type: string;
  uploadedAt: string;
  size: string;
  fileType: string;
}

const DOCUMENT_TYPES = [
  { value: "all", label: "Alle Typen" },
  { value: "grundbuch", label: "Grundbuch" },
  { value: "versicherung", label: "Versicherung" },
  { value: "energieausweis", label: "Energieausweis" },
  { value: "bauplan", label: "Bauplan" },
  { value: "wartung", label: "Wartungsvertrag" },
  { value: "sonstiges", label: "Sonstiges" },
];

export function BuildingDocumentsTab({ buildingId }: BuildingDocumentsTabProps) {
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock documents - replace with real data later
  const documents: Document[] = [
    {
      id: "1",
      title: "Grundbuchauszug 2024",
      type: "grundbuch",
      uploadedAt: "15.01.2024",
      size: "2.4 MB",
      fileType: "pdf",
    },
    {
      id: "2",
      title: "Gebäudeversicherung",
      type: "versicherung",
      uploadedAt: "10.01.2024",
      size: "1.2 MB",
      fileType: "pdf",
    },
    {
      id: "3",
      title: "Energieausweis",
      type: "energieausweis",
      uploadedAt: "05.01.2024",
      size: "3.1 MB",
      fileType: "pdf",
    },
  ];

  const filteredDocuments = documents.filter((doc) => {
    const matchesType = filterType === "all" || doc.type === filterType;
    const matchesSearch =
      searchQuery === "" ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getDocumentTypeLabel = (type: string) => {
    const found = DOCUMENT_TYPES.find((t) => t.value === type);
    return found?.label || type;
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === "pdf") return <FileText className="h-8 w-8 text-destructive" />;
    if (["jpg", "jpeg", "png", "gif"].includes(fileType))
      return <FileImage className="h-8 w-8 text-primary" />;
    return <File className="h-8 w-8 text-muted-foreground" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Dokumente durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Typ filtern" />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Dokument hochladen
        </Button>
      </div>

      {filteredDocuments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Keine Dokumente"
          description="Es wurden noch keine Dokumente für dieses Gebäude hochgeladen."
          action={{
            label: "Dokument hochladen",
            onClick: () => console.log("Upload clicked"),
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {getFileIcon(doc.fileType)}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{doc.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {getDocumentTypeLabel(doc.type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {doc.size}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Hochgeladen am {doc.uploadedAt}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
