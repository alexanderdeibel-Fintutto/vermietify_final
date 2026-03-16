 import { useState } from "react";
 import { MainLayout } from "@/components/layout/MainLayout";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { ArrowLeft, Plus, Edit, Trash2, FileText, Lock } from "lucide-react";
 import { useLetters, LetterTemplate } from "@/hooks/useLetters";
 import { useNavigate } from "react-router-dom";
 import { LoadingState } from "@/components/shared/LoadingState";
 
 const categories = [
   { value: "general", label: "Allgemein" },
   { value: "rent", label: "Miete" },
   { value: "billing", label: "Abrechnung" },
   { value: "reminder", label: "Mahnung" },
   { value: "termination", label: "Kündigung" },
 ];
 
 export default function LetterTemplates() {
   const navigate = useNavigate();
   const { templates, isLoading } = useLetters();
   const [dialogOpen, setDialogOpen] = useState(false);
   const [selectedTemplate, setSelectedTemplate] = useState<LetterTemplate | null>(null);
 
   const systemTemplates = templates.filter(t => t.is_system);
   const customTemplates = templates.filter(t => !t.is_system);
 
   if (isLoading) return <MainLayout title="Vorlagen"><LoadingState /></MainLayout>;
 
   return (
     <MainLayout 
       title="Briefvorlagen"
       breadcrumbs={[
         { label: "Briefversand", href: "/briefe" },
         { label: "Vorlagen" }
       ]}
       actions={
         <div className="flex gap-2">
           <Button variant="outline" onClick={() => navigate("/briefe")}>
             <ArrowLeft className="h-4 w-4 mr-2" />
             Zurück
           </Button>
           <Button onClick={() => { setSelectedTemplate(null); setDialogOpen(true); }}>
             <Plus className="h-4 w-4 mr-2" />
             Neue Vorlage
           </Button>
         </div>
       }
     >
       <div className="space-y-6">
         <div>
           <h1 className="text-3xl font-bold tracking-tight">Briefvorlagen</h1>
           <p className="text-muted-foreground">Verwalten Sie Ihre Vorlagen für den Briefversand</p>
         </div>
 
         <div className="space-y-4">
           <h2 className="text-lg font-semibold">System-Vorlagen</h2>
           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
             {systemTemplates.map(template => (
               <Card key={template.id} className="relative">
                 <CardHeader className="pb-2">
                   <div className="flex items-start justify-between">
                     <CardTitle className="text-base flex items-center gap-2">
                       <FileText className="h-4 w-4" />
                       {template.name}
                     </CardTitle>
                     <Badge variant="secondary" className="flex items-center gap-1">
                       <Lock className="h-3 w-3" />
                       System
                     </Badge>
                   </div>
                   <CardDescription>
                     {categories.find(c => c.value === template.category)?.label || template.category}
                   </CardDescription>
                 </CardHeader>
                 <CardContent>
                   <p className="text-sm text-muted-foreground line-clamp-2">
                     {template.content.substring(0, 100)}...
                   </p>
                   {(template.placeholders as string[])?.length > 0 && (
                     <div className="mt-2 flex flex-wrap gap-1">
                       {(template.placeholders as string[]).slice(0, 3).map(p => (
                         <Badge key={p} variant="outline" className="text-xs">
                           {`{{${p}}}`}
                         </Badge>
                       ))}
                       {(template.placeholders as string[]).length > 3 && (
                         <Badge variant="outline" className="text-xs">
                           +{(template.placeholders as string[]).length - 3} mehr
                         </Badge>
                       )}
                     </div>
                   )}
                 </CardContent>
               </Card>
             ))}
           </div>
         </div>
 
         <div className="space-y-4">
           <h2 className="text-lg font-semibold">Eigene Vorlagen</h2>
           {customTemplates.length === 0 ? (
             <Card>
               <CardContent className="py-8 text-center">
                 <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                 <p className="text-muted-foreground">Noch keine eigenen Vorlagen erstellt</p>
                 <Button 
                   variant="outline" 
                   className="mt-4"
                   onClick={() => { setSelectedTemplate(null); setDialogOpen(true); }}
                 >
                   <Plus className="h-4 w-4 mr-2" />
                   Erste Vorlage erstellen
                 </Button>
               </CardContent>
             </Card>
           ) : (
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
               {customTemplates.map(template => (
                 <Card key={template.id}>
                   <CardHeader className="pb-2">
                     <div className="flex items-start justify-between">
                       <CardTitle className="text-base flex items-center gap-2">
                         <FileText className="h-4 w-4" />
                         {template.name}
                       </CardTitle>
                       <div className="flex gap-1">
                         <Button 
                           variant="ghost" 
                           size="icon"
                           onClick={() => { setSelectedTemplate(template); setDialogOpen(true); }}
                         >
                           <Edit className="h-4 w-4" />
                         </Button>
                         <Button variant="ghost" size="icon">
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </div>
                     </div>
                     <CardDescription>
                       {categories.find(c => c.value === template.category)?.label || template.category}
                     </CardDescription>
                   </CardHeader>
                   <CardContent>
                     <p className="text-sm text-muted-foreground line-clamp-2">
                       {template.content.substring(0, 100)}...
                     </p>
                   </CardContent>
                 </Card>
               ))}
             </div>
           )}
         </div>
       </div>
 
       {/* Template Editor Dialog would go here */}
     </MainLayout>
   );
 }