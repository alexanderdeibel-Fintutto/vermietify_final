import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  Users,
  CreditCard,
  FileText,
  BarChart3,
  Shield,
  Mail,
  Calculator,
  Zap,
  Boxes,
  Gauge,
  Leaf,
  Flame,
  ClipboardCheck,
  BanknoteIcon,
  LayoutDashboard,
  Crown,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

interface ModuleConfig {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  enabled: boolean;
  premium: boolean;
  category: "core" | "finance" | "communication" | "compliance" | "analytics" | "automation";
}

const initialModules: ModuleConfig[] = [
  {
    id: "buildings",
    name: "Gebäudeverwaltung",
    description: "Gebäude, Einheiten und Ausstattung verwalten",
    icon: Building2,
    enabled: true,
    premium: false,
    category: "core",
  },
  {
    id: "tenants",
    name: "Mieterverwaltung",
    description: "Mieter, Verträge und Kommunikation",
    icon: Users,
    enabled: true,
    premium: false,
    category: "core",
  },
  {
    id: "contracts",
    name: "Vertragsmanagement",
    description: "Mietverträge erstellen und verwalten",
    icon: FileText,
    enabled: true,
    premium: false,
    category: "core",
  },
  {
    id: "payments",
    name: "Zahlungsverwaltung",
    description: "Mietzahlungen und Mahnwesen",
    icon: CreditCard,
    enabled: true,
    premium: false,
    category: "finance",
  },
  {
    id: "banking",
    name: "Banking-Integration",
    description: "Bankkonten anbinden und Transaktionen abgleichen",
    icon: BanknoteIcon,
    enabled: true,
    premium: true,
    category: "finance",
  },
  {
    id: "accounting",
    name: "Buchhaltung",
    description: "Betriebskostenabrechnung und Buchführung",
    icon: Calculator,
    enabled: true,
    premium: false,
    category: "finance",
  },
  {
    id: "tax",
    name: "Steuermodul",
    description: "ELSTER-Anbindung, Anlage V, Steuererklärung",
    icon: FileText,
    enabled: false,
    premium: true,
    category: "finance",
  },
  {
    id: "email",
    name: "E-Mail-Kommunikation",
    description: "E-Mail-Vorlagen und automatischer Versand",
    icon: Mail,
    enabled: true,
    premium: false,
    category: "communication",
  },
  {
    id: "whatsapp",
    name: "WhatsApp-Integration",
    description: "Direktnachrichten über WhatsApp senden",
    icon: Mail,
    enabled: false,
    premium: true,
    category: "communication",
  },
  {
    id: "compliance",
    name: "Compliance-Manager",
    description: "DSGVO, Brandschutz, Energie-Compliance prüfen",
    icon: Shield,
    enabled: true,
    premium: false,
    category: "compliance",
  },
  {
    id: "fire_safety",
    name: "Brandschutz",
    description: "Brandschutzprüfungen und Dokumentation",
    icon: Flame,
    enabled: false,
    premium: true,
    category: "compliance",
  },
  {
    id: "energy",
    name: "Energiemanagement",
    description: "Energieausweise, CO2-Bilanzierung, Verbrauchsanalyse",
    icon: Leaf,
    enabled: false,
    premium: true,
    category: "compliance",
  },
  {
    id: "audit",
    name: "Audit-Readiness",
    description: "Audit-Vorbereitung und Dokumentationsprüfung",
    icon: ClipboardCheck,
    enabled: false,
    premium: true,
    category: "compliance",
  },
  {
    id: "analytics",
    name: "Erweiterte Analytics",
    description: "Dashboards, KPIs und benutzerdefinierte Berichte",
    icon: BarChart3,
    enabled: true,
    premium: false,
    category: "analytics",
  },
  {
    id: "reports",
    name: "Report Builder",
    description: "Benutzerdefinierte Berichte erstellen und exportieren",
    icon: LayoutDashboard,
    enabled: false,
    premium: true,
    category: "analytics",
  },
  {
    id: "automation",
    name: "Workflow-Automatisierung",
    description: "Automatische Aufgaben und Benachrichtigungen",
    icon: Zap,
    enabled: false,
    premium: true,
    category: "automation",
  },
  {
    id: "meter_reading",
    name: "Zählererfassung",
    description: "Digitale Zählerablesung und Verbrauchsanalyse",
    icon: Gauge,
    enabled: true,
    premium: false,
    category: "core",
  },
];

const categoryLabels: Record<string, string> = {
  core: "Kernmodule",
  finance: "Finanzen",
  communication: "Kommunikation",
  compliance: "Compliance",
  analytics: "Analytics & Berichte",
  automation: "Automatisierung",
};

const categoryIcons: Record<string, LucideIcon> = {
  core: Boxes,
  finance: CreditCard,
  communication: Mail,
  compliance: Shield,
  analytics: BarChart3,
  automation: Zap,
};

export default function ModuleManagement() {
  const { toast } = useToast();
  const [modules, setModules] = useState<ModuleConfig[]>(initialModules);

  const handleToggleModule = (moduleId: string) => {
    setModules((prev) =>
      prev.map((m) => {
        if (m.id !== moduleId) return m;
        const newEnabled = !m.enabled;
        toast({
          title: newEnabled ? "Modul aktiviert" : "Modul deaktiviert",
          description: `${m.name} wurde ${newEnabled ? "aktiviert" : "deaktiviert"}`,
        });
        return { ...m, enabled: newEnabled };
      })
    );
  };

  // Group modules by category
  const modulesByCategory = modules.reduce<Record<string, ModuleConfig[]>>((acc, mod) => {
    if (!acc[mod.category]) acc[mod.category] = [];
    acc[mod.category].push(mod);
    return acc;
  }, {});

  const enabledCount = modules.filter((m) => m.enabled).length;
  const premiumCount = modules.filter((m) => m.premium).length;

  return (
    <MainLayout title="Modulverwaltung">
      <div className="space-y-6">
        <PageHeader
          title="Modulverwaltung"
          subtitle="Module aktivieren oder deaktivieren, um den Funktionsumfang anzupassen"
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "Module" },
          ]}
        />

        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Boxes className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{modules.length}</p>
                  <p className="text-sm text-muted-foreground">Module gesamt</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-green-500/10 p-3">
                  <Zap className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{enabledCount}</p>
                  <p className="text-sm text-muted-foreground">Aktiviert</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-amber-500/10 p-3">
                  <Crown className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{premiumCount}</p>
                  <p className="text-sm text-muted-foreground">Premium-Module</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Module Grid by Category */}
        {Object.entries(modulesByCategory).map(([category, mods]) => {
          const CategoryIcon = categoryIcons[category] || Boxes;
          return (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-2">
                <CategoryIcon className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">
                  {categoryLabels[category] || category}
                </h2>
                <Badge variant="secondary">{mods.length}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mods.map((mod) => {
                  const Icon = mod.icon;
                  return (
                    <Card
                      key={mod.id}
                      className={mod.enabled ? "" : "opacity-60"}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`rounded-lg p-2 ${
                                mod.enabled
                                  ? "bg-primary/10"
                                  : "bg-muted"
                              }`}
                            >
                              <Icon
                                className={`h-5 w-5 ${
                                  mod.enabled
                                    ? "text-primary"
                                    : "text-muted-foreground"
                                }`}
                              />
                            </div>
                            <div>
                              <CardTitle className="text-sm flex items-center gap-2">
                                {mod.name}
                                {mod.premium && (
                                  <Badge className="bg-gradient-to-r from-amber-400 to-amber-600 text-white text-[10px] px-1.5 py-0">
                                    <Crown className="h-3 w-3 mr-0.5" />
                                    Premium
                                  </Badge>
                                )}
                              </CardTitle>
                            </div>
                          </div>
                          <Switch
                            checked={mod.enabled}
                            onCheckedChange={() => handleToggleModule(mod.id)}
                          />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription>{mod.description}</CardDescription>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </MainLayout>
  );
}
