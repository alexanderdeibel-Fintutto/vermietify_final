import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Upload, FolderOpen, FileText, Loader2, Check, AlertCircle, Receipt, Calendar, Clock, Sparkles, Mail } from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { useAIAnalysis, ReceiptAnalysisResult } from '@/hooks/useAIAnalysis';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { EmailInboxTab } from '@/components/receipts/EmailInboxTab';
import { OpenQuestionsTab } from '@/components/receipts/OpenQuestionsTab';
import { useEmailInbox } from '@/hooks/useEmailInbox';

interface Receipt {
  id: string;
  file_name: string;
  file_type: string | null;
  amount: number | null;
  date: string;
  description: string | null;
  transaction_id: string | null;
}

export default function Receipts() {
  const { currentCompany } = useCompany();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ReceiptAnalysisResult | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { analyzeReceipt, isAnalyzing } = useAIAnalysis();

  useEffect(() => {
    if (currentCompany) {
      fetchReceipts();
    }
  }, [currentCompany]);

  const fetchReceipts = async () => {
    if (!currentCompany) return;

    setLoading(true);
    const { data } = await supabase
      .from('receipts')
      .select('*')
      .eq('company_id', currentCompany.id)
      .order('date', { ascending: false })
      .limit(10000);

    if (data) {
      setReceipts(data);
    }
    setLoading(false);
  };

  // Statistics calculations
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonthReceipts = receipts.filter(r => {
      const date = new Date(r.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const unprocessedReceipts = receipts.filter(r => !r.transaction_id);

    return {
      total: receipts.length,
      thisMonth: thisMonthReceipts.length,
      unprocessed: unprocessedReceipts.length,
      aiAccuracy: 87, // Demo value - would be calculated from actual AI results
    };
  }, [receipts]);

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getConfidenceTextColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-500';
    if (confidence >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const validFile = files.find(f => 
      f.type === 'image/jpeg' || 
      f.type === 'image/png' || 
      f.type === 'application/pdf'
    );

    if (validFile) {
      await processFile(validFile);
    } else {
      toast.error('Bitte laden Sie eine JPG, PNG oder PDF Datei hoch.');
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
    e.target.value = '';
  };

  const processFile = async (file: File) => {
    setCurrentFile(file);
    setShowAnalysisDialog(true);
    setAnalysisResult(null);

    const result = await analyzeReceipt(file);
    setAnalysisResult(result);
  };

  const handleCreateBooking = async () => {
    if (!currentCompany || !analysisResult || !currentFile) return;

    setIsSaving(true);

    try {
      // 1. Create transaction
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          company_id: currentCompany.id,
          type: 'expense',
          amount: analysisResult.grossAmount,
          date: analysisResult.date,
          description: `${analysisResult.vendor} - ${analysisResult.category}`,
          category: analysisResult.category,
        })
        .select('id')
        .single();

      if (transactionError) throw transactionError;

      // 2. Create receipt linked to transaction
      const { error: receiptError } = await supabase.from('receipts').insert({
        company_id: currentCompany.id,
        file_name: currentFile.name,
        file_type: currentFile.type,
        amount: analysisResult.grossAmount,
        date: analysisResult.date,
        description: `${analysisResult.vendor} - ${analysisResult.category}`,
        transaction_id: transactionData.id,
      });

      if (receiptError) throw receiptError;

      toast.success('Buchung und Beleg erfolgreich erstellt');
      setShowAnalysisDialog(false);
      setAnalysisResult(null);
      setCurrentFile(null);
      fetchReceipts();
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Fehler beim Erstellen der Buchung');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredReceipts = receipts.filter(
    (r) =>
      r.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pagination = usePagination(filteredReceipts);

  if (!currentCompany) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        Bitte wählen Sie eine Firma aus.
      </div>
    );
  }

  const { emailReceipts: emailReceiptsList } = useEmailInbox();
  const openQuestionsCount = emailReceiptsList.filter((r) => r.status === 'question' || r.status === 'error').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Belege</h1>
          <p className="text-muted-foreground">Verwalten Sie Ihre Belege und Dokumente</p>
        </div>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" />
            E-Mail-Eingang
          </TabsTrigger>
          <TabsTrigger value="questions" className="gap-2 relative">
            <AlertCircle className="h-4 w-4" />
            Offene Fragen
            {openQuestionsCount > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                {openQuestionsCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-0 space-y-6">

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="kpi-card">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-primary/10">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-sm text-muted-foreground">Belege gesamt</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-info/10">
              <Calendar className="h-5 w-5 text-info" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-sm text-muted-foreground">Diesen Monat</p>
            <p className="text-2xl font-bold">{stats.thisMonth}</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-destructive/10">
              <Clock className="h-5 w-5 text-destructive" />
            </div>
            {stats.unprocessed > 0 && (
              <Badge variant="destructive" className="text-xs">
                {stats.unprocessed}
              </Badge>
            )}
          </div>
          <div className="mt-3">
            <p className="text-sm text-muted-foreground">Unverarbeitet</p>
            <p className="text-2xl font-bold">{stats.unprocessed}</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-sm text-muted-foreground">KI-Genauigkeit</p>
            <p className="text-2xl font-bold text-primary">{stats.aiAccuracy}%</p>
          </div>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
          ${isDragging 
            ? 'border-primary bg-primary/10 scale-[1.02]' 
            : 'border-border/50 bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50'
          }
        `}
      >
        <input
          type="file"
          id="file-upload"
          accept="image/jpeg,image/png,application/pdf"
          multiple
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center gap-3">
          <div className={`p-4 rounded-full transition-colors ${isDragging ? 'bg-primary/20' : 'bg-secondary'}`}>
            <Upload className={`h-8 w-8 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <p className="font-medium text-lg">
              {isDragging ? 'Datei hier ablegen' : 'Beleg hochladen oder hierher ziehen'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              JPG, PNG oder PDF (max. 10MB)
            </p>
          </div>
          <Button variant="outline" className="mt-2" onClick={() => document.getElementById('file-upload')?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Datei auswählen
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Beleg suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-secondary/50"
        />
      </div>

      {/* Receipts Grid */}
      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Laden...</div>
      ) : filteredReceipts.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <FolderOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mb-4">Keine Belege vorhanden</p>
          <p className="text-sm text-muted-foreground">
            Laden Sie Ihren ersten Beleg hoch, um loszulegen.
          </p>
        </div>
      ) : (
        <>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pagination.paginatedItems.map((receipt) => (
            <div
              key={receipt.id}
              className="glass rounded-xl p-4 hover:bg-secondary/30 transition-colors cursor-pointer group"
            >
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{receipt.file_name}</p>
                    {receipt.transaction_id ? (
                      <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                        Verbucht
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/30">
                        Offen
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(receipt.date)}
                  </p>
                  {receipt.amount && (
                    <p className="text-sm font-semibold mt-1 text-primary">
                      {formatCurrency(receipt.amount)}
                    </p>
                  )}
                </div>
              </div>
              {receipt.description && (
                <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                  {receipt.description}
                </p>
              )}
            </div>
          ))}
        </div>
        <PaginationControls
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          hasNextPage={pagination.hasNextPage}
          hasPrevPage={pagination.hasPrevPage}
          onNextPage={pagination.nextPage}
          onPrevPage={pagination.prevPage}
          onGoToPage={pagination.goToPage}
        />
        </>
      )}

      {/* AI Analysis Dialog */}
      <Dialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              KI-Beleganalyse
            </DialogTitle>
            <DialogDescription>
              {currentFile?.name}
            </DialogDescription>
          </DialogHeader>

          {isAnalyzing ? (
            <div className="py-8 space-y-4">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="font-medium">KI analysiert Beleg...</p>
                <p className="text-sm text-muted-foreground text-center">
                  Erkennung von Lieferant, Betrag und Kategorie
                </p>
              </div>
              <Progress value={66} className="h-2" />
            </div>
          ) : analysisResult ? (
            <div className="space-y-4">
              {/* Confidence Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Erkennungsgenauigkeit</span>
                  <span className={cn("font-semibold", getConfidenceTextColor(analysisResult.confidence))}>
                    {Math.round(analysisResult.confidence * 100)}%
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className={cn("h-full transition-all duration-500", getConfidenceColor(analysisResult.confidence))}
                    style={{ width: `${analysisResult.confidence * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {analysisResult.confidence >= 0.8 
                    ? 'Hohe Erkennungsqualität' 
                    : analysisResult.confidence >= 0.6 
                      ? 'Mittlere Erkennungsqualität - bitte überprüfen'
                      : 'Niedrige Erkennungsqualität - manuelle Prüfung empfohlen'}
                </p>
              </div>

              {/* Extracted Data */}
              <div className="space-y-3">
                <div className="flex justify-between items-start p-3 rounded-lg bg-secondary/50">
                  <span className="text-sm text-muted-foreground">Lieferant/Händler</span>
                  <span className="font-medium text-right max-w-[60%]">{analysisResult.vendor}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/50">
                  <span className="text-sm text-muted-foreground">Datum</span>
                  <span className="font-medium">{formatDate(analysisResult.date)}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/50">
                  <span className="text-sm text-muted-foreground">Betrag (Brutto)</span>
                  <span className="font-semibold text-primary">
                    {formatCurrency(analysisResult.grossAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/50">
                  <span className="text-sm text-muted-foreground">USt ({analysisResult.vatRate}%)</span>
                  <span className="font-medium">{formatCurrency(analysisResult.vatAmount)}</span>
                </div>
                <div className="flex justify-between items-start p-3 rounded-lg bg-secondary/50">
                  <span className="text-sm text-muted-foreground">Kategorie</span>
                  <span className="font-medium text-right">{analysisResult.category}</span>
                </div>
                <div className="flex justify-between items-start p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <span className="text-sm text-muted-foreground">Buchungskonto</span>
                  <span className="font-medium text-right text-primary">{analysisResult.suggestedAccount}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30 text-warning">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="text-sm">Bitte überprüfen Sie die erkannten Daten vor dem Speichern.</span>
              </div>
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowAnalysisDialog(false)}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleCreateBooking} 
              disabled={isAnalyzing || !analysisResult || isSaving}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Buchung erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </TabsContent>

        <TabsContent value="email" className="mt-0">
          <EmailInboxTab />
        </TabsContent>

        <TabsContent value="questions" className="mt-0">
          <OpenQuestionsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
