import { useState } from 'react';
import {
  AlertCircle,
  Check,
  FileText,
  Trash2,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useEmailInbox, EmailReceipt } from '@/hooks/useEmailInbox';

export function OpenQuestionsTab() {
  const { emailReceipts, resolveQuestion, bookEmailReceipt, deleteEmailReceipt } = useEmailInbox();

  const openQuestions = emailReceipts.filter((r) => r.status === 'question' || r.status === 'error');

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  if (openQuestions.length === 0) {
    return (
      <Card className="glass">
        <CardContent className="py-12 text-center">
          <Check className="h-16 w-16 mx-auto mb-4 text-primary opacity-50" />
          <p className="text-muted-foreground font-medium">Keine offenen Fragen</p>
          <p className="text-sm text-muted-foreground mt-1">
            Alle empfangenen Belege wurden erfolgreich verarbeitet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
        <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
        <p className="text-sm">
          <strong>{openQuestions.length}</strong> Beleg{openQuestions.length !== 1 ? 'e' : ''} erfordern Ihre Aufmerksamkeit.
          Bitte prüfen und ergänzen Sie die fehlenden Informationen.
        </p>
      </div>

      {openQuestions.map((receipt) => (
        <QuestionCard
          key={receipt.id}
          receipt={receipt}
          onResolve={(updates) => resolveQuestion(receipt.id, updates)}
          onBook={() => bookEmailReceipt(receipt.id)}
          onDelete={() => deleteEmailReceipt(receipt.id)}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      ))}
    </div>
  );
}

function QuestionCard({
  receipt,
  onResolve,
  onBook,
  onDelete,
  formatCurrency,
  formatDate,
}: {
  receipt: EmailReceipt;
  onResolve: (updates: Partial<EmailReceipt>) => void;
  onBook: () => void;
  onDelete: () => void;
  formatCurrency: (v: number | null) => string;
  formatDate: (v: string | null) => string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    vendor: receipt.vendor || '',
    amount: receipt.amount?.toString() || '',
    date: receipt.date || '',
    category: receipt.category || '',
    description: receipt.description || '',
  });

  const handleSave = () => {
    onResolve({
      vendor: editData.vendor || null,
      amount: editData.amount ? parseFloat(editData.amount) : null,
      date: editData.date || null,
      category: editData.category || null,
      description: editData.description || null,
    });
    setIsEditing(false);
  };

  return (
    <div className="glass rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-destructive/10 shrink-0">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h4 className="font-medium">{receipt.subject || '(kein Betreff)'}</h4>
            <p className="text-sm text-muted-foreground">
              Von: {receipt.sender_email} • {formatDate(receipt.received_at)}
            </p>
            {receipt.file_name && (
              <div className="flex items-center gap-1 mt-1">
                <FileText className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{receipt.file_name}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!isEditing && (
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="gap-1">
              <Edit2 className="h-4 w-4" />
              Bearbeiten
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onDelete} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Question */}
      {receipt.question_text && (
        <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-sm text-destructive">
          {receipt.question_text}
        </div>
      )}

      {/* Editing or Display */}
      {isEditing ? (
        <div className="space-y-3 p-4 rounded-lg bg-secondary/30 border border-border/50">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Händler/Lieferant</Label>
              <Input
                value={editData.vendor}
                onChange={(e) => setEditData({ ...editData, vendor: e.target.value })}
                placeholder="z.B. Amazon"
                className="bg-background"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Betrag (EUR)</Label>
              <Input
                type="number"
                step="0.01"
                value={editData.amount}
                onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                placeholder="0.00"
                className="bg-background"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Datum</Label>
              <Input
                type="date"
                value={editData.date}
                onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                className="bg-background"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Kategorie</Label>
              <Input
                value={editData.category}
                onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                placeholder="z.B. Büromaterial"
                className="bg-background"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Beschreibung</Label>
            <Input
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              placeholder="Kurze Beschreibung"
              className="bg-background"
            />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Button size="sm" onClick={handleSave} className="gap-1">
              <Save className="h-4 w-4" />
              Speichern & lösen
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} className="gap-1">
              <X className="h-4 w-4" />
              Abbrechen
            </Button>
          </div>
        </div>
      ) : (
        receipt.vendor && (
          <div className="grid gap-2 md:grid-cols-3 text-sm">
            <div className="p-2 rounded bg-secondary/50">
              <span className="text-muted-foreground">Händler: </span>
              <span className="font-medium">{receipt.vendor}</span>
            </div>
            <div className="p-2 rounded bg-secondary/50">
              <span className="text-muted-foreground">Betrag: </span>
              <span className="font-semibold text-primary">{formatCurrency(receipt.amount)}</span>
            </div>
            <div className="p-2 rounded bg-secondary/50">
              <span className="text-muted-foreground">Kategorie: </span>
              <span className="font-medium">{receipt.category || '-'}</span>
            </div>
          </div>
        )
      )}

      {/* Actions */}
      {!isEditing && receipt.amount && (
        <div className="flex justify-end">
          <Button size="sm" onClick={onBook} className="gap-1">
            <Check className="h-4 w-4" />
            Jetzt buchen
          </Button>
        </div>
      )}
    </div>
  );
}
