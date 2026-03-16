 import { Link } from "react-router-dom";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { useElster, ELSTER_STATUS_LABELS, FORM_TYPE_LABELS } from "@/hooks/useElster";
 import { format, parseISO } from "date-fns";
 import { de } from "date-fns/locale";
 import {
   FileText,
   Send,
   CheckCircle2,
   Clock,
   AlertTriangle,
   ArrowRight,
 } from "lucide-react";
 
 interface ElsterStatusWidgetProps {
   compact?: boolean;
 }
 
 export function ElsterStatusWidget({ compact = false }: ElsterStatusWidgetProps) {
   const { useSubmissions, useActiveCertificate } = useElster();
   const { data: submissions = [], isLoading } = useSubmissions();
   const { data: activeCert } = useActiveCertificate();
 
   // Get recent submissions
   const recentSubmissions = submissions.slice(0, 3);
   const pendingCount = submissions.filter((s) =>
     ["submitted", "accepted"].includes(s.status)
   ).length;
   const noticeCount = submissions.filter(
     (s) => s.status === "notice_received"
   ).length;
 
   if (isLoading) {
     return null;
   }
 
   if (compact) {
     return (
       <div className="flex items-center justify-between p-3 border rounded-lg">
         <div className="flex items-center gap-3">
           <div className={`p-2 rounded-full ${activeCert ? "bg-green-100" : "bg-yellow-100"}`}>
             <FileText className={`h-4 w-4 ${activeCert ? "text-green-600" : "text-yellow-600"}`} />
           </div>
           <div>
             <p className="text-sm font-medium">ELSTER</p>
             <p className="text-xs text-muted-foreground">
               {pendingCount > 0
                 ? `${pendingCount} Übertragung(en) ausstehend`
                 : noticeCount > 0
                 ? `${noticeCount} Bescheid(e) vorhanden`
                 : "Keine ausstehenden Übertragungen"}
             </p>
           </div>
         </div>
         <Button variant="ghost" size="sm" asChild>
           <Link to="/steuern/elster">
             <ArrowRight className="h-4 w-4" />
           </Link>
         </Button>
       </div>
     );
   }
 
   return (
     <Card>
       <CardHeader className="pb-3">
         <div className="flex items-center justify-between">
           <div>
             <CardTitle className="text-base flex items-center gap-2">
               <FileText className="h-4 w-4" />
               ELSTER-Übertragungen
             </CardTitle>
             <CardDescription>
               Elektronische Steuererklärung
             </CardDescription>
           </div>
           <Button variant="outline" size="sm" asChild>
             <Link to="/steuern/elster">
               Alle anzeigen
             </Link>
           </Button>
         </div>
       </CardHeader>
       <CardContent className="space-y-3">
         {!activeCert && (
           <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
             <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />
             <span className="text-yellow-800">Kein gültiges Zertifikat</span>
           </div>
         )}
 
         {recentSubmissions.length === 0 ? (
           <p className="text-sm text-muted-foreground text-center py-4">
             Noch keine Übertragungen
           </p>
         ) : (
           <div className="space-y-2">
             {recentSubmissions.map((sub) => (
               <Link
                 key={sub.id}
                 to={`/steuern/elster/senden?id=${sub.id}`}
                 className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors"
               >
                 <div className="flex items-center gap-2">
                   {sub.status === "notice_received" || sub.status === "accepted" ? (
                     <CheckCircle2 className="h-4 w-4 text-green-600" />
                   ) : sub.status === "submitted" || sub.status === "validating" ? (
                     <Clock className="h-4 w-4 text-blue-600" />
                   ) : (
                     <Send className="h-4 w-4 text-muted-foreground" />
                   )}
                   <div>
                     <p className="text-sm font-medium">
                       {FORM_TYPE_LABELS[sub.form_type]} {sub.tax_year}
                     </p>
                     <p className="text-xs text-muted-foreground">
                       {sub.submitted_at
                         ? format(parseISO(sub.submitted_at), "dd.MM.yyyy", { locale: de })
                         : "Entwurf"}
                     </p>
                   </div>
                 </div>
                 <Badge variant="secondary" className="text-xs">
                   {ELSTER_STATUS_LABELS[sub.status]}
                 </Badge>
               </Link>
             ))}
           </div>
         )}
 
         <Button className="w-full" size="sm" asChild>
           <Link to="/steuern/elster/senden">
             <Send className="mr-2 h-4 w-4" />
             Neue Übertragung
           </Link>
         </Button>
       </CardContent>
     </Card>
   );
 }