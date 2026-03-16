import { useState } from 'react';
import {
  Mail,
  Copy,
  Check,
  Plus,
  X,
  Power,
  PowerOff,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  BookOpen,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEmailInbox, EmailReceipt } from '@/hooks/useEmailInbox';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; icon: typeof Check; className: string }> = {
  pending: { label: 'Ausstehend', icon: Clock, className: 'bg-warning/10 text-warning border-warning/30' },
  processed: { label: 'Verarbeitet', icon: CheckCircle2, className: 'bg-primary/10 text-primary border-primary/30' },
  question: { label: 'Offene Frage', icon: AlertCircle, className: 'bg-destructive/10 text-destructive border-destructive/30' },
  error: { label: 'Fehler', icon: XCircle, className: 'bg-destructive/10 text-destructive border-destructive/30' },
  booked: { label: 'Gebucht', icon: Check, className: 'bg-accent/50 text-accent-foreground border-accent/30' },
};

export function EmailInboxTab() {
  const {
    inbox,
    emailReceipts,
    loading,
    receiptsLoading,
    createInbox,
    addAllowedSender,
    removeAllowedSender,
    toggleInboxActive,
    bookEmailReceipt,
    deleteEmailReceipt,
  } = useEmailInbox();

  const [newSenderEmail, setNewSenderEmail] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (inbox?.inbox_address) {
      navigator.clipboard.writeText(inbox.inbox_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddSender = () => {
    if (newSenderEmail && newSenderEmail.includes('@')) {
      addAllowedSender(newSenderEmail);
      setNewSenderEmail('');
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const processedReceipts = emailReceipts.filter((r) => r.status === 'processed');
  const bookedReceipts = emailReceipts.filter((r) => r.status === 'booked');

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Inbox Setup */}
      {!inbox ? (
        <Card className="glass border-dashed border-2 border-primary/30">
          <CardContent className="py-12 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">E-Mail-Belegempfang einrichten</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Generieren Sie eine persönliche E-Mail-Adresse, an die Sie Belege als PDF senden können.
              </p>
            </div>
            <Button onClick={createInbox} className="gap-2">
              <Mail className="h-4 w-4" />
              E-Mail-Adresse generieren
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Inbox Configuration */}
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    E-Mail-Belegempfang
                  </CardTitle>
                  <CardDescription>
                    Senden Sie Belege als PDF-Anhang an diese Adresse
                  </CardDescription>
                </div>
                <Button
                  variant={inbox.is_active ? 'outline' : 'destructive'}
                  size="sm"
                  onClick={toggleInboxActive}
                  className="gap-2"
                >
                  {inbox.is_active ? (
                    <>
                      <Power className="h-4 w-4" />
                      Aktiv
                    </>
                  ) : (
                    <>
                      <PowerOff className="h-4 w-4" />
                      Inaktiv
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email Address */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <code className="text-sm font-mono flex-1 truncate">{inbox.inbox_address}</code>
                <Button variant="ghost" size="sm" onClick={handleCopy} className="shrink-0">
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              {/* Allowed Senders */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Erlaubte Absender</h4>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="absender@beispiel.de"
                    value={newSenderEmail}
                    onChange={(e) => setNewSenderEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSender()}
                    className="bg-secondary/50"
                  />
                  <Button size="sm" onClick={handleAddSender} disabled={!newSenderEmail.includes('@')}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {inbox.allowed_senders.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {inbox.allowed_senders.map((sender) => (
                      <Badge key={sender} variant="secondary" className="gap-1 pl-3">
                        {sender}
                        <button
                          onClick={() => removeAllowedSender(sender)}
                          className="ml-1 hover:text-destructive transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Keine Absender-Einschränkung – alle E-Mails werden akzeptiert.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="kpi-card">
              <div className="p-2 rounded-lg bg-primary/10 w-fit">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div className="mt-3">
                <p className="text-sm text-muted-foreground">Empfangen</p>
                <p className="text-2xl font-bold">{emailReceipts.length}</p>
              </div>
            </div>
            <div className="kpi-card">
              <div className="p-2 rounded-lg bg-primary/10 w-fit">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div className="mt-3">
                <p className="text-sm text-muted-foreground">Verarbeitet</p>
                <p className="text-2xl font-bold">{processedReceipts.length}</p>
              </div>
            </div>
            <div className="kpi-card">
              <div className="p-2 rounded-lg bg-accent/10 w-fit">
                <Check className="h-5 w-5 text-accent-foreground" />
              </div>
              <div className="mt-3">
                <p className="text-sm text-muted-foreground">Gebucht</p>
                <p className="text-2xl font-bold">{bookedReceipts.length}</p>
              </div>
            </div>
            <div className="kpi-card">
              <div className="p-2 rounded-lg bg-destructive/10 w-fit">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div className="mt-3">
                <p className="text-sm text-muted-foreground">Offene Fragen</p>
                <p className="text-2xl font-bold">
                  {emailReceipts.filter((r) => r.status === 'question').length}
                </p>
              </div>
            </div>
          </div>

          {/* Email Receipts List */}
          {receiptsLoading ? (
            <div className="p-8 text-center text-muted-foreground">Laden...</div>
          ) : emailReceipts.length === 0 ? (
            <Card className="glass">
              <CardContent className="py-12 text-center">
                <Mail className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Noch keine E-Mail-Belege empfangen</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Senden Sie eine E-Mail mit PDF-Anhang an{' '}
                  <code className="text-primary">{inbox.inbox_address}</code>
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {emailReceipts.map((receipt) => (
                <EmailReceiptCard
                  key={receipt.id}
                  receipt={receipt}
                  onBook={() => bookEmailReceipt(receipt.id)}
                  onDelete={() => deleteEmailReceipt(receipt.id)}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EmailReceiptCard({
  receipt,
  onBook,
  onDelete,
  formatCurrency,
  formatDate,
}: {
  receipt: EmailReceipt;
  onBook: () => void;
  onDelete: () => void;
  formatCurrency: (v: number | null) => string;
  formatDate: (v: string | null) => string;
}) {
  const status = statusConfig[receipt.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div className="glass rounded-xl p-4 hover:bg-secondary/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium truncate">{receipt.subject || '(kein Betreff)'}</span>
            <Badge variant="outline" className={cn('text-xs', status.className)}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <span>Von: {receipt.sender_email}</span>
            <span>{formatDate(receipt.received_at)}</span>
            {receipt.file_name && <span>{receipt.file_name}</span>}
          </div>
          {receipt.vendor && (
            <div className="flex items-center gap-4 text-sm flex-wrap">
              <span>
                <strong>Händler:</strong> {receipt.vendor}
              </span>
              {receipt.amount !== null && (
                <span className="text-primary font-semibold">{formatCurrency(receipt.amount)}</span>
              )}
              {receipt.category && <span className="text-muted-foreground">{receipt.category}</span>}
            </div>
          )}
          {receipt.question_text && (
            <div className="flex items-start gap-2 p-2 rounded-lg bg-destructive/5 border border-destructive/20 text-sm">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <span className="text-destructive">{receipt.question_text}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {(receipt.status === 'processed' || receipt.status === 'question') && (
            <Button variant="ghost" size="sm" onClick={onBook} className="gap-1 text-primary">
              <BookOpen className="h-4 w-4" />
              Buchen
            </Button>
          )}
          {receipt.status !== 'booked' && (
            <Button variant="ghost" size="icon" onClick={onDelete} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
