import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader, StatCard, EmptyState, LoadingState } from "@/components/shared";
import { DataTable } from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  FileText, Plus, Search, Filter, UserPlus, CheckCircle, XCircle, Clock,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { useRentalOffers } from "@/hooks/useRentalOffers";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: "Entwurf", className: "bg-muted text-muted-foreground" },
  sent: { label: "Gesendet", className: "bg-blue-500 text-white" },
  accepted: { label: "Angenommen", className: "bg-green-500 text-white" },
  rejected: { label: "Abgelehnt", className: "bg-destructive text-white" },
  expired: { label: "Abgelaufen", className: "bg-orange-500 text-white" },
};

export default function OfferList() {
  const navigate = useNavigate();
  const { useOffersList } = useRentalOffers();
  const { data: offers, isLoading } = useOffersList();
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const stats = useMemo(() => {
    if (!offers) return { total: 0, draft: 0, sent: 0, accepted: 0 };
    return {
      total: offers.length,
      draft: offers.filter((o: any) => o.status === "draft").length,
      sent: offers.filter((o: any) => o.status === "sent").length,
      accepted: offers.filter((o: any) => o.status === "accepted").length,
    };
  }, [offers]);

  const filtered = useMemo(() => {
    if (!offers) return [];
    return offers.filter((o: any) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = `${o.tenants?.first_name} ${o.tenants?.last_name}`.toLowerCase();
        const unit = o.units?.unit_number?.toLowerCase() || "";
        if (!name.includes(q) && !unit.includes(q)) return false;
      }
      return true;
    });
  }, [offers, statusFilter, searchQuery]);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "tenant",
      header: "Interessent",
      cell: ({ row }) => {
        const t = row.original.tenants;
        return (
          <div>
            <p className="font-medium">{t?.first_name} {t?.last_name}</p>
            <p className="text-sm text-muted-foreground">{t?.email}</p>
          </div>
        );
      },
    },
    {
      accessorKey: "unit",
      header: "Einheit",
      cell: ({ row }) => row.original.units?.unit_number || "–",
    },
    {
      accessorKey: "building",
      header: "Gebäude",
      cell: ({ row }) => row.original.units?.buildings?.name || "–",
    },
    {
      accessorKey: "total_amount_cents",
      header: "Warmmiete",
      cell: ({ row }) => formatCurrency(row.original.total_amount_cents / 100),
    },
    {
      accessorKey: "proposed_start_date",
      header: "Mietbeginn",
      cell: ({ row }) => format(new Date(row.original.proposed_start_date), "dd.MM.yyyy", { locale: de }),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = STATUS_CONFIG[row.original.status] || STATUS_CONFIG.draft;
        return <Badge className={s.className}>{s.label}</Badge>;
      },
    },
  ];

  if (isLoading) {
    return <MainLayout title="Mietangebote"><LoadingState /></MainLayout>;
  }

  return (
    <MainLayout title="Mietangebote" breadcrumbs={[{ label: "Mietangebote" }]}>
      <div className="space-y-6">
        <PageHeader
          title="Mietangebote"
          actions={
            <Button asChild>
              <Link to="/angebote/neu">
                <Plus className="h-4 w-4 mr-2" /> Neues Angebot
              </Link>
            </Button>
          }
        />

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Gesamt" value={stats.total} icon={FileText} />
          <StatCard title="Entwürfe" value={stats.draft} icon={Clock} />
          <StatCard title="Gesendet" value={stats.sent} icon={UserPlus} />
          <StatCard title="Angenommen" value={stats.accepted} icon={CheckCircle} />
        </div>

        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filter:</span>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="draft">Entwurf</SelectItem>
                  <SelectItem value="sent">Gesendet</SelectItem>
                  <SelectItem value="accepted">Angenommen</SelectItem>
                  <SelectItem value="rejected">Abgelehnt</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Suchen..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
            </div>
          </CardContent>
        </Card>

        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <EmptyState
                icon={FileText}
                title="Keine Angebote"
                description={offers?.length === 0 ? "Erstellen Sie Ihr erstes Mietangebot." : "Keine Angebote für die Filter gefunden."}
                action={offers?.length === 0 && (
                  <Button asChild><Link to="/angebote/neu"><Plus className="h-4 w-4 mr-2" /> Neues Angebot</Link></Button>
                )}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="[&_tr]:cursor-pointer [&_tr:hover]:bg-muted/50" onClick={(e) => {
                const target = e.target as HTMLElement;
                const row = target.closest("tr");
                if (row && !target.closest("a")) {
                  const id = filtered[Number(row.dataset.index)]?.id;
                  if (id) navigate(`/angebote/${id}`);
                }
              }}>
                <DataTable columns={columns} data={filtered.map((o: any, i: number) => ({ ...o, _index: i }))} pagination pageSize={10} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
