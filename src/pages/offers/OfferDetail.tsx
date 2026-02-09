import { useParams, useNavigate, Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { LoadingState } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useRentalOffers } from "@/hooks/useRentalOffers";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Building2, User, Euro, Calendar, ArrowRight, FileText, Send, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: "Entwurf", className: "bg-muted text-muted-foreground" },
  sent: { label: "Gesendet", className: "bg-blue-500 text-white" },
  accepted: { label: "Angenommen", className: "bg-green-500 text-white" },
  rejected: { label: "Abgelehnt", className: "bg-destructive text-white" },
  expired: { label: "Abgelaufen", className: "bg-orange-500 text-white" },
};

export default function OfferDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { useOffer, updateOfferStatus } = useRentalOffers();
  const { data: offer, isLoading } = useOffer(id);

  if (isLoading) return <MainLayout title="Mietangebot"><LoadingState /></MainLayout>;
  if (!offer) return <MainLayout title="Nicht gefunden"><p>Angebot nicht gefunden.</p></MainLayout>;

  const statusConf = STATUS_CONFIG[offer.status] || STATUS_CONFIG.draft;

  const handleStatusChange = async (status: string) => {
    await updateOfferStatus.mutateAsync({ id: offer.id, status });
  };

  const handleConvertToContract = () => {
    // Navigate to new contract wizard with prefilled data
    navigate(`/vertraege/neu?fromOffer=${offer.id}&unitId=${offer.unit_id}&tenantId=${offer.tenant_id}&rent=${offer.rent_amount_cents}&utilities=${offer.utility_advance_cents}&deposit=${offer.deposit_amount_cents}&startDate=${offer.proposed_start_date}`);
  };

  return (
    <MainLayout
      title={`Angebot: ${offer.tenants?.first_name} ${offer.tenants?.last_name}`}
      breadcrumbs={[
        { label: "Mietangebote", href: "/angebote" },
        { label: `${offer.tenants?.first_name} ${offer.tenants?.last_name}` },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className={statusConf.className}>{statusConf.label}</Badge>
            <span className="text-sm text-muted-foreground">
              Erstellt am {format(new Date(offer.created_at), "dd.MM.yyyy", { locale: de })}
            </span>
          </div>
          <div className="flex gap-2">
            {offer.status === "draft" && (
              <Button variant="outline" onClick={() => handleStatusChange("sent")}>
                <Send className="h-4 w-4 mr-2" /> Als gesendet markieren
              </Button>
            )}
            {(offer.status === "draft" || offer.status === "sent") && (
              <>
                <Button variant="outline" onClick={() => handleStatusChange("rejected")}>
                  <XCircle className="h-4 w-4 mr-2" /> Ablehnen
                </Button>
                <Button onClick={handleConvertToContract}>
                  <ArrowRight className="h-4 w-4 mr-2" /> In Vertrag umwandeln
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Unit */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Building2 className="h-4 w-4" /> Mietfläche</CardTitle>
            </CardHeader>
            <CardContent>
              <Link to={`/einheiten/${offer.unit_id}`} className="font-medium hover:text-primary">
                {offer.units?.unit_number}
              </Link>
              <p className="text-sm text-muted-foreground">
                {offer.units?.buildings?.name} – {offer.units?.buildings?.address}, {offer.units?.buildings?.city}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {offer.units?.rooms || "–"} Zi. · {offer.units?.area || "–"} m²
              </p>
            </CardContent>
          </Card>

          {/* Tenant */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4" /> Interessent</CardTitle>
            </CardHeader>
            <CardContent>
              <Link to={`/mieter/${offer.tenant_id}`} className="font-medium hover:text-primary">
                {offer.tenants?.first_name} {offer.tenants?.last_name}
              </Link>
              {offer.tenants?.email && <p className="text-sm text-muted-foreground">{offer.tenants.email}</p>}
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">
                  {offer.tenants?.status === "interessent" ? "Interessent" : offer.tenants?.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pricing */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Euro className="h-4 w-4" /> Preiskalkulation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between"><span>Kaltmiete</span><span>{formatCurrency(offer.rent_amount_cents / 100)}</span></div>
              <div className="flex justify-between"><span>Nebenkosten</span><span>{formatCurrency(offer.utility_advance_cents / 100)}</span></div>
              <div className="flex justify-between"><span>Heizkosten</span><span>{formatCurrency(offer.heating_advance_cents / 100)}</span></div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Warmmiete</span><span>{formatCurrency(offer.total_amount_cents / 100)}</span>
              </div>
              {offer.deposit_amount_cents > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Kaution</span><span>{formatCurrency(offer.deposit_amount_cents / 100)}</span>
                </div>
              )}
            </div>
            {offer.is_kdu_eligible && offer.kdu_max_total_cents && (
              <div className="mt-3 p-2 rounded bg-muted/50 text-sm">
                KdU-Höchstbetrag: {formatCurrency(offer.kdu_max_total_cents / 100)} · 
                {offer.total_amount_cents <= offer.kdu_max_total_cents
                  ? <span className="text-green-600 font-medium ml-1">✓ Konform</span>
                  : <span className="text-destructive font-medium ml-1">✗ Überschritten</span>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4" /> Termine</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Gewünschter Mietbeginn</span>
              <span className="font-medium">{format(new Date(offer.proposed_start_date), "dd.MM.yyyy", { locale: de })}</span>
            </div>
            {offer.valid_until && (
              <div className="flex justify-between">
                <span>Gültig bis</span>
                <span>{format(new Date(offer.valid_until), "dd.MM.yyyy", { locale: de })}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {offer.special_agreements && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Besondere Vereinbarungen</CardTitle></CardHeader>
            <CardContent><p className="text-sm whitespace-pre-wrap">{offer.special_agreements}</p></CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
