 import { useState, useRef } from "react";
 import { MainLayout } from "@/components/layout/MainLayout";
 import { PageHeader } from "@/components/shared/PageHeader";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Badge } from "@/components/ui/badge";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
 } from "@/components/ui/dialog";
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
 import { useTaxData } from "@/hooks/useTaxData";
 import { useAuth } from "@/hooks/useAuth";
 import { useBuildings } from "@/hooks/useBuildings";
 import { useToast } from "@/hooks/use-toast";
 import { supabase } from "@/integrations/supabase/client";
 import { LoadingState, EmptyState } from "@/components/shared";
 import {
   Upload,
   FileText,
   Bot,
   Download,
   Trash2,
   Loader2,
   Receipt,
   Calendar,
   Building2,
 } from "lucide-react";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";
 
 const currentYear = new Date().getFullYear();
 const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
 
 const categoryLabels: Record<string, string> = {
   repair: "Reparatur",
   insurance: "Versicherung",
   interest: "Zinsen",
   administration: "Verwaltung",
   utilities: "Nebenkosten",
   other: "Sonstiges",
 };
 
 const categoryColors: Record<string, string> = {
   repair: "bg-orange-100 text-orange-800",
   insurance: "bg-blue-100 text-blue-800",
   interest: "bg-purple-100 text-purple-800",
   administration: "bg-green-100 text-green-800",
   utilities: "bg-cyan-100 text-cyan-800",
   other: "bg-gray-100 text-gray-800",
 };
 
 export default function TaxDocuments() {
   const { toast } = useToast();
   const { profile } = useAuth();
   const { useBuildingsList } = useBuildings();
   const { data: buildingsData } = useBuildingsList(1, 100);
   const buildings = buildingsData?.buildings || [];
 
   const [selectedYear, setSelectedYear] = useState(currentYear);
   const { useTaxDocuments } = useTaxData(selectedYear);
   const { data: documents = [], isLoading, refetch } = useTaxDocuments();
 
   const [showUploadDialog, setShowUploadDialog] = useState(false);
   const [selectedFile, setSelectedFile] = useState<File | null>(null);
   const [uploadData, setUploadData] = useState({
     title: "",
     category: "",
     buildingId: "",
     amount: "",
     documentDate: "",
   });
   const [isUploading, setIsUploading] = useState(false);
   const [isAnalyzing, setIsAnalyzing] = useState(false);
   const fileInputRef = useRef<HTMLInputElement>(null);
 
   const handleFileSelect = (files: FileList | null) => {
     if (!files || files.length === 0) return;
     setSelectedFile(files[0]);
     setUploadData((prev) => ({ ...prev, title: files[0].name }));
     setShowUploadDialog(true);
   };
 
   const handleAnalyzeWithAI = async () => {
     if (!selectedFile) return;
 
     setIsAnalyzing(true);
     try {
       // For image files, we can use the AI directly
       // For PDFs, we'd need OCR first
       const isImage = selectedFile.type.startsWith("image/");
       
       if (isImage) {
         // Convert to base64 for AI analysis
         const reader = new FileReader();
         reader.onload = async () => {
           const base64 = reader.result as string;
           
           const response = await fetch(
             `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-document`,
             {
               method: "POST",
               headers: {
                 "Content-Type": "application/json",
                 Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
               },
               body: JSON.stringify({ imageUrl: base64 }),
             }
           );
 
           const result = await response.json();
           
           if (result.success && result.data) {
             const { date, amount, category, description } = result.data;
             setUploadData((prev) => ({
               ...prev,
               title: description || prev.title,
               category: category || prev.category,
               amount: amount ? String(amount / 100) : prev.amount,
               documentDate: date || prev.documentDate,
             }));
             toast({ title: "Dokument analysiert", description: "Daten wurden vorausgefüllt" });
           }
         };
         reader.readAsDataURL(selectedFile);
       } else {
         toast({
           title: "Hinweis",
           description: "KI-Analyse funktioniert aktuell nur für Bilder",
         });
       }
     } catch (error: any) {
       toast({
         title: "Analyse fehlgeschlagen",
         description: error.message,
         variant: "destructive",
       });
     } finally {
       setIsAnalyzing(false);
     }
   };
 
   const handleUpload = async () => {
     if (!selectedFile || !profile?.organization_id || !uploadData.category) return;
 
     setIsUploading(true);
     try {
       // Upload file to storage
       const fileExt = selectedFile.name.split(".").pop();
       const fileName = `${profile.organization_id}/${selectedYear}/${Date.now()}.${fileExt}`;
 
       const { error: uploadError } = await supabase.storage
         .from("documents")
         .upload(fileName, selectedFile);
 
       if (uploadError) throw uploadError;
 
       const { data: urlData } = supabase.storage
         .from("documents")
         .getPublicUrl(fileName);
 
       // Create tax document record
       const { error: insertError } = await supabase.from("tax_documents").insert({
         organization_id: profile.organization_id,
         building_id: uploadData.buildingId || null,
         year: selectedYear,
         category: uploadData.category,
         title: uploadData.title,
         amount: uploadData.amount ? Math.round(parseFloat(uploadData.amount) * 100) : null,
         document_date: uploadData.documentDate || null,
         file_url: urlData.publicUrl,
         file_size: selectedFile.size,
       });
 
       if (insertError) throw insertError;
 
       toast({ title: "Beleg hochgeladen" });
       setShowUploadDialog(false);
       setSelectedFile(null);
       setUploadData({ title: "", category: "", buildingId: "", amount: "", documentDate: "" });
       refetch();
     } catch (error: any) {
       toast({
         title: "Upload fehlgeschlagen",
         description: error.message,
         variant: "destructive",
       });
     } finally {
       setIsUploading(false);
     }
   };
 
   const handleDelete = async (id: string) => {
     try {
       const { error } = await supabase.from("tax_documents").delete().eq("id", id);
       if (error) throw error;
       toast({ title: "Beleg gelöscht" });
       refetch();
     } catch (error: any) {
       toast({
         title: "Fehler",
         description: error.message,
         variant: "destructive",
       });
     }
   };
 
   const totalAmount = documents.reduce((sum, d: any) => sum + (d.amount || 0), 0);
 
   return (
     <MainLayout title="Belege">
       <div className="space-y-6">
         <PageHeader
           title="Steuerbelege"
           subtitle="Belege für die Steuererklärung verwalten"
           breadcrumbs={[
             { label: "Steuern", href: "/taxes" },
             { label: "Belege" },
           ]}
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
               <Button onClick={() => fileInputRef.current?.click()}>
                 <Upload className="h-4 w-4 mr-2" />
                 Beleg hochladen
               </Button>
               <input
                 ref={fileInputRef}
                 type="file"
                 accept="image/*,application/pdf"
                 className="hidden"
                 onChange={(e) => handleFileSelect(e.target.files)}
               />
             </div>
           }
         />
 
         {/* Summary Card */}
         <Card>
           <CardContent className="pt-6">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm text-muted-foreground">
                   {documents.length} Belege für {selectedYear}
                 </p>
                 <p className="text-2xl font-bold">
                   {(totalAmount / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                 </p>
               </div>
               <Button variant="outline">
                 <Download className="h-4 w-4 mr-2" />
                 Alle exportieren
               </Button>
             </div>
           </CardContent>
         </Card>
 
         {/* Documents List */}
         {isLoading ? (
           <LoadingState />
         ) : documents.length === 0 ? (
           <EmptyState
             icon={Receipt}
             title="Keine Belege"
             description={`Laden Sie Belege für ${selectedYear} hoch`}
             action={
               <Button onClick={() => fileInputRef.current?.click()}>
                 <Upload className="h-4 w-4 mr-2" />
                 Ersten Beleg hochladen
               </Button>
             }
           />
         ) : (
           <Card>
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>Titel</TableHead>
                   <TableHead>Kategorie</TableHead>
                   <TableHead>Objekt</TableHead>
                   <TableHead>Datum</TableHead>
                   <TableHead className="text-right">Betrag</TableHead>
                   <TableHead></TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {documents.map((doc: any) => (
                   <TableRow key={doc.id}>
                     <TableCell>
                       <div className="flex items-center gap-2">
                         <FileText className="h-4 w-4 text-muted-foreground" />
                         <a
                           href={doc.file_url}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="font-medium hover:underline"
                         >
                           {doc.title}
                         </a>
                       </div>
                     </TableCell>
                     <TableCell>
                       <Badge variant="outline" className={categoryColors[doc.category]}>
                         {categoryLabels[doc.category] || doc.category}
                       </Badge>
                     </TableCell>
                     <TableCell>
                       {doc.buildings?.name || "-"}
                     </TableCell>
                     <TableCell>
                       {doc.document_date
                         ? format(new Date(doc.document_date), "dd.MM.yyyy", { locale: de })
                         : "-"}
                     </TableCell>
                     <TableCell className="text-right font-mono">
                       {doc.amount
                         ? `${(doc.amount / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €`
                         : "-"}
                     </TableCell>
                     <TableCell>
                       <Button
                         variant="ghost"
                         size="icon"
                         onClick={() => handleDelete(doc.id)}
                       >
                         <Trash2 className="h-4 w-4" />
                       </Button>
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
           </Card>
         )}
       </div>
 
       {/* Upload Dialog */}
       <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Beleg hochladen</DialogTitle>
           </DialogHeader>
 
           <div className="space-y-4">
             {selectedFile && (
               <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <FileText className="h-4 w-4" />
                   <span className="text-sm truncate max-w-[200px]">
                     {selectedFile.name}
                   </span>
                 </div>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={handleAnalyzeWithAI}
                   disabled={isAnalyzing}
                 >
                   {isAnalyzing ? (
                     <Loader2 className="h-4 w-4 animate-spin" />
                   ) : (
                     <>
                       <Bot className="h-4 w-4 mr-1" />
                       KI analysieren
                     </>
                   )}
                 </Button>
               </div>
             )}
 
             <div className="space-y-2">
               <Label>Titel</Label>
               <Input
                 value={uploadData.title}
                 onChange={(e) => setUploadData((p) => ({ ...p, title: e.target.value }))}
               />
             </div>
 
             <div className="space-y-2">
               <Label>Kategorie *</Label>
               <Select
                 value={uploadData.category}
                 onValueChange={(v) => setUploadData((p) => ({ ...p, category: v }))}
               >
                 <SelectTrigger>
                   <SelectValue placeholder="Kategorie wählen" />
                 </SelectTrigger>
                 <SelectContent>
                   {Object.entries(categoryLabels).map(([value, label]) => (
                     <SelectItem key={value} value={value}>
                       {label}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
 
             <div className="space-y-2">
               <Label>Objekt (optional)</Label>
               <Select
                 value={uploadData.buildingId}
                 onValueChange={(v) => setUploadData((p) => ({ ...p, buildingId: v }))}
               >
                 <SelectTrigger>
                   <SelectValue placeholder="Objekt wählen" />
                 </SelectTrigger>
                 <SelectContent>
                   {buildings.map((b) => (
                     <SelectItem key={b.id} value={b.id}>
                       {b.name}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
 
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Betrag (€)</Label>
                 <Input
                   type="number"
                   step="0.01"
                   value={uploadData.amount}
                   onChange={(e) => setUploadData((p) => ({ ...p, amount: e.target.value }))}
                 />
               </div>
               <div className="space-y-2">
                 <Label>Datum</Label>
                 <Input
                   type="date"
                   value={uploadData.documentDate}
                   onChange={(e) => setUploadData((p) => ({ ...p, documentDate: e.target.value }))}
                 />
               </div>
             </div>
           </div>
 
           <DialogFooter>
             <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
               Abbrechen
             </Button>
             <Button onClick={handleUpload} disabled={isUploading || !uploadData.category}>
               {isUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
               Hochladen
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </MainLayout>
   );
 }