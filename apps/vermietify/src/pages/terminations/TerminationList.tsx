import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LoadingState, EmptyState } from "@/components/shared";
import { useTerminations, Termination } from "@/hooks/useTerminations";
import {
  FileX,
  Plus,
  Search,
  Calendar,
  User,
  Building2,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const TYPE_LABELS: Record<string, string> = {
  tenant: "Mieter",
  landlord: "Vermieter",
  mutual: "Einvernehmlich",
};

const TYPE_STYLES: Record<string, string> = {
  tenant: "bg-blue-100 text-blue-800",
  landlord: "bg-orange-100 text-orange-800",
  mutual: "bg-green-100 text-green-800",
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "Ausstehend", className: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Bestätigt", className: "bg-blue-100 text-blue-800" },
  completed: { label: "Abgeschlossen", className: "bg-green-100 text-green-800" },
  disputed: { label: "Angefochten", className: "bg-red-100 text-red-800" },
  withdrawn: { label: "Zurückgezogen", className: "bg-muted text-muted-foreground" },
};

export default function TerminationList() {
  const { data: terminationsData = [], isLoading } = useTerminations();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    return terminationsData.filter((t) => {
      // Tab filter
      if (activeTab !== "all" && t.status !== activeTab) return false;
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const unitName = (t.units?.name || "").toLowerCase();
        if (!unitName.includes(q)) return false;
      }
      return true;
    });
  }, [terminationsData, activeTab, searchQuery]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: terminationsData.length };
    terminationsData.forEach((t) => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return counts;
  }, [terminationsData]);

  if (isLoading) {
    return (
      <MainLayout title="Kündigungen">
        <LoadingState />
      </MainLayout>
    );
  }

  const renderTable = (data: Termination[]) => {
    if (data.length === 0) {
      return (
        <EmptyState
          icon={FileX}
          title="Keine Kündigungen"
          description={
            terminationsData.length === 0
              ? "Erfassen Sie Ihre erste Kündigung."
              : "Keine Kündigungen entsprechen den Filterkriterien."
          }
          action={
            terminationsData.length === 0 && (
              <Button asChild>
                <Link to="/kuendigungen/neu">
                  <Plus className="h-4 w-4 mr-2" />
                  Neue Kündigung
                </Link>
              </Button>
            )
          }
        />
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Einheit</TableHead>
            <TableHead>Typ</TableHead>
            <TableHead>Kündigungsdatum</TableHead>
            <TableHead>Wirksamkeitsdatum</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((term) => {
            const statusConfig = STATUS_CONFIG[term.status] || STATUS_CONFIG.pending;
            return (
              <TableRow key={term.id}>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Building2 className="h-3 w-3 text-muted-foreground" />
                    {term.units?.name || "-"}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={TYPE_STYLES[term.type] || ""}>
                    {TYPE_LABELS[term.type] || term.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    {format(new Date(term.notice_date), "dd.MM.yyyy", { locale: de })}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    {format(new Date(term.effective_date), "dd.MM.yyyy", { locale: de })}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusConfig.className}>
                    {statusConfig.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    Details
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  return (
    <MainLayout title="Kündigungen" breadcrumbs={[{ label: "Kündigungen" }]}>
      <div className="space-y-6">
        <PageHeader
          title="Kündigungen"
          subtitle="Verwalten Sie alle Mietvertragskündigungen."
          actions={
            <Button asChild>
              <Link to="/kuendigungen/neu">
                <Plus className="h-4 w-4 mr-2" />
                Neue Kündigung
              </Link>
            </Button>
          }
        />

        {/* Search */}
        <Card>
          <CardContent className="py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Einheit oder Mieter suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Filter Tabs and Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileX className="h-5 w-5" />
              Kündigungsliste ({filtered.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">
                  Alle ({statusCounts.all || 0})
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Ausstehend ({statusCounts.pending || 0})
                </TabsTrigger>
                <TabsTrigger value="confirmed">
                  Bestätigt ({statusCounts.confirmed || 0})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Abgeschlossen ({statusCounts.completed || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab}>
                {renderTable(filtered)}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
