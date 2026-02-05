import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader, EmptyState, LoadingState } from "@/components/shared";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileSignature,
  Edit,
  XCircle,
  Download,
  Building2,
  User,
  Euro,
  Shield,
  FileText,
  Calendar,
  MapPin,
  Mail,
  Phone,
  CheckCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { useContracts } from "@/hooks/useContracts";
import { format, differenceInMonths } from "date-fns";
import { de } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";

type ContractStatus = "active" | "terminated" | "expiring" | "expired";

const STATUS_CONFIG: Record<ContractStatus, { 
  label: string; 
  className: string; 
  icon: typeof CheckCircle;
  alertVariant: "default" | "destructive";
}> = {
  active: { 
    label: "Aktiv", 
    className: "bg-green-500 text-white", 
    icon: CheckCircle,
    alertVariant: "default",
  },
  terminated: { 
    label: "Gekündigt", 
    className: "bg-orange-500 text-white", 
    icon: XCircle,
    alertVariant: "destructive",
  },
  expiring: { 
    label: "Läuft bald aus", 
    className: "bg-yellow-500 text-white", 
    icon: AlertTriangle,
    alertVariant: "default",
  },
  expired: { 
    label: "Abgelaufen", 
    className: "bg-muted text-muted-foreground", 
    icon: Clock,
    alertVariant: "default",
  },
};

function getContractStatus(contract: any): ContractStatus {
  if (!contract.is_active) return "expired";
  if (contract.end_date) {
    const endDate = new Date(contract.end_date);
    const now = new Date();
    if (endDate < now) return "expired";
    const monthsUntilEnd = differenceInMonths(endDate, now);
    if (monthsUntilEnd <= 3) return "expiring";
    return "terminated";
  }
  return "active";
}

export default function ContractDetail() {
  const { id } = useParams();
  const { useContract, terminateContract } = useContracts();
  const { data: contract, isLoading, error } = useContract(id);
  const [showTerminateDialog, setShowTerminateDialog] = useState(false);

  if (isLoading) {
    return (
      <MainLayout title="Vertrag laden...">
        <LoadingState />
      </MainLayout>
    );
  }

  if (error || !contract) {
    return (
      <MainLayout title="Fehler">
        <EmptyState
          icon={FileSignature}
          title="Vertrag nicht gefunden"
          description="Der angeforderte Mietvertrag konnte nicht gefunden werden."
          action={
            <Button asChild>
              <Link to="/vertraege">Zurück zur Übersicht</Link>
            </Button>
          }
        />
      </MainLayout>
    );
  }

  const status = getContractStatus(contract);
  const statusConfig = STATUS_CONFIG[status];
  const StatusIcon = statusConfig.icon;
  
  const tenant = contract.tenant;
  const unit = contract.unit;
  const building = contract.building;
  
  const totalRent = (contract.rent_amount || 0) + (contract.utility_advance || 0);

  const handleTerminate = () => {
    terminateContract.mutate(
      { id: contract.id, terminationDate: new Date().toISOString().split("T")[0] },
      { onSuccess: () => setShowTerminateDialog(false) }
    );
  };

  return (
    <MainLayout
      title="Mietvertrag"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Mietverträge", href: "/vertraege" },
        { label: `Vertrag ${unit?.unit_number || ""}` },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Mietvertrag"
          subtitle={
            <span>
              {tenant?.first_name} {tenant?.last_name} • {unit?.unit_number}
            </span>
          }
          actions={
            <div className="flex gap-2">
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Bearbeiten
              </Button>
              {status === "active" && (
                <Button 
                  variant="outline" 
                  className="text-destructive"
                  onClick={() => setShowTerminateDialog(true)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Kündigen
                </Button>
              )}
              <Button>
                <Download className="h-4 w-4 mr-2" />
                PDF exportieren
              </Button>
            </div>
          }
        />

        {/* Status Banner */}
        {(status === "terminated" || status === "expiring") && (
          <Alert variant={statusConfig.alertVariant}>
            <StatusIcon className="h-4 w-4" />
            <AlertDescription>
              {status === "terminated" && contract.end_date && (
                <>
                  Dieser Vertrag wurde gekündigt. Mietende: {" "}
                  <strong>{format(new Date(contract.end_date), "dd.MM.yyyy", { locale: de })}</strong>
                </>
              )}
              {status === "expiring" && contract.end_date && (
                <>
                  Dieser Vertrag läuft am {" "}
                  <strong>{format(new Date(contract.end_date), "dd.MM.yyyy", { locale: de })}</strong> aus.
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Status Badge */}
        <div className="flex items-center gap-3">
          <Badge className={statusConfig.className}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig.label}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Vertrag erstellt am {format(new Date(contract.created_at), "dd.MM.yyyy", { locale: de })}
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Mietobjekt */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Mietobjekt
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Gebäude</p>
                <Link
                  to={`/gebaeude/${building?.id}`}
                  className="text-lg font-semibold hover:text-primary"
                >
                  {building?.name}
                </Link>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Einheit</p>
                <Link
                  to={`/einheiten/${unit?.id}`}
                  className="text-lg font-semibold hover:text-primary"
                >
                  {unit?.unit_number}
                </Link>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>
                  {building?.address}, {building?.postal_code} {building?.city}
                </span>
              </div>
              {unit?.area && (
                <p className="text-sm text-muted-foreground">
                  {unit.area} m² • {unit.rooms} Zimmer
                </p>
              )}
            </CardContent>
          </Card>

          {/* Mieter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Mieter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <Link
                  to={`/mieter/${tenant?.id}`}
                  className="text-lg font-semibold hover:text-primary"
                >
                  {tenant?.first_name} {tenant?.last_name}
                </Link>
              </div>
              {tenant?.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${tenant.email}`} className="hover:text-primary">
                    {tenant.email}
                  </a>
                </div>
              )}
              {tenant?.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${tenant.phone}`} className="hover:text-primary">
                    {tenant.phone}
                  </a>
                </div>
              )}
              <Button asChild variant="outline" size="sm" className="mt-2">
                <Link to={`/mieter/${tenant?.id}`}>Mieter ansehen</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Konditionen */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Konditionen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Mietbeginn</p>
                  <p className="font-medium">
                    {format(new Date(contract.start_date), "dd.MM.yyyy", { locale: de })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mietende</p>
                  <p className="font-medium">
                    {contract.end_date
                      ? format(new Date(contract.end_date), "dd.MM.yyyy", { locale: de })
                      : "Unbefristet"}
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kaltmiete</span>
                  <span className="font-medium">{formatCurrency(contract.rent_amount / 100)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nebenkosten</span>
                  <span className="font-medium">{formatCurrency((contract.utility_advance || 0) / 100)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-medium">Gesamtmiete</span>
                  <span className="text-lg font-bold">{formatCurrency(totalRent / 100)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Kündigungsfrist</p>
                  <p className="font-medium">3 Monate</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Zahlungstag</p>
                  <p className="font-medium">{contract.payment_day || 1}. des Monats</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kaution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Kaution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">
                    {formatCurrency((contract.deposit_amount || 0) / 100)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {contract.deposit_amount 
                      ? `${((contract.deposit_amount / contract.rent_amount) || 0).toFixed(1)} Monatsmieten`
                      : "Keine Kaution vereinbart"}
                  </p>
                </div>
                <Badge 
                  variant={contract.deposit_paid ? "default" : "destructive"}
                  className={contract.deposit_paid ? "bg-green-500" : ""}
                >
                  {contract.deposit_paid ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Gezahlt
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Ausstehend
                    </>
                  )}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sondervereinbarungen */}
        {contract.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Sondervereinbarungen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                {contract.notes}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dokumente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              Dokumente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Mietvertrag.pdf</p>
                    <p className="text-sm text-muted-foreground">
                      Erstellt am {format(new Date(contract.created_at), "dd.MM.yyyy", { locale: de })}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
              
              <EmptyState
                icon={FileText}
                title="Weitere Dokumente"
                description="Übergabeprotokolle und Nachträge können hier hochgeladen werden."
                action={
                  <Button variant="outline" size="sm">
                    Dokument hochladen
                  </Button>
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Terminate Dialog */}
        <ConfirmDialog
          open={showTerminateDialog}
          onOpenChange={setShowTerminateDialog}
          title="Vertrag kündigen"
          description={`Möchten Sie den Mietvertrag für ${tenant?.first_name} ${tenant?.last_name} wirklich kündigen? Diese Aktion kann nicht rückgängig gemacht werden.`}
          confirmLabel="Kündigen"
          destructive
          onConfirm={handleTerminate}
        />
      </div>
    </MainLayout>
  );
}
