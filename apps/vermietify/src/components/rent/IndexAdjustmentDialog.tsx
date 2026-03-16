import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, FileText, TrendingUp, AlertCircle } from "lucide-react";
import { useRentAdjustments, IndexAdjustmentCandidate, VPIIndex } from "@/hooks/useRentAdjustments";
import { format, addMonths } from "date-fns";
import { de } from "date-fns/locale";

interface IndexAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: IndexAdjustmentCandidate;
  currentVPI?: VPIIndex;
}

export function IndexAdjustmentDialog({
  open,
  onOpenChange,
  candidate,
  currentVPI,
}: IndexAdjustmentDialogProps) {
  const { createAdjustment, updateAdjustmentStatus } = useRentAdjustments();
  const [effectiveDate, setEffectiveDate] = useState(
    format(addMonths(new Date(), candidate.announcementMonthsRequired), "yyyy-MM-dd")
  );
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateAdjustment = async () => {
    setIsCreating(true);
    try {
      await createAdjustment.mutateAsync({
        leaseId: candidate.leaseId,
        type: "index",
        oldRentCents: candidate.currentRentCents,
        newRentCents: candidate.newRentCents,
        effectiveDate,
        indexOld: candidate.indexAtLastAdjustment,
        indexNew: candidate.currentIndex,
        indexChangePercent: candidate.indexChangePercent,
      });
      onOpenChange(false);
    } finally {
      setIsCreating(false);
    }
  };

  const announcementDeadline = addMonths(new Date(effectiveDate), -candidate.announcementMonthsRequired);
  const isAnnouncementOverdue = new Date() > announcementDeadline;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Indexmietanpassung</DialogTitle>
          <DialogDescription>
            Berechnung und Ankündigung der Mietanpassung basierend auf dem Verbraucherpreisindex
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contract Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Mieter</Label>
              <p className="font-medium">{candidate.tenant}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Einheit</Label>
              <p className="font-medium">{candidate.unit}</p>
            </div>
          </div>

          <Separator />

          {/* Calculation Breakdown */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Berechnungsgrundlage</h4>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Basis-Miete (Kaltmiete)</span>
                  <span className="font-medium">{candidate.currentRentEuro} €</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Index bei letzter Anpassung</span>
                  <span className="font-medium">{candidate.indexAtLastAdjustment.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Aktueller Index</span>
                  <span className="font-medium">{candidate.currentIndex.toFixed(1)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Steigerung</span>
                  <span className="font-medium text-primary">+{candidate.indexChangePercent.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span className="font-semibold">Neue Miete</span>
                  <span className="font-bold text-primary">{candidate.newRentEuro} €</span>
                </div>
                <div className="flex justify-between items-center text-green-600">
                  <span>Monatliche Mehreinnahmen</span>
                  <span className="font-semibold">+{candidate.differenceEuro} €</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Effective Date */}
          <div className="space-y-2">
            <Label htmlFor="effectiveDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Anpassungsdatum (Stichtag)
            </Label>
            <Input
              id="effectiveDate"
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              min={format(addMonths(new Date(), candidate.announcementMonthsRequired), "yyyy-MM-dd")}
            />
            <p className="text-sm text-muted-foreground">
              Die neue Miete gilt ab diesem Datum
            </p>
          </div>

          {/* Announcement Warning */}
          <Alert variant={isAnnouncementOverdue ? "destructive" : "default"}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Ankündigung erforderlich:</strong> Die Mieterhöhung muss dem Mieter mindestens{" "}
              <strong>{candidate.announcementMonthsRequired} Monate</strong> vorher schriftlich mitgeteilt werden.
              {isAnnouncementOverdue ? (
                <span className="block mt-1 text-destructive">
                  Bei diesem Stichtag müsste die Ankündigung bereits erfolgt sein!
                </span>
              ) : (
                <span className="block mt-1">
                  Ankündigung spätestens bis: {format(announcementDeadline, "dd.MM.yyyy", { locale: de })}
                </span>
              )}
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button variant="secondary" className="gap-2">
            <FileText className="h-4 w-4" />
            Ankündigung generieren
          </Button>
          <Button 
            onClick={handleCreateAdjustment}
            disabled={isCreating || createAdjustment.isPending}
          >
            {isCreating ? "Wird erstellt..." : "Anpassung erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}