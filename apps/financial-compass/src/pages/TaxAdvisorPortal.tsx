import { useState } from 'react';
import {
  UserCheck,
  Plus,
  Key,
  Shield,
  Clock,
  Activity,
  Copy,
  RefreshCw,
  Ban,
  Calendar,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Settings,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCompany } from '@/contexts/CompanyContext';
import { useTaxAdvisorPortal, AdvisorPermissions, TaxAdvisorAccess } from '@/hooks/useTaxAdvisorPortal';
import { useToast } from '@/hooks/use-toast';

const defaultPermissions: AdvisorPermissions = {
  view_transactions: true,
  view_invoices: true,
  view_receipts: true,
  view_reports: true,
  export_datev: true,
  export_gdpdu: false,
  view_bank_accounts: false,
  view_contacts: true,
};

export default function TaxAdvisorPortal() {
  const { currentCompany } = useCompany();
  const { toast } = useToast();
  const {
    accessList,
    activityLog,
    settings,
    loading,
    createAccess,
    revokeAccess,
    extendAccess,
    regenerateCode,
    updatePermissions,
    updateSettings,
    getStats,
  } = useTaxAdvisorPortal();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedAccess, setSelectedAccess] = useState<TaxAdvisorAccess | null>(null);
  const [activeTab, setActiveTab] = useState('advisors');

  const [newAdvisor, setNewAdvisor] = useState({
    advisor_name: '',
    advisor_email: '',
    firm_name: '',
    expires_in_days: '365',
    permissions: { ...defaultPermissions },
  });

  const stats = getStats();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (access: TaxAdvisorAccess) => {
    if (access.status === 'revoked') {
      return <Badge variant="destructive">Widerrufen</Badge>;
    }
    if (new Date(access.expires_at) < new Date()) {
      return <Badge variant="secondary">Abgelaufen</Badge>;
    }
    return <Badge variant="default" className="bg-success">Aktiv</Badge>;
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      login: 'Anmeldung',
      view_report: 'Bericht angesehen',
      export_datev: 'DATEV-Export',
      export_gdpdu: 'GDPdU-Export',
      view_transactions: 'Buchungen angesehen',
      view_invoices: 'Rechnungen angesehen',
      download: 'Download',
    };
    return labels[action] || action;
  };

  const handleCreateAccess = () => {
    if (!newAdvisor.advisor_name || !newAdvisor.advisor_email) {
      toast({
        title: 'Fehler',
        description: 'Bitte füllen Sie alle Pflichtfelder aus.',
        variant: 'destructive',
      });
      return;
    }

    const result = createAccess(
      {
        advisor_name: newAdvisor.advisor_name,
        advisor_email: newAdvisor.advisor_email,
        firm_name: newAdvisor.firm_name || undefined,
        permissions: newAdvisor.permissions,
      },
      parseInt(newAdvisor.expires_in_days)
    );

    if (result) {
      toast({
        title: 'Zugang erstellt',
        description: `Der Zugangscode wurde für ${result.advisor_name} erstellt.`,
      });
      setCreateDialogOpen(false);
      setNewAdvisor({
        advisor_name: '',
        advisor_email: '',
        firm_name: '',
        expires_in_days: '365',
        permissions: { ...defaultPermissions },
      });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Kopiert',
      description: 'Zugangscode in Zwischenablage kopiert.',
    });
  };

  const handleRevoke = (accessId: string) => {
    revokeAccess(accessId);
    toast({
      title: 'Zugang widerrufen',
      description: 'Der Zugang wurde widerrufen.',
    });
  };

  const handleRegenerateCode = (accessId: string) => {
    const newCode = regenerateCode(accessId);
    if (newCode) {
      toast({
        title: 'Neuer Code generiert',
        description: 'Ein neuer Zugangscode wurde generiert.',
      });
    }
  };

  const handleExtend = (accessId: string) => {
    extendAccess(accessId, 365);
    toast({
      title: 'Zugang verlängert',
      description: 'Der Zugang wurde um 1 Jahr verlängert.',
    });
  };

  if (!currentCompany) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        Bitte wählen Sie eine Firma aus.
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Steuerberater-Portal</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Zugang für Ihren Steuerberater verwalten
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Neuen Zugang erstellen</span>
              <span className="sm:hidden">Neu</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Neuen Steuerberater-Zugang erstellen</DialogTitle>
              <DialogDescription>
                Generieren Sie einen Zugangscode für Ihren Steuerberater.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Name des Steuerberaters *</Label>
                <Input
                  placeholder="z.B. Dr. Max Mustermann"
                  value={newAdvisor.advisor_name}
                  onChange={(e) => setNewAdvisor({ ...newAdvisor, advisor_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>E-Mail-Adresse *</Label>
                <Input
                  type="email"
                  placeholder="steuerberater@kanzlei.de"
                  value={newAdvisor.advisor_email}
                  onChange={(e) => setNewAdvisor({ ...newAdvisor, advisor_email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Kanzleiname (optional)</Label>
                <Input
                  placeholder="Kanzlei Mustermann & Partner"
                  value={newAdvisor.firm_name}
                  onChange={(e) => setNewAdvisor({ ...newAdvisor, firm_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Gültigkeitsdauer</Label>
                <Select
                  value={newAdvisor.expires_in_days}
                  onValueChange={(v) => setNewAdvisor({ ...newAdvisor, expires_in_days: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 Tage</SelectItem>
                    <SelectItem value="90">90 Tage</SelectItem>
                    <SelectItem value="180">6 Monate</SelectItem>
                    <SelectItem value="365">1 Jahr</SelectItem>
                    <SelectItem value="730">2 Jahre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-4 space-y-3">
                <Label className="text-sm font-medium">Berechtigungen</Label>
                {Object.entries({
                  view_transactions: 'Buchungen einsehen',
                  view_invoices: 'Rechnungen einsehen',
                  view_receipts: 'Belege einsehen',
                  view_reports: 'Berichte einsehen',
                  export_datev: 'DATEV-Export',
                  export_gdpdu: 'GDPdU-Export',
                  view_bank_accounts: 'Bankkonten einsehen',
                  view_contacts: 'Kontakte einsehen',
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Checkbox
                      checked={newAdvisor.permissions[key as keyof AdvisorPermissions]}
                      onCheckedChange={(checked) =>
                        setNewAdvisor({
                          ...newAdvisor,
                          permissions: {
                            ...newAdvisor.permissions,
                            [key]: checked,
                          },
                        })
                      }
                    />
                    <Label className="text-sm font-normal">{label}</Label>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleCreateAccess}>Zugang erstellen</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card className="glass">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Steuerberater</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.totalAdvisors}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-primary/10 shrink-0 ml-2">
                <UserCheck className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Aktive Zugänge</p>
                <p className="text-lg sm:text-2xl font-bold text-success">{stats.activeAdvisors}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-success/10 shrink-0 ml-2">
                <Shield className="h-4 w-4 sm:h-6 sm:w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Anmeldungen</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.totalLogins}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-info/10 shrink-0 ml-2">
                <Activity className="h-4 w-4 sm:h-6 sm:w-6 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Portal Status</p>
                <p className="text-lg sm:text-2xl font-bold text-success">Aktiv</p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-success/10 shrink-0 ml-2">
                <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="advisors" className="flex-1 sm:flex-none gap-2">
            <UserCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Steuerberater</span>
            <span className="sm:hidden">Berater</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex-1 sm:flex-none gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Aktivitäten</span>
            <span className="sm:hidden">Aktivität</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex-1 sm:flex-none gap-2">
            <Settings className="h-4 w-4" />
            <span>Einstellungen</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="advisors" className="mt-4">
          {accessList.length === 0 ? (
            <Card className="glass">
              <CardContent className="p-8 text-center text-muted-foreground">
                <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Noch keine Steuerberater-Zugänge erstellt.</p>
                <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ersten Zugang erstellen
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {accessList.map((access) => (
                <Card key={access.id} className="glass">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">{access.advisor_name}</h3>
                            {access.firm_name && (
                              <p className="text-sm text-muted-foreground">{access.firm_name}</p>
                            )}
                          </div>
                          {getStatusBadge(access)}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          <Mail className="h-4 w-4" />
                          <span>{access.advisor_email}</span>
                        </div>

                        <div className="bg-secondary/50 rounded-lg p-3 mb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Zugangscode</p>
                              <code className="text-sm sm:text-base font-mono font-bold">
                                {access.access_code}
                              </code>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCopyCode(access.access_code)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              {access.status === 'active' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRegenerateCode(access.id)}
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Gültig bis: {formatDate(access.expires_at)}</span>
                          </div>
                          {access.last_access_at && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>Letzter Zugriff: {formatDate(access.last_access_at)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex sm:flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 sm:flex-none"
                          onClick={() => {
                            setSelectedAccess(access);
                            setDetailsDialogOpen(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Details
                        </Button>
                        {access.status === 'active' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 sm:flex-none"
                              onClick={() => handleExtend(access.id)}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              Verlängern
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="flex-1 sm:flex-none"
                              onClick={() => handleRevoke(access.id)}
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Widerrufen
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg">Aktivitätsprotokoll</CardTitle>
              <CardDescription>Alle Zugriffe und Aktionen Ihrer Steuerberater</CardDescription>
            </CardHeader>
            <CardContent>
              {activityLog.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Noch keine Aktivitäten aufgezeichnet.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {activityLog.map((activity) => {
                    const access = accessList.find(a => a.id === activity.access_id);
                    return (
                      <div key={activity.id} className="flex items-center gap-4 py-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Activity className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {getActionLabel(activity.action)}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {access?.advisor_name || 'Unbekannt'}
                            {activity.details && ` • ${activity.details}`}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(activity.timestamp)}
                          </p>
                          {activity.ip_address && (
                            <p className="text-xs text-muted-foreground">
                              IP: {activity.ip_address}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg">Portal-Einstellungen</CardTitle>
              <CardDescription>Konfigurieren Sie das Steuerberater-Portal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Portal aktiviert</p>
                  <p className="text-sm text-muted-foreground">
                    Steuerberater können auf Ihre Daten zugreifen
                  </p>
                </div>
                <Switch
                  checked={settings?.portal_enabled}
                  onCheckedChange={(checked) =>
                    settings && updateSettings({ ...settings, portal_enabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Benachrichtigung bei Zugriff</p>
                  <p className="text-sm text-muted-foreground">
                    E-Mail bei jedem Steuerberater-Login
                  </p>
                </div>
                <Switch
                  checked={settings?.notification_on_access}
                  onCheckedChange={(checked) =>
                    settings && updateSettings({ ...settings, notification_on_access: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Zwei-Faktor-Authentifizierung</p>
                  <p className="text-sm text-muted-foreground">
                    2FA für Steuerberater-Logins erforderlich
                  </p>
                </div>
                <Switch
                  checked={settings?.require_2fa}
                  onCheckedChange={(checked) =>
                    settings && updateSettings({ ...settings, require_2fa: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Standard-Gültigkeitsdauer für neue Zugänge</Label>
                <Select
                  value={settings?.auto_expire_days.toString()}
                  onValueChange={(v) =>
                    settings && updateSettings({ ...settings, auto_expire_days: parseInt(v) })
                  }
                >
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 Tage</SelectItem>
                    <SelectItem value="90">90 Tage</SelectItem>
                    <SelectItem value="180">6 Monate</SelectItem>
                    <SelectItem value="365">1 Jahr</SelectItem>
                    <SelectItem value="730">2 Jahre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Zugangsdetails</DialogTitle>
            <DialogDescription>
              {selectedAccess?.advisor_name} - {selectedAccess?.firm_name || 'Keine Kanzlei'}
            </DialogDescription>
          </DialogHeader>
          {selectedAccess && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-sm text-muted-foreground">Zugangscode</Label>
                <code className="block mt-1 font-mono text-lg font-bold">
                  {selectedAccess.access_code}
                </code>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Erstellt am</Label>
                  <p className="mt-1">{formatDate(selectedAccess.created_at)}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Gültig bis</Label>
                  <p className="mt-1">{formatDate(selectedAccess.expires_at)}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Berechtigungen</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries({
                    view_transactions: 'Buchungen',
                    view_invoices: 'Rechnungen',
                    view_receipts: 'Belege',
                    view_reports: 'Berichte',
                    export_datev: 'DATEV-Export',
                    export_gdpdu: 'GDPdU-Export',
                    view_bank_accounts: 'Bankkonten',
                    view_contacts: 'Kontakte',
                  }).map(([key, label]) => (
                    <div key={key} className="flex items-center gap-2">
                      {selectedAccess.permissions[key as keyof AdvisorPermissions] ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Zugriffe</Label>
                  <p className="mt-1 text-2xl font-bold">{selectedAccess.access_count}</p>
                </div>
                {selectedAccess.last_access_at && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Letzter Zugriff</Label>
                    <p className="mt-1">{formatDateTime(selectedAccess.last_access_at)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
