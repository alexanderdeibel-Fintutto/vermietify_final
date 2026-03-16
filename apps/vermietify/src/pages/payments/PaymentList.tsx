 import { useState } from "react";
 import { MainLayout } from "@/components/layout/MainLayout";
 import { Button } from "@/components/ui/button";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Plus } from "lucide-react";
 import { PaymentOverviewTab } from "@/components/payments/PaymentOverviewTab";
 import { PaymentDueTab } from "@/components/payments/PaymentDueTab";
 import { PaymentOverdueTab } from "@/components/payments/PaymentOverdueTab";
 import { PaymentHistoryTab } from "@/components/payments/PaymentHistoryTab";
 import { RecordPaymentDialog } from "@/components/payments/RecordPaymentDialog";

 export default function PaymentList() {
   const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);
 
  return (
     <MainLayout
       title="Zahlungen"
      breadcrumbs={[{ label: "Zahlungen" }]}
       actions={
         <Button onClick={() => setIsRecordDialogOpen(true)}>
           <Plus className="h-4 w-4 mr-2" />
           Zahlung erfassen
         </Button>
       }
    >
       <Tabs defaultValue="overview" className="space-y-6">
         <TabsList>
           <TabsTrigger value="overview">Übersicht</TabsTrigger>
           <TabsTrigger value="due">Fällig</TabsTrigger>
           <TabsTrigger value="overdue">Überfällig</TabsTrigger>
           <TabsTrigger value="history">Historie</TabsTrigger>
         </TabsList>
 
         <TabsContent value="overview">
           <PaymentOverviewTab />
         </TabsContent>
 
         <TabsContent value="due">
           <PaymentDueTab />
         </TabsContent>
 
         <TabsContent value="overdue">
           <PaymentOverdueTab />
         </TabsContent>
 
         <TabsContent value="history">
           <PaymentHistoryTab />
         </TabsContent>
       </Tabs>
 
       <RecordPaymentDialog
         open={isRecordDialogOpen}
         onOpenChange={setIsRecordDialogOpen}
       />
    </MainLayout>
  );
}
