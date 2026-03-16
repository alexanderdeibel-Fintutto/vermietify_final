import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Calendar,
  User,
  Euro,
  ThumbsUp,
  ThumbsDown,
  Edit2,
  Check,
  X,
  Building,
  ExternalLink,
} from "lucide-react";
import { Document, DocumentOCRResult, useDocuments, DOCUMENT_TYPES, DOCUMENT_CATEGORIES } from "@/hooks/useDocuments";
import { useBuildings } from "@/hooks/useBuildings";
import { cn } from "@/lib/utils";

interface DocumentOCRPreviewProps {
  document: Document | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentOCRPreview({
  document,
  open,
  onOpenChange,
}: DocumentOCRPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<DocumentOCRResult["extracted_data"]>>({});
  const [editedType, setEditedType] = useState("");
  const [editedBuildingId, setEditedBuildingId] = useState("");

  const { updateOCRResult, provideFeedback, updateDocument } = useDocuments();
  const { useBuildingsList } = useBuildings();
  const { data: buildingsData } = useBuildingsList(1, 100);
  const buildings = buildingsData?.buildings || [];

  const ocr = document?.ocr_result;

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditedData(ocr?.extracted_data || {});
    setEditedType(ocr?.detected_type || "");
    setEditedBuildingId(document?.building_id || "");
  };

  const handleSaveEdit = async () => {
    if (!ocr) return;

    await updateOCRResult.mutateAsync({
      ocrId: ocr.id,
      updates: {
        detected_type: editedType as keyof typeof DOCUMENT_TYPES,
        extracted_data: editedData,
        suggested_building_id: editedBuildingId || null,
      },
    });

    if (editedBuildingId && document) {
      await updateDocument.mutateAsync({
        id: document.id,
        updates: { building_id: editedBuildingId },
      });
    }

    setIsEditing(false);
  };

  const handleFeedback = async (feedback: "correct" | "incorrect") => {
    if (!ocr) return;
    await provideFeedback.mutateAsync({ ocrId: ocr.id, feedback });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "bg-green-500";
    if (confidence >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {document.title}
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Document Preview */}
          <div className="space-y-4">
            <h3 className="font-medium">Dokument</h3>
            <Card className="aspect-[3/4] bg-muted/30 flex items-center justify-center overflow-hidden">
              {document.file_url && (
                document.file_url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  <img
                    src={document.file_url}
                    alt={document.title}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-4">
                    <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      PDF-Vorschau nicht verfügbar
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <a href={document.file_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Dokument öffnen
                      </a>
                    </Button>
                  </div>
                )
              )}
            </Card>
          </div>

          {/* OCR Results */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Extrahierte Daten</h3>
              {ocr && !isEditing && (
                <Button variant="outline" size="sm" onClick={handleStartEdit}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Bearbeiten
                </Button>
              )}
              {isEditing && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    <X className="mr-2 h-4 w-4" />
                    Abbrechen
                  </Button>
                  <Button size="sm" onClick={handleSaveEdit}>
                    <Check className="mr-2 h-4 w-4" />
                    Speichern
                  </Button>
                </div>
              )}
            </div>

            {ocr ? (
              <div className="space-y-3">
                {/* Confidence Score */}
                <Card className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Erkennungsgenauigkeit</span>
                    <Badge variant="outline">
                      {ocr.confidence_score?.toFixed(0) || 0}%
                    </Badge>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full transition-all", getConfidenceColor(ocr.confidence_score || 0))}
                      style={{ width: `${ocr.confidence_score || 0}%` }}
                    />
                  </div>
                </Card>

                {/* Document Type */}
                <Card className="p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <FileText className="h-4 w-4" />
                    Dokumenttyp
                  </div>
                  {isEditing ? (
                    <Select value={editedType} onValueChange={setEditedType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(DOCUMENT_TYPES).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="secondary" className="text-base">
                      {DOCUMENT_TYPES[ocr.detected_type] || "Unbekannt"}
                    </Badge>
                  )}
                </Card>

                {/* Date */}
                <Card className="p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Calendar className="h-4 w-4" />
                    Datum
                  </div>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editedData.date || ""}
                      onChange={(e) => setEditedData({ ...editedData, date: e.target.value })}
                    />
                  ) : (
                    <p className="font-medium">
                      {ocr.extracted_data?.date || "-"}
                    </p>
                  )}
                </Card>

                {/* Sender */}
                <Card className="p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <User className="h-4 w-4" />
                    Absender
                  </div>
                  {isEditing ? (
                    <Input
                      value={editedData.sender || ""}
                      onChange={(e) => setEditedData({ ...editedData, sender: e.target.value })}
                      placeholder="Absender eingeben..."
                    />
                  ) : (
                    <p className="font-medium">
                      {ocr.extracted_data?.sender || "-"}
                    </p>
                  )}
                </Card>

                {/* Amounts */}
                {(ocr.extracted_data?.amounts?.length || isEditing) && (
                  <Card className="p-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Euro className="h-4 w-4" />
                      Betrag
                    </div>
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={(editedData.amounts?.[0]?.value || 0) / 100}
                        onChange={(e) => setEditedData({
                          ...editedData,
                          amounts: [{ value: Math.round(parseFloat(e.target.value) * 100) }],
                        })}
                        placeholder="Betrag in €"
                      />
                    ) : (
                      <p className="font-medium text-lg">
                        {ocr.extracted_data?.amounts?.[0]?.value
                          ? (ocr.extracted_data.amounts[0].value / 100).toLocaleString("de-DE", {
                              style: "currency",
                              currency: "EUR",
                            })
                          : "-"}
                      </p>
                    )}
                  </Card>
                )}

                {/* Building Assignment */}
                <Card className="p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Building className="h-4 w-4" />
                    Gebäude-Zuordnung
                  </div>
                  {isEditing ? (
                    <Select value={editedBuildingId} onValueChange={setEditedBuildingId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Gebäude wählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Keine Zuordnung</SelectItem>
                        {buildings.map((building) => (
                          <SelectItem key={building.id} value={building.id}>
                            {building.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium">
                      {document.buildings?.name || "-"}
                    </p>
                  )}
                </Card>

                {/* Subject / Description */}
                {ocr.extracted_data?.subject && (
                  <Card className="p-3">
                    <div className="text-sm text-muted-foreground mb-2">
                      Betreff / Beschreibung
                    </div>
                    <p className="text-sm">{ocr.extracted_data.subject}</p>
                  </Card>
                )}

                {/* Feedback Section */}
                {!isEditing && (
                  <Card className="p-4 bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-3">
                      Waren die extrahierten Daten korrekt?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant={ocr.user_feedback === "correct" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleFeedback("correct")}
                        className="flex-1"
                      >
                        <ThumbsUp className="mr-2 h-4 w-4" />
                        Richtig
                      </Button>
                      <Button
                        variant={ocr.user_feedback === "incorrect" ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => handleFeedback("incorrect")}
                        className="flex-1"
                      >
                        <ThumbsDown className="mr-2 h-4 w-4" />
                        Fehlerhaft
                      </Button>
                    </div>
                    {ocr.user_feedback && (
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Feedback gespeichert ✓
                      </p>
                    )}
                  </Card>
                )}
              </div>
            ) : (
              <Card className="p-8 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Keine OCR-Daten verfügbar</p>
                <p className="text-sm">Dieses Dokument wurde nicht analysiert</p>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
