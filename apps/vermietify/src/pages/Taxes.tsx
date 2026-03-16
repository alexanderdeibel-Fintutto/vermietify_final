 import { useState } from "react";
 import { Link } from "react-router-dom";
 import { MainLayout } from "@/components/layout/MainLayout";
 import { PageHeader } from "@/components/shared/PageHeader";
 import { StatCard } from "@/components/shared/StatCard";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
 import { useTaxData, calculateAfA } from "@/hooks/useTaxData";
 import { LoadingState } from "@/components/shared";
import { ElsterStatusWidget } from "@/components/elster/ElsterStatusWidget";
 import {
   Calculator,
   FileText,
   Download,
   Info,
   Euro,
   TrendingDown,
   Receipt,
   ArrowRight,
   Bot,
   Upload,
   Building2,
  Send,
 } from "lucide-react";
 
 const currentYear = new Date().getFullYear();
 const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

export default function Taxes() {
   const [selectedYear, setSelectedYear] = useState(currentYear);
   const { useRentalIncome, useExpenses, useBuildings, useTaxDocuments } = useTaxData(selectedYear);
 
   const { data: rentalIncome = 0, isLoading: incomeLoading } = useRentalIncome();
   const { data: expenses = 0, isLoading: expensesLoading } = useExpenses();
   const { data: buildings = [], isLoading: buildingsLoading } = useBuildings();
   const { data: taxDocs = [] } = useTaxDocuments();
 
   const isLoading = incomeLoading || expensesLoading || buildingsLoading;
 
   // Calculate total AfA
   const totalAfA = buildings.reduce((sum, b) => {
     if (b.year_built && b.total_area) {
       // Rough estimate: assume 2000€/m² purchase price
       const estimatedPrice = (b.total_area || 0) * 200000;
       return sum + calculateAfA(estimatedPrice, b.year_built, selectedYear);
     }
     return sum;
   }, 0);
 
   // Calculate taxable income
   const taxableIncome = rentalIncome - expenses - totalAfA;
   
   // Rough tax estimate (30% effective rate for rental income)
   const estimatedTax = Math.max(0, Math.round(taxableIncome * 0.3));
 
  return (
    <MainLayout title="Steuern">
      <div className="space-y-6">
         <PageHeader
           title="Steuern & Finanzen"
           subtitle={`Übersicht für das Steuerjahr ${selectedYear}`}
           actions={
             <div className="flex items-center gap-2">
               <Select
                 value={String(selectedYear)}
                 onValueChange={(v) => setSelectedYear(Number(v))}
               >
                 <SelectTrigger className="w-32">
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   {years.map((year) => (
                     <SelectItem key={year} value={String(year)}>
                       {year}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
               <Button variant="outline">
                 <Download className="mr-2 h-4 w-4" />
                 Export
               </Button>
             </div>
           }
         />

        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Hinweis</AlertTitle>
          <AlertDescription>
            Die hier bereitgestellten Daten dienen der Vorbereitung Ihrer Steuererklärung. 
            Bitte konsultieren Sie Ihren Steuerberater für verbindliche Auskünfte.
          </AlertDescription>
        </Alert>

         {isLoading ? (
           <LoadingState />
         ) : (
           <>
             {/* Stat Cards */}
             <div className="grid gap-4 md:grid-cols-4">
               <StatCard
                 title="Mieteinnahmen"
                 value={`${(rentalIncome / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €`}
                 icon={Euro}
                 description={`${selectedYear}`}
               />
               <StatCard
                 title="Werbungskosten"
                 value={`${((expenses + totalAfA) / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €`}
                 icon={TrendingDown}
                 description="inkl. AfA"
               />
               <StatCard
                 title="Zu versteuern"
                 value={`${(taxableIncome / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €`}
                 icon={Receipt}
               />
               <StatCard
                 title="Geschätzte Steuer"
                 value={`${(estimatedTax / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €`}
                 icon={Calculator}
                 description="~30% Steuersatz"
               />
             </div>
 
             {/* Overview Cards */}
             <div className="grid gap-6 md:grid-cols-2">
               <Card>
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <Euro className="h-5 w-5" />
                     Einkünfte aus V+V
                   </CardTitle>
                   <CardDescription>
                     Summe aller Mieteinnahmen {selectedYear}
                   </CardDescription>
                 </CardHeader>
                 <CardContent>
                   <div className="space-y-4">
                     <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                       <span className="text-sm">Kaltmieten</span>
                       <span className="font-medium">
                         {(rentalIncome / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                       </span>
                     </div>
                     <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                       <span className="text-sm">Nebenkostenvorauszahlungen</span>
                       <span className="font-medium">0,00 €</span>
                     </div>
                     <div className="flex justify-between items-center p-3 border rounded-lg">
                       <span className="font-medium">Gesamt Einnahmen</span>
                       <span className="font-bold text-primary">
                         {(rentalIncome / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                       </span>
                     </div>
                   </div>
                 </CardContent>
               </Card>
 
               <Card>
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <TrendingDown className="h-5 w-5" />
                     Werbungskosten
                   </CardTitle>
                   <CardDescription>
                     Abzugsfähige Ausgaben {selectedYear}
                   </CardDescription>
                 </CardHeader>
                 <CardContent>
                   <div className="space-y-4">
                     <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                       <span className="text-sm">AfA (Abschreibung)</span>
                       <span className="font-medium">
                         {(totalAfA / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                       </span>
                     </div>
                     <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                       <span className="text-sm">Sonstige Ausgaben</span>
                       <span className="font-medium">
                         {(expenses / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                       </span>
                     </div>
                     <div className="flex justify-between items-center p-3 border rounded-lg">
                       <span className="font-medium">Gesamt Werbungskosten</span>
                       <span className="font-bold text-destructive">
                         -{((expenses + totalAfA) / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                       </span>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             </div>
 
             {/* Result Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                 <Calculator className="h-5 w-5" />
                 Ergebnis {selectedYear}
              </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="grid gap-4 md:grid-cols-3">
                 <div className="text-center p-4 bg-muted/50 rounded-lg">
                   <p className="text-sm text-muted-foreground mb-1">Einnahmen</p>
                   <p className="text-2xl font-bold text-primary">
                     +{(rentalIncome / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                   </p>
                </div>
                 <div className="text-center p-4 bg-muted/50 rounded-lg">
                   <p className="text-sm text-muted-foreground mb-1">Werbungskosten</p>
                   <p className="text-2xl font-bold text-destructive">
                     -{((expenses + totalAfA) / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                   </p>
                </div>
                 <div className="text-center p-4 border-2 border-primary rounded-lg">
                   <p className="text-sm text-muted-foreground mb-1">Einkünfte V+V</p>
                   <p className="text-2xl font-bold">
                     {(taxableIncome / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                   </p>
                </div>
              </div>
            </CardContent>
          </Card>

             {/* Quick Links */}
          <Card>
            <CardHeader>
               <CardTitle>Schnellzugriff</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                 <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                   <Link to="/steuern/anlage-v">
                     <FileText className="h-6 w-6" />
                     <span>Anlage V Wizard</span>
                   </Link>
                 </Button>
                 <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                   <Link to="/steuern/belege">
                     <Upload className="h-6 w-6" />
                     <span>Belege hochladen</span>
                   </Link>
                 </Button>
                 <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                   <Link to="/steuern/ki-berater">
                     <Bot className="h-6 w-6" />
                     <span>KI-Steuerberater</span>
                   </Link>
                 </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                  <Link to="/steuern/elster">
                    <Send className="h-6 w-6" />
                    <span>ELSTER Übertragung</span>
                  </Link>
                 </Button>
              </div>
            </CardContent>
          </Card>

          {/* ELSTER Status Widget */}
          <ElsterStatusWidget />
           </>
         )}

      </div>
    </MainLayout>
  );
}
