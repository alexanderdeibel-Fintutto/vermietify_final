import { useEffect, useState } from 'react';
import { Send, CheckCircle2, Clock, Mail, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Invitation {
  id: string;
  recipient_email: string;
  recipient_name: string | null;
  app_id: string;
  app_name: string;
  property_name: string | null;
  status: string;
  sent_at: string;
  accepted_at: string | null;
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; variant: 'default' | 'secondary' | 'outline' }> = {
  sent: { label: 'Gesendet', icon: <Clock className="h-3 w-3" />, variant: 'secondary' },
  accepted: { label: 'Angenommen', icon: <CheckCircle2 className="h-3 w-3" />, variant: 'default' },
};

export default function Invitations() {
  const { currentCompany } = useCompany();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvitations = async () => {
    if (!currentCompany) return;
    setLoading(true);
    const { data } = await supabase
      .from('app_invitations')
      .select('*')
      .eq('company_id', currentCompany.id)
      .order('sent_at', { ascending: false });
    setInvitations(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchInvitations();
  }, [currentCompany?.id]);

  const sentCount = invitations.filter(i => i.status === 'sent').length;
  const acceptedCount = invitations.filter(i => i.status === 'accepted').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Send className="h-6 w-6 text-primary" />
            Einladungen
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Übersicht aller gesendeten Einladungen und deren Status
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchInvitations} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Aktualisieren
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{invitations.length}</p>
              <p className="text-xs text-muted-foreground">Gesamt</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-yellow-500/10">
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{sentCount}</p>
              <p className="text-xs text-muted-foreground">Ausstehend</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-500/10">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{acceptedCount}</p>
              <p className="text-xs text-muted-foreground">Angenommen</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Versendete Einladungen</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Send className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Noch keine Einladungen</p>
              <p className="text-sm mt-1">Versenden Sie Einladungen über die Immobilien- oder Ökosystem-Seite.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empfänger</TableHead>
                  <TableHead>App</TableHead>
                  <TableHead>Immobilie</TableHead>
                  <TableHead>Gesendet am</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv) => {
                  const status = statusConfig[inv.status] || statusConfig.sent;
                  return (
                    <TableRow key={inv.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{inv.recipient_name || '–'}</p>
                          <p className="text-xs text-muted-foreground">{inv.recipient_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{inv.app_name}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {inv.property_name || '–'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(inv.sent_at), 'dd. MMM yyyy, HH:mm', { locale: de })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="gap-1 text-xs">
                          {status.icon}
                          {status.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
