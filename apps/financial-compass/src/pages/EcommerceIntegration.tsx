import { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  RefreshCw,
  Link2,
  Link2Off,
  Settings,
  Package,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Euro,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
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
import { useEcommerceIntegration, EcommercePlatform, EcommerceConnection, EcommerceOrder } from '@/hooks/useEcommerceIntegration';
import { useToast } from '@/hooks/use-toast';

export default function EcommerceIntegration() {
  const { currentCompany } = useCompany();
  const { toast } = useToast();
  const {
    connections,
    orders,
    loading,
    syncing,
    createConnection,
    disconnectStore,
    reconnectStore,
    deleteConnection,
    toggleAutoSync,
    syncOrders,
    createInvoiceFromOrder,
    createTransactionFromOrder,
    getOrdersForConnection,
    getStats,
    getPlatformInfo,
  } = useEcommerceIntegration();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<EcommerceConnection | null>(null);
  const [activeTab, setActiveTab] = useState<'connections' | 'orders'>('connections');

  const [newConnection, setNewConnection] = useState({
    platform: 'shopify' as EcommercePlatform,
    store_name: '',
    store_url: '',
  });

  const stats = getStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      connected: { label: 'Verbunden', variant: 'default' },
      disconnected: { label: 'Getrennt', variant: 'secondary' },
      error: { label: 'Fehler', variant: 'destructive' },
      syncing: { label: 'Synchronisiert...', variant: 'outline' },
    };
    const { label, variant } = config[status] || { label: status, variant: 'secondary' };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getOrderStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      completed: { label: 'Abgeschlossen', variant: 'default' },
      processing: { label: 'In Bearbeitung', variant: 'outline' },
      pending: { label: 'Ausstehend', variant: 'secondary' },
      cancelled: { label: 'Storniert', variant: 'destructive' },
      refunded: { label: 'Erstattet', variant: 'destructive' },
    };
    const { label, variant } = config[status] || { label: status, variant: 'secondary' };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const handleCreateConnection = () => {
    if (!newConnection.store_name || !newConnection.store_url) {
      toast({
        title: 'Fehler',
        description: 'Bitte füllen Sie alle Pflichtfelder aus.',
        variant: 'destructive',
      });
      return;
    }

    const result = createConnection({
      platform: newConnection.platform,
      store_name: newConnection.store_name,
      store_url: newConnection.store_url,
    });

    if (result) {
      toast({
        title: 'Shop verbunden',
        description: `${result.store_name} wurde erfolgreich verbunden.`,
      });
      setCreateDialogOpen(false);
      setNewConnection({
        platform: 'shopify',
        store_name: '',
        store_url: '',
      });
    }
  };

  const handleSync = async (connectionId: string) => {
    const result = await syncOrders(connectionId);
    toast({
      title: 'Synchronisierung abgeschlossen',
      description: `${result.orders_imported} neue Bestellungen importiert.`,
    });
  };

  const handleCreateInvoice = (orderId: string) => {
    createInvoiceFromOrder(orderId);
    toast({
      title: 'Rechnung erstellt',
      description: 'Die Rechnung wurde aus der Bestellung erstellt.',
    });
  };

  const handleCreateTransaction = (orderId: string) => {
    createTransactionFromOrder(orderId);
    toast({
      title: 'Buchung erstellt',
      description: 'Die Buchung wurde aus der Bestellung erstellt.',
    });
  };

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
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">E-Commerce Integration</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Verbinden Sie Ihre Online-Shops
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Shop verbinden</span>
              <span className="sm:hidden">Verbinden</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Neuen Shop verbinden</DialogTitle>
              <DialogDescription>
                Verbinden Sie Ihren Online-Shop, um Bestellungen automatisch zu importieren.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Plattform</Label>
                <Select
                  value={newConnection.platform}
                  onValueChange={(v) => setNewConnection({ ...newConnection, platform: v as EcommercePlatform })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shopify">🛍️ Shopify</SelectItem>
                    <SelectItem value="woocommerce">🔌 WooCommerce</SelectItem>
                    <SelectItem value="amazon">📦 Amazon Seller</SelectItem>
                    <SelectItem value="ebay">🏷️ eBay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Shop-Name *</Label>
                <Input
                  placeholder="z.B. Mein Onlineshop"
                  value={newConnection.store_name}
                  onChange={(e) => setNewConnection({ ...newConnection, store_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Shop-URL *</Label>
                <Input
                  placeholder="https://mein-shop.myshopify.com"
                  value={newConnection.store_url}
                  onChange={(e) => setNewConnection({ ...newConnection, store_url: e.target.value })}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                API-Schlüssel werden nach der Verbindung sicher serverseitig gespeichert.
              </p>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleCreateConnection}>Shop verbinden</Button>
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
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Verbundene Shops</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.activeConnections}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-primary/10 shrink-0 ml-2">
                <ShoppingCart className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Bestellungen</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.totalOrders}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-success/10 shrink-0 ml-2">
                <Package className="h-4 w-4 sm:h-6 sm:w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Gesamtumsatz</p>
                <p className="text-lg sm:text-2xl font-bold truncate">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-info/10 shrink-0 ml-2">
                <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Ausstehend</p>
                <p className="text-lg sm:text-2xl font-bold text-warning">{stats.pendingOrders}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-warning/10 shrink-0 ml-2">
                <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="connections" className="flex-1 sm:flex-none gap-2">
            <Link2 className="h-4 w-4" />
            <span className="hidden sm:inline">Verbindungen</span>
            <span className="sm:hidden">Shops</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex-1 sm:flex-none gap-2">
            <Package className="h-4 w-4" />
            <span>Bestellungen</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="mt-4">
          {connections.length === 0 ? (
            <Card className="glass">
              <CardContent className="p-8 text-center text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Noch keine Shops verbunden.</p>
                <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ersten Shop verbinden
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {connections.map((connection) => {
                const platformInfo = getPlatformInfo(connection.platform);
                return (
                  <Card key={connection.id} className="glass">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className={`p-3 rounded-xl ${platformInfo.color} text-white text-2xl shrink-0`}>
                          {platformInfo.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-lg">{connection.store_name}</h3>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                {platformInfo.name}
                                <a
                                  href={connection.store_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center hover:text-primary"
                                >
                                  <ExternalLink className="h-3 w-3 ml-1" />
                                </a>
                              </p>
                            </div>
                            {getStatusBadge(connection.status)}
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Bestellungen</p>
                              <p className="font-semibold">{connection.order_count}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Umsatz</p>
                              <p className="font-semibold">{formatCurrency(connection.revenue_total)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Letzte Sync</p>
                              <p className="font-semibold text-sm">
                                {connection.last_sync_at ? formatDateTime(connection.last_sync_at) : 'Nie'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-muted-foreground">Auto-Sync</p>
                              <Switch
                                checked={connection.auto_sync_enabled}
                                onCheckedChange={(checked) => toggleAutoSync(connection.id, checked)}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex sm:flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 sm:flex-none"
                            onClick={() => handleSync(connection.id)}
                            disabled={syncing || connection.status === 'disconnected'}
                          >
                            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                            Sync
                          </Button>
                          {connection.status === 'connected' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 sm:flex-none"
                              onClick={() => disconnectStore(connection.id)}
                            >
                              <Link2Off className="mr-2 h-4 w-4" />
                              Trennen
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 sm:flex-none"
                              onClick={() => reconnectStore(connection.id)}
                            >
                              <Link2 className="mr-2 h-4 w-4" />
                              Verbinden
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            className="flex-1 sm:flex-none"
                            onClick={() => deleteConnection(connection.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Löschen
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <Card className="glass overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg">Importierte Bestellungen</CardTitle>
              <CardDescription>Alle Bestellungen aus verbundenen Shops</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {orders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Noch keine Bestellungen importiert.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {orders.map((order) => (
                    <div key={order.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Package className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">
                            {order.order_number} - {order.customer_name}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            {order.items.length} Artikel • {formatDate(order.order_date)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-4">
                        {getOrderStatusBadge(order.status)}
                        <span className="font-semibold">{formatCurrency(order.total_amount)}</span>
                      </div>

                      <div className="flex gap-2 mt-2 sm:mt-0">
                        {!order.invoice_created ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCreateInvoice(order.id)}
                          >
                            <FileText className="mr-1 h-3 w-3" />
                            <span className="hidden sm:inline">Rechnung</span>
                          </Button>
                        ) : (
                          <Badge variant="outline" className="text-success">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Rechnung
                          </Badge>
                        )}
                        {!order.transaction_created ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCreateTransaction(order.id)}
                          >
                            <Euro className="mr-1 h-3 w-3" />
                            <span className="hidden sm:inline">Buchung</span>
                          </Button>
                        ) : (
                          <Badge variant="outline" className="text-success">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Buchung
                          </Badge>
                        )}
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
