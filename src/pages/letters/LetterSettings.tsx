 import { useState } from "react";
 import { MainLayout } from "@/components/layout/MainLayout";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Switch } from "@/components/ui/switch";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Separator } from "@/components/ui/separator";
 import { ArrowLeft, Save, Upload, Key, TestTube, Globe, FileText } from "lucide-react";
 import { useLetters } from "@/hooks/useLetters";
 import { useNavigate } from "react-router-dom";
 import { LoadingState } from "@/components/shared/LoadingState";
 import { supabase } from "@/integrations/supabase/client";
 
 export default function LetterSettings() {
   const navigate = useNavigate();
   const { settings, saveSettings, isLoading } = useLetters();
   const [apiKey, setApiKey] = useState(settings?.api_key_encrypted || "");
   const [testMode, setTestMode] = useState(settings?.test_mode ?? true);
   const [senderName, setSenderName] = useState(settings?.default_sender?.name || "");
   const [senderStreet, setSenderStreet] = useState(settings?.default_sender?.street || "");
   const [senderPostalCode, setSenderPostalCode] = useState(settings?.default_sender?.postal_code || "");
   const [senderCity, setSenderCity] = useState(settings?.default_sender?.city || "");
   const [webhookUrl, setWebhookUrl] = useState("");
 
   // Generate webhook URL on load
   const projectUrl = import.meta.env.VITE_SUPABASE_URL || "";
   const generatedWebhookUrl = `${projectUrl}/functions/v1/letterxpress-webhook`;
 
   const handleSave = async () => {
     await saveSettings.mutateAsync({
       api_key_encrypted: apiKey,
       test_mode: testMode,
       default_sender: {
         name: senderName,
         street: senderStreet,
         postal_code: senderPostalCode,
         city: senderCity,
       },
     });
   };
 
   if (isLoading) return <MainLayout title="Einstellungen"><LoadingState /></MainLayout>;
 
   return (
     <MainLayout 
       title="Briefversand Einstellungen"
       breadcrumbs={[
         { label: "Briefversand", href: "/briefe" },
         { label: "Einstellungen" }
       ]}
       actions={
         <div className="flex gap-2">
           <Button variant="outline" onClick={() => navigate("/briefe")}>
             <ArrowLeft className="h-4 w-4 mr-2" />
             Zurück
           </Button>
           <Button onClick={handleSave} disabled={saveSettings.isPending}>
             <Save className="h-4 w-4 mr-2" />
             {saveSettings.isPending ? "Speichern..." : "Speichern"}
           </Button>
         </div>
       }
     >
       <div className="space-y-6 max-w-2xl">
         <div>
           <h1 className="text-3xl font-bold tracking-tight">Einstellungen</h1>
           <p className="text-muted-foreground">Konfigurieren Sie Ihre LetterXpress-Integration</p>
         </div>
 
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Key className="h-5 w-5" />
               API-Zugang
             </CardTitle>
             <CardDescription>
               Geben Sie Ihren LetterXpress API-Key ein. Sie finden diesen in Ihrem LetterXpress-Dashboard.
             </CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
             <div>
               <Label htmlFor="apiKey">API-Key</Label>
               <Input
                 id="apiKey"
                 type="password"
                 value={apiKey}
                 onChange={(e) => setApiKey(e.target.value)}
                 placeholder="Ihr LetterXpress API-Key"
               />
             </div>
           </CardContent>
         </Card>
 
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <TestTube className="h-5 w-5" />
               Test-Modus
             </CardTitle>
             <CardDescription>
               Im Test-Modus werden keine echten Briefe versendet. Nutzen Sie diesen zum Testen Ihrer Integration.
             </CardDescription>
           </CardHeader>
           <CardContent>
             <div className="flex items-center justify-between">
               <div>
                 <p className="font-medium">Test-Modus aktivieren</p>
                 <p className="text-sm text-muted-foreground">Briefe werden simuliert, nicht echt versendet</p>
               </div>
               <Switch
                 checked={testMode}
                 onCheckedChange={setTestMode}
               />
             </div>
           </CardContent>
         </Card>
 
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <FileText className="h-5 w-5" />
               Standard-Absender
             </CardTitle>
             <CardDescription>
               Diese Adresse wird als Absender auf allen Briefen verwendet.
             </CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
             <div>
               <Label>Name / Firma</Label>
               <Input
                 value={senderName}
                 onChange={(e) => setSenderName(e.target.value)}
                 placeholder="Mustermann Immobilien GmbH"
               />
             </div>
             <div>
               <Label>Straße</Label>
               <Input
                 value={senderStreet}
                 onChange={(e) => setSenderStreet(e.target.value)}
                 placeholder="Musterstraße 1"
               />
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <Label>PLZ</Label>
                 <Input
                   value={senderPostalCode}
                   onChange={(e) => setSenderPostalCode(e.target.value)}
                   placeholder="12345"
                 />
               </div>
               <div>
                 <Label>Ort</Label>
                 <Input
                   value={senderCity}
                   onChange={(e) => setSenderCity(e.target.value)}
                   placeholder="Berlin"
                 />
               </div>
             </div>
           </CardContent>
         </Card>
 
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Upload className="h-5 w-5" />
               Briefpapier
             </CardTitle>
             <CardDescription>
               Laden Sie eine PDF-Datei hoch, die als Hintergrund für alle Briefe verwendet wird.
             </CardDescription>
           </CardHeader>
           <CardContent>
             <div className="border-2 border-dashed rounded-lg p-6 text-center">
               <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
               <p className="text-sm text-muted-foreground mb-2">PDF-Datei hier ablegen</p>
               <Button variant="outline" size="sm">Datei auswählen</Button>
             </div>
           </CardContent>
         </Card>
 
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Globe className="h-5 w-5" />
               Webhook-URL
             </CardTitle>
             <CardDescription>
               Tragen Sie diese URL in Ihrem LetterXpress-Dashboard ein, um Status-Updates zu erhalten.
             </CardDescription>
           </CardHeader>
           <CardContent>
             <div className="flex gap-2">
               <Input
                 value={generatedWebhookUrl}
                 readOnly
                 className="font-mono text-sm"
               />
               <Button 
                 variant="outline"
                 onClick={() => navigator.clipboard.writeText(generatedWebhookUrl)}
               >
                 Kopieren
               </Button>
             </div>
           </CardContent>
         </Card>
       </div>
     </MainLayout>
   );
 }