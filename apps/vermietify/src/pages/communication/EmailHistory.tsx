import { useState } from "react";
import { sanitizeHtml } from "@/lib/sanitize";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader, StatCard, DataTable, EmptyState, LoadingState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Mail,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  MoreHorizontal,
  Search,
  Filter,
  MailOpen,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useEmailTemplates, EmailLog, EMAIL_CATEGORIES } from "@/hooks/useEmailTemplates";

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Send; color: string }> = {
  queued: { label: "Geplant", icon: Clock, color: "bg-yellow-100 text-yellow-800" },
  sent: { label: "Gesendet", icon: Send, color: "bg-blue-100 text-blue-800" },
  delivered: { label: "Zugestellt", icon: CheckCircle, color: "bg-green-100 text-green-800" },
  opened: { label: "Geöffnet", icon: MailOpen, color: "bg-purple-100 text-purple-800" },
  failed: { label: "Fehlgeschlagen", icon: AlertCircle, color: "bg-red-100 text-red-800" },
};

export default function EmailHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);

  const { emailLogs, logsLoading, stats } = useEmailTemplates();

  // Filter logs
  const filteredLogs = emailLogs.filter((log) => {
    const matchesSearch =
      !searchTerm ||
      log.recipient_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.tenant?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.tenant?.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns: ColumnDef<EmailLog>[] = [
    {
      accessorKey: "created_at",
      header: "Datum",
      cell: ({ row }) => (
        <span className="text-sm">
          {format(new Date(row.original.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
        </span>
      ),
    },
    {
      accessorKey: "recipient",
      header: "Empfänger",
      cell: ({ row }) => (
        <div>
          {row.original.tenant ? (
            <div>
              <p className="font-medium text-sm">
                {row.original.tenant.first_name} {row.original.tenant.last_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {row.original.recipient_email}
              </p>
            </div>
          ) : (
            <p className="text-sm">{row.original.recipient_email}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "subject",
      header: "Betreff",
      cell: ({ row }) => (
        <span className="text-sm truncate max-w-[250px] block">
          {row.original.subject}
        </span>
      ),
    },
    {
      accessorKey: "template",
      header: "Vorlage",
      cell: ({ row }) => (
        row.original.template ? (
          <Badge variant="outline" className="text-xs">
            {row.original.template.name}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        )
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = STATUS_CONFIG[row.original.status];
        const Icon = status.icon;
        return (
          <Badge className={status.color}>
            <Icon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSelectedEmail(row.original)}>
              <Eye className="mr-2 h-4 w-4" />
              Details anzeigen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (logsLoading) {
    return (
      <MainLayout title="E-Mail-Verlauf">
        <LoadingState />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="E-Mail-Verlauf">
      <div className="space-y-6">
        <PageHeader
          title="E-Mail-Verlauf"
          subtitle="Übersicht aller gesendeten E-Mails"
          breadcrumbs={[
            { label: "Kommunikation", href: "/kommunikation" },
            { label: "Verlauf" },
          ]}
        />

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Gesendet"
            value={stats.totalSent.toString()}
            icon={Send}
            description="Erfolgreich zugestellt"
          />
          <StatCard
            title="Geplant"
            value={stats.queued.toString()}
            icon={Clock}
            description="Ausstehend"
          />
          <StatCard
            title="Fehlgeschlagen"
            value={stats.failed.toString()}
            icon={AlertCircle}
            description="Nicht zugestellt"
          />
          <StatCard
            title="Vorlagen"
            value={stats.totalTemplates.toString()}
            icon={Mail}
            description="Verfügbar"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="E-Mails durchsuchen..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {filteredLogs.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="Keine E-Mails"
            description={
              searchTerm || statusFilter !== "all"
                ? "Keine E-Mails mit diesen Filtern gefunden"
                : "Noch keine E-Mails gesendet"
            }
          />
        ) : (
          <DataTable columns={columns} data={filteredLogs} searchable={false} />
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedEmail} onOpenChange={() => setSelectedEmail(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>E-Mail-Details</DialogTitle>
          </DialogHeader>
          {selectedEmail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Empfänger</p>
                  <p className="font-medium">
                    {selectedEmail.tenant
                      ? `${selectedEmail.tenant.first_name} ${selectedEmail.tenant.last_name}`
                      : selectedEmail.recipient_email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedEmail.recipient_email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={STATUS_CONFIG[selectedEmail.status].color}>
                    {STATUS_CONFIG[selectedEmail.status].label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Erstellt</p>
                  <p className="text-sm">
                    {format(new Date(selectedEmail.created_at), "dd.MM.yyyy HH:mm", {
                      locale: de,
                    })}
                  </p>
                </div>
                {selectedEmail.sent_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Gesendet</p>
                    <p className="text-sm">
                      {format(new Date(selectedEmail.sent_at), "dd.MM.yyyy HH:mm", {
                        locale: de,
                      })}
                    </p>
                  </div>
                )}
                {selectedEmail.opened_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Geöffnet</p>
                    <p className="text-sm">
                      {format(new Date(selectedEmail.opened_at), "dd.MM.yyyy HH:mm", {
                        locale: de,
                      })}
                    </p>
                  </div>
                )}
                {selectedEmail.error_message && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Fehler</p>
                    <p className="text-sm text-destructive">
                      {selectedEmail.error_message}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-1">Betreff</p>
                <p className="font-medium">{selectedEmail.subject}</p>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-2">Inhalt</p>
                <Card>
                  <CardContent className="pt-4">
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedEmail.body_html) }}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
