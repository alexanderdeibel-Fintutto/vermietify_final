import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader, StatCard, EmptyState, LoadingState, ConfirmDialog } from "@/components/shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Euro, 
  Ruler, 
  Home,
  Edit,
  FileText,
  User,
  Calendar,
  Gauge,
  CreditCard,
  FolderOpen,
  Plus,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
} from "lucide-react";
import { useUnits } from "@/hooks/useUnits";
import { UnitFormDialog } from "@/components/buildings/UnitFormDialog";
import { UnitContractTab } from "@/components/units/UnitContractTab";
import { UnitMetersTab } from "@/components/units/UnitMetersTab";
import { UnitPaymentsTab } from "@/components/units/UnitPaymentsTab";
import { UnitDocumentsTab } from "@/components/units/UnitDocumentsTab";
import { formatCurrency } from "@/lib/utils";

const STATUS_CONFIG = {
  rented: { label: "Vermietet", variant: "default" as const, color: "bg-green-500" },
  vacant: { label: "Frei", variant: "secondary" as const, color: "bg-blue-500" },
  renovating: { label: "In Renovierung", variant: "outline" as const, color: "bg-orange-500" },
};

// Parse features from notes JSON
const parseFeatures = (notes: string | null): string[] => {
  if (!notes) return [];
  try {
    const parsed = JSON.parse(notes);
    if (parsed.features && Array.isArray(parsed.features)) {
      return parsed.features;
    }
  } catch {
    return [];
  }
  return [];
};

const parseNotesText = (notes: string | null): string => {
  if (!notes) return "";
  try {
    const parsed = JSON.parse(notes);
    return parsed.text || "";
  } catch {
    return notes;
  }
};

const FEATURE_LABELS: Record<string, string> = {
  balkon: "Balkon",
  keller: "Keller",
  aufzug: "Aufzug",
  stellplatz: "Stellplatz",
  einbaukueche: "Einbauküche",
};

export default function UnitDetail() {
  const { id } = useParams<{ id: string }>();
  const { useUnit } = useUnits();
  const { data: unit, isLoading, error } = useUnit(id);
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <MainLayout title="Einheit laden...">
        <LoadingState />
      </MainLayout>
    );
  }

  if (error || !unit) {
    return (
      <MainLayout title="Fehler">
        <EmptyState
          icon={AlertCircle}
          title="Einheit nicht gefunden"
          description="Die angeforderte Einheit konnte nicht gefunden werden."
          action={
            <Button asChild>
              <Link to="/properties">Zurück zu Immobilien</Link>
            </Button>
          }
        />
      </MainLayout>
    );
  }

  const statusConfig = STATUS_CONFIG[unit.status] || STATUS_CONFIG.vacant;
  const features = parseFeatures(unit.notes);
  const notesText = parseNotesText(unit.notes);
  const isVacant = unit.status === "vacant";

  return (
    <MainLayout
      title={unit.unit_number}
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Immobilien", href: "/properties" },
        { label: unit.building?.name || "Gebäude", href: `/gebaeude/${unit.building_id}` },
        { label: unit.unit_number },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title={unit.unit_number}
          subtitle={
            <Link 
              to={`/gebaeude/${unit.building_id}`}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {unit.building?.name} • {unit.building?.address}, {unit.building?.city}
            </Link>
          }
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Bearbeiten
              </Button>
              {isVacant && (
                <Button asChild>
                  <Link to={`/contracts/new?unit=${id}`}>
                    <FileText className="h-4 w-4 mr-2" />
                    Vertrag erstellen
                  </Link>
                </Button>
              )}
            </div>
          }
        />

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">
              <Home className="h-4 w-4 mr-2" />
              Übersicht
            </TabsTrigger>
            <TabsTrigger value="contract">
              <FileText className="h-4 w-4 mr-2" />
              Mietvertrag
            </TabsTrigger>
            <TabsTrigger value="meters">
              <Gauge className="h-4 w-4 mr-2" />
              Zähler
            </TabsTrigger>
            <TabsTrigger value="payments">
              <CreditCard className="h-4 w-4 mr-2" />
              Zahlungen
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FolderOpen className="h-4 w-4 mr-2" />
              Dokumente
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Overview */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Row */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={statusConfig.variant}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              
              <StatCard
                title="Kaltmiete"
                value={formatCurrency(unit.rent_amount / 100)}
                icon={Euro}
              />
              
              <StatCard
                title="Nebenkosten"
                value={formatCurrency((unit.utility_advance || 0) / 100)}
                icon={Euro}
              />
              
              <StatCard
                title="Größe"
                value={`${unit.area} m²`}
                icon={Ruler}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Unit Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Einheit-Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Etage</p>
                      <p className="font-medium">
                        {unit.floor !== null ? `${unit.floor}. Etage` : "–"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Zimmer</p>
                      <p className="font-medium">{unit.rooms}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Warmmiete</p>
                      <p className="font-medium">
                        {formatCurrency((unit.rent_amount + (unit.utility_advance || 0)) / 100)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Preis/m²</p>
                      <p className="font-medium">
                        {formatCurrency(unit.rent_amount / 100 / unit.area)}/m²
                      </p>
                    </div>
                  </div>

                  {features.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Ausstattung</p>
                      <div className="flex flex-wrap gap-2">
                        {features.map((feature) => (
                          <Badge key={feature} variant="secondary">
                            {FEATURE_LABELS[feature] || feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {notesText && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Notizen</p>
                      <p className="text-sm">{notesText}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tenant Info Card (if rented) */}
              {unit.tenant ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Aktueller Mieter
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-lg font-semibold">
                        {unit.tenant.first_name} {unit.tenant.last_name}
                      </p>
                    </div>
                    
                    {unit.tenant.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={`mailto:${unit.tenant.email}`}
                          className="hover:text-primary"
                        >
                          {unit.tenant.email}
                        </a>
                      </div>
                    )}
                    
                    {unit.tenant.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={`tel:${unit.tenant.phone}`}
                          className="hover:text-primary"
                        >
                          {unit.tenant.phone}
                        </a>
                      </div>
                    )}

                    {unit.tenant.address && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span>
                          {unit.tenant.address}
                          {unit.tenant.postal_code && `, ${unit.tenant.postal_code}`}
                          {unit.tenant.city && ` ${unit.tenant.city}`}
                        </span>
                      </div>
                    )}

                    <Button asChild variant="outline" className="w-full">
                      <Link to={`/mieter/${unit.tenant.id}`}>
                        Mieter-Details ansehen
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Mieter
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <EmptyState
                      icon={User}
                      title="Kein Mieter"
                      description="Diese Einheit ist derzeit nicht vermietet."
                      action={
                        <Button asChild size="sm">
                          <Link to={`/contracts/new?unit=${id}`}>
                            <Plus className="h-4 w-4 mr-2" />
                            Vertrag erstellen
                          </Link>
                        </Button>
                      }
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* TAB 2: Contract */}
          <TabsContent value="contract">
            <UnitContractTab unitId={id!} />
          </TabsContent>

          {/* TAB 3: Meters */}
          <TabsContent value="meters">
            <UnitMetersTab unitId={id!} />
          </TabsContent>

          {/* TAB 4: Payments */}
          <TabsContent value="payments">
            <UnitPaymentsTab unitId={id!} />
          </TabsContent>

          {/* TAB 5: Documents */}
          <TabsContent value="documents">
            <UnitDocumentsTab unitId={id!} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <UnitFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        buildingId={unit.building_id}
        unit={unit}
      />
    </MainLayout>
  );
}
