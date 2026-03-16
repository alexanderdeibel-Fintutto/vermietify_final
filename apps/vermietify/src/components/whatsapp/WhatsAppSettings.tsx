 import { useState, useEffect } from "react";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import { Switch } from "@/components/ui/switch";
 import { Separator } from "@/components/ui/separator";
 import { Badge } from "@/components/ui/badge";
 import { Save, RefreshCw, ExternalLink, Copy, CheckCircle } from "lucide-react";
 import { useWhatsApp } from "@/hooks/useWhatsApp";
 import { toast } from "sonner";
 
 export function WhatsAppSettings() {
   const { settings, updateSettings } = useWhatsApp();
   const [formData, setFormData] = useState({
     phone_number_id: "",
     business_account_id: "",
     access_token_encrypted: "",
     webhook_verify_token: "",
     business_name: "",
     business_description: "",
     business_address: "",
     greeting_message: "",
     away_message: "",
     away_enabled: false,
   });
   const [copied, setCopied] = useState(false);
 
   useEffect(() => {
     if (settings) {
       setFormData({
         phone_number_id: settings.phone_number_id || "",
         business_account_id: settings.business_account_id || "",
         access_token_encrypted: settings.access_token_encrypted || "",
         webhook_verify_token: settings.webhook_verify_token || "",
         business_name: settings.business_name || "",
         business_description: settings.business_description || "",
         business_address: settings.business_address || "",
         greeting_message: settings.greeting_message || "",
         away_message: settings.away_message || "",
         away_enabled: settings.away_enabled || false,
       });
     }
   }, [settings]);
 
   const handleSave = async () => {
     await updateSettings.mutateAsync(formData);
   };
 
   const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook`;
 
   const copyWebhookUrl = () => {
     navigator.clipboard.writeText(webhookUrl);
     setCopied(true);
     toast.success("Webhook-URL kopiert");
     setTimeout(() => setCopied(false), 2000);
   };
 
   const generateVerifyToken = () => {
     const token = crypto.randomUUID();
     setFormData(prev => ({ ...prev, webhook_verify_token: token }));
   };
 
   return (
     <div className="space-y-6">
       {/* API Configuration */}
       <Card>
         <CardHeader>
           <CardTitle>WhatsApp Business API</CardTitle>
           <CardDescription>
             Verbinden Sie Ihr WhatsApp Business Konto über die Meta Business API
           </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
           <div className="grid gap-4 md:grid-cols-2">
             <div>
               <Label>Phone Number ID</Label>
               <Input
                 value={formData.phone_number_id}
                 onChange={(e) => setFormData(prev => ({ ...prev, phone_number_id: e.target.value }))}
                 placeholder="Ihre WhatsApp Phone Number ID"
               />
             </div>
             <div>
               <Label>Business Account ID</Label>
               <Input
                 value={formData.business_account_id}
                 onChange={(e) => setFormData(prev => ({ ...prev, business_account_id: e.target.value }))}
                 placeholder="Ihre WhatsApp Business Account ID"
               />
             </div>
           </div>
 
           <div>
             <Label>Access Token</Label>
             <Input
               type="password"
               value={formData.access_token_encrypted}
               onChange={(e) => setFormData(prev => ({ ...prev, access_token_encrypted: e.target.value }))}
               placeholder="Ihr permanenter Access Token"
             />
             <p className="text-xs text-muted-foreground mt-1">
               Erstellen Sie einen permanenten Token in der Meta Business Suite
             </p>
           </div>
 
           <Button variant="outline" asChild>
             <a 
               href="https://developers.facebook.com/apps/" 
               target="_blank" 
               rel="noopener noreferrer"
               className="flex items-center gap-2"
             >
               <ExternalLink className="h-4 w-4" />
               Meta for Developers öffnen
             </a>
           </Button>
         </CardContent>
       </Card>
 
       {/* Webhook Configuration */}
       <Card>
         <CardHeader>
           <CardTitle>Webhook-Konfiguration</CardTitle>
           <CardDescription>
             Konfigurieren Sie den Webhook in der Meta Developer Console
           </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
           <div>
             <Label>Webhook-URL</Label>
             <div className="flex gap-2">
               <Input value={webhookUrl} readOnly className="font-mono text-sm" />
               <Button variant="outline" size="icon" onClick={copyWebhookUrl}>
                 {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
               </Button>
             </div>
           </div>
 
           <div>
             <Label>Verify Token</Label>
             <div className="flex gap-2">
               <Input
                 value={formData.webhook_verify_token}
                 onChange={(e) => setFormData(prev => ({ ...prev, webhook_verify_token: e.target.value }))}
                 placeholder="Ihr Verify Token"
               />
               <Button variant="outline" size="icon" onClick={generateVerifyToken}>
                 <RefreshCw className="h-4 w-4" />
               </Button>
             </div>
             <p className="text-xs text-muted-foreground mt-1">
               Verwenden Sie diesen Token bei der Webhook-Verifizierung in Meta
             </p>
           </div>
 
           <div className="bg-muted/50 rounded-lg p-4">
             <h4 className="font-medium mb-2">Webhook-Felder abonnieren:</h4>
             <ul className="text-sm text-muted-foreground space-y-1">
               <li>• messages</li>
               <li>• message_deliveries</li>
               <li>• message_reads</li>
             </ul>
           </div>
         </CardContent>
       </Card>
 
       {/* Business Profile */}
       <Card>
         <CardHeader>
           <CardTitle>Business-Profil</CardTitle>
           <CardDescription>
             Informationen, die Ihren Kontakten angezeigt werden
           </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
           <div>
             <Label>Business-Name</Label>
             <Input
               value={formData.business_name}
               onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
               placeholder="z.B. Mustermann Hausverwaltung"
             />
           </div>
 
           <div>
             <Label>Beschreibung</Label>
             <Textarea
               value={formData.business_description}
               onChange={(e) => setFormData(prev => ({ ...prev, business_description: e.target.value }))}
               placeholder="Kurze Beschreibung Ihres Unternehmens"
               rows={3}
             />
           </div>
 
           <div>
             <Label>Adresse</Label>
             <Input
               value={formData.business_address}
               onChange={(e) => setFormData(prev => ({ ...prev, business_address: e.target.value }))}
               placeholder="Ihre Geschäftsadresse"
             />
           </div>
         </CardContent>
       </Card>
 
       {/* Auto-Responses */}
       <Card>
         <CardHeader>
           <CardTitle>Automatische Antworten</CardTitle>
           <CardDescription>
             Nachrichten, die automatisch gesendet werden
           </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
           <div>
             <Label>Begrüßungsnachricht</Label>
             <Textarea
               value={formData.greeting_message}
               onChange={(e) => setFormData(prev => ({ ...prev, greeting_message: e.target.value }))}
               placeholder="Wird beim ersten Kontakt gesendet..."
               rows={3}
             />
             <p className="text-xs text-muted-foreground mt-1">
               Wird gesendet, wenn ein neuer Kontakt Sie zum ersten Mal anschreibt
             </p>
           </div>
 
           <Separator />
 
           <div className="flex items-center justify-between">
             <div>
               <Label>Abwesenheitsnachricht</Label>
               <p className="text-sm text-muted-foreground">
                 Automatisch antworten wenn aktiviert
               </p>
             </div>
             <Switch
               checked={formData.away_enabled}
               onCheckedChange={(checked) => setFormData(prev => ({ ...prev, away_enabled: checked }))}
             />
           </div>
 
           {formData.away_enabled && (
             <div>
               <Textarea
                 value={formData.away_message}
                 onChange={(e) => setFormData(prev => ({ ...prev, away_message: e.target.value }))}
                 placeholder="Vielen Dank für Ihre Nachricht. Wir sind derzeit nicht erreichbar..."
                 rows={3}
               />
             </div>
           )}
         </CardContent>
       </Card>
 
       {/* GDPR / Opt-in */}
       <Card>
         <CardHeader>
           <CardTitle>DSGVO & Opt-in</CardTitle>
           <CardDescription>
             Verwalten Sie die Einwilligung Ihrer Kontakte
           </CardDescription>
         </CardHeader>
         <CardContent>
           <div className="bg-muted/50 rounded-lg p-4">
             <h4 className="font-medium mb-2">Wichtige Hinweise:</h4>
             <ul className="text-sm text-muted-foreground space-y-2">
               <li>• Kontakte müssen aktiv einwilligen, bevor Sie ihnen Nachrichten senden dürfen</li>
               <li>• Das 24-Stunden-Fenster gilt für Freitext-Nachrichten nach einer eingehenden Nachricht</li>
               <li>• Außerhalb des Fensters können nur genehmigte Vorlagen verwendet werden</li>
               <li>• Opt-out-Anfragen müssen umgehend bearbeitet werden</li>
             </ul>
           </div>
         </CardContent>
       </Card>
 
       {/* Save Button */}
       <div className="flex justify-end">
         <Button onClick={handleSave} disabled={updateSettings.isPending}>
           <Save className="h-4 w-4 mr-2" />
           {updateSettings.isPending ? "Wird gespeichert..." : "Einstellungen speichern"}
         </Button>
       </div>
     </div>
   );
 }