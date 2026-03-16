import { useState, useEffect } from 'react';
import { Plus, Mail, AlertTriangle, FileText, Folder, Edit, Trash2, Eye, Copy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';

interface EmailTemplate {
  id: string;
  template_key: string;
  name: string;
  category: string;
  subject: string;
  body: string;
  variables: string[];
  created_at: string;
  updated_at: string;
}

const defaultTemplates = [
  {
    template_key: 'invoice',
    name: 'Rechnung versenden',
    category: 'invoices',
    subject: 'Rechnung {{invoice_number}} von {{company_name}}',
    body: `Sehr geehrte/r {{customer_name}},

anbei erhalten Sie Rechnung {{invoice_number}} über {{amount}}.

Bitte überweisen Sie den Betrag bis zum {{due_date}} auf unser Konto.

Mit freundlichen Grüßen
{{company_name}}`,
    variables: ['invoice_number', 'company_name', 'customer_name', 'amount', 'due_date']
  },
  {
    template_key: 'reminder1',
    name: '1. Mahnung',
    category: 'reminders',
    subject: 'Zahlungserinnerung: Rechnung {{invoice_number}}',
    body: `Sehr geehrte/r {{customer_name}},

die Rechnung {{invoice_number}} über {{amount}} ist seit {{days_overdue}} Tagen überfällig.

Bitte begleichen Sie den offenen Betrag umgehend.

Mit freundlichen Grüßen
{{company_name}}`,
    variables: ['invoice_number', 'customer_name', 'amount', 'days_overdue', 'company_name']
  },
  {
    template_key: 'reminder2',
    name: '2. Mahnung',
    category: 'reminders',
    subject: 'Zweite Mahnung: Rechnung {{invoice_number}}',
    body: `Sehr geehrte/r {{customer_name}},

trotz unserer Erinnerung ist die Rechnung {{invoice_number}} weiterhin unbezahlt.

Wir bitten Sie dringend, den Betrag von {{amount}} innerhalb von 7 Tagen zu überweisen.

Mit freundlichen Grüßen
{{company_name}}`,
    variables: ['invoice_number', 'customer_name', 'amount', 'company_name']
  },
  {
    template_key: 'welcome_tenant',
    name: 'Willkommen Mieter',
    category: 'contracts',
    subject: 'Willkommen in Ihrer neuen Wohnung',
    body: `Sehr geehrte/r {{tenant_name}},

herzlich willkommen als neuer Mieter in {{property_address}}.

Ihr Mietbeginn ist der {{start_date}}.

Bei Fragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen
{{company_name}}`,
    variables: ['tenant_name', 'property_address', 'start_date', 'company_name']
  },
  {
    template_key: 'contract_termination',
    name: 'Kündigungsbestätigung',
    category: 'contracts',
    subject: 'Bestätigung Ihrer Kündigung',
    body: `Sehr geehrte/r {{tenant_name}},

hiermit bestätigen wir den Eingang Ihrer Kündigung zum {{end_date}}.

Bitte vereinbaren Sie einen Termin zur Wohnungsübergabe.

Mit freundlichen Grüßen
{{company_name}}`,
    variables: ['tenant_name', 'end_date', 'company_name']
  }
];

const categoryLabels: Record<string, string> = {
  invoices: 'Rechnungen',
  reminders: 'Mahnungen',
  contracts: 'Verträge',
  general: 'Allgemein',
};

const categoryIcons: Record<string, typeof Mail> = {
  invoices: FileText,
  reminders: AlertTriangle,
  contracts: Folder,
  general: Mail,
};

const sampleData: Record<string, string> = {
  invoice_number: 'RE-2024-001',
  company_name: 'Muster GmbH',
  customer_name: 'Max Mustermann',
  amount: '1.250,00 €',
  due_date: '15.02.2024',
  days_overdue: '14',
  tenant_name: 'Anna Schmidt',
  property_address: 'Musterstraße 123, 12345 Berlin',
  start_date: '01.03.2024',
  end_date: '31.05.2024',
};

export default function EmailTemplates() {
  const { currentCompany } = useCompany();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<EmailTemplate> | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    if (currentCompany) {
      fetchTemplates();
    }
  }, [currentCompany]);

  const fetchTemplates = async () => {
    if (!currentCompany) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('company_id', currentCompany.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching templates:', error);
    } else {
      setTemplates(data || []);
    }
    setLoading(false);
  };

  const initializeDefaultTemplates = async () => {
    if (!currentCompany) return;

    for (const template of defaultTemplates) {
      const { error } = await supabase
        .from('email_templates')
        .insert({
          company_id: currentCompany.id,
          ...template,
        });

      if (error) {
        console.error('Error creating template:', error);
      }
    }

    await fetchTemplates();
    toast({
      title: 'Vorlagen erstellt',
      description: 'Standardvorlagen wurden erfolgreich erstellt.',
    });
  };

  const saveTemplate = async () => {
    if (!currentCompany || !editingTemplate) return;

    const templateData = {
      company_id: currentCompany.id,
      template_key: editingTemplate.template_key || `custom_${Date.now()}`,
      name: editingTemplate.name || '',
      category: editingTemplate.category || 'general',
      subject: editingTemplate.subject || '',
      body: editingTemplate.body || '',
      variables: extractVariables(editingTemplate.body || ''),
    };

    if (editingTemplate.id) {
      const { error } = await supabase
        .from('email_templates')
        .update(templateData)
        .eq('id', editingTemplate.id);

      if (error) {
        toast({ title: 'Fehler', description: 'Vorlage konnte nicht gespeichert werden.', variant: 'destructive' });
        return;
      }
    } else {
      const { error } = await supabase
        .from('email_templates')
        .insert(templateData);

      if (error) {
        toast({ title: 'Fehler', description: 'Vorlage konnte nicht erstellt werden.', variant: 'destructive' });
        return;
      }
    }

    toast({ title: 'Gespeichert', description: 'E-Mail-Vorlage wurde gespeichert.' });
    setEditorOpen(false);
    setEditingTemplate(null);
    fetchTemplates();
  };

  const deleteTemplate = async (id: string) => {
    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Fehler', description: 'Vorlage konnte nicht gelöscht werden.', variant: 'destructive' });
      return;
    }

    toast({ title: 'Gelöscht', description: 'Vorlage wurde gelöscht.' });
    fetchTemplates();
  };

  const extractVariables = (text: string): string[] => {
    const matches = text.match(/\{\{(\w+)\}\}/g);
    if (!matches) return [];
    return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))];
  };

  const insertVariable = (variable: string) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      body: (editingTemplate.body || '') + `{{${variable}}}`,
    });
  };

  const replaceVariables = (text: string): string => {
    return text.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      return sampleData[variable] || match;
    });
  };

  const filteredTemplates = selectedCategory === 'all'
    ? templates
    : templates.filter(t => t.category === selectedCategory);

  const allVariables = ['invoice_number', 'company_name', 'customer_name', 'amount', 'due_date', 'days_overdue', 'tenant_name', 'property_address', 'start_date', 'end_date'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">E-Mail-Vorlagen</h1>
          <p className="text-muted-foreground">Verwalten Sie Ihre E-Mail-Templates für Rechnungen, Mahnungen und mehr.</p>
        </div>
        <div className="flex gap-2">
          {templates.length === 0 && (
            <Button variant="outline" onClick={initializeDefaultTemplates}>
              <Copy className="h-4 w-4 mr-2" />
              Standardvorlagen laden
            </Button>
          )}
          <Button onClick={() => { setEditingTemplate({}); setEditorOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Neue Vorlage
          </Button>
        </div>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList>
          <TabsTrigger value="all">Alle</TabsTrigger>
          <TabsTrigger value="invoices">Rechnungen</TabsTrigger>
          <TabsTrigger value="reminders">Mahnungen</TabsTrigger>
          <TabsTrigger value="contracts">Verträge</TabsTrigger>
          <TabsTrigger value="general">Allgemein</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Keine Vorlagen vorhanden</p>
                <p className="text-muted-foreground text-sm mb-4">
                  Erstellen Sie Ihre erste E-Mail-Vorlage oder laden Sie die Standardvorlagen.
                </p>
                <Button onClick={initializeDefaultTemplates}>
                  Standardvorlagen laden
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((template) => {
                const CategoryIcon = categoryIcons[template.category] || Mail;
                return (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <CategoryIcon className="h-5 w-5 text-muted-foreground" />
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setPreviewTemplate(template); setPreviewOpen(true); }}>
                              <Eye className="h-4 w-4 mr-2" />
                              Vorschau
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setEditingTemplate(template); setEditorOpen(true); }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Bearbeiten
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteTemplate(template.id)} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Löschen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <CardDescription>{template.subject}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground line-clamp-3 mb-3">
                        {template.body}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline">{categoryLabels[template.category]}</Badge>
                        {template.variables?.slice(0, 3).map((v) => (
                          <Badge key={v} variant="secondary" className="text-xs">
                            {v}
                          </Badge>
                        ))}
                        {(template.variables?.length || 0) > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{(template.variables?.length || 0) - 3}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Editor Dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate?.id ? 'Vorlage bearbeiten' : 'Neue Vorlage erstellen'}</DialogTitle>
            <DialogDescription>Erstellen oder bearbeiten Sie eine E-Mail-Vorlage mit Platzhaltern.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editingTemplate?.name || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  placeholder="z.B. Rechnung versenden"
                />
              </div>
              <div className="space-y-2">
                <Label>Kategorie</Label>
                <Select
                  value={editingTemplate?.category || 'general'}
                  onValueChange={(value) => setEditingTemplate({ ...editingTemplate, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invoices">Rechnungen</SelectItem>
                    <SelectItem value="reminders">Mahnungen</SelectItem>
                    <SelectItem value="contracts">Verträge</SelectItem>
                    <SelectItem value="general">Allgemein</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Betreff</Label>
              <Input
                value={editingTemplate?.subject || ''}
                onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                placeholder="z.B. Rechnung {{invoice_number}} von {{company_name}}"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Inhalt</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="h-3 w-3 mr-1" />
                      Variable einfügen
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {allVariables.map((v) => (
                      <DropdownMenuItem key={v} onClick={() => insertVariable(v)}>
                        {`{{${v}}}`}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Textarea
                value={editingTemplate?.body || ''}
                onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                placeholder="E-Mail-Text mit {{platzhaltern}}..."
                className="min-h-[200px] font-mono text-sm"
              />
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <Label className="text-sm font-medium">Erkannte Variablen</Label>
              <div className="flex flex-wrap gap-1 mt-2">
                {extractVariables(editingTemplate?.body || '').map((v) => (
                  <Badge key={v} variant="secondary">{v}</Badge>
                ))}
                {extractVariables(editingTemplate?.body || '').length === 0 && (
                  <span className="text-sm text-muted-foreground">Keine Variablen gefunden</span>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>Abbrechen</Button>
            <Button onClick={saveTemplate}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vorschau: {previewTemplate?.name}</DialogTitle>
            <DialogDescription>So sieht die E-Mail mit Beispieldaten aus.</DialogDescription>
          </DialogHeader>

          {previewTemplate && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <Label className="text-sm text-muted-foreground">Betreff</Label>
                <p className="font-medium mt-1">{replaceVariables(previewTemplate.subject)}</p>
              </div>

              <div className="border rounded-lg p-4">
                <pre className="whitespace-pre-wrap font-sans text-sm">
                  {replaceVariables(previewTemplate.body)}
                </pre>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setPreviewOpen(false)}>Schließen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
