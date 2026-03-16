 import { useState } from "react";
 import { Link } from "react-router-dom";
 import { MainLayout } from "@/components/layout/MainLayout";
 import { PageHeader } from "@/components/shared/PageHeader";
 import { StatCard } from "@/components/shared/StatCard";
 import { LoadingState, EmptyState } from "@/components/shared";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Switch } from "@/components/ui/switch";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
 import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import {
   useElster,
   ELSTER_STATUS_LABELS,
   ELSTER_STATUS_COLORS,
   FORM_TYPE_LABELS,
   TAX_OFFICES_BY_STATE,
   type ElsterStatus,
 } from "@/hooks/useElster";
 import { format, differenceInDays, parseISO } from "date-fns";
 import { de } from "date-fns/locale";
 import {
   FileText,
   Upload,
   Send,
   CheckCircle2,
   XCircle,
   Clock,
   AlertTriangle,
   ExternalLink,
   Shield,
   Settings,
   RefreshCw,
   Download,
   Trash2,
   Eye,
 } from "lucide-react";
 
 export default function ElsterDashboard() {
   const {
     useCertificates,
     useActiveCertificate,
     useSubmissions,
     useSettings,
     upsertSettings,
     uploadCertificate,
     fetchNotices,
     deleteSubmission,
   } = useElster();
 
   const { data: certificates = [], isLoading: certsLoading } = useCertificates();
   const { data: activeCert } = useActiveCertificate();
   const { data: submissions = [], isLoading: subsLoading } = useSubmissions();
   const { data: settings, isLoading: settingsLoading } = useSettings();
 
   const [showCertDialog, setShowCertDialog] = useState(false);
   const [certName, setCertName] = useState("");
   const [certValidFrom, setCertValidFrom] = useState("");
   const [certValidUntil, setCertValidUntil] = useState("");
 
   const [selectedState, setSelectedState] = useState("");
   const [taxNumber, setTaxNumber] = useState(settings?.tax_number || "");
   const [taxOfficeId, setTaxOfficeId] = useState(settings?.tax_office_id || "");
   const [notificationEmail, setNotificationEmail] = useState(settings?.notification_email || "");
   const [testMode, setTestMode] = useState(settings?.test_mode ?? true);
   const [autoFetch, setAutoFetch] = useState(settings?.auto_fetch_notices ?? true);
 
   const isLoading = certsLoading || subsLoading || settingsLoading;
 
   // Stats
   const draftCount = submissions.filter(s => s.status === "draft").length;
   const submittedCount = submissions.filter(s => ["submitted", "accepted"].includes(s.status)).length;
   const noticeCount = submissions.filter(s => s.status === "notice_received").length;
   const rejectedCount = submissions.filter(s => s.status === "rejected").length;
 
   // Certificate expiry warning
   const certDaysRemaining = activeCert
     ? differenceInDays(parseISO(activeCert.valid_until), new Date())
     : null;
 
   const handleUploadCert = () => {
     if (certName && certValidFrom && certValidUntil) {
       uploadCertificate.mutate({
         name: certName,
         validFrom: certValidFrom,
         validUntil: certValidUntil,
       });
       setShowCertDialog(false);
       setCertName("");
       setCertValidFrom("");
       setCertValidUntil("");
     }
   };
 
   const handleSaveSettings = () => {
     const office = Object.values(TAX_OFFICES_BY_STATE)
       .flat()
       .find(o => o.id === taxOfficeId);
 
     upsertSettings.mutate({
       tax_number: taxNumber,
       tax_office_id: taxOfficeId,
       tax_office_name: office?.name || null,
       notification_email: notificationEmail,
       test_mode: testMode,
       auto_fetch_notices: autoFetch,
     });
   };
 
   const getStatusIcon = (status: ElsterStatus) => {
     switch (status) {
       case "accepted":
       case "notice_received":
         return <CheckCircle2 className="h-4 w-4 text-green-600" />;
       case "rejected":
         return <XCircle className="h-4 w-4 text-destructive" />;
       case "validating":
       case "submitted":
         return <Clock className="h-4 w-4 text-blue-600" />;
       default:
         return <FileText className="h-4 w-4 text-muted-foreground" />;
     }
   };
 
   return (
     <MainLayout title="ELSTER-Übertragung">
       <div className="space-y-6">
         <PageHeader
           title="ELSTER-Übertragung"
           subtitle="Elektronische Steuererklärung ans Finanzamt"
           actions={
             <Button asChild>
               <Link to="/steuern/elster/senden">
                 <Send className="mr-2 h-4 w-4" />
                 Neue Übertragung
               </Link>
             </Button>
           }
         />
 
         {/* Certificate Status */}
         <Card className={activeCert && certDaysRemaining && certDaysRemaining < 30 ? "border-yellow-500" : ""}>
           <CardContent className="py-4">
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <div className={`p-2 rounded-full ${activeCert ? "bg-green-100" : "bg-red-100"}`}>
                   <Shield className={`h-5 w-5 ${activeCert ? "text-green-600" : "text-red-600"}`} />
                 </div>
                 <div>
                   <p className="font-medium">
                     {activeCert ? "Zertifikat aktiv" : "Kein gültiges Zertifikat"}
                   </p>
                   {activeCert && (
                     <p className="text-sm text-muted-foreground">
                       {activeCert.certificate_name} • Gültig bis{" "}
                       {format(parseISO(activeCert.valid_until), "dd.MM.yyyy", { locale: de })}
                       {certDaysRemaining && certDaysRemaining < 30 && (
                         <span className="text-yellow-600 ml-2">
                           (noch {certDaysRemaining} Tage)
                         </span>
                       )}
                     </p>
                   )}
                 </div>
               </div>
               <Button variant="outline" size="sm" asChild>
                 <a
                   href="https://www.elster.de/eportal/start"
                   target="_blank"
                   rel="noopener noreferrer"
                 >
                   <ExternalLink className="mr-2 h-4 w-4" />
                   ELSTER Portal
                 </a>
               </Button>
             </div>
           </CardContent>
         </Card>
 
         {isLoading ? (
           <LoadingState />
         ) : (
           <>
             {/* Stats */}
             <div className="grid gap-4 md:grid-cols-4">
               <StatCard
                 title="Entwürfe"
                 value={draftCount}
                 icon={FileText}
               />
               <StatCard
                 title="Übertragen"
                 value={submittedCount}
                 icon={Send}
               />
               <StatCard
                 title="Bescheide"
                 value={noticeCount}
                 icon={CheckCircle2}
               />
               <StatCard
                 title="Abgelehnt"
                 value={rejectedCount}
                 icon={XCircle}
               />
             </div>
 
             <Tabs defaultValue="submissions" className="space-y-4">
               <TabsList>
                 <TabsTrigger value="submissions">Übertragungen</TabsTrigger>
                 <TabsTrigger value="certificate">Zertifikat</TabsTrigger>
                 <TabsTrigger value="settings">Einstellungen</TabsTrigger>
               </TabsList>
 
               {/* Submissions Tab */}
               <TabsContent value="submissions" className="space-y-4">
                 <div className="flex justify-end">
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => fetchNotices.mutate()}
                     disabled={fetchNotices.isPending}
                   >
                     <RefreshCw className={`mr-2 h-4 w-4 ${fetchNotices.isPending ? "animate-spin" : ""}`} />
                     Bescheide abrufen
                   </Button>
                 </div>
 
                 {submissions.length === 0 ? (
                   <EmptyState
                    icon={FileText}
                     title="Keine Übertragungen"
                     description="Starten Sie Ihre erste ELSTER-Übertragung"
                     action={
                       <Button asChild>
                         <Link to="/steuern/elster/senden">Neue Übertragung</Link>
                       </Button>
                     }
                   />
                 ) : (
                   <Card>
                     <Table>
                       <TableHeader>
                         <TableRow>
                           <TableHead>Jahr</TableHead>
                           <TableHead>Formular</TableHead>
                           <TableHead>Status</TableHead>
                           <TableHead>Übertragen am</TableHead>
                           <TableHead>Transfer-Ticket</TableHead>
                           <TableHead className="text-right">Aktionen</TableHead>
                         </TableRow>
                       </TableHeader>
                       <TableBody>
                         {submissions.map((sub) => (
                           <TableRow key={sub.id}>
                             <TableCell className="font-medium">{sub.tax_year}</TableCell>
                             <TableCell>{FORM_TYPE_LABELS[sub.form_type]}</TableCell>
                             <TableCell>
                               <div className="flex items-center gap-2">
                                 {getStatusIcon(sub.status)}
                                 <Badge variant={ELSTER_STATUS_COLORS[sub.status] as "default" | "secondary" | "destructive"}>
                                   {ELSTER_STATUS_LABELS[sub.status]}
                                 </Badge>
                               </div>
                             </TableCell>
                             <TableCell>
                               {sub.submitted_at
                                 ? format(parseISO(sub.submitted_at), "dd.MM.yyyy HH:mm", { locale: de })
                                 : "-"}
                             </TableCell>
                             <TableCell>
                               <code className="text-xs">{sub.transfer_ticket || "-"}</code>
                             </TableCell>
                             <TableCell className="text-right">
                               <div className="flex justify-end gap-2">
                                 <Button variant="ghost" size="icon" asChild>
                                   <Link to={`/steuern/elster/senden?id=${sub.id}`}>
                                     <Eye className="h-4 w-4" />
                                   </Link>
                                 </Button>
                                 {sub.protocol_pdf_path && (
                                   <Button variant="ghost" size="icon">
                                     <Download className="h-4 w-4" />
                                   </Button>
                                 )}
                                 {sub.status === "draft" && (
                                   <Button
                                     variant="ghost"
                                     size="icon"
                                     onClick={() => deleteSubmission.mutate(sub.id)}
                                   >
                                     <Trash2 className="h-4 w-4" />
                                   </Button>
                                 )}
                               </div>
                             </TableCell>
                           </TableRow>
                         ))}
                       </TableBody>
                     </Table>
                   </Card>
                 )}
               </TabsContent>
 
               {/* Certificate Tab */}
               <TabsContent value="certificate" className="space-y-4">
                 <Card>
                   <CardHeader>
                     <CardTitle>ELSTER-Zertifikat</CardTitle>
                     <CardDescription>
                       Ihr persönliches Zertifikat für die elektronische Übertragung
                     </CardDescription>
                   </CardHeader>
                   <CardContent className="space-y-4">
                     {activeCert ? (
                       <div className="space-y-4">
                         <div className="p-4 border rounded-lg space-y-2">
                           <div className="flex justify-between">
                             <span className="text-sm text-muted-foreground">Name</span>
                             <span className="font-medium">{activeCert.certificate_name}</span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-sm text-muted-foreground">Gültig ab</span>
                             <span>{format(parseISO(activeCert.valid_from), "dd.MM.yyyy", { locale: de })}</span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-sm text-muted-foreground">Gültig bis</span>
                             <span className={certDaysRemaining && certDaysRemaining < 30 ? "text-yellow-600 font-medium" : ""}>
                               {format(parseISO(activeCert.valid_until), "dd.MM.yyyy", { locale: de })}
                             </span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-sm text-muted-foreground">Fingerprint</span>
                             <code className="text-xs">{activeCert.certificate_fingerprint}</code>
                           </div>
                         </div>
 
                         {certDaysRemaining && certDaysRemaining < 30 && (
                           <Alert variant="default" className="border-yellow-500 bg-yellow-50">
                             <AlertTriangle className="h-4 w-4 text-yellow-600" />
                             <AlertTitle>Zertifikat läuft bald ab</AlertTitle>
                             <AlertDescription>
                               Ihr Zertifikat ist nur noch {certDaysRemaining} Tage gültig.
                               Beantragen Sie rechtzeitig ein neues Zertifikat.
                             </AlertDescription>
                           </Alert>
                         )}
                       </div>
                     ) : (
                       <Alert>
                         <AlertTriangle className="h-4 w-4" />
                         <AlertTitle>Kein Zertifikat</AlertTitle>
                         <AlertDescription>
                           Sie benötigen ein ELSTER-Zertifikat für die elektronische Übertragung.
                         </AlertDescription>
                       </Alert>
                     )}
 
                     <div className="flex gap-2">
                       <Dialog open={showCertDialog} onOpenChange={setShowCertDialog}>
                         <DialogTrigger asChild>
                           <Button>
                             <Upload className="mr-2 h-4 w-4" />
                             Zertifikat hochladen
                           </Button>
                         </DialogTrigger>
                         <DialogContent>
                           <DialogHeader>
                             <DialogTitle>Zertifikat hochladen</DialogTitle>
                             <DialogDescription>
                               Laden Sie Ihr ELSTER-Zertifikat (.pfx Datei) hoch
                             </DialogDescription>
                           </DialogHeader>
                           <div className="space-y-4 py-4">
                             <div className="space-y-2">
                               <Label>Zertifikat-Name</Label>
                               <Input
                                 value={certName}
                                 onChange={(e) => setCertName(e.target.value)}
                                 placeholder="z.B. ELSTER Zertifikat 2024"
                               />
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2">
                                 <Label>Gültig ab</Label>
                                 <Input
                                   type="date"
                                   value={certValidFrom}
                                   onChange={(e) => setCertValidFrom(e.target.value)}
                                 />
                               </div>
                               <div className="space-y-2">
                                 <Label>Gültig bis</Label>
                                 <Input
                                   type="date"
                                   value={certValidUntil}
                                   onChange={(e) => setCertValidUntil(e.target.value)}
                                 />
                               </div>
                             </div>
                             <div className="space-y-2">
                               <Label>Zertifikat-Datei (.pfx)</Label>
                               <Input type="file" accept=".pfx,.p12" />
                               <p className="text-xs text-muted-foreground">
                                 Die Datei wird verschlüsselt gespeichert
                               </p>
                             </div>
                           </div>
                           <DialogFooter>
                             <Button variant="outline" onClick={() => setShowCertDialog(false)}>
                               Abbrechen
                             </Button>
                             <Button onClick={handleUploadCert} disabled={uploadCertificate.isPending}>
                               Hochladen
                             </Button>
                           </DialogFooter>
                         </DialogContent>
                       </Dialog>
 
                       <Button variant="outline" asChild>
                         <a
                           href="https://www.elster.de/eportal/registrierung-auswahl"
                           target="_blank"
                           rel="noopener noreferrer"
                         >
                           <ExternalLink className="mr-2 h-4 w-4" />
                           Zertifikat beantragen
                         </a>
                       </Button>
                     </div>
 
                     {certificates.length > 1 && (
                       <div className="pt-4 border-t">
                         <h4 className="font-medium mb-2">Frühere Zertifikate</h4>
                         <div className="space-y-2">
                           {certificates
                             .filter((c) => c.id !== activeCert?.id)
                             .map((cert) => (
                               <div
                                 key={cert.id}
                                 className="flex justify-between items-center p-2 bg-muted/50 rounded text-sm"
                               >
                                 <span>{cert.certificate_name}</span>
                                 <span className="text-muted-foreground">
                                   bis {format(parseISO(cert.valid_until), "dd.MM.yyyy")}
                                 </span>
                               </div>
                             ))}
                         </div>
                       </div>
                     )}
                   </CardContent>
                 </Card>
               </TabsContent>
 
               {/* Settings Tab */}
               <TabsContent value="settings" className="space-y-4">
                 <Card>
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                       <Settings className="h-5 w-5" />
                       ELSTER-Einstellungen
                     </CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-6">
                     <div className="grid gap-4 md:grid-cols-2">
                       <div className="space-y-2">
                         <Label>Steuernummer</Label>
                         <Input
                           value={taxNumber}
                           onChange={(e) => setTaxNumber(e.target.value)}
                           placeholder="z.B. 123/456/78901"
                         />
                         <p className="text-xs text-muted-foreground">
                           Format: XXX/XXX/XXXXX (je nach Bundesland)
                         </p>
                       </div>
 
                       <div className="space-y-2">
                         <Label>Bundesland</Label>
                         <Select value={selectedState} onValueChange={setSelectedState}>
                           <SelectTrigger>
                             <SelectValue placeholder="Bundesland wählen" />
                           </SelectTrigger>
                           <SelectContent>
                             {Object.keys(TAX_OFFICES_BY_STATE).map((state) => (
                               <SelectItem key={state} value={state}>
                                 {state}
                               </SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                       </div>
 
                       <div className="space-y-2 md:col-span-2">
                         <Label>Finanzamt</Label>
                         <Select
                           value={taxOfficeId}
                           onValueChange={setTaxOfficeId}
                           disabled={!selectedState}
                         >
                           <SelectTrigger>
                             <SelectValue placeholder="Finanzamt wählen" />
                           </SelectTrigger>
                           <SelectContent>
                             {selectedState &&
                               TAX_OFFICES_BY_STATE[selectedState]?.map((office) => (
                                 <SelectItem key={office.id} value={office.id}>
                                   {office.name}
                                 </SelectItem>
                               ))}
                           </SelectContent>
                         </Select>
                       </div>
 
                       <div className="space-y-2 md:col-span-2">
                         <Label>E-Mail für Übertragungsprotokolle</Label>
                         <Input
                           type="email"
                           value={notificationEmail}
                           onChange={(e) => setNotificationEmail(e.target.value)}
                           placeholder="ihre@email.de"
                         />
                       </div>
                     </div>
 
                     <div className="space-y-4 pt-4 border-t">
                       <div className="flex items-center justify-between">
                         <div>
                           <Label>Test-Modus</Label>
                           <p className="text-sm text-muted-foreground">
                             Übertragungen an den ELSTER-Testserver senden
                           </p>
                         </div>
                         <Switch checked={testMode} onCheckedChange={setTestMode} />
                       </div>
 
                       <div className="flex items-center justify-between">
                         <div>
                           <Label>Automatischer Bescheid-Abruf</Label>
                           <p className="text-sm text-muted-foreground">
                             Steuerbescheide automatisch abrufen
                           </p>
                         </div>
                         <Switch checked={autoFetch} onCheckedChange={setAutoFetch} />
                       </div>
                     </div>
 
                     <Button onClick={handleSaveSettings} disabled={upsertSettings.isPending}>
                       Einstellungen speichern
                     </Button>
                   </CardContent>
                 </Card>
               </TabsContent>
             </Tabs>
           </>
         )}
       </div>
     </MainLayout>
   );
 }