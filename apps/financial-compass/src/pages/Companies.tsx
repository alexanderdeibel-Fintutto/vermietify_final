 import { useEffect, useState } from 'react';
 import { useCompany } from '@/contexts/CompanyContext';
 import { supabase } from '@/integrations/supabase/client';
 import { useToast } from '@/hooks/use-toast';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { NewCompanyDialog } from '@/components/company/NewCompanyDialog';
import { EditCompanyDialog } from '@/components/company/EditCompanyDialog';
import { Building2, Plus, Pencil, Trash2, ArrowRight, Receipt, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COMPANY_GRADIENTS, getCompanyGradient } from '@/lib/companyGradients';
 
 interface CompanyStats {
   transactionCount: number;
   totalRevenue: number;
 }
 
interface CompanyWithStats {
  id: string;
  name: string;
  legal_form?: string;
  tax_id?: string;
  vat_id?: string;
  address?: string;
  zip?: string;
  city?: string;
  chart_of_accounts?: string;
  theme_index?: number;
  stats: CompanyStats;
}
 
 const legalFormLabels: Record<string, string> = {
   gmbh: 'GmbH',
   ug: 'UG',
   ag: 'AG',
   kg: 'KG',
   ohg: 'OHG',
   gbr: 'GbR',
   einzelunternehmen: 'Einzelunternehmen',
 };
 
 const avatarColors = [
   'bg-blue-500',
   'bg-green-500',
   'bg-purple-500',
   'bg-orange-500',
   'bg-pink-500',
   'bg-cyan-500',
   'bg-amber-500',
 ];
 
 export default function Companies() {
   const { companies, currentCompany, setCurrentCompany, refetchCompanies } = useCompany();
   const { toast } = useToast();
   const [companiesWithStats, setCompaniesWithStats] = useState<CompanyWithStats[]>([]);
   const [loading, setLoading] = useState(true);
  const [newCompanyOpen, setNewCompanyOpen] = useState(false);
  const [editCompany, setEditCompany] = useState<CompanyWithStats | null>(null);
  const [deleteCompanyId, setDeleteCompanyId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
 
   useEffect(() => {
     fetchCompaniesWithStats();
   }, [companies]);
 
   const fetchCompaniesWithStats = async () => {
     setLoading(true);
     const enrichedCompanies: CompanyWithStats[] = [];
 
     for (const company of companies) {
       // Fetch transaction count
       const { count: transactionCount } = await supabase
         .from('transactions')
         .select('*', { count: 'exact', head: true })
         .eq('company_id', company.id);
 
       // Fetch total revenue (income transactions)
       const { data: incomeData } = await supabase
         .from('transactions')
         .select('amount')
         .eq('company_id', company.id)
         .eq('type', 'income');
 
       const totalRevenue = incomeData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
 
       // Fetch full company data with new fields
       const { data: fullCompany } = await supabase
         .from('companies')
         .select('*')
         .eq('id', company.id)
         .single();
 
        enrichedCompanies.push({
          id: company.id,
          name: company.name,
          legal_form: fullCompany?.legal_form,
          tax_id: fullCompany?.tax_id,
          vat_id: fullCompany?.vat_id,
          address: fullCompany?.address,
          zip: fullCompany?.zip,
          city: fullCompany?.city,
          chart_of_accounts: fullCompany?.chart_of_accounts,
          theme_index: fullCompany?.theme_index ?? 0,
          stats: {
            transactionCount: transactionCount || 0,
            totalRevenue,
          },
        });
     }
 
     setCompaniesWithStats(enrichedCompanies);
     setLoading(false);
   };
 
   const handleSwitchCompany = (company: CompanyWithStats) => {
     // Add fade animation class
     document.body.classList.add('animate-fade-out');
     
     setTimeout(() => {
       setCurrentCompany({
         id: company.id,
         name: company.name,
         tax_id: company.tax_id,
         address: company.address,
       });
       
       document.body.classList.remove('animate-fade-out');
       document.body.classList.add('animate-fade-in');
       
       toast({
         title: 'Firma gewechselt',
         description: `Gewechselt zu ${company.name}`,
       });
       
       setTimeout(() => {
         document.body.classList.remove('animate-fade-in');
       }, 300);
     }, 150);
   };
 
   const handleDeleteCompany = async () => {
     if (!deleteCompanyId) return;
     
     setIsDeleting(true);
     try {
       // Delete company membership first (RLS will handle cascade)
       const { error } = await supabase
         .from('company_members')
         .delete()
         .eq('company_id', deleteCompanyId);
 
       if (error) throw error;
 
       await refetchCompanies();
       
       // If deleted company was current, switch to first available
       if (currentCompany?.id === deleteCompanyId && companies.length > 1) {
         const remaining = companies.find(c => c.id !== deleteCompanyId);
         if (remaining) setCurrentCompany(remaining);
       }
 
       toast({
         title: 'Firma entfernt',
         description: 'Sie wurden aus der Firma entfernt.',
       });
     } catch (error) {
       console.error('Error removing from company:', error);
       toast({
         title: 'Fehler',
         description: 'Die Firma konnte nicht entfernt werden.',
         variant: 'destructive',
       });
     } finally {
       setIsDeleting(false);
       setDeleteCompanyId(null);
     }
   };
 
   const formatCurrency = (amount: number) => {
     return new Intl.NumberFormat('de-DE', {
       style: 'currency',
       currency: 'EUR',
     }).format(amount);
   };
 
   const getAvatarColor = (index: number) => {
     return avatarColors[index % avatarColors.length];
   };
 
   const getInitials = (name: string) => {
     return name
       .split(' ')
       .map(word => word[0])
       .join('')
       .toUpperCase()
       .slice(0, 2);
   };
 
   return (
     <div className="space-y-8 animate-fade-in">
       {/* Header */}
       <div className="flex justify-between items-start">
         <div>
           <h1 className="text-3xl font-bold mb-2">Firmen</h1>
           <p className="text-muted-foreground">
             Verwalten Sie Ihre Firmen und wechseln Sie zwischen ihnen.
           </p>
         </div>
         <Button onClick={() => setNewCompanyOpen(true)}>
           <Plus className="h-4 w-4 mr-2" />
           Neue Firma
         </Button>
       </div>
 
       {/* Companies Grid */}
       {loading ? (
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
           {[1, 2, 3].map((i) => (
             <Card key={i} className="animate-pulse">
               <CardHeader className="space-y-2">
                 <div className="h-12 w-12 rounded-full bg-muted" />
                 <div className="h-5 w-3/4 bg-muted rounded" />
                 <div className="h-4 w-1/2 bg-muted rounded" />
               </CardHeader>
               <CardContent>
                 <div className="h-20 bg-muted rounded" />
               </CardContent>
             </Card>
           ))}
         </div>
       ) : (
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {companiesWithStats.map((company, index) => {
              const gradient = getCompanyGradient(company.theme_index ?? 0);
              return (
              <Card
                key={company.id}
                className={cn(
                  'transition-all duration-200 hover:shadow-lg overflow-hidden',
                  currentCompany?.id === company.id && 'ring-2 ring-primary'
                )}
              >
                {/* Gradient accent bar */}
                <div className="h-1.5" style={{ background: gradient.gradient }} />
               <CardHeader>
                 <div className="flex items-start justify-between">
                   <div className="flex items-center gap-3">
                     <Avatar className={cn('h-12 w-12', getAvatarColor(index))}>
                       <AvatarFallback className="text-white font-bold">
                         {getInitials(company.name)}
                       </AvatarFallback>
                     </Avatar>
                     <div>
                       <CardTitle className="text-lg">{company.name}</CardTitle>
                       <div className="flex items-center gap-2 mt-1">
                         {company.legal_form && (
                           <Badge variant="secondary">
                             {legalFormLabels[company.legal_form] || company.legal_form}
                           </Badge>
                         )}
                         {currentCompany?.id === company.id && (
                           <Badge variant="default">Aktiv</Badge>
                         )}
                       </div>
                     </div>
                   </div>
                 </div>
                 {(company.address || company.city) && (
                   <CardDescription className="mt-2">
                     {[company.address, company.zip, company.city].filter(Boolean).join(', ')}
                   </CardDescription>
                 )}
               </CardHeader>
               <CardContent className="space-y-4">
                 {/* Stats */}
                 <div className="grid grid-cols-2 gap-4">
                   <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                     <Receipt className="h-4 w-4 text-muted-foreground" />
                     <div>
                       <p className="text-xs text-muted-foreground">Buchungen</p>
                       <p className="font-semibold">{company.stats.transactionCount}</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                     <TrendingUp className="h-4 w-4 text-muted-foreground" />
                     <div>
                       <p className="text-xs text-muted-foreground">Umsatz</p>
                       <p className="font-semibold">{formatCurrency(company.stats.totalRevenue)}</p>
                     </div>
                   </div>
                 </div>
 
                 {/* Actions */}
                 <div className="flex gap-2">
                   {currentCompany?.id !== company.id && (
                     <Button
                       variant="default"
                       size="sm"
                       className="flex-1"
                       onClick={() => handleSwitchCompany(company)}
                     >
                       <ArrowRight className="h-4 w-4 mr-1" />
                       Wechseln
                     </Button>
                   )}
                <Button variant="outline" size="sm" onClick={() => setEditCompany(company)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                   <Button
                     variant="outline"
                     size="sm"
                     className="text-destructive hover:text-destructive"
                     onClick={() => setDeleteCompanyId(company.id)}
                   >
                     <Trash2 className="h-4 w-4" />
                   </Button>
                 </div>
                </CardContent>
              </Card>
              );
            })}
 
           {/* Add New Company Card */}
           <Card
             className="border-dashed cursor-pointer hover:bg-accent/50 transition-colors"
             onClick={() => setNewCompanyOpen(true)}
           >
             <CardContent className="flex flex-col items-center justify-center h-full min-h-[280px] text-muted-foreground">
               <div className="p-4 rounded-full bg-muted mb-4">
                 <Plus className="h-8 w-8" />
               </div>
               <p className="font-medium">Neue Firma hinzufügen</p>
               <p className="text-sm">Klicken zum Erstellen</p>
             </CardContent>
           </Card>
         </div>
       )}
 
      {/* New Company Dialog */}
      <NewCompanyDialog open={newCompanyOpen} onOpenChange={setNewCompanyOpen} />

      {/* Edit Company Dialog */}
      <EditCompanyDialog
        open={!!editCompany}
        onOpenChange={(open) => { if (!open) setEditCompany(null); }}
         company={editCompany ? {
           id: editCompany.id,
           name: editCompany.name,
           legal_form: editCompany.legal_form,
           tax_id: editCompany.tax_id,
           vat_id: editCompany.vat_id,
           address: editCompany.address,
           zip: editCompany.zip,
           city: editCompany.city,
           chart_of_accounts: editCompany.chart_of_accounts,
           theme_index: editCompany.theme_index,
         } : null}
      />
 
       {/* Delete Confirmation Dialog */}
       <AlertDialog open={!!deleteCompanyId} onOpenChange={() => setDeleteCompanyId(null)}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Firma entfernen?</AlertDialogTitle>
             <AlertDialogDescription>
               Sie werden aus dieser Firma entfernt. Ihre Mitgliedschaft wird gelöscht.
               Die Firmendaten bleiben für andere Mitglieder erhalten.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Abbrechen</AlertDialogCancel>
             <AlertDialogAction
               onClick={handleDeleteCompany}
               className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
               disabled={isDeleting}
             >
               {isDeleting ? 'Wird entfernt...' : 'Entfernen'}
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     </div>
   );
 }