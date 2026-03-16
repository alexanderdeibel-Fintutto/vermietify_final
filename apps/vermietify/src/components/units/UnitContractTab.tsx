import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, ConfirmDialog } from "@/components/shared";
import { 
  FileText, 
  User, 
  Calendar, 
  Euro, 
  Shield,
  Plus,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

interface UnitContractTabProps {
  unitId: string;
}

export function UnitContractTab({ unitId }: UnitContractTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [terminateDialogOpen, setTerminateDialogOpen] = useState(false);

  // Fetch active lease for this unit
  const { data: lease, isLoading } = useQuery({
    queryKey: ["leases", "unit", unitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leases")
        .select(`
          *,
          tenants(*)
        `)
        .eq("unit_id", unitId)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Terminate lease mutation
  const terminateLease = useMutation({
    mutationFn: async () => {
      if (!lease) return;
      
      const { error } = await supabase
        .from("leases")
        .update({ 
          is_active: false,
          end_date: new Date().toISOString().split("T")[0],
        })
        .eq("id", lease.id);

      if (error) throw error;

      // Update unit status to vacant
      await supabase
        .from("units")
        .update({ status: "vacant" })
        .eq("id", unitId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leases"] });
      queryClient.invalidateQueries({ queryKey: ["units"] });
      toast({
        title: "Vertrag beendet",
        description: "Der Mietvertrag wurde erfolgreich beendet.",
      });
      setTerminateDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: "Der Vertrag konnte nicht beendet werden.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-1/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!lease) {
    return (
      <Card>
        <CardContent className="py-8">
          <EmptyState
            icon={FileText}
            title="Kein aktiver Mietvertrag"
            description="Für diese Einheit existiert kein aktiver Mietvertrag."
            action={
              <Button asChild>
                <Link to={`/contracts/new?unit=${unitId}`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Vertrag erstellen
                </Link>
              </Button>
            }
          />
        </CardContent>
      </Card>
    );
  }

  const tenant = lease.tenants;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Aktiver Mietvertrag
            </CardTitle>
            <Badge variant="default" className="bg-green-500">
              <CheckCircle className="h-3 w-3 mr-1" />
              Aktiv
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tenant Info */}
          {tenant && (
            <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
              <User className="h-10 w-10 text-muted-foreground p-2 bg-background rounded-full" />
              <div className="flex-1">
                <p className="font-semibold text-lg">
                  {tenant.first_name} {tenant.last_name}
                </p>
                {tenant.email && (
                  <p className="text-sm text-muted-foreground">{tenant.email}</p>
                )}
                {tenant.phone && (
                  <p className="text-sm text-muted-foreground">{tenant.phone}</p>
                )}
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to={`/mieter/${tenant.id}`}>Details</Link>
              </Button>
            </div>
          )}

          {/* Contract Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Mietbeginn
              </div>
              <p className="font-medium">
                {format(new Date(lease.start_date), "dd.MM.yyyy", { locale: de })}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Mietende
              </div>
              <p className="font-medium">
                {lease.end_date 
                  ? format(new Date(lease.end_date), "dd.MM.yyyy", { locale: de })
                  : "Unbefristet"}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Euro className="h-4 w-4" />
                Kaltmiete
              </div>
              <p className="font-medium">{formatCurrency(lease.rent_amount / 100)}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Euro className="h-4 w-4" />
                Nebenkosten
              </div>
              <p className="font-medium">
                {formatCurrency((lease.utility_advance || 0) / 100)}
              </p>
            </div>
          </div>

          {/* Deposit Info */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Kaution</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency((lease.deposit_amount || 0) / 100)}
                  </p>
                </div>
              </div>
              <Badge variant={lease.deposit_paid ? "default" : "destructive"}>
                {lease.deposit_paid ? (
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
          </div>

          {/* Payment Day */}
          <div className="text-sm text-muted-foreground">
            Zahlungstag: {lease.payment_day || 1}. des Monats
          </div>

          {/* Notes */}
          {lease.notes && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Notizen</p>
              <p className="text-sm">{lease.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button asChild variant="outline">
              <Link to={`/contracts/${lease.id}`}>
                Vertrag ansehen
              </Link>
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => setTerminateDialogOpen(true)}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Vertrag kündigen
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={terminateDialogOpen}
        onOpenChange={setTerminateDialogOpen}
        title="Mietvertrag kündigen"
        description="Möchten Sie diesen Mietvertrag wirklich beenden? Die Einheit wird als 'Frei' markiert."
        confirmLabel="Vertrag beenden"
        onConfirm={() => terminateLease.mutate()}
        destructive
      />
    </div>
  );
}
