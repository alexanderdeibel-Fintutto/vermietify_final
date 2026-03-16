 import { useState } from "react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { EmptyState } from "@/components/shared";
 import {
   FolderOpen,
   Upload,
   FileText,
   Download,
   Eye,
   Trash2,
   Filter,
   Calendar,
 } from "lucide-react";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";
 
 interface TenantDocumentsTabProps {
   tenantId: string;
   documents: any[];
 }
 
 const DOCUMENT_TYPE_LABELS: Record<string, string> = {
   contract: "Vertrag",
   protocol: "Protokoll",
   invoice: "Rechnung",
   correspondence: "Korrespondenz",
   other: "Sonstiges",
 };
 
 export function TenantDocumentsTab({ tenantId, documents }: TenantDocumentsTabProps) {
   const [selectedType, setSelectedType] = useState<string>("all");
 
   const filteredDocuments = documents?.filter(
     (doc) => selectedType === "all" || doc.document_type === selectedType
   ) || [];
 
   return (
     <div className="space-y-4">
       <Card>
         <CardContent className="py-4">
           <div className="flex flex-wrap gap-4 items-center">
             <div className="flex items-center gap-2">
               <Filter className="h-4 w-4 text-muted-foreground" />
               <span className="text-sm font-medium">Filter:</span>
             </div>
 
             <Select value={selectedType} onValueChange={setSelectedType}>
               <SelectTrigger className="w-[180px]">
                 <SelectValue placeholder="Dokumenttyp" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">Alle Typen</SelectItem>
                 {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                   <SelectItem key={value} value={value}>
                     {label}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
 
             <div className="ml-auto">
               <Button>
                 <Upload className="h-4 w-4 mr-2" />
                 Dokument hochladen
               </Button>
             </div>
           </div>
         </CardContent>
       </Card>
 
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <FolderOpen className="h-5 w-5" />
             Dokumente ({filteredDocuments.length})
           </CardTitle>
         </CardHeader>
         <CardContent>
           {filteredDocuments.length === 0 ? (
             <EmptyState
               icon={FolderOpen}
               title="Keine Dokumente vorhanden"
               description="Laden Sie Dokumente wie Mietverträge hoch."
               action={
                 <Button>
                   <Upload className="h-4 w-4 mr-2" />
                   Dokument hochladen
                 </Button>
               }
             />
           ) : (
             <div className="space-y-2">
               {filteredDocuments.map((doc) => (
                 <div
                   key={doc.id}
                   className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                 >
                   <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center">
                     <FileText className="h-5 w-5 text-primary" />
                   </div>
 
                   <div className="flex-1 min-w-0">
                     <p className="font-medium truncate">{doc.title}</p>
                     <div className="flex items-center gap-2 text-sm text-muted-foreground">
                       <Badge variant="outline" className="text-xs">
                         {DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}
                       </Badge>
                       <span className="flex items-center gap-1">
                         <Calendar className="h-3 w-3" />
                         {format(new Date(doc.created_at), "dd.MM.yyyy", { locale: de })}
                       </span>
                     </div>
                   </div>
 
                   <div className="flex items-center gap-1">
                     <Button variant="ghost" size="icon">
                       <Eye className="h-4 w-4" />
                     </Button>
                     <Button variant="ghost" size="icon">
                       <Download className="h-4 w-4" />
                     </Button>
                     <Button variant="ghost" size="icon" className="text-destructive">
                       <Trash2 className="h-4 w-4" />
                     </Button>
                   </div>
                 </div>
               ))}
             </div>
           )}
         </CardContent>
       </Card>
     </div>
   );
 }