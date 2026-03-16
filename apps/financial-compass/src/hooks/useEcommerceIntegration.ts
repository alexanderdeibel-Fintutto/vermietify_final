import { useState, useEffect, useCallback } from 'react';
import { useCompany } from '@/contexts/CompanyContext';

export type EcommercePlatform = 'shopify' | 'woocommerce' | 'amazon' | 'ebay';
export type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'syncing';

export interface EcommerceConnection {
  id: string;
  company_id: string;
  platform: EcommercePlatform;
  store_name: string;
  store_url: string;
  status: ConnectionStatus;
  last_sync_at?: string;
  order_count: number;
  revenue_total: number;
  auto_sync_enabled: boolean;
  sync_interval_hours: number;
  created_at: string;
  settings: ConnectionSettings;
}

export interface ConnectionSettings {
  import_orders: boolean;
  import_products: boolean;
  import_customers: boolean;
  auto_create_invoices: boolean;
  auto_create_transactions: boolean;
  default_revenue_account: string;
  default_tax_rate: number;
  order_status_filter: string[];
}

export interface EcommerceOrder {
  id: string;
  connection_id: string;
  order_number: string;
  platform_order_id: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed';
  items: OrderItem[];
  order_date: string;
  imported_at: string;
  invoice_created: boolean;
  invoice_id?: string;
  transaction_created: boolean;
  transaction_id?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  sku?: string;
  quantity: number;
  price: number;
  tax_rate: number;
}

export interface SyncResult {
  orders_imported: number;
  orders_updated: number;
  invoices_created: number;
  transactions_created: number;
  errors: string[];
}

const CONNECTIONS_STORAGE_KEY = 'fintutto_ecommerce_connections';
const ORDERS_STORAGE_KEY = 'fintutto_ecommerce_orders';

export function useEcommerceIntegration() {
  const { currentCompany } = useCompany();
  const [connections, setConnections] = useState<EcommerceConnection[]>([]);
  const [orders, setOrders] = useState<EcommerceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Load data from localStorage
  useEffect(() => {
    if (!currentCompany) return;

    const storedConnections = localStorage.getItem(`${CONNECTIONS_STORAGE_KEY}_${currentCompany.id}`);
    const storedOrders = localStorage.getItem(`${ORDERS_STORAGE_KEY}_${currentCompany.id}`);

    if (storedConnections) {
      try {
        setConnections(JSON.parse(storedConnections));
      } catch {
        setConnections([]);
      }
    } else {
      // Demo connection
      setConnections([
        {
          id: 'conn-1',
          company_id: currentCompany.id,
          platform: 'shopify',
          store_name: 'Mein Onlineshop',
          store_url: 'https://mein-shop.myshopify.com',
          status: 'connected',
          last_sync_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          order_count: 156,
          revenue_total: 45780.50,
          auto_sync_enabled: true,
          sync_interval_hours: 4,
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          settings: getDefaultSettings(),
        },
      ]);
    }

    if (storedOrders) {
      try {
        setOrders(JSON.parse(storedOrders));
      } catch {
        setOrders([]);
      }
    } else {
      // Demo orders
      setOrders([
        {
          id: 'order-1',
          connection_id: 'conn-1',
          order_number: '#1001',
          platform_order_id: 'shop_12345',
          customer_name: 'Max Mustermann',
          customer_email: 'max@example.com',
          total_amount: 129.99,
          subtotal: 109.24,
          tax_amount: 20.75,
          shipping_amount: 4.99,
          currency: 'EUR',
          status: 'completed',
          payment_status: 'paid',
          items: [
            { id: 'item-1', name: 'Premium Widget', sku: 'WID-001', quantity: 2, price: 54.99, tax_rate: 19 },
          ],
          order_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          imported_at: new Date().toISOString(),
          invoice_created: true,
          invoice_id: 'inv-123',
          transaction_created: true,
          transaction_id: 'tx-456',
        },
        {
          id: 'order-2',
          connection_id: 'conn-1',
          order_number: '#1002',
          platform_order_id: 'shop_12346',
          customer_name: 'Anna Schmidt',
          customer_email: 'anna@example.com',
          total_amount: 79.50,
          subtotal: 66.81,
          tax_amount: 12.69,
          shipping_amount: 0,
          currency: 'EUR',
          status: 'processing',
          payment_status: 'paid',
          items: [
            { id: 'item-2', name: 'Standard Widget', sku: 'WID-002', quantity: 1, price: 79.50, tax_rate: 19 },
          ],
          order_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          imported_at: new Date().toISOString(),
          invoice_created: false,
          transaction_created: false,
        },
      ]);
    }

    setLoading(false);
  }, [currentCompany]);

  // Save functions
  const saveConnections = useCallback((list: EcommerceConnection[]) => {
    if (!currentCompany) return;
    localStorage.setItem(`${CONNECTIONS_STORAGE_KEY}_${currentCompany.id}`, JSON.stringify(list));
    setConnections(list);
  }, [currentCompany]);

  const saveOrders = useCallback((list: EcommerceOrder[]) => {
    if (!currentCompany) return;
    localStorage.setItem(`${ORDERS_STORAGE_KEY}_${currentCompany.id}`, JSON.stringify(list));
    setOrders(list);
  }, [currentCompany]);

  // Create new connection
  const createConnection = useCallback((data: {
    platform: EcommercePlatform;
    store_name: string;
    store_url: string;
  }) => {
    if (!currentCompany) return null;

    const newConnection: EcommerceConnection = {
      id: `conn-${Date.now()}`,
      company_id: currentCompany.id,
      platform: data.platform,
      store_name: data.store_name,
      store_url: data.store_url,
      status: 'connected',
      order_count: 0,
      revenue_total: 0,
      auto_sync_enabled: true,
      sync_interval_hours: 4,
      created_at: new Date().toISOString(),
      settings: getDefaultSettings(),
    };

    saveConnections([newConnection, ...connections]);
    return newConnection;
  }, [currentCompany, connections, saveConnections]);

  // Disconnect a store
  const disconnectStore = useCallback((connectionId: string) => {
    const updated = connections.map(c =>
      c.id === connectionId
        ? { ...c, status: 'disconnected' as ConnectionStatus }
        : c
    );
    saveConnections(updated);
  }, [connections, saveConnections]);

  // Reconnect a store
  const reconnectStore = useCallback((connectionId: string) => {
    const updated = connections.map(c =>
      c.id === connectionId
        ? { ...c, status: 'connected' as ConnectionStatus }
        : c
    );
    saveConnections(updated);
  }, [connections, saveConnections]);

  // Delete connection
  const deleteConnection = useCallback((connectionId: string) => {
    const filtered = connections.filter(c => c.id !== connectionId);
    saveConnections(filtered);
    // Also remove associated orders
    const filteredOrders = orders.filter(o => o.connection_id !== connectionId);
    saveOrders(filteredOrders);
  }, [connections, orders, saveConnections, saveOrders]);

  // Update connection settings
  const updateConnectionSettings = useCallback((connectionId: string, settings: Partial<ConnectionSettings>) => {
    const updated = connections.map(c =>
      c.id === connectionId
        ? { ...c, settings: { ...c.settings, ...settings } }
        : c
    );
    saveConnections(updated);
  }, [connections, saveConnections]);

  // Toggle auto sync
  const toggleAutoSync = useCallback((connectionId: string, enabled: boolean) => {
    const updated = connections.map(c =>
      c.id === connectionId
        ? { ...c, auto_sync_enabled: enabled }
        : c
    );
    saveConnections(updated);
  }, [connections, saveConnections]);

  // Sync orders (simulated)
  const syncOrders = useCallback(async (connectionId: string): Promise<SyncResult> => {
    setSyncing(true);

    // Update connection status
    const updatedConnections = connections.map(c =>
      c.id === connectionId
        ? { ...c, status: 'syncing' as ConnectionStatus }
        : c
    );
    saveConnections(updatedConnections);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate some new demo orders
    const newOrders: EcommerceOrder[] = [
      {
        id: `order-${Date.now()}`,
        connection_id: connectionId,
        order_number: `#${1003 + Math.floor(Math.random() * 100)}`,
        platform_order_id: `shop_${Date.now()}`,
        customer_name: 'Neuer Kunde',
        customer_email: 'kunde@example.com',
        total_amount: 50 + Math.random() * 200,
        subtotal: 0,
        tax_amount: 0,
        shipping_amount: Math.random() > 0.5 ? 4.99 : 0,
        currency: 'EUR',
        status: 'completed',
        payment_status: 'paid',
        items: [
          { id: `item-${Date.now()}`, name: 'Produkt', quantity: 1, price: 50 + Math.random() * 200, tax_rate: 19 },
        ],
        order_date: new Date().toISOString(),
        imported_at: new Date().toISOString(),
        invoice_created: false,
        transaction_created: false,
      },
    ];

    // Calculate subtotal and tax
    newOrders.forEach(order => {
      order.subtotal = order.total_amount - order.shipping_amount;
      order.tax_amount = order.subtotal * 0.19;
      order.subtotal = order.subtotal / 1.19;
    });

    // Update orders
    const allOrders = [...newOrders, ...orders];
    saveOrders(allOrders);

    // Update connection stats
    const connection = connections.find(c => c.id === connectionId);
    if (connection) {
      const connectionOrders = allOrders.filter(o => o.connection_id === connectionId);
      const finalConnections = connections.map(c =>
        c.id === connectionId
          ? {
              ...c,
              status: 'connected' as ConnectionStatus,
              last_sync_at: new Date().toISOString(),
              order_count: connectionOrders.length,
              revenue_total: connectionOrders.reduce((sum, o) => sum + o.total_amount, 0),
            }
          : c
      );
      saveConnections(finalConnections);
    }

    setSyncing(false);

    return {
      orders_imported: newOrders.length,
      orders_updated: 0,
      invoices_created: 0,
      transactions_created: 0,
      errors: [],
    };
  }, [connections, orders, saveConnections, saveOrders]);

  // Create invoice from order
  const createInvoiceFromOrder = useCallback((orderId: string) => {
    const updated = orders.map(o =>
      o.id === orderId
        ? { ...o, invoice_created: true, invoice_id: `inv-${Date.now()}` }
        : o
    );
    saveOrders(updated);
  }, [orders, saveOrders]);

  // Create transaction from order
  const createTransactionFromOrder = useCallback((orderId: string) => {
    const updated = orders.map(o =>
      o.id === orderId
        ? { ...o, transaction_created: true, transaction_id: `tx-${Date.now()}` }
        : o
    );
    saveOrders(updated);
  }, [orders, saveOrders]);

  // Get orders for a connection
  const getOrdersForConnection = useCallback((connectionId: string) => {
    return orders.filter(o => o.connection_id === connectionId);
  }, [orders]);

  // Get statistics
  const getStats = useCallback(() => {
    const activeConnections = connections.filter(c => c.status === 'connected');
    const totalRevenue = connections.reduce((sum, c) => sum + c.revenue_total, 0);
    const pendingOrders = orders.filter(o => !o.invoice_created);

    return {
      totalConnections: connections.length,
      activeConnections: activeConnections.length,
      totalOrders: orders.length,
      totalRevenue,
      pendingOrders: pendingOrders.length,
    };
  }, [connections, orders]);

  // Get platform info
  const getPlatformInfo = useCallback((platform: EcommercePlatform) => {
    const platforms = {
      shopify: { name: 'Shopify', color: 'bg-green-500', icon: '🛍️' },
      woocommerce: { name: 'WooCommerce', color: 'bg-purple-500', icon: '🔌' },
      amazon: { name: 'Amazon', color: 'bg-orange-500', icon: '📦' },
      ebay: { name: 'eBay', color: 'bg-blue-500', icon: '🏷️' },
    };
    return platforms[platform];
  }, []);

  return {
    connections,
    orders,
    loading,
    syncing,
    createConnection,
    disconnectStore,
    reconnectStore,
    deleteConnection,
    updateConnectionSettings,
    toggleAutoSync,
    syncOrders,
    createInvoiceFromOrder,
    createTransactionFromOrder,
    getOrdersForConnection,
    getStats,
    getPlatformInfo,
  };
}

function getDefaultSettings(): ConnectionSettings {
  return {
    import_orders: true,
    import_products: false,
    import_customers: true,
    auto_create_invoices: false,
    auto_create_transactions: false,
    default_revenue_account: '8400',
    default_tax_rate: 19,
    order_status_filter: ['completed', 'processing'],
  };
}
