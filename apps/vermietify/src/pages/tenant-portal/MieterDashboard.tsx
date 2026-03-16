import { Link } from "react-router-dom";
import { TenantLayout } from "@/components/tenant-portal/TenantLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTenantPortal } from "@/hooks/useTenantPortal";
import { LoadingState } from "@/components/shared";
import {
  Building2,
  Phone,
  Mail,
  CalendarDays,
  AlertTriangle,
  MessageSquare,
  Gauge,
  FileText,
  ArrowRight,
  Euro,
  Clock,
  CheckCircle,
  Info,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { de } from "date-fns/locale";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const PIE_COLORS = ["hsl(var(--primary))", "hsl(120, 60%, 45%)", "hsl(40, 90%, 55%)"];

export default function MieterDashboard() {
  const { useTenantAccess, useTenantTasks, useTenantDocuments, useTenantMeters } = useTenantPortal();
  const { data: access, isLoading } = useTenantAccess();
  const { data: tasks = [] } = useTenantTasks();
  const { data: documents = [] } = useTenantDocuments();
  const { data: meters = [] } = useTenantMeters();

  if (isLoading) {
    return (
      <TenantLayout>
        <LoadingState />
      </TenantLayout>
    );
  }

  const tenant = access?.tenant as any;
  const unit = access?.unit as any;
  const building = unit?.building as any;
  const lease = access?.lease as any;

  const openTasks = tasks.filter((t: any) => t.status === "open" || t.status === "in_progress");
  const completedTasks = tasks.filter((t: any) => t.status === "completed");

  // Calculate next payment date
  const today = new Date();
  const paymentDay = lease?.payment_day || 1;
  const nextPayment = new Date(today.getFullYear(), today.getMonth() + (today.getDate() > paymentDay ? 1 : 0), paymentDay);
  const daysUntilPayment = differenceInDays(nextPayment, today);

  // Lease duration info
  const leaseStart = lease?.start_date ? new Date(lease.start_date) : null;
  const leaseDuration = leaseStart ? differenceInDays(today, leaseStart) : 0;

  // Task distribution for pie chart
  const taskDistribution = [
    { name: "Offen", value: openTasks.filter((t: any) => t.status === "open").length },
    { name: "Erledigt", value: completedTasks.length },
    { name: "In Bearbeitung", value: openTasks.filter((t: any) => t.status === "in_progress").length },
  ].filter(d => d.value > 0);

  return (
    <TenantLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div>
          <h1 className="text-2xl font-bold">
            Willkommen, {tenant?.first_name || "Mieter"}!
          </h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Wohnung und kommunizieren Sie mit Ihrem Vermieter.
          </p>
        </div>

        {/* Current Unit Card */}
        {unit && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5" />
                Meine Wohnung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="font-medium">{building?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {building?.address}, {building?.postal_code} {building?.city}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Einheit: {unit.unit_number} • {unit.rooms} Zimmer • {unit.area} m²
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Vermieter-Kontakt:</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>Nicht hinterlegt</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>Nicht hinterlegt</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Mietvertrag:</p>
                  {leaseStart && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      <span>Seit {format(leaseStart, "dd.MM.yyyy", { locale: de })}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{Math.floor(leaseDuration / 30)} Monate Mietdauer</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nächste Zahlung</p>
                  <p className="text-2xl font-bold">{format(nextPayment, "dd. MMM", { locale: de })}</p>
                  {lease && (
                    <p className="text-sm text-muted-foreground">
                      {((Number(lease.rent_amount) + Number(lease.utility_advance || 0)) / 100).toFixed(2)} €
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Euro className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <Badge variant={daysUntilPayment <= 3 ? "destructive" : "secondary"} className="mt-2">
                {daysUntilPayment === 0 ? "Heute fällig" : `in ${daysUntilPayment} Tagen`}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Offene Meldungen</p>
                  <p className="text-2xl font-bold">{openTasks.length}</p>
                  <p className="text-sm text-muted-foreground">
                    {openTasks.length === 0 ? "Alles erledigt" : "In Bearbeitung"}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dokumente</p>
                  <p className="text-2xl font-bold">{documents.length}</p>
                  <p className="text-sm text-muted-foreground">Verfügbare Dokumente</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Zähler</p>
                  <p className="text-2xl font-bold">{meters.length}</p>
                  <p className="text-sm text-muted-foreground">Registrierte Zähler</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-cyan-100 flex items-center justify-center">
                  <Gauge className="h-6 w-6 text-cyan-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts + Info Row */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Task Distribution */}
          {tasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Meldungen-Übersicht</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="50%" height={180}>
                    <PieChart>
                      <Pie data={taskDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value">
                        {taskDistribution.map((_, index) => (
                          <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {taskDistribution.map((item, idx) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: PIE_COLORS[idx] }} />
                        <span className="text-sm">{item.name}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lease Info Card */}
          {lease && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Mietvertragsdaten
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Kaltmiete</span>
                    <span className="font-medium">{(Number(lease.rent_amount) / 100).toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Nebenkosten-Vorauszahlung</span>
                    <span className="font-medium">{(Number(lease.utility_advance || 0) / 100).toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Gesamtmiete</span>
                    <span className="font-bold text-primary">
                      {((Number(lease.rent_amount) + Number(lease.utility_advance || 0)) / 100).toFixed(2)} €
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Zahltag</span>
                    <span className="font-medium">{lease.payment_day || 1}. des Monats</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Schnellaktionen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <Link to="/mieter-portal/mangel-melden">
                  <AlertTriangle className="h-6 w-6 text-orange-500" />
                  <span>Mangel melden</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <Link to="/mieter-portal/zaehler">
                  <Gauge className="h-6 w-6 text-blue-500" />
                  <span>Zähler ablesen</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <Link to="/mieter-portal/dokumente">
                  <FileText className="h-6 w-6 text-green-500" />
                  <span>Dokument anfragen</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Letzte Aktivitäten</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/mieter-portal/mangel-melden">
                Alle anzeigen
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Noch keine Aktivitäten vorhanden.
              </p>
            ) : (
              <div className="space-y-3">
                {tasks.slice(0, 5).map((task: any) => (
                  <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      {task.status === "completed" ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(task.created_at), "dd.MM.yyyy", { locale: de })}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        task.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : task.status === "in_progress"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-blue-100 text-blue-800"
                      }
                    >
                      {task.status === "completed" ? "Erledigt" : task.status === "in_progress" ? "In Bearbeitung" : "Offen"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TenantLayout>
  );
}
