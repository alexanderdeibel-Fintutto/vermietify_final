import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Building,
  Calendar,
  User,
  Euro,
  ArrowRight,
  ArrowLeft,
  X,
} from "lucide-react";
import { useDocuments, DOCUMENT_TYPES, DOCUMENT_CATEGORIES } from "@/hooks/useDocuments";
import { useBuildings } from "@/hooks/useBuildings";
import { useUnits } from "@/hooks/useUnits";
import { cn } from "@/lib/utils";

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type UploadStep = "upload" | "analyzing" | "review" | "saving";

export function DocumentUploadDialog({ open, onOpenChange }: DocumentUploadDialogProps) {
  const [step, setStep] = useState<UploadStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Analysis results
  const [analysisResult, setAnalysisResult] = useState<{
    detected_type: string;
    confidence: number;
    date: string | null;
    sender: string | null;
    amount: number | null;
    description: string;
  } | null>(null);
  
  // Form state
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState<string>("other");
  const [buildingId, setBuildingId] = useState<string>("");
  const [unitId, setUnitId] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [notes, setNotes] = useState("");

  const { uploadDocument, analyzeDocument } = useDocuments();
  const { useBuildingsList } = useBuildings();
  const { data: buildingsData } = useBuildingsList(1, 100);
  const buildings = buildingsData?.buildings || [];
  const { useUnitsList } = useUnits();
  const { data: units = [] } = useUnitsList(buildingId || undefined);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
    
    // Create preview for images
    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    
    setStep("analyzing");
    
    try {
      // First upload the file
      const doc = await uploadDocument.mutateAsync({
        file,
        title,
        document_type: "other", // Will be updated after analysis
      });

      // Create a data URL for images to send to AI
      let imageUrl: string | undefined;
      if (file.type.startsWith("image/")) {
        imageUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
      }

      // Analyze the document
      const result = await analyzeDocument.mutateAsync({
        documentId: doc.id,
        imageUrl,
      });

      setAnalysisResult({
        detected_type: result.analysis.category || "other",
        confidence: result.analysis.confidence || 0,
        date: result.analysis.date,
        sender: result.analysis.sender,
        amount: result.analysis.amount,
        description: result.analysis.description || "",
      });
      
      // Pre-fill form with analysis results
      setDocumentType(result.analysis.category || "other");
      setCategory(result.analysis.category || "");
      
      setStep("review");
    } catch (error) {
      console.error("Analysis failed:", error);
      setStep("review");
      // Still allow manual entry even if analysis fails
    }
  };

  const handleSave = async () => {
    if (!file) return;
    
    setStep("saving");
    
    try {
      // If already uploaded during analysis, just update
      // Otherwise upload now
      if (!analysisResult) {
        await uploadDocument.mutateAsync({
          file,
          title,
          document_type: documentType,
          building_id: buildingId || undefined,
          notes,
        });
      }
      
      onOpenChange(false);
      resetForm();
    } catch (error) {
      setStep("review");
    }
  };

  const resetForm = () => {
    setStep("upload");
    setFile(null);
    setFilePreview(null);
    setAnalysisResult(null);
    setTitle("");
    setDocumentType("other");
    setBuildingId("");
    setUnitId("");
    setCategory("");
    setNotes("");
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600 bg-green-100";
    if (confidence >= 50) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) resetForm();
      onOpenChange(value);
    }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Dokument hochladen
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-4">
          {["upload", "analyzing", "review", "saving"].map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  step === s
                    ? "bg-primary text-primary-foreground"
                    : ["upload"].indexOf(step) < i
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary/20 text-primary"
                )}
              >
                {i + 1}
              </div>
              {i < 3 && (
                <div className={cn(
                  "w-8 h-0.5 mx-1",
                  ["upload", "analyzing", "review", "saving"].indexOf(step) > i
                    ? "bg-primary"
                    : "bg-muted"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="space-y-4">
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                file ? "bg-muted/30" : ""
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-4">
                    {filePreview ? (
                      <img
                        src={filePreview}
                        alt="Vorschau"
                        className="max-h-32 rounded border"
                      />
                    ) : (
                      <FileText className="h-16 w-16 text-muted-foreground" />
                    )}
                    <div className="text-left">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setFile(null);
                        setFilePreview(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-lg font-medium">
                      Datei hierher ziehen oder
                    </p>
                    <label className="cursor-pointer">
                      <span className="text-primary hover:underline">
                        Datei auswählen
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleFileSelect(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    PDF, Bilder oder Word-Dokumente
                  </p>
                </div>
              )}
            </div>

            {file && (
              <div className="space-y-2">
                <Label>Dokumentname</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Name des Dokuments"
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={handleAnalyze}
                disabled={!file || !title}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Mit KI analysieren
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Analyzing */}
        {step === "analyzing" && (
          <div className="py-12 text-center space-y-6">
            <Loader2 className="h-16 w-16 mx-auto animate-spin text-primary" />
            <div>
              <h3 className="text-lg font-medium">Dokument wird analysiert...</h3>
              <p className="text-muted-foreground">
                Die KI erkennt Dokumenttyp und extrahiert relevante Daten
              </p>
            </div>
            <Progress value={66} className="max-w-xs mx-auto" />
          </div>
        )}

        {/* Step 3: Review */}
        {step === "review" && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Document Preview */}
              <div>
                <h3 className="font-medium mb-2">Dokument</h3>
                <Card className="p-4 bg-muted/30">
                  {filePreview ? (
                    <img
                      src={filePreview}
                      alt="Vorschau"
                      className="max-h-64 mx-auto rounded"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <FileText className="h-16 w-16 text-muted-foreground mb-2" />
                      <p className="font-medium">{file?.name}</p>
                    </div>
                  )}
                </Card>
              </div>

              {/* Extracted Data */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  KI-Erkennung
                  {analysisResult && (
                    <Badge className={getConfidenceColor(analysisResult.confidence)}>
                      {analysisResult.confidence.toFixed(0)}% Konfidenz
                    </Badge>
                  )}
                </h3>

                {analysisResult ? (
                  <div className="space-y-3">
                    <Card className="p-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <FileText className="h-4 w-4" />
                        Dokumenttyp
                      </div>
                      <Badge variant="secondary" className="text-base">
                        {DOCUMENT_TYPES[analysisResult.detected_type as keyof typeof DOCUMENT_TYPES] || "Unbekannt"}
                      </Badge>
                    </Card>

                    {analysisResult.date && (
                      <Card className="p-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Calendar className="h-4 w-4" />
                          Datum
                        </div>
                        <p className="font-medium">{analysisResult.date}</p>
                      </Card>
                    )}

                    {analysisResult.sender && (
                      <Card className="p-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <User className="h-4 w-4" />
                          Absender
                        </div>
                        <p className="font-medium">{analysisResult.sender}</p>
                      </Card>
                    )}

                    {analysisResult.amount && (
                      <Card className="p-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Euro className="h-4 w-4" />
                          Betrag
                        </div>
                        <p className="font-medium text-lg">
                          {(analysisResult.amount / 100).toLocaleString("de-DE", {
                            style: "currency",
                            currency: "EUR",
                          })}
                        </p>
                      </Card>
                    )}

                    {analysisResult.description && (
                      <Card className="p-3">
                        <div className="text-sm text-muted-foreground mb-1">
                          Beschreibung
                        </div>
                        <p className="text-sm">{analysisResult.description}</p>
                      </Card>
                    )}
                  </div>
                ) : (
                  <Card className="p-4 text-center text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Analyse nicht verfügbar</p>
                    <p className="text-sm">Bitte Daten manuell eingeben</p>
                  </Card>
                )}
              </div>
            </div>

            {/* Manual Assignment */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-4">Zuordnung</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dokumenttyp</Label>
                  <Select value={documentType} onValueChange={setDocumentType}>
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
                </div>

                <div className="space-y-2">
                  <Label>Kategorie</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kategorie wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Gebäude</Label>
                  <Select value={buildingId} onValueChange={(v) => {
                    setBuildingId(v);
                    setUnitId("");
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Gebäude wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Keine Zuordnung</SelectItem>
                      {buildings.map((building) => (
                        <SelectItem key={building.id} value={building.id}>
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            {building.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Einheit</Label>
                  <Select 
                    value={unitId} 
                    onValueChange={setUnitId}
                    disabled={!buildingId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={buildingId ? "Einheit wählen..." : "Erst Gebäude wählen"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Keine Zuordnung</SelectItem>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.unit_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <Label>Notizen</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Zusätzliche Notizen..."
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("upload")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück
              </Button>
              <Button onClick={handleSave}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Speichern
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Saving */}
        {step === "saving" && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="h-16 w-16 mx-auto animate-spin text-primary" />
            <p className="text-lg">Dokument wird gespeichert...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

