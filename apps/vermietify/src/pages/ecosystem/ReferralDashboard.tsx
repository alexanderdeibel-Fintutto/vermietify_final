import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useEcosystemReferrals } from "@/hooks/useEcosystemReferrals";
import { useEcosystemApps } from "@/hooks/useEcosystemApps";
import { EcosystemPromoCards } from "@/components/ecosystem/EcosystemPromoCards";
import { Send, Users, CheckCircle, Clock, TrendingUp, LinkIcon } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  sent: { label: "Gesendet", variant: "secondary" },
  clicked: { label: "Geklickt", variant: "outline" },
  registered: { label: "Registriert", variant: "default" },
  active: { label: "Aktiv", variant: "default" },
};

export default function ReferralDashboard() {
  const { data: referrals, isLoading: refLoading } = useEcosystemReferrals();
  const { data: apps } = useEcosystemApps([]);

  const totalSent = referrals?.length ?? 0;
  const totalRegistered = referrals?.filter((r) => r.status === "registered" || r.status === "active").length ?? 0;
  const conversionRate = totalSent > 0 ? Math.round((totalRegistered / totalSent) * 100) : 0;

  // Group by app
  const byApp = (referrals ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.app_slug] = (acc[r.app_slug] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <MainLayout title="Empfehlungen">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Empfehlungen & Referrals</h1>
          <p className="text-muted-foreground">
            Verfolgen Sie Ihre Einladungen zum Fintutto-Ökosystem
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Send className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalSent}</p>
                  <p className="text-xs text-muted-foreground">Einladungen gesendet</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalRegistered}</p>
                  <p className="text-xs text-muted-foreground">Registrierungen</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <TrendingUp className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{conversionRate}%</p>
                  <p className="text-xs text-muted-foreground">Conversion-Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                  <Users className="h-5 w-5 text-violet-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{Object.keys(byApp).length}</p>
                  <p className="text-xs text-muted-foreground">Apps beworben</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Per-App Breakdown */}
        {apps && apps.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {apps.map((app) => {
              const count = byApp[app.slug] ?? 0;
              return (
                <Card key={app.slug} className="overflow-hidden">
                  <div className="h-1 w-full" style={{ background: `linear-gradient(135deg, ${app.color_from}, ${app.color_to})` }} />
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{app.icon_emoji}</span>
                      <span className="text-sm font-medium">{app.name}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{count}</span>
                      <span className="text-xs text-muted-foreground">Einladungen</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Referral History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Einladungs-Verlauf
            </CardTitle>
            <CardDescription>Alle verschickten Einladungen mit Status</CardDescription>
          </CardHeader>
          <CardContent>
            {refLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : !referrals?.length ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Send className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground mb-1">Noch keine Einladungen verschickt</p>
                <p className="text-xs text-muted-foreground">Nutzen Sie die Werbekarten unten, um Einladungen zu versenden</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>App</TableHead>
                    <TableHead>Empfänger</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Datum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map((ref) => {
                    const st = statusLabels[ref.status] ?? statusLabels.sent;
                    return (
                      <TableRow key={ref.id}>
                        <TableCell>
                          <span className="text-sm font-medium">{ref.app_name}</span>
                        </TableCell>
                        <TableCell className="text-sm">{ref.invited_email}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{ref.invited_name ?? "–"}</TableCell>
                        <TableCell>
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(ref.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Ecosystem Cards for new invites */}
        <EcosystemPromoCards />
      </div>
    </MainLayout>
  );
}
