import { useParams, Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader, EmptyState, LoadingState } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Send,
  CheckCircle,
  Download,
  Edit,
  Clock,
  AlertTriangle,
  Building2,
  User,
  Calendar,
  ArrowLeft,
} from "lucide-react";
import { useInvoices, Invoice } from "@/hooks/useInvoices";
import { formatCurrency } from "@/lib/utils";

type InvoiceStatus = Invoice["status"];

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; className: string; icon: typeof CheckCircle }> = {
  draft: { label: "Entwurf", className: "bg-muted text-muted-foreground", icon: Clock },
  sent: { label: "Gesendet", className: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Send },
  paid: { label: "Bezahlt", className: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle },
  overdue: { label: "Überfällig", className: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertTriangle },
  cancelled: { label: "Storniert", className: "bg-muted text-muted-foreground", icon: Clock },
};

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const { getInvoice, updateInvoice } = useInvoices();
  const { data: invoice, isLoading, error } = getInvoice(id!);

  const handleSend = () => {
    if (!id) return;
    updateInvoice.mutate({ id, status: "sent" });
  };

  const handleMarkPaid = () => {
    if (!id) return;
    updateInvoice.mutate({ id, status: "paid", paid_at: new Date().toISOString() });
  };

  if (isLoading) {
    return (
      <MainLayout title="Rechnung laden...">
        <LoadingState />
      </MainLayout>
    );
  }

  if (error || !invoice) {
    return (
      <MainLayout title="Fehler">
        <EmptyState
          icon={FileText}
          title="Rechnung nicht gefunden"
          description="Die angeforderte Rechnung konnte nicht gefunden werden."
          action={
            <Button asChild>
              <Link to="/finanzen/rechnungen">Zurück zur Übersicht</Link>
            </Button>
          }
        />
      </MainLayout>
    );
  }

  const statusConfig = STATUS_CONFIG[invoice.status];
  const StatusIcon = statusConfig.icon;
  const items = invoice.invoice_items || [];

  return (
    <MainLayout
      title="Rechnung"
      breadcrumbs={[
        { label: "Finanzen", href: "/finanzen" },
        { label: "Rechnungen", href: "/finanzen/rechnungen" },
        { label: invoice.invoice_number },
      ]}
    >
      <div className="space-y-6">
        {/* Back link and header */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/finanzen/rechnungen">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Zurück
            </Link>
          </Button>
        </div>

        <PageHeader
          title={`Rechnung ${invoice.invoice_number}`}
          subtitle={
            <span className="flex items-center gap-2">
              <Badge className={statusConfig.className}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </span>
          }
          actions={
            <div className="flex gap-2">
              {invoice.status === "draft" && (
                <>
                  <Button variant="outline" asChild>
                    <Link to={`/finanzen/rechnungen/${id}/bearbeiten`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Bearbeiten
                    </Link>
                  </Button>
                  <Button onClick={handleSend} disabled={updateInvoice.isPending}>
                    <Send className="h-4 w-4 mr-2" />
                    Senden
                  </Button>
                </>
              )}
              {invoice.status === "sent" && (
                <Button onClick={handleMarkPaid} disabled={updateInvoice.isPending}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Als bezahlt markieren
                </Button>
              )}
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                PDF herunterladen
              </Button>
            </div>
          }
        />

        <div className="grid gap-6 md:grid-cols-2">
          {/* Invoice Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Rechnungsdetails
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Rechnungsnummer</p>
                  <p className="font-medium">{invoice.invoice_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Typ</p>
                  <p className="font-medium">
                    {invoice.type === "outgoing" ? "Ausgehend" : "Eingehend"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Rechnungsdatum</p>
                    <p className="font-medium">
                      {new Date(invoice.issue_date).toLocaleDateString("de-DE")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fälligkeitsdatum</p>
                    <p className="font-medium">
                      {invoice.due_date
                        ? new Date(invoice.due_date).toLocaleDateString("de-DE")
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>
              {invoice.buildings?.name && (
                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Gebäude</p>
                    <p className="font-medium">{invoice.buildings.name}</p>
                  </div>
                </div>
              )}
              {invoice.paid_at && (
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Bezahlt am</p>
                    <p className="font-medium text-green-500">
                      {new Date(invoice.paid_at).toLocaleDateString("de-DE")}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recipient Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Empfänger
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-lg font-semibold">{invoice.recipient_name}</p>
              </div>
              {invoice.recipient_address && (
                <div>
                  <p className="text-sm text-muted-foreground">Adresse</p>
                  <p className="font-medium whitespace-pre-line">
                    {invoice.recipient_address}
                  </p>
                </div>
              )}
              {invoice.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notizen</p>
                  <p className="text-sm">{invoice.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle>Rechnungspositionen</CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">
                Keine Positionen vorhanden.
              </p>
            ) : (
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase text-muted-foreground border-b">
                    <tr>
                      <th className="px-4 py-3">Beschreibung</th>
                      <th className="px-4 py-3 text-right">Menge</th>
                      <th className="px-4 py-3 text-right">Einzelpreis</th>
                      <th className="px-4 py-3 text-right">MwSt.</th>
                      <th className="px-4 py-3 text-right">Gesamt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="px-4 py-3 font-medium">{item.description}</td>
                        <td className="px-4 py-3 text-right">{item.quantity}</td>
                        <td className="px-4 py-3 text-right">
                          {formatCurrency(item.unit_price_cents / 100)}
                        </td>
                        <td className="px-4 py-3 text-right">{item.tax_rate}%</td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatCurrency(item.total_cents / 100)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Totals */}
            <Separator className="my-4" />
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Zwischensumme</span>
                  <span>{formatCurrency(invoice.subtotal_cents / 100)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    MwSt. ({invoice.tax_rate}%)
                  </span>
                  <span>{formatCurrency(invoice.tax_cents / 100)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Gesamt</span>
                  <span>{formatCurrency(invoice.total_cents / 100)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
