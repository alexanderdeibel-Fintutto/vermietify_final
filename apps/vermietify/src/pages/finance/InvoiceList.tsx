import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader, EmptyState, LoadingState } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Plus,
  Search,
  Send,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export default function InvoiceList() {
  const { data: invoices, isLoading } = useInvoices();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];

    return invoices.filter((invoice) => {
      // Tab filter
      if (activeTab !== "all" && invoice.status !== activeTab) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesNumber = invoice.invoice_number?.toLowerCase().includes(query);
        const matchesRecipient = invoice.recipient_name?.toLowerCase().includes(query);
        if (!matchesNumber && !matchesRecipient) return false;
      }

      return true;
    });
  }, [invoices, activeTab, searchQuery]);

  const statusCounts = useMemo(() => {
    if (!invoices) return { all: 0, draft: 0, sent: 0, paid: 0, overdue: 0 };
    return {
      all: invoices.length,
      draft: invoices.filter((i) => i.status === "draft").length,
      sent: invoices.filter((i) => i.status === "sent").length,
      paid: invoices.filter((i) => i.status === "paid").length,
      overdue: invoices.filter((i) => i.status === "overdue").length,
    };
  }, [invoices]);

  if (isLoading) {
    return (
      <MainLayout title="Rechnungen">
        <LoadingState />
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="Rechnungen"
      breadcrumbs={[
        { label: "Finanzen", href: "/finanzen" },
        { label: "Rechnungen" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Rechnungen"
          actions={
            <Button asChild>
              <Link to="/finanzen/rechnungen/neu">
                <Plus className="h-4 w-4 mr-2" />
                Neue Rechnung
              </Link>
            </Button>
          }
        />

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechnungsnr. oder Empfänger suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">
              Alle ({statusCounts.all})
            </TabsTrigger>
            <TabsTrigger value="draft">
              Entwurf ({statusCounts.draft})
            </TabsTrigger>
            <TabsTrigger value="sent">
              Gesendet ({statusCounts.sent})
            </TabsTrigger>
            <TabsTrigger value="paid">
              Bezahlt ({statusCounts.paid})
            </TabsTrigger>
            <TabsTrigger value="overdue">
              Überfällig ({statusCounts.overdue})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {filteredInvoices.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <EmptyState
                    icon={FileText}
                    title="Keine Rechnungen gefunden"
                    description={
                      invoices?.length === 0
                        ? "Erstellen Sie Ihre erste Rechnung."
                        : "Keine Rechnungen entsprechen den Filterkriterien."
                    }
                    action={
                      invoices?.length === 0 && (
                        <Button asChild>
                          <Link to="/finanzen/rechnungen/neu">
                            <Plus className="h-4 w-4 mr-2" />
                            Neue Rechnung
                          </Link>
                        </Button>
                      )
                    }
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="relative overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase text-muted-foreground border-b">
                        <tr>
                          <th className="px-4 py-3">Rechnungsnr.</th>
                          <th className="px-4 py-3">Empfänger</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Betrag</th>
                          <th className="px-4 py-3">Fälligkeitsdatum</th>
                          <th className="px-4 py-3 text-right">Aktionen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInvoices.map((invoice) => {
                          const statusConfig = STATUS_CONFIG[invoice.status];
                          const StatusIcon = statusConfig.icon;
                          return (
                            <tr
                              key={invoice.id}
                              className="border-b last:border-0 hover:bg-muted/50 cursor-pointer"
                            >
                              <td className="px-4 py-3 font-medium">
                                <Link
                                  to={`/finanzen/rechnungen/${invoice.id}`}
                                  className="hover:text-primary"
                                >
                                  {invoice.invoice_number}
                                </Link>
                              </td>
                              <td className="px-4 py-3">{invoice.recipient_name}</td>
                              <td className="px-4 py-3">
                                <Badge className={statusConfig.className}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusConfig.label}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-right font-medium">
                                {formatCurrency(invoice.total_cents / 100)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {invoice.due_date
                                  ? new Date(invoice.due_date).toLocaleDateString("de-DE")
                                  : "-"}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                      <Link to={`/finanzen/rechnungen/${invoice.id}`}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        Anzeigen
                                      </Link>
                                    </DropdownMenuItem>
                                    {invoice.status === "draft" && (
                                      <DropdownMenuItem>
                                        <Send className="h-4 w-4 mr-2" />
                                        Senden
                                      </DropdownMenuItem>
                                    )}
                                    {invoice.status === "sent" && (
                                      <DropdownMenuItem>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Als bezahlt markieren
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
