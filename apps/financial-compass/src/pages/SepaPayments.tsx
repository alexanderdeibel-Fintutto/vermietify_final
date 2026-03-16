import { useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Download,
  FileText,
  Euro,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCompany } from '@/contexts/CompanyContext';
import { useSepaPayments, SepaPaymentType, SepaPaymentStatus } from '@/hooks/useSepaPayments';
import { useToast } from '@/hooks/use-toast';

export default function SepaPayments() {
  const { currentCompany } = useCompany();
  const { toast } = useToast();
  const {
    payments,
    batches,
    loading,
    createPayment,
    updatePaymentStatus,
    deletePayment,
    createBatchAndExport,
    validateIban,
    getStats,
  } = useSepaPayments();

  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'transfers' | 'direct_debits' | 'batches'>('transfers');

  const [newPayment, setNewPayment] = useState({
    type: 'transfer' as SepaPaymentType,
    creditor_name: '',
    creditor_iban: '',
    creditor_bic: '',
    amount: '',
    reference: '',
    execution_date: new Date().toISOString().split('T')[0],
    mandate_id: '',
    mandate_date: '',
    sequence_type: 'OOFF' as 'FRST' | 'RCUR' | 'OOFF' | 'FNAL',
  });

  const [exportConfig, setExportConfig] = useState({
    creditor_id: 'DE98ZZZ09999999999',
    company_name: currentCompany?.name || '',
    iban: 'DE89370400440532013000',
    bic: 'COBADEFFXXX',
  });

  const stats = getStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const getStatusBadge = (status: SepaPaymentStatus) => {
    const config = {
      draft: { label: 'Entwurf', variant: 'secondary' as const },
      pending: { label: 'Ausstehend', variant: 'outline' as const },
      exported: { label: 'Exportiert', variant: 'default' as const },
      executed: { label: 'Ausgeführt', variant: 'default' as const },
      failed: { label: 'Fehlgeschlagen', variant: 'destructive' as const },
    };
    const { label, variant } = config[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const handleCreatePayment = () => {
    if (!newPayment.creditor_name || !newPayment.creditor_iban || !newPayment.amount) {
      toast({
        title: 'Fehler',
        description: 'Bitte füllen Sie alle Pflichtfelder aus.',
        variant: 'destructive',
      });
      return;
    }

    if (!validateIban(newPayment.creditor_iban)) {
      toast({
        title: 'Ungültige IBAN',
        description: 'Bitte überprüfen Sie die IBAN.',
        variant: 'destructive',
      });
      return;
    }

    createPayment({
      type: newPayment.type,
      status: 'draft',
      creditor_name: newPayment.creditor_name,
      creditor_iban: newPayment.creditor_iban.replace(/\s/g, '').toUpperCase(),
      creditor_bic: newPayment.creditor_bic || undefined,
      amount: parseFloat(newPayment.amount),
      currency: 'EUR',
      reference: newPayment.reference,
      end_to_end_id: `${newPayment.type === 'transfer' ? 'TRF' : 'DD'}-${Date.now()}`,
      execution_date: newPayment.execution_date,
      mandate_id: newPayment.type === 'direct_debit' ? newPayment.mandate_id : undefined,
      mandate_date: newPayment.type === 'direct_debit' ? newPayment.mandate_date : undefined,
      sequence_type: newPayment.type === 'direct_debit' ? newPayment.sequence_type : undefined,
    });

    toast({
      title: 'Zahlung erstellt',
      description: `${newPayment.type === 'transfer' ? 'Überweisung' : 'Lastschrift'} wurde erstellt.`,
    });

    setCreateDialogOpen(false);
    setNewPayment({
      type: 'transfer',
      creditor_name: '',
      creditor_iban: '',
      creditor_bic: '',
      amount: '',
      reference: '',
      execution_date: new Date().toISOString().split('T')[0],
      mandate_id: '',
      mandate_date: '',
      sequence_type: 'OOFF',
    });
  };

  const handleExport = () => {
    if (selectedPayments.length === 0) {
      toast({
        title: 'Keine Auswahl',
        description: 'Bitte wählen Sie mindestens eine Zahlung aus.',
        variant: 'destructive',
      });
      return;
    }

    const type = activeTab === 'transfers' ? 'transfer' : 'direct_debit';
    const result = createBatchAndExport(type, selectedPayments, exportConfig);

    if (result) {
      // Download XML file
      const blob = new Blob([result.xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sepa_${type}_${new Date().toISOString().split('T')[0]}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export erfolgreich',
        description: `${selectedPayments.length} Zahlung(en) als SEPA-XML exportiert.`,
      });

      setSelectedPayments([]);
      setExportDialogOpen(false);
    }
  };

  const togglePaymentSelection = (paymentId: string) => {
    setSelectedPayments(prev =>
      prev.includes(paymentId)
        ? prev.filter(id => id !== paymentId)
        : [...prev, paymentId]
    );
  };

  const filteredPayments = payments.filter(p =>
    activeTab === 'transfers' ? p.type === 'transfer' : p.type === 'direct_debit'
  );

  if (!currentCompany) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        Bitte wählen Sie eine Firma aus.
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">SEPA-Zahlungen</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Überweisungen und Lastschriften verwalten
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Neue Zahlung</span>
              <span className="sm:hidden">Neu</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Neue SEPA-Zahlung</DialogTitle>
              <DialogDescription>
                Erstellen Sie eine Überweisung oder Lastschrift.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Payment Type */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={newPayment.type === 'transfer' ? 'default' : 'outline'}
                  className="flex-1 gap-2"
                  onClick={() => setNewPayment({ ...newPayment, type: 'transfer' })}
                >
                  <ArrowUpRight className="h-4 w-4" />
                  Überweisung
                </Button>
                <Button
                  type="button"
                  variant={newPayment.type === 'direct_debit' ? 'default' : 'outline'}
                  className="flex-1 gap-2"
                  onClick={() => setNewPayment({ ...newPayment, type: 'direct_debit' })}
                >
                  <ArrowDownLeft className="h-4 w-4" />
                  Lastschrift
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Empfänger / Zahlungspflichtiger *</Label>
                <Input
                  placeholder="Name"
                  value={newPayment.creditor_name}
                  onChange={(e) => setNewPayment({ ...newPayment, creditor_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>IBAN *</Label>
                  <Input
                    placeholder="DE89 3704 0044 0532 0130 00"
                    value={newPayment.creditor_iban}
                    onChange={(e) => setNewPayment({ ...newPayment, creditor_iban: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>BIC (optional)</Label>
                  <Input
                    placeholder="COBADEFFXXX"
                    value={newPayment.creditor_bic}
                    onChange={(e) => setNewPayment({ ...newPayment, creditor_bic: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Betrag *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ausführungsdatum</Label>
                  <Input
                    type="date"
                    value={newPayment.execution_date}
                    onChange={(e) => setNewPayment({ ...newPayment, execution_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Verwendungszweck</Label>
                <Input
                  placeholder="Rechnung Nr. ..."
                  value={newPayment.reference}
                  onChange={(e) => setNewPayment({ ...newPayment, reference: e.target.value })}
                />
              </div>

              {/* Direct Debit specific fields */}
              {newPayment.type === 'direct_debit' && (
                <>
                  <div className="border-t pt-4 mt-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      SEPA-Lastschriftmandat
                    </Label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Mandatsreferenz</Label>
                      <Input
                        placeholder="MNDT-2024-001"
                        value={newPayment.mandate_id}
                        onChange={(e) => setNewPayment({ ...newPayment, mandate_id: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Mandatsdatum</Label>
                      <Input
                        type="date"
                        value={newPayment.mandate_date}
                        onChange={(e) => setNewPayment({ ...newPayment, mandate_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Sequenztyp</Label>
                    <Select
                      value={newPayment.sequence_type}
                      onValueChange={(value) =>
                        setNewPayment({ ...newPayment, sequence_type: value as typeof newPayment.sequence_type })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FRST">Erstlastschrift (FRST)</SelectItem>
                        <SelectItem value="RCUR">Folgelastschrift (RCUR)</SelectItem>
                        <SelectItem value="OOFF">Einmallastschrift (OOFF)</SelectItem>
                        <SelectItem value="FNAL">Letzte Lastschrift (FNAL)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleCreatePayment}>Zahlung erstellen</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card className="glass">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Überweisungen</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.totalTransfers}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-primary/10 shrink-0 ml-2">
                <ArrowUpRight className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Offen (Überw.)</p>
                <p className="text-lg sm:text-2xl font-bold truncate">{formatCurrency(stats.pendingTransferAmount)}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-warning/10 shrink-0 ml-2">
                <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Lastschriften</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.totalDirectDebits}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-success/10 shrink-0 ml-2">
                <ArrowDownLeft className="h-4 w-4 sm:h-6 sm:w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Offen (Last.)</p>
                <p className="text-lg sm:text-2xl font-bold truncate">{formatCurrency(stats.pendingDirectDebitAmount)}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-info/10 shrink-0 ml-2">
                <CreditCard className="h-4 w-4 sm:h-6 sm:w-6 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => {
        setActiveTab(v as typeof activeTab);
        setSelectedPayments([]);
      }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="transfers" className="flex-1 sm:flex-none gap-2">
              <ArrowUpRight className="h-4 w-4" />
              <span className="hidden sm:inline">Überweisungen</span>
              <span className="sm:hidden">Überw.</span>
            </TabsTrigger>
            <TabsTrigger value="direct_debits" className="flex-1 sm:flex-none gap-2">
              <ArrowDownLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Lastschriften</span>
              <span className="sm:hidden">Lastschr.</span>
            </TabsTrigger>
            <TabsTrigger value="batches" className="flex-1 sm:flex-none gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Exporte</span>
              <span className="sm:hidden">Exp.</span>
            </TabsTrigger>
          </TabsList>

          {activeTab !== 'batches' && selectedPayments.length > 0 && (
            <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default">
                  <Download className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">
                    {selectedPayments.length} Zahlung(en) exportieren
                  </span>
                  <span className="sm:hidden">Exportieren ({selectedPayments.length})</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>SEPA-XML Export</DialogTitle>
                  <DialogDescription>
                    Konfigurieren Sie die Absenderdaten für den Export.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Firmenname</Label>
                    <Input
                      value={exportConfig.company_name}
                      onChange={(e) => setExportConfig({ ...exportConfig, company_name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>IBAN</Label>
                      <Input
                        value={exportConfig.iban}
                        onChange={(e) => setExportConfig({ ...exportConfig, iban: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>BIC</Label>
                      <Input
                        value={exportConfig.bic}
                        onChange={(e) => setExportConfig({ ...exportConfig, bic: e.target.value })}
                      />
                    </div>
                  </div>
                  {activeTab === 'direct_debits' && (
                    <div className="space-y-2">
                      <Label>Gläubiger-ID</Label>
                      <Input
                        value={exportConfig.creditor_id}
                        onChange={(e) => setExportConfig({ ...exportConfig, creditor_id: e.target.value })}
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    XML exportieren
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <TabsContent value="transfers" className="mt-4">
          <PaymentList
            payments={filteredPayments}
            selectedPayments={selectedPayments}
            onToggleSelection={togglePaymentSelection}
            onDelete={deletePayment}
            onStatusChange={updatePaymentStatus}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="direct_debits" className="mt-4">
          <PaymentList
            payments={filteredPayments}
            selectedPayments={selectedPayments}
            onToggleSelection={togglePaymentSelection}
            onDelete={deletePayment}
            onStatusChange={updatePaymentStatus}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="batches" className="mt-4">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg">Export-Historie</CardTitle>
              <CardDescription>Alle exportierten SEPA-Dateien</CardDescription>
            </CardHeader>
            <CardContent>
              {batches.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Noch keine Exporte vorhanden.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {batches.map((batch) => (
                    <div key={batch.id} className="flex items-center gap-4 py-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{batch.message_id}</p>
                        <p className="text-sm text-muted-foreground">
                          {batch.payment_count} Zahlung(en) • {formatDate(batch.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(batch.total_amount)}</p>
                        <Badge variant="default">
                          {batch.type === 'transfer' ? 'Überweisung' : 'Lastschrift'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Payment list component
function PaymentList({
  payments,
  selectedPayments,
  onToggleSelection,
  onDelete,
  onStatusChange,
  formatCurrency,
  formatDate,
  getStatusBadge,
}: {
  payments: ReturnType<typeof useSepaPayments>['payments'];
  selectedPayments: string[];
  onToggleSelection: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: SepaPaymentStatus) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  getStatusBadge: (status: SepaPaymentStatus) => JSX.Element;
}) {
  if (payments.length === 0) {
    return (
      <Card className="glass">
        <CardContent className="p-8 text-center text-muted-foreground">
          Keine Zahlungen vorhanden.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass overflow-hidden">
      <div className="divide-y divide-border">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-secondary/30 transition-colors"
          >
            <Checkbox
              checked={selectedPayments.includes(payment.id)}
              onCheckedChange={() => onToggleSelection(payment.id)}
              disabled={payment.status === 'exported' || payment.status === 'executed'}
            />
            <div
              className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${
                payment.type === 'transfer'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-success/10 text-success'
              }`}
            >
              {payment.type === 'transfer' ? (
                <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <ArrowDownLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-base font-medium truncate">
                {payment.creditor_name}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {payment.reference || 'Kein Verwendungszweck'} • {formatDate(payment.execution_date)}
              </p>
            </div>
            <div className="hidden sm:block">
              {getStatusBadge(payment.status)}
            </div>
            <span className="text-sm sm:text-base font-semibold shrink-0">
              {formatCurrency(payment.amount)}
            </span>
            {payment.status === 'draft' && (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-destructive hover:text-destructive"
                onClick={() => onDelete(payment.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
