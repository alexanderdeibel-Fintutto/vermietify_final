 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
 import { useAuth } from "@/hooks/useAuth";
 import type { Database } from "@/integrations/supabase/types";
 
 type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];
 type TransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"];
 
 const PAYMENTS_KEY = "payments";
 
 export interface PaymentFilters {
   status?: "all" | "paid" | "pending" | "overdue" | "partial";
   tenantId?: string;
   buildingId?: string;
   startDate?: string;
   endDate?: string;
  type?: "rent" | "deposit" | "utility" | "repair" | "insurance" | "tax" | "other_income" | "other_expense";
 }
 
 export interface RecordPaymentData {
   leaseId: string;
   amount: number;
   transactionDate: string;
   paymentMethod: "transfer" | "direct_debit" | "cash";
   reference?: string;
   transactionType: "rent" | "deposit" | "utility";
 }
 
 export interface PartialPaymentData {
   leaseId: string;
   originalAmount: number;
   paidAmount: number;
   transactionDate: string;
   paymentMethod: "transfer" | "direct_debit" | "cash";
   reference?: string;
 }
 
 export function usePayments() {
   const { toast } = useToast();
   const queryClient = useQueryClient();
   const { profile } = useAuth();
 
   // Fetch all payments/transactions
   const usePaymentsList = (filters?: PaymentFilters) => {
     return useQuery({
       queryKey: [PAYMENTS_KEY, "list", filters],
       queryFn: async () => {
         let query = supabase
           .from("transactions")
           .select(`
             *,
             leases(
               id,
               rent_amount,
               utility_advance,
               payment_day,
               tenants(id, first_name, last_name, email),
               units(
                 id,
                 unit_number,
                 buildings(id, name, address)
               )
             )
           `)
           .order("transaction_date", { ascending: false });
 
         if (filters?.type) {
          query = query.eq("transaction_type", filters.type as any);
         }
 
         if (filters?.startDate) {
           query = query.gte("transaction_date", filters.startDate);
         }
 
         if (filters?.endDate) {
           query = query.lte("transaction_date", filters.endDate);
         }
 
         const { data, error } = await query;
 
         if (error) throw error;
         return data;
       },
       enabled: !!profile?.organization_id,
     });
   };
 
   // Get payment statistics
   const usePaymentStats = () => {
     return useQuery({
       queryKey: [PAYMENTS_KEY, "stats"],
       queryFn: async () => {
         const now = new Date();
         const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
         const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
 
         // Get this month's income
         const { data: incomeData, error: incomeError } = await supabase
           .from("transactions")
           .select("amount")
           .eq("is_income", true)
           .gte("transaction_date", startOfMonth)
           .lte("transaction_date", endOfMonth);
 
         if (incomeError) throw incomeError;
 
         const incomeThisMonth = incomeData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
 
         // Get active leases for expected payments
         const { data: leases, error: leasesError } = await supabase
           .from("leases")
           .select("id, rent_amount, utility_advance, payment_day")
           .eq("is_active", true);
 
         if (leasesError) throw leasesError;
 
         const expectedTotal = leases?.reduce(
           (sum, l) => sum + Number(l.rent_amount) + Number(l.utility_advance || 0),
           0
         ) || 0;
 
         const pending = Math.max(0, expectedTotal - incomeThisMonth);
         const paymentRate = expectedTotal > 0 ? (incomeThisMonth / expectedTotal) * 100 : 100;
 
         return {
           incomeThisMonth,
           pending,
           overdue: 0, // Calculated separately
           paymentRate: Math.round(paymentRate),
         };
       },
       enabled: !!profile?.organization_id,
     });
   };
 
   // Get monthly income for chart (last 12 months)
   const useMonthlyIncome = () => {
     return useQuery({
       queryKey: [PAYMENTS_KEY, "monthly-income"],
       queryFn: async () => {
         const months = [];
         const now = new Date();
 
         for (let i = 11; i >= 0; i--) {
           const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
           const startOfMonth = date.toISOString().split("T")[0];
           const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split("T")[0];
 
           months.push({
             month: date.toLocaleDateString("de-DE", { month: "short", year: "2-digit" }),
             startOfMonth,
             endOfMonth,
           });
         }
 
         const { data, error } = await supabase
           .from("transactions")
           .select("amount, transaction_date")
           .eq("is_income", true)
           .gte("transaction_date", months[0].startOfMonth);
 
         if (error) throw error;
 
         return months.map((m) => {
           const monthIncome = data
             ?.filter(
               (t) =>
                 t.transaction_date >= m.startOfMonth &&
                 t.transaction_date <= m.endOfMonth
             )
             .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
 
           return {
             month: m.month,
             income: monthIncome / 100, // Convert cents to EUR
           };
         });
       },
       enabled: !!profile?.organization_id,
     });
   };
 
   // Get due payments for this month
   const useDuePayments = () => {
     return useQuery({
       queryKey: [PAYMENTS_KEY, "due"],
       queryFn: async () => {
         const now = new Date();
         const today = now.getDate();
         const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
 
         // Get active leases
         const { data: leases, error } = await supabase
           .from("leases")
           .select(`
             id,
             rent_amount,
             utility_advance,
             payment_day,
             tenants(id, first_name, last_name, email),
             units(
               id,
               unit_number,
               buildings(id, name)
             )
           `)
           .eq("is_active", true);
 
         if (error) throw error;
 
         // Get this month's payments
         const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
         const { data: paidThisMonth } = await supabase
           .from("transactions")
           .select("lease_id, amount")
           .eq("transaction_type", "rent")
           .gte("transaction_date", startOfMonth);
 
         const paidLeaseIds = new Set(paidThisMonth?.map((p) => p.lease_id) || []);
 
         // Filter to unpaid leases with payment day >= today
         return leases
           ?.filter((l) => !paidLeaseIds.has(l.id) && (l.payment_day || 1) >= today)
           .map((l) => ({
             ...l,
             totalDue: Number(l.rent_amount) + Number(l.utility_advance || 0),
             dueDate: new Date(now.getFullYear(), now.getMonth(), l.payment_day || 1),
             daysRemaining: (l.payment_day || 1) - today,
           })) || [];
       },
       enabled: !!profile?.organization_id,
     });
   };
 
   // Get overdue payments
   const useOverduePayments = () => {
     return useQuery({
       queryKey: [PAYMENTS_KEY, "overdue"],
       queryFn: async () => {
         const now = new Date();
         const today = now.getDate();
 
         // Get active leases
         const { data: leases, error } = await supabase
           .from("leases")
           .select(`
             id,
             rent_amount,
             utility_advance,
             payment_day,
             tenants(id, first_name, last_name, email),
             units(
               id,
               unit_number,
               buildings(id, name)
             )
           `)
           .eq("is_active", true);
 
         if (error) throw error;
 
         // Get this month's payments
         const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
         const { data: paidThisMonth } = await supabase
           .from("transactions")
           .select("lease_id, amount")
           .eq("transaction_type", "rent")
           .gte("transaction_date", startOfMonth);
 
         const paidLeaseIds = new Set(paidThisMonth?.map((p) => p.lease_id) || []);
 
         // Filter to unpaid leases with payment day < today
         return leases
           ?.filter((l) => !paidLeaseIds.has(l.id) && (l.payment_day || 1) < today)
           .map((l) => ({
             ...l,
             totalDue: Number(l.rent_amount) + Number(l.utility_advance || 0),
             dueDate: new Date(now.getFullYear(), now.getMonth(), l.payment_day || 1),
             daysOverdue: today - (l.payment_day || 1),
           })) || [];
       },
       enabled: !!profile?.organization_id,
     });
   };
 
   // Record payment mutation
   const recordPayment = useMutation({
     mutationFn: async (data: RecordPaymentData) => {
       if (!profile?.organization_id) throw new Error("Organization not found");
 
       // Get lease details to find building
       const { data: lease, error: leaseError } = await supabase
         .from("leases")
         .select("unit_id, units(building_id)")
         .eq("id", data.leaseId)
         .single();
 
       if (leaseError) throw leaseError;
 
       const insertData: TransactionInsert = {
         organization_id: profile.organization_id,
         lease_id: data.leaseId,
         building_id: lease.units?.building_id || null,
         amount: data.amount, // Already in cents
         transaction_date: data.transactionDate,
         transaction_type: data.transactionType,
         is_income: true,
         description: data.reference || `${data.paymentMethod} - ${data.transactionType}`,
       };
 
       const { data: transaction, error } = await supabase
         .from("transactions")
         .insert(insertData)
         .select()
         .single();
 
       if (error) throw error;
       return transaction;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: [PAYMENTS_KEY] });
       toast({
         title: "Zahlung erfasst",
         description: "Die Zahlung wurde erfolgreich verbucht.",
       });
     },
     onError: (error: Error) => {
       toast({
         title: "Fehler",
         description: error.message || "Die Zahlung konnte nicht erfasst werden.",
         variant: "destructive",
       });
     },
   });
 
   // Record partial payment mutation
   const recordPartialPayment = useMutation({
     mutationFn: async (data: PartialPaymentData) => {
       if (!profile?.organization_id) throw new Error("Organization not found");
 
       const { data: lease, error: leaseError } = await supabase
         .from("leases")
         .select("unit_id, units(building_id)")
         .eq("id", data.leaseId)
         .single();
 
       if (leaseError) throw leaseError;
 
       const remaining = data.originalAmount - data.paidAmount;
 
       const insertData: TransactionInsert = {
         organization_id: profile.organization_id,
         lease_id: data.leaseId,
         building_id: lease.units?.building_id || null,
         amount: data.paidAmount,
         transaction_date: data.transactionDate,
         transaction_type: "rent",
         is_income: true,
         description: `Teilzahlung (Restbetrag: ${(remaining / 100).toFixed(2)}€)`,
       };
 
       const { data: transaction, error } = await supabase
         .from("transactions")
         .insert(insertData)
         .select()
         .single();
 
       if (error) throw error;
       return transaction;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: [PAYMENTS_KEY] });
       toast({
         title: "Teilzahlung erfasst",
         description: "Die Teilzahlung wurde erfolgreich verbucht.",
       });
     },
     onError: (error: Error) => {
       toast({
         title: "Fehler",
         description: error.message || "Die Teilzahlung konnte nicht erfasst werden.",
         variant: "destructive",
       });
     },
   });
 
   return {
     usePaymentsList,
     usePaymentStats,
     useMonthlyIncome,
     useDuePayments,
     useOverduePayments,
     recordPayment,
     recordPartialPayment,
   };
 }