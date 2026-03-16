import { useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTaxProfiles, TaxProfile } from "@/hooks/useTaxProfiles";
import { useTaxDeadlines, TaxDeadline } from "@/hooks/useTaxDeadlines";
import { LoadingState } from "@/components/shared";
import {
  Euro,
  TrendingDown,
  Receipt,
  Calculator,
  FileText,
  Calendar,
  Clock,
  ArrowRight,
  BarChart3,
  Shield,
  Download,
  Lightbulb,
  BookOpen,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

const COUNTRY_LABELS: Record<string, string> = {
  DE: "Deutschland",
  AT: "Osterreich",
  CH: "Schweiz",
};

const STATUS_COLORS: Record<string, string> = {
  upcoming: "bg-blue-100 text-blue-800",
  due_soon: "bg-orange-100 text-orange-800",
  overdue: "bg-red-100 text-red-800",
  completed: "bg-green-100 text-green-800",
};

const STATUS_LABELS: Record<string, string> = {
  upcoming: "Anstehend",
  due_soon: "Bald fallig",
  overdue: "Uberschritten",
  completed: "Erledigt",
};

const quickLinks = [
  { to: "/steuern/erklaerungen", icon: FileText, label: "Steuererklarungen" },
  { to: "/steuern/absetzungen", icon: TrendingDown, label: "Absetzungen" },
  { to: "/steuern/fristen", icon: Calendar, label: "Fristen" },
  { to: "/steuern/szenarien", icon: BarChart3, label: "Szenarien" },
  { to: "/steuern/optimierung", icon: Lightbulb, label: "Optimierung" },
  { to: "/steuern/formulare", icon: BookOpen, label: "Formulare" },
  { to: "/steuern/compliance", icon: Shield, label: "Compliance" },
  { to: "/steuern/export", icon: Download, label: "Export" },
];

export default function TaxDashboard() {
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedCountry, setSelectedCountry] = useState<string>("DE");

  const { data: profiles = [], isLoading: profilesLoading } = useTaxProfiles(selectedYear);
  const { data: deadlines = [], isLoading: deadlinesLoading } = useTaxDeadlines(selectedYear);

  const isLoading = profilesLoading || deadlinesLoading;

  const activeProfile = profiles.find((p: TaxProfile) => p.country === selectedCountry) || profiles[0];

  const totalIncome = activeProfile?.total_income_cents || 0;
  const totalDeductions = activeProfile?.total_deductions_cents || 0;
  const taxableIncome = activeProfile?.taxable_income_cents || Math.max(0, totalIncome - totalDeductions);
  const estimatedTax = activeProfile?.estimated_tax_cents || Math.round(taxableIncome * 0.3);

  const upcomingDeadlines = deadlines
    .filter((d: TaxDeadline) => d.status !== "completed")
    .slice(0, 5);

  return (
    <MainLayout title="Steuer-Dashboard">
      <div className="space-y-6">
        <PageHeader
          title="Steuer-Dashboard"
          subtitle={`Ubersicht fur das Steuerjahr ${selectedYear}`}
          actions={
            <div className="flex items-center gap-2">
              <Select
                value={String(selectedYear)}
                onValueChange={(v) => setSelectedYear(Number(v))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" asChild>
                <Link to="/steuern/export">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Link>
              </Button>
            </div>
          }
        />

        {/* Country Tabs */}
        <Tabs value={selectedCountry} onValueChange={setSelectedCountry}>
          <TabsList>
            <TabsTrigger value="DE">DE - Deutschland</TabsTrigger>
            <TabsTrigger value="AT">AT - Osterreich</TabsTrigger>
            <TabsTrigger value="CH">CH - Schweiz</TabsTrigger>
          </TabsList>

          {["DE", "AT", "CH"].map((country) => (
            <TabsContent key={country} value={country}>
              {isLoading ? (
                <LoadingState />
              ) : (
                <div className="space-y-6">
                  {/* KPI Cards */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <StatCard
                      title="Gesamteinnahmen"
                      value={`${(totalIncome / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €`}
                      icon={Euro}
                      description={`${COUNTRY_LABELS[country]} ${selectedYear}`}
                    />
                    <StatCard
                      title="Absetzungen"
                      value={`${(totalDeductions / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €`}
                      icon={TrendingDown}
                      description="Werbungskosten gesamt"
                    />
                    <StatCard
                      title="Zu versteuerndes Einkommen"
                      value={`${(taxableIncome / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €`}
                      icon={Receipt}
                      description="Einnahmen abzgl. Absetzungen"
                    />
                    <StatCard
                      title="Geschatzte Steuer"
                      value={`${(estimatedTax / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €`}
                      icon={Calculator}
                      description="~30% effektiver Steuersatz"
                    />
                  </div>

                  {/* Quick Links */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Schnellzugriff</CardTitle>
                      <CardDescription>Alle Steuerfunktionen auf einen Blick</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                        {quickLinks.map((link) => (
                          <Button
                            key={link.to}
                            variant="outline"
                            className="h-auto py-4 flex-col gap-2"
                            asChild
                          >
                            <Link to={link.to}>
                              <link.icon className="h-6 w-6" />
                              <span>{link.label}</span>
                            </Link>
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Deadline Timeline */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Fristen-Timeline
                          </CardTitle>
                          <CardDescription>
                            Nachste Steuerfristen fur {selectedYear}
                          </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link to="/steuern/fristen">
                            Alle anzeigen
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {upcomingDeadlines.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          Keine anstehenden Fristen fur {selectedYear}
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {upcomingDeadlines.map((deadline: TaxDeadline) => (
                            <div
                              key={deadline.id}
                              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium">{deadline.title}</p>
                                  {deadline.description && (
                                    <p className="text-xs text-muted-foreground">
                                      {deadline.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-muted-foreground">
                                  {format(new Date(deadline.deadline_date), "dd.MM.yyyy", { locale: de })}
                                </span>
                                <Badge variant="outline" className={STATUS_COLORS[deadline.status]}>
                                  {STATUS_LABELS[deadline.status]}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Filing Status */}
                  {activeProfile && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <RefreshCw className="h-5 w-5" />
                          Bearbeitungsstatus
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">
                              Steuerprofil {COUNTRY_LABELS[activeProfile.country]} {activeProfile.tax_year}
                            </p>
                            {activeProfile.tax_number && (
                              <p className="text-sm text-muted-foreground">
                                Steuernummer: {activeProfile.tax_number}
                              </p>
                            )}
                            {activeProfile.tax_office_name && (
                              <p className="text-sm text-muted-foreground">
                                Finanzamt: {activeProfile.tax_office_name}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline">
                            {activeProfile.filing_status === "not_started" && "Nicht begonnen"}
                            {activeProfile.filing_status === "in_progress" && "In Bearbeitung"}
                            {activeProfile.filing_status === "ready" && "Bereit"}
                            {activeProfile.filing_status === "filed" && "Eingereicht"}
                            {activeProfile.filing_status === "accepted" && "Akzeptiert"}
                            {activeProfile.filing_status === "rejected" && "Abgelehnt"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </MainLayout>
  );
}
