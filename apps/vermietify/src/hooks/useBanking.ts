 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/hooks/useAuth";
 import { toast } from "sonner";
 
 export interface BankConnection {
   id: string;
   organization_id: string;
   finapi_user_id: string | null;
   bank_id: string;
   bank_name: string;
   bank_logo_url: string | null;
   bank_bic: string | null;
   status: 'pending' | 'connected' | 'error' | 'update_required' | 'disconnected';
   last_sync_at: string | null;
   error_message: string | null;
   created_at: string;
   updated_at: string;
 }
 
 export interface BankAccount {
   id: string;
   connection_id: string;
   finapi_account_id: string | null;
   iban: string;
   account_name: string;
   account_type: 'checking' | 'savings' | 'credit_card' | 'loan' | 'securities' | 'other';
   balance_cents: number;
   balance_date: string | null;
   currency: string;
   is_active: boolean;
   created_at: string;
   updated_at: string;
   connection?: BankConnection;
 }
 
 export interface BankTransaction {
   id: string;
   account_id: string;
   finapi_transaction_id: string | null;
   booking_date: string;
   value_date: string | null;
   amount_cents: number;
   currency: string;
   counterpart_name: string | null;
   counterpart_iban: string | null;
   purpose: string | null;
   booking_text: string | null;
   transaction_type: 'rent' | 'deposit' | 'utility' | 'maintenance' | 'other';
   matched_payment_id: string | null;
   matched_tenant_id: string | null;
   matched_lease_id: string | null;
   match_status: 'unmatched' | 'auto' | 'manual' | 'ignored';
   match_confidence: number | null;
   matched_at: string | null;
   matched_by: string | null;
   created_at: string;
   account?: BankAccount;
   tenant?: {
     first_name: string;
     last_name: string;
   };
 }
 
 export interface TransactionRule {
   id: string;
   organization_id: string;
   name: string;
   description: string | null;
   conditions: Array<{ field: string; operator: string; value: string }>;
   action_type: 'assign_tenant' | 'book_as' | 'ignore';
   action_config: Record<string, unknown>;
   priority: number;
   is_active: boolean;
   match_count: number;
   last_match_at: string | null;
   created_at: string;
   updated_at: string;
 }
 
 export function useBanking() {
   const { profile } = useAuth();
   const queryClient = useQueryClient();
   const organizationId = profile?.organization_id;
 
   // Fetch connections
   const { data: connections = [], isLoading: connectionsLoading } = useQuery({
     queryKey: ['bank-connections', organizationId],
     queryFn: async () => {
       if (!organizationId) return [];
       const { data, error } = await supabase
         .from('finapi_connections')
         .select('*')
         .eq('organization_id', organizationId)
         .order('created_at', { ascending: false });
       if (error) throw error;
       return data as BankConnection[];
     },
     enabled: !!organizationId,
   });
 
   // Fetch accounts
   const { data: accounts = [], isLoading: accountsLoading } = useQuery({
     queryKey: ['bank-accounts', organizationId],
     queryFn: async () => {
       if (!organizationId) return [];
       const { data, error } = await supabase
         .from('bank_accounts')
         .select('*, connection:finapi_connections!inner(*)')
         .eq('is_active', true);
       if (error) throw error;
       // Filter by organization
       return (data as unknown as Array<BankAccount & { connection: BankConnection }>)
         .filter(a => a.connection.organization_id === organizationId);
     },
     enabled: !!organizationId,
   });
 
   // Fetch transactions
   const useTransactions = (filters?: {
     accountId?: string;
     startDate?: string;
     endDate?: string;
     type?: 'income' | 'expense' | 'all';
     matchStatus?: string;
   }) => {
     return useQuery({
       queryKey: ['bank-transactions', organizationId, filters],
       queryFn: async () => {
         if (!organizationId) return [];
         
         let query = supabase
           .from('bank_transactions')
           .select(`
             *,
             account:bank_accounts!inner(
               id, account_name, iban,
               connection:finapi_connections!inner(organization_id)
             ),
             tenant:tenants(first_name, last_name)
           `)
           .order('booking_date', { ascending: false });
 
         if (filters?.accountId) {
           query = query.eq('account_id', filters.accountId);
         }
         if (filters?.startDate) {
           query = query.gte('booking_date', filters.startDate);
         }
         if (filters?.endDate) {
           query = query.lte('booking_date', filters.endDate);
         }
         if (filters?.type === 'income') {
           query = query.gt('amount_cents', 0);
         } else if (filters?.type === 'expense') {
           query = query.lt('amount_cents', 0);
         }
         if (filters?.matchStatus && filters.matchStatus !== 'all') {
           query = query.eq('match_status', filters.matchStatus);
         }
 
         const { data, error } = await query;
         if (error) throw error;
         
         // Filter by organization
         return (data as unknown as Array<BankTransaction & { 
           account: { connection: { organization_id: string } } 
         }>).filter(t => t.account.connection.organization_id === organizationId);
       },
       enabled: !!organizationId,
     });
   };
 
   // Fetch rules
   const { data: rules = [], isLoading: rulesLoading } = useQuery({
     queryKey: ['transaction-rules', organizationId],
     queryFn: async () => {
       if (!organizationId) return [];
       const { data, error } = await supabase
         .from('transaction_rules')
         .select('*')
         .eq('organization_id', organizationId)
         .order('priority', { ascending: false });
       if (error) throw error;
       return data as TransactionRule[];
     },
     enabled: !!organizationId,
   });
 
   // Connect bank
   const connectBank = useMutation({
     mutationFn: async (bankData: { 
       bankId: string; 
       bankName: string; 
       bankLogo?: string;
       bankBic?: string;
     }) => {
       const { data, error } = await supabase.functions.invoke('finapi-connect', {
         body: bankData,
       });
       if (error) throw error;
       if (!data.success) throw new Error(data.error);
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['bank-connections'] });
       queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
       toast.success('Bank erfolgreich verbunden');
     },
     onError: (error) => {
       toast.error('Fehler beim Verbinden: ' + error.message);
     },
   });
 
   // Sync transactions
   const syncTransactions = useMutation({
     mutationFn: async (params?: { connectionId?: string; accountId?: string }) => {
       const { data, error } = await supabase.functions.invoke('finapi-sync', {
         body: params || {},
       });
       if (error) throw error;
       if (!data.success) throw new Error(data.error);
       return data;
     },
     onSuccess: (data) => {
       queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
       queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
       queryClient.invalidateQueries({ queryKey: ['bank-connections'] });
       toast.success(`${data.newTransactions} neue Transaktionen, ${data.matched} automatisch zugeordnet`);
     },
     onError: (error) => {
       toast.error('Fehler beim Synchronisieren: ' + error.message);
     },
   });
 
   // Match transaction
   const matchTransaction = useMutation({
     mutationFn: async (params: {
       transactionId: string;
       tenantId?: string;
       leaseId?: string;
       transactionType?: string;
       createRule?: boolean;
       ruleConditions?: Array<{ field: string; operator: string; value: string }>;
     }) => {
       const { data, error } = await supabase.functions.invoke('auto-match-transactions', {
         body: params,
       });
       if (error) throw error;
       if (!data.success) throw new Error(data.error);
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
       queryClient.invalidateQueries({ queryKey: ['transaction-rules'] });
       toast.success('Transaktion zugeordnet');
     },
     onError: (error) => {
       toast.error('Fehler beim Zuordnen: ' + error.message);
     },
   });
 
   // Ignore transaction
   const ignoreTransaction = useMutation({
     mutationFn: async (transactionId: string) => {
       const { error } = await supabase
         .from('bank_transactions')
         .update({ match_status: 'ignored' })
         .eq('id', transactionId);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
       toast.success('Transaktion ignoriert');
     },
   });
 
   // Delete connection
   const deleteConnection = useMutation({
     mutationFn: async (connectionId: string) => {
       const { error } = await supabase
         .from('finapi_connections')
         .delete()
         .eq('id', connectionId);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['bank-connections'] });
       queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
       toast.success('Verbindung getrennt');
     },
   });
 
   // Create rule
   const createRule = useMutation({
     mutationFn: async (rule: Partial<TransactionRule>) => {
       if (!organizationId) throw new Error('No organization');
       const { data, error } = await supabase
         .from('transaction_rules')
         .insert({ ...rule, organization_id: organizationId } as never)
         .select()
         .single();
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['transaction-rules'] });
       toast.success('Regel erstellt');
     },
   });
 
   // Update rule
   const updateRule = useMutation({
     mutationFn: async ({ id, ...updates }: Partial<TransactionRule> & { id: string }) => {
       const { error } = await supabase
         .from('transaction_rules')
         .update(updates as never)
         .eq('id', id);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['transaction-rules'] });
       toast.success('Regel aktualisiert');
     },
   });
 
   // Delete rule
   const deleteRule = useMutation({
     mutationFn: async (ruleId: string) => {
       const { error } = await supabase
         .from('transaction_rules')
         .delete()
         .eq('id', ruleId);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['transaction-rules'] });
       toast.success('Regel gelöscht');
     },
   });
 
   // Calculate stats
   const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance_cents, 0);
 
   return {
     connections,
     accounts,
     rules,
     totalBalance,
     isLoading: connectionsLoading || accountsLoading || rulesLoading,
     useTransactions,
     connectBank,
     syncTransactions,
     matchTransaction,
     ignoreTransaction,
     deleteConnection,
     createRule,
     updateRule,
     deleteRule,
   };
 }