import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  FileCheck,
  FileText,
  Send,
  Copy,
  Trash2,
  MoreHorizontal,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Contact {
  id: string;
  name: string;
  email: string | null;
}

interface Quote {
  id: string;
  quote_number: string;
  contact_id: string | null;
  contact_name?: string;
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'expired';
  amount: number;
  tax_amount: number;
  valid_until: string;
  issue_date: string;
  description: string | null;
  items: QuoteItem[];
  created_at: string;
}

interface QuoteItem {
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
}

const STORAGE_KEY = 'fintutto_quotes';

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-info/20 text-info',
  accepted: 'bg-success/20 text-success',
  declined: 'bg-destructive/20 text-destructive',
  expired: 'bg-muted text-muted-foreground',
};

const statusLabels: Record<string, string> = {
  draft: 'Entwurf',
  sent: 'Versendet',
  accepted: 'Angenommen',
  declined: 'Abgelehnt',
  expired: 'Abgelaufen',
};

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  draft: FileText,
  sent: Send,
  accepted: CheckCircle,
  declined: XCircle,
  expired: Clock,
};

function getStoredQuotes(): Quote[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveQuotes(quotes: Quote[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
}

export default function Quotes() {
  const { currentCompany } = useCompany();
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  const [formData, setFormData] = useState({
    contact_id: '',
    description: '',
    valid_days: '30',
    items: [{ description: '', quantity: 1, unit_price: 0, tax_rate: 19 }] as QuoteItem[],
  });

  useEffect(() => {
    if (currentCompany) {
      fetchData();
    }
  }, [currentCompany]);

  const fetchData = async () => {
    if (!currentCompany) return;
    setLoading(true);

    // Fetch contacts from Supabase
    const { data: contactsData } = await supabase
      .from('contacts')
      .select('id, name, email')
      .eq('company_id', currentCompany.id);

    if (contactsData) {
      setContacts(contactsData);
    }

    // Load quotes from localStorage
    const allQuotes = getStoredQuotes();
    const companyQuotes = allQuotes.filter((q) => (q as any).company_id === currentCompany.id);

    // Enrich with contact names
    const enrichedQuotes = companyQuotes.map((quote) => {
      const contact = contactsData?.find((c) => c.id === quote.contact_id);
      return { ...quote, contact_name: contact?.name };
    });

    setQuotes(enrichedQuotes);
    setLoading(false);
  };

  const generateQuoteNumber = () => {
    const year = new Date().getFullYear();
    const count = quotes.filter((q) => q.quote_number.startsWith(`ANG-${year}`)).length + 1;
    return `ANG-${year}-${count.toString().padStart(4, '0')}`;
  };

  const calculateTotals = (items: QuoteItem[]) => {
    const netAmount = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    const taxAmount = items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price * (item.tax_rate / 100),
      0
    );
    return { netAmount, taxAmount, grossAmount: netAmount + taxAmount };
  };

  const resetForm = () => {
    setFormData({
      contact_id: '',
      description: '',
      valid_days: '30',
      items: [{ description: '', quantity: 1, unit_price: 0, tax_rate: 19 }],
    });
    setSelectedQuote(null);
  };

  const handleOpenDialog = (quote?: Quote) => {
    if (quote) {
      setSelectedQuote(quote);
      setFormData({
        contact_id: quote.contact_id || '',
        description: quote.description || '',
        valid_days: '30',
        items: quote.items.length > 0 ? quote.items : [{ description: '', quantity: 1, unit_price: 0, tax_rate: 19 }],
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unit_price: 0, tax_rate: 19 }],
    });
  };

  const handleRemoveItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData({
        ...formData,
        items: formData.items.filter((_, i) => i !== index),
      });
    }
  };

  const handleItemChange = (index: number, field: keyof QuoteItem, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const handleSave = async () => {
    if (!currentCompany) return;

    const validDays = parseInt(formData.valid_days) || 30;
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);

    const { netAmount, taxAmount, grossAmount } = calculateTotals(formData.items);

    const quoteData: Quote = {
      id: selectedQuote?.id || crypto.randomUUID(),
      quote_number: selectedQuote?.quote_number || generateQuoteNumber(),
      contact_id: formData.contact_id || null,
      status: selectedQuote?.status || 'draft',
      amount: grossAmount,
      tax_amount: taxAmount,
      valid_until: validUntil.toISOString().split('T')[0],
      issue_date: selectedQuote?.issue_date || new Date().toISOString().split('T')[0],
      description: formData.description || null,
      items: formData.items,
      created_at: selectedQuote?.created_at || new Date().toISOString(),
    };

    const allQuotes = getStoredQuotes();

    if (selectedQuote) {
      const index = allQuotes.findIndex((q) => q.id === selectedQuote.id);
      if (index !== -1) {
        allQuotes[index] = { ...quoteData, company_id: currentCompany.id } as any;
      }
    } else {
      allQuotes.push({ ...quoteData, company_id: currentCompany.id } as any);
    }

    saveQuotes(allQuotes);

    toast({
      title: 'Erfolg',
      description: selectedQuote ? 'Angebot wurde aktualisiert.' : 'Angebot wurde erstellt.',
    });

    setDialogOpen(false);
    resetForm();
    fetchData();
  };

  const handleStatusChange = async (quote: Quote, newStatus: Quote['status']) => {
    const allQuotes = getStoredQuotes();
    const index = allQuotes.findIndex((q) => q.id === quote.id);

    if (index !== -1) {
      allQuotes[index] = { ...allQuotes[index], status: newStatus };
      saveQuotes(allQuotes);

      toast({
        title: 'Status aktualisiert',
        description: `Angebot ${quote.quote_number} ist jetzt "${statusLabels[newStatus]}".`,
      });

      fetchData();
    }
  };

  const handleConvertToInvoice = async (quote: Quote) => {
    if (!currentCompany) return;

    // Create invoice from quote
    const invoiceNumber = `RE-${new Date().getFullYear()}-${(Math.floor(Math.random() * 10000)).toString().padStart(4, '0')}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const { error } = await supabase.from('invoices').insert({
      company_id: currentCompany.id,
      invoice_number: invoiceNumber,
      type: 'outgoing',
      status: 'draft',
      amount: quote.amount,
      tax_amount: quote.tax_amount,
      contact_id: quote.contact_id,
      description: `Aus Angebot ${quote.quote_number}: ${quote.description || ''}`,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
    });

    if (error) {
      toast({
        title: 'Fehler',
        description: 'Rechnung konnte nicht erstellt werden.',
        variant: 'destructive',
      });
    } else {
      // Update quote status
      handleStatusChange(quote, 'accepted');

      toast({
        title: 'Rechnung erstellt',
        description: `Rechnung ${invoiceNumber} wurde aus dem Angebot erstellt.`,
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedQuote) return;

    const allQuotes = getStoredQuotes();
    const filtered = allQuotes.filter((q) => q.id !== selectedQuote.id);
    saveQuotes(filtered);

    toast({
      title: 'Erfolg',
      description: 'Angebot wurde gelöscht.',
    });

    setDeleteDialogOpen(false);
    setSelectedQuote(null);
    fetchData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const filteredQuotes = quotes.filter(
    (q) =>
      q.quote_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.contact_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Statistics
  const totalQuotes = quotes.length;
  const totalAmount = quotes.reduce((sum, q) => sum + q.amount, 0);
  const acceptedAmount = quotes
    .filter((q) => q.status === 'accepted')
    .reduce((sum, q) => sum + q.amount, 0);
  const pendingAmount = quotes
    .filter((q) => q.status === 'sent')
    .reduce((sum, q) => sum + q.amount, 0);

  if (!currentCompany) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        Bitte wählen Sie eine Firma aus.
      </div>
    );
  }

  const { netAmount, taxAmount, grossAmount } = calculateTotals(formData.items);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Angebote</h1>
          <p className="text-muted-foreground">Erstellen und verwalten Sie Ihre Angebote</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Neues Angebot
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Angebote gesamt</p>
                <p className="text-2xl font-bold">{totalQuotes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <FileText className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gesamtvolumen</p>
                <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Angenommen</p>
                <p className="text-2xl font-bold text-success">{formatCurrency(acceptedAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ausstehend</p>
                <p className="text-2xl font-bold text-warning">{formatCurrency(pendingAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Angebot suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-secondary/50"
        />
      </div>

      {/* Quotes List */}
      <Card className="glass">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Laden...</div>
          ) : filteredQuotes.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Keine Angebote vorhanden</p>
              <Button className="mt-4" variant="outline" onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Erstes Angebot erstellen
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredQuotes.map((quote) => {
                const StatusIcon = statusIcons[quote.status];
                const isExpired = new Date(quote.valid_until) < new Date() && quote.status === 'sent';

                return (
                  <div
                    key={quote.id}
                    className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${isExpired ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                      <StatusIcon className={`h-5 w-5 ${isExpired ? 'text-destructive' : 'text-primary'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{quote.quote_number}</p>
                        <Badge className={statusColors[isExpired ? 'expired' : quote.status]}>
                          {statusLabels[isExpired ? 'expired' : quote.status]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {quote.contact_name || 'Kein Kunde'} • Gültig bis: {formatDate(quote.valid_until)}
                      </p>
                    </div>
                    <span className="font-semibold">{formatCurrency(quote.amount)}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(quote)}>
                          <FileText className="mr-2 h-4 w-4" />
                          Bearbeiten
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(quote, 'sent')}>
                          <Send className="mr-2 h-4 w-4" />
                          Als versendet markieren
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(quote, 'accepted')}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Als angenommen markieren
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleConvertToInvoice(quote)}>
                          <ArrowRight className="mr-2 h-4 w-4" />
                          In Rechnung umwandeln
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedQuote(quote);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Löschen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedQuote ? 'Angebot bearbeiten' : 'Neues Angebot'}
            </DialogTitle>
            <DialogDescription>
              {selectedQuote
                ? `Bearbeiten Sie das Angebot ${selectedQuote.quote_number}.`
                : 'Erstellen Sie ein neues Angebot für Ihren Kunden.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact">Kunde</Label>
                <Select
                  value={formData.contact_id}
                  onValueChange={(value) => setFormData({ ...formData, contact_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kunde wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="valid_days">Gültigkeit (Tage)</Label>
                <Input
                  id="valid_days"
                  type="number"
                  min="1"
                  value={formData.valid_days}
                  onChange={(e) => setFormData({ ...formData, valid_days: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung / Betreff</Label>
              <Textarea
                id="description"
                placeholder="z.B. Website-Redesign, Consulting-Paket..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Line Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Positionen</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                  <Plus className="mr-1 h-3 w-3" />
                  Position hinzufügen
                </Button>
              </div>
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    {index === 0 && <Label className="text-xs">Beschreibung</Label>}
                    <Input
                      placeholder="Leistung / Produkt"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    {index === 0 && <Label className="text-xs">Menge</Label>}
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="col-span-2">
                    {index === 0 && <Label className="text-xs">Preis</Label>}
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2">
                    {index === 0 && <Label className="text-xs">MwSt %</Label>}
                    <Select
                      value={item.tax_rate.toString()}
                      onValueChange={(value) => handleItemChange(index, 'tax_rate', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="7">7%</SelectItem>
                        <SelectItem value="19">19%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(index)}
                      disabled={formData.items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Netto</span>
                <span>{formatCurrency(netAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">MwSt</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Gesamt (Brutto)</span>
                <span>{formatCurrency(grossAmount)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSave}>
              {selectedQuote ? 'Speichern' : 'Angebot erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Angebot löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie das Angebot "{selectedQuote?.quote_number}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
