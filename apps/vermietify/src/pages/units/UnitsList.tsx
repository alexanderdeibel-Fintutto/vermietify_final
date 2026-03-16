import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Home, Search, Building2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { StatCard } from "@/components/shared/StatCard";

interface UnitWithBuilding {
  id: string;
  unit_number: string;
  floor: number | null;
  area: number;
  rooms: number;
  rent_amount: number;
  utility_advance: number;
  status: string;
  building_id: string;
  building: {
    id: string;
    name: string;
    address: string;
    city: string;
  };
}

const statusLabels: Record<string, string> = {
  rented: "Vermietet",
  vacant: "Leer",
  renovating: "Renovierung",
};

const statusColors: Record<string, "default" | "secondary" | "destructive"> = {
  rented: "default",
  vacant: "secondary",
  renovating: "destructive",
};

const floorLabel = (floor: number | null) => {
  if (floor === null || floor === undefined) return "-";
  if (floor === 0) return "EG";
  if (floor < 0) return `${floor}. UG`;
  return `${floor}. OG`;
};

export default function UnitsList() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [units, setUnits] = useState<UnitWithBuilding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (profile?.organization_id) {
      fetchUnits();
    }
  }, [profile?.organization_id]);

  const fetchUnits = async () => {
    try {
      const { data, error } = await supabase
        .from("units")
        .select("*, building:buildings(id, name, address, city)")
        .order("unit_number");

      if (error) throw error;
      setUnits((data as unknown as UnitWithBuilding[]) || []);
    } catch (error) {
      console.error("Error fetching units:", error);
      toast({
        title: "Fehler",
        description: "Einheiten konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = units.filter((unit) => {
    const matchesSearch =
      unit.unit_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.building?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.building?.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || unit.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalUnits = units.length;
  const rentedUnits = units.filter((u) => u.status === "rented").length;
  const vacantUnits = units.filter((u) => u.status === "vacant").length;
  const totalRent = units
    .filter((u) => u.status === "rented")
    .reduce((sum, u) => sum + (u.rent_amount || 0), 0);

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);

  return (
    <MainLayout title="Einheiten">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Einheiten</h1>
          <p className="text-muted-foreground">
            Übersicht aller Wohneinheiten Ihrer Gebäude
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Gesamt"
            value={totalUnits.toString()}
            icon={Home}
          />
          <StatCard
            title="Vermietet"
            value={rentedUnits.toString()}
            description={`${totalUnits > 0 ? Math.round((rentedUnits / totalUnits) * 100) : 0}%`}
            icon={Home}
          />
          <StatCard
            title="Leer"
            value={vacantUnits.toString()}
            icon={Home}
          />
          <StatCard
            title="Mieteinnahmen"
            value={formatCurrency(totalRent)}
            description="pro Monat"
            icon={Home}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Einheit oder Gebäude suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status filtern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="rented">Vermietet</SelectItem>
              <SelectItem value="vacant">Leer</SelectItem>
              <SelectItem value="renovating">Renovierung</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <Home className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm || statusFilter !== "all"
                  ? "Keine Einheiten gefunden"
                  : "Noch keine Einheiten"}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all"
                  ? "Versuchen Sie andere Filterkriterien"
                  : "Erstellen Sie zunächst ein Gebäude und fügen Sie Einheiten hinzu"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Einheit</TableHead>
                    <TableHead>Gebäude</TableHead>
                    <TableHead>Etage</TableHead>
                    <TableHead>Fläche</TableHead>
                    <TableHead>Zimmer</TableHead>
                    <TableHead>Kaltmiete</TableHead>
                    <TableHead>NK-Vorauszahlung</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((unit) => (
                    <TableRow
                      key={unit.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/einheiten/${unit.id}`)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-primary" />
                          {unit.unit_number}
                        </div>
                      </TableCell>
                      <TableCell>
                        <button
                          className="flex items-center gap-1 text-sm hover:underline text-left"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/gebaeude/${unit.building_id}`);
                          }}
                        >
                          <Building2 className="h-3 w-3" />
                          {unit.building?.name}
                        </button>
                      </TableCell>
                      <TableCell>{floorLabel(unit.floor)}</TableCell>
                      <TableCell>
                        {unit.area ? `${unit.area} m²` : "-"}
                      </TableCell>
                      <TableCell>{unit.rooms ?? "-"}</TableCell>
                      <TableCell>{formatCurrency(unit.rent_amount || 0)}</TableCell>
                      <TableCell>{formatCurrency(unit.utility_advance || 0)}</TableCell>
                      <TableCell>
                        <Badge variant={statusColors[unit.status] || "secondary"}>
                          {statusLabels[unit.status] || unit.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          →
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
