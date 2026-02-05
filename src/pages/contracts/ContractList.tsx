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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileSignature,
  Plus,
  Search,
  Filter,
  FileText,
  AlertTriangle,
  XCircle,
  Building2,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { useContracts } from "@/hooks/useContracts";
import { useBuildings } from "@/hooks/useBuildings";
import { format, addMonths, isWithinInterval, startOfMonth, endOfMonth } from "date-fns";
import { de } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";

type ContractStatus = "active" | "terminated" | "expiring" | "expired";

const STATUS_CONFIG: Record<ContractStatus, { label: string; className: string }> = {
  active: { label: "Aktiv", className: "bg-green-500 text-white" },
  terminated: { label: "Gekündigt", className: "bg-orange-500 text-white" },
  expiring: { label: "Läuft aus", className: "bg-yellow-500 text-white" },
  expired: { label: "Abgelaufen", className: "bg-muted text-muted-foreground" },
};

function getContractStatus(contract: any): ContractStatus {
  if (!contract.is_active) return "expired";
  if (contract.end_date) {
    const endDate = new Date(contract.end_date);
    const now = new Date();
    if (endDate < now) return "expired";
    if (endDate <= addMonths(now, 3)) return "expiring";
    // Check if terminated (has end date but still active)
    return "terminated";
  }
  return "active";
}

export default function ContractList() {
  const navigate = useNavigate();
  const { useContractsList } = useContracts();
  const { useBuildingsList } = useBuildings();
  
  const { data: contracts, isLoading } = useContractsList();
  const { data: buildings } = useBuildingsList();
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [buildingFilter, setBuildingFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Calculate statistics
  const stats = useMemo(() => {
    if (!contracts) return { active: 0, expiring: 0, terminated: 0 };
    
    const now = new Date();
    const threeMonthsFromNow = addMonths(now, 3);
    const thisMonth = { start: startOfMonth(now), end: endOfMonth(now) };
    
    let active = 0;
    let expiring = 0;
    let terminated = 0;
    
    contracts.forEach((contract: any) => {
      if (contract.is_active) {
        active++;
        if (contract.end_date) {
          const endDate = new Date(contract.end_date);
          if (endDate <= threeMonthsFromNow && endDate > now) {
            expiring++;
          }
          // Check if termination was this month
          if (isWithinInterval(new Date(contract.updated_at), thisMonth)) {
            terminated++;
          }
        }
      }
    });
    
    return { active, expiring, terminated };
  }, [contracts]);

  // Filter contracts
  const filteredContracts = useMemo(() => {
    if (!contracts) return [];
    
    return contracts.filter((contract: any) => {
      // Status filter
      if (statusFilter !== "all") {
        const status = getContractStatus(contract);
        if (statusFilter === "active" && status !== "active") return false;
        if (statusFilter === "terminated" && status !== "terminated" && status !== "expiring") return false;
        if (statusFilter === "expired" && status !== "expired") return false;
      }
      
      // Building filter
      if (buildingFilter !== "all") {
        if (contract.units?.building_id !== buildingFilter) return false;
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const tenantName = `${contract.tenants?.first_name} ${contract.tenants?.last_name}`.toLowerCase();
        const unitName = contract.units?.unit_number?.toLowerCase() || "";
        const buildingName = contract.units?.buildings?.name?.toLowerCase() || "";
        
        if (!tenantName.includes(query) && !unitName.includes(query) && !buildingName.includes(query)) {
          return false;
        }
      }
      
      return true;
    });
  }, [contracts, statusFilter, buildingFilter, searchQuery]);

  // Table columns
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "tenant",
      header: "Mieter",
      cell: ({ row }) => {
        const tenant = row.original.tenants;
        return (
          <div>
            <p className="font-medium">{tenant?.first_name} {tenant?.last_name}</p>
            <p className="text-sm text-muted-foreground">{tenant?.email}</p>
          </div>
        );
      },
    },
    {
      accessorKey: "unit",
      header: "Einheit",
      cell: ({ row }) => {
        const unit = row.original.units;
        return (
          <Link 
            to={`/einheiten/${unit?.id}`}
            className="hover:text-primary"
            onClick={(e) => e.stopPropagation()}
          >
            {unit?.unit_number}
          </Link>
        );
      },
    },
    {
      accessorKey: "building",
      header: "Gebäude",
      cell: ({ row }) => {
        const building = row.original.units?.buildings;
        return (
          <Link 
            to={`/gebaeude/${building?.id}`}
            className="hover:text-primary"
            onClick={(e) => e.stopPropagation()}
          >
            {building?.name}
          </Link>
        );
      },
    },
    {
      accessorKey: "start_date",
      header: "Mietbeginn",
      cell: ({ row }) => format(new Date(row.original.start_date), "dd.MM.yyyy", { locale: de }),
    },
    {
      accessorKey: "rent_amount",
      header: "Miete",
      cell: ({ row }) => formatCurrency(row.original.rent_amount / 100),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = getContractStatus(row.original);
        return (
          <Badge className={STATUS_CONFIG[status].className}>
            {STATUS_CONFIG[status].label}
          </Badge>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <MainLayout title="Mietverträge">
        <LoadingState />
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="Mietverträge"
      breadcrumbs={[{ label: "Mietverträge" }]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Mietverträge"
          actions={
            <Button asChild>
              <Link to="/vertraege/neu">
                <Plus className="h-4 w-4 mr-2" />
                Neuer Vertrag
              </Link>
            </Button>
          }
        />

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Aktive Verträge"
            value={stats.active}
            icon={FileText}
          />
          <StatCard
            title="Auslaufend in 3 Monaten"
            value={stats.expiring}
            icon={AlertTriangle}
          />
          <StatCard
            title="Kündigungen diesen Monat"
            value={stats.terminated}
            icon={XCircle}
          />
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filter:</span>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="terminated">Gekündigt</SelectItem>
                  <SelectItem value="expired">Abgelaufen</SelectItem>
                </SelectContent>
              </Select>

              <Select value={buildingFilter} onValueChange={setBuildingFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Gebäude" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Gebäude</SelectItem>
                {buildings?.buildings?.map((building: any) => (
                    <SelectItem key={building.id} value={building.id}>
                      {building.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Mieter, Einheit oder Gebäude suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contracts Table */}
        {filteredContracts.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <EmptyState
                icon={FileSignature}
                title="Keine Verträge gefunden"
                description={
                  contracts?.length === 0
                    ? "Erstellen Sie Ihren ersten Mietvertrag."
                    : "Keine Verträge entsprechen den Filterkriterien."
                }
                action={
                  contracts?.length === 0 && (
                    <Button asChild>
                      <Link to="/vertraege/neu">
                        <Plus className="h-4 w-4 mr-2" />
                        Neuer Vertrag
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
              <div
                className="[&_tr]:cursor-pointer [&_tr:hover]:bg-muted/50"
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  const row = target.closest("tr");
                  if (row && !target.closest("a")) {
                    const contractId = filteredContracts[Number(row.dataset.index)]?.id;
                    if (contractId) navigate(`/vertraege/${contractId}`);
                  }
                }}
              >
                <DataTable
                  columns={columns}
                  data={filteredContracts.map((c: any, i: number) => ({ ...c, _index: i }))}
                  pagination
                  pageSize={10}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
