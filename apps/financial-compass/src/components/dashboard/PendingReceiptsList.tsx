import { useState } from 'react';
import { Receipt, Sparkles, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAIAnalysis } from '@/hooks/useAIAnalysis';
import { toast } from 'sonner';

interface PendingReceipt {
  id: string;
  file_name: string;
  file_url?: string | null;
  created_at: string;
}

interface PendingReceiptsListProps {
  receipts: PendingReceipt[];
  onAnalyze?: (receiptId: string, result: unknown) => void;
}

export function PendingReceiptsList({ receipts, onAnalyze }: PendingReceiptsListProps) {
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const { analyzeReceipt, isAnalyzing } = useAIAnalysis();

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
    });

  const handleAnalyze = async (receipt: PendingReceipt) => {
    if (!receipt.file_url) {
      toast.error('Keine Datei zum Analysieren verfügbar');
      return;
    }

    setAnalyzingId(receipt.id);
    try {
      // Fetch the file and convert to File object for analysis
      const response = await fetch(receipt.file_url);
      const blob = await response.blob();
      const file = new File([blob], receipt.file_name, { type: blob.type });
      
      const result = await analyzeReceipt(file);
      toast.success(`Beleg analysiert: ${result.vendor} - ${result.grossAmount}€`);
      onAnalyze?.(receipt.id, result);
    } catch (error) {
      toast.error('Analyse fehlgeschlagen');
      console.error(error);
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Offene Belege</CardTitle>
          <a href="/belege" className="text-sm text-primary hover:underline">
            Alle anzeigen
          </a>
        </div>
      </CardHeader>
      <CardContent>
        {receipts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-success">
            <CheckCircle className="h-10 w-10 mb-2" />
            <p className="text-sm font-medium">Alle Belege verarbeitet!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {receipts.map((receipt) => {
              const isCurrentlyAnalyzing = analyzingId === receipt.id;

              return (
                <div
                  key={receipt.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{receipt.file_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(receipt.created_at)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAnalyze(receipt)}
                    disabled={isCurrentlyAnalyzing || isAnalyzing}
                  >
                    {isCurrentlyAnalyzing ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Analyse...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3 mr-1" />
                        KI
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
