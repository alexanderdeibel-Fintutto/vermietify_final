import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  ClipboardList,
  FileText,
  Truck,
  Package,
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

interface OrderConfirmation {
  id: string;
  order_number: string;
  contact_id: string | null;
  contact_name?: string;
  quote_number?: string;
  status: 'draft' | 'confirmed' | 'in_production' | 'shipped' | 'delivered' | 'cancelled';
  amount: number;
  tax_amount: number;
  delivery_date: string;
  issue_date: string;
  description: string | null;
  items: OrderItem[];
  created_at: string;
}

interface OrderItem {
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
}

const STORAGE_KEY = 'fintutto_order_confirmations';

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  confirmed: 'bg-info/20 text-info',
  in_production: 'bg-warning/20 text-warning',
  shipped: 'bg-purple-500/20 text-purple-400',
  delivered: 'bg-success/20 text-success',
  cancelled: 'bg-destructive/20 text-destructive',
};

const statusLabels: Record<string, string> = {
  draft: 'Entwurf',
  confirmed: 'Bestätigt',
  in_production: 'In Bearbeitung',
  shipped: 'Versendet',
  delivered: 'Geliefert',
  cancelled: 'Storniert',
};

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  draft: FileText,
  confirmed: CheckCircle,
  in_production: Clock,
  shipped: Truck,
  delivered: Package,
  cancelled: XCircle,
};

function getStoredOrders(): OrderConfirmation[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveOrders(orders: OrderConfirmation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

export default function OrderConfirmations() {
  const { currentCompany } = useCompany();
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderConfirmation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderConfirmation | null>(null);

  const [formData, setFormData] = useState({
    contact_id: '',
    description: '',
    delivery_days: '14',
    items: [{ description: '', quantity: 1, unit_price: 0, tax_rate: 19 }] as OrderItem[],
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

    // Load orders from localStorage
    const allOrders = getStoredOrders();
    const companyOrders = allOrders.filter((o) => (o as any).company_id === currentCompany.id);

    // Enrich with contact names
    const enrichedOrders = companyOrders.map((order) => {
      const contact = contactsData?.find((c) => c.id === order.contact_id);
      return { ...order, contact_name: contact?.name };
    });

    setOrders(enrichedOrders);
    setLoading(false);
  };

  const generateOrderNumber = () => {
    const year = new Date().getFullYear();
    const count = orders.filter((o) => o.order_number.startsWith(`AB-${year}`)).length + 1;
    return `AB-${year}-${count.toString().padStart(4, '0')}`;
  };

  const calculateTotals = (items: OrderItem[]) => {
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
      delivery_days: '14',
      items: [{ description: '', quantity: 1, unit_price: 0, tax_rate: 19 }],
    });
    setSelectedOrder(null);
  };

  const handleOpenDialog = (order?: OrderConfirmation) => {
    if (order) {
      setSelectedOrder(order);
      setFormData({
        contact_id: order.contact_id || '',
        description: order.description || '',
        delivery_days: '14',
        items: order.items.length > 0 ? order.items : [{ description: '', quantity: 1, unit_price: 0, tax_rate: 19 }],
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

  const handleItemChange = (index: number, field: keyof OrderItem, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const handleSave = async () => {
    if (!currentCompany) return;

    const deliveryDays = parseInt(formData.delivery_days) || 14;
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);

    const { netAmount, taxAmount, grossAmount } = calculateTotals(formData.items);

    const orderData: OrderConfirmation = {
      id: selectedOrder?.id || crypto.randomUUID(),
      order_number: selectedOrder?.order_number || generateOrderNumber(),
      contact_id: formData.contact_id || null,
      status: selectedOrder?.status || 'draft',
      amount: grossAmount,
      tax_amount: taxAmount,
      delivery_date: deliveryDate.toISOString().split('T')[0],
      issue_date: selectedOrder?.issue_date || new Date().toISOString().split('T')[0],
      description: formData.description || null,
      items: formData.items,
      created_at: selectedOrder?.created_at || new Date().toISOString(),
    };

    const allOrders = getStoredOrders();

    if (selectedOrder) {
      const index = allOrders.findIndex((o) => o.id === selectedOrder.id);
      if (index !== -1) {
        allOrders[index] = { ...orderData, company_id: currentCompany.id } as any;
      }
    } else {
      allOrders.push({ ...orderData, company_id: currentCompany.id } as any);
    }

    saveOrders(allOrders);

    toast({
      title: 'Erfolg',
      description: selectedOrder ? 'Auftragsbestätigung wurde aktualisiert.' : 'Auftragsbestätigung wurde erstellt.',
    });

    setDialogOpen(false);
    resetForm();
    fetchData();
  };

  const handleStatusChange = async (order: OrderConfirmation, newStatus: OrderConfirmation['status']) => {
    const allOrders = getStoredOrders();
    const index = allOrders.findIndex((o) => o.id === order.id);

    if (index !== -1) {
      allOrders[index] = { ...allOrders[index], status: newStatus };
      saveOrders(allOrders);

      toast({
        title: 'Status aktualisiert',
        description: `Auftrag ${order.order_number} ist jetzt "${statusLabels[newStatus]}".`,
      });

      fetchData();
    }
  };

  const handleConvertToInvoice = async (order: OrderConfirmation) => {
    if (!currentCompany) return;

    // Create invoice from order
    const invoiceNumber = `RE-${new Date().getFullYear()}-${(Math.floor(Math.random() * 10000)).toString().padStart(4, '0')}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const { error } = await supabase.from('invoices').insert({
      company_id: currentCompany.id,
      invoice_number: invoiceNumber,
      type: 'outgoing',
      status: 'draft',
      amount: order.amount,
      tax_amount: order.tax_amount,
      contact_id: order.contact_id,
      description: `Aus Auftragsbestätigung ${order.order_number}: ${order.description || ''}`,
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
      toast({
        title: 'Rechnung erstellt',
        description: `Rechnung ${invoiceNumber} wurde aus der Auftragsbestätigung erstellt.`,
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedOrder) return;

    const allOrders = getStoredOrders();
    const filtered = allOrders.filter((o) => o.id !== selectedOrder.id);
    saveOrders(filtered);

    toast({
      title: 'Erfolg',
      description: 'Auftragsbestätigung wurde gelöscht.',
    });

    setDeleteDialogOpen(false);
    setSelectedOrder(null);
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

  const filteredOrders = orders.filter(
    (o) =>
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.contact_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Statistics
  const totalOrders = orders.length;
  const totalAmount = orders.reduce((sum, o) => sum + o.amount, 0);
  const deliveredAmount = orders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + o.amount, 0);
  const inProgressAmount = orders
    .filter((o) => ['confirmed', 'in_production', 'shipped'].includes(o.status))
    .reduce((sum, o) => sum + o.amount, 0);

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
          <h1 className="text-3xl font-bold mb-2">Auftragsbestätigungen</h1>
          <p className="text-muted-foreground">Verwalten Sie Ihre Auftragsbestätigungen</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Neue Auftragsbestätigung
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aufträge gesamt</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
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
                <Package className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Geliefert</p>
                <p className="text-2xl font-bold text-success">{formatCurrency(deliveredAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Truck className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Bearbeitung</p>
                <p className="text-2xl font-bold text-warning">{formatCurrency(inProgressAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Auftrag suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-secondary/50"
        />
      </div>

      {/* Orders List */}
      <Card className="glass">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Laden...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Keine Auftragsbestätigungen vorhanden</p>
              <Button className="mt-4" variant="outline" onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Erste Auftragsbestätigung erstellen
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredOrders.map((order) => {
                const StatusIcon = statusIcons[order.status];

                return (
                  <div
                    key={order.id}
                    className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-primary/10">
                      <StatusIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{order.order_number}</p>
                        <Badge className={statusColors[order.status]}>
                          {statusLabels[order.status]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {order.contact_name || 'Kein Kunde'} • Lieferung: {formatDate(order.delivery_date)}
                      </p>
                    </div>
                    <span className="font-semibold">{formatCurrency(order.amount)}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(order)}>
                          <FileText className="mr-2 h-4 w-4" />
                          Bearbeiten
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleStatusChange(order, 'confirmed')}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Als bestätigt markieren
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(order, 'in_production')}>
                          <Clock className="mr-2 h-4 w-4" />
                          In Bearbeitung
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(order, 'shipped')}>
                          <Truck className="mr-2 h-4 w-4" />
                          Versendet
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(order, 'delivered')}>
                          <Package className="mr-2 h-4 w-4" />
                          Geliefert
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleConvertToInvoice(order)}>
                          <ArrowRight className="mr-2 h-4 w-4" />
                          In Rechnung umwandeln
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedOrder(order);
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
              {selectedOrder ? 'Auftragsbestätigung bearbeiten' : 'Neue Auftragsbestätigung'}
            </DialogTitle>
            <DialogDescription>
              {selectedOrder
                ? `Bearbeiten Sie die Auftragsbestätigung ${selectedOrder.order_number}.`
                : 'Erstellen Sie eine neue Auftragsbestätigung.'}
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
                <Label htmlFor="delivery_days">Lieferzeit (Tage)</Label>
                <Input
                  id="delivery_days"
                  type="number"
                  min="1"
                  value={formData.delivery_days}
                  onChange={(e) => setFormData({ ...formData, delivery_days: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung / Betreff</Label>
              <Textarea
                id="description"
                placeholder="z.B. Bestellung #1234, Projektauftrag..."
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
              {selectedOrder ? 'Speichern' : 'Auftragsbestätigung erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Auftragsbestätigung löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie die Auftragsbestätigung "{selectedOrder?.order_number}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
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
