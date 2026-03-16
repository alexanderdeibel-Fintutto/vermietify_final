import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Send,
  Eye,
  MessageSquare,
  Clock,
  Mail,
  FileText,
  Globe,
  TrendingUp,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from "lucide-react";

const KPI_DATA = [
  {
    title: "Gesendete Nachrichten",
    value: "1.284",
    change: "+12%",
    trend: "up" as const,
    icon: Send,
    description: "Diesen Monat",
  },
  {
    title: "Öffnungsrate",
    value: "68,4%",
    change: "+3,2%",
    trend: "up" as const,
    icon: Eye,
    description: "Durchschnitt",
  },
  {
    title: "Antwortrate",
    value: "42,1%",
    change: "-1,5%",
    trend: "down" as const,
    icon: MessageSquare,
    description: "Durchschnitt",
  },
  {
    title: "Durchschn. Antwortzeit",
    value: "4,2 Std",
    change: "-0,8 Std",
    trend: "up" as const,
    icon: Clock,
    description: "Schneller als letzter Monat",
  },
];

const CHANNEL_DATA = [
  {
    channel: "Email",
    icon: Mail,
    sent: 892,
    openRate: "72%",
    responseRate: "38%",
    color: "bg-blue-100 text-blue-800",
  },
  {
    channel: "Brief",
    icon: FileText,
    sent: 156,
    openRate: "-",
    responseRate: "22%",
    color: "bg-orange-100 text-orange-800",
  },
  {
    channel: "Portal",
    icon: Globe,
    sent: 236,
    openRate: "89%",
    responseRate: "64%",
    color: "bg-green-100 text-green-800",
  },
];

const RECENT_ACTIVITY = [
  {
    id: "1",
    type: "email",
    recipient: "Müller, Anna",
    subject: "Nebenkostenabrechnung 2025",
    status: "delivered",
    date: "15.02.2026 10:30",
  },
  {
    id: "2",
    type: "email",
    recipient: "Schmidt, Thomas",
    subject: "Mieterhöhung zum 01.04.2026",
    status: "opened",
    date: "15.02.2026 09:15",
  },
  {
    id: "3",
    type: "portal",
    recipient: "Weber, Lisa",
    subject: "Wartungsarbeiten Heizungsanlage",
    status: "read",
    date: "14.02.2026 16:45",
  },
  {
    id: "4",
    type: "letter",
    recipient: "Fischer, Markus",
    subject: "Mängelanzeige - Stellungnahme",
    status: "sent",
    date: "14.02.2026 14:20",
  },
  {
    id: "5",
    type: "email",
    recipient: "Braun, Susanne",
    subject: "Bestätigung Mietvertragsverlängerung",
    status: "delivered",
    date: "14.02.2026 11:00",
  },
  {
    id: "6",
    type: "portal",
    recipient: "Klein, Peter",
    subject: "Zählerstandsmeldung Erinnerung",
    status: "read",
    date: "13.02.2026 09:30",
  },
  {
    id: "7",
    type: "email",
    recipient: "Hoffmann, Maria",
    subject: "Mietbescheinigung 2025",
    status: "bounced",
    date: "13.02.2026 08:15",
  },
];

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  sent: { label: "Gesendet", className: "bg-blue-100 text-blue-800" },
  delivered: { label: "Zugestellt", className: "bg-green-100 text-green-800" },
  opened: { label: "Geöffnet", className: "bg-purple-100 text-purple-800" },
  read: { label: "Gelesen", className: "bg-emerald-100 text-emerald-800" },
  bounced: { label: "Fehlgeschlagen", className: "bg-red-100 text-red-800" },
};

const TYPE_ICON: Record<string, typeof Mail> = {
  email: Mail,
  letter: FileText,
  portal: Globe,
};

const MONTHS = [
  { label: "Jan", value: 45 },
  { label: "Feb", value: 62 },
  { label: "Mär", value: 58 },
  { label: "Apr", value: 71 },
  { label: "Mai", value: 85 },
  { label: "Jun", value: 92 },
  { label: "Jul", value: 78 },
  { label: "Aug", value: 65 },
  { label: "Sep", value: 88 },
  { label: "Okt", value: 95 },
  { label: "Nov", value: 102 },
  { label: "Dez", value: 110 },
];

export default function CommunicationAnalytics() {
  const [timeRange, setTimeRange] = useState("month");

  const maxValue = Math.max(...MONTHS.map((m) => m.value));

  return (
    <MainLayout
      title="Kommunikations-Analyse"
      breadcrumbs={[
        { label: "Kommunikation", href: "/kommunikation" },
        { label: "Analyse" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Kommunikations-Analyse"
          subtitle="Auswertung und Statistiken Ihrer Mieterkommunikation."
          actions={
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Diese Woche</SelectItem>
                <SelectItem value="month">Dieser Monat</SelectItem>
                <SelectItem value="quarter">Dieses Quartal</SelectItem>
                <SelectItem value="year">Dieses Jahr</SelectItem>
              </SelectContent>
            </Select>
          }
        />

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {KPI_DATA.map((kpi) => {
            const Icon = kpi.icon;
            const TrendIcon = kpi.trend === "up" ? ArrowUpRight : ArrowDownRight;
            const trendColor =
              kpi.title === "Durchschn. Antwortzeit"
                ? kpi.trend === "up"
                  ? "text-green-600"
                  : "text-red-600"
                : kpi.trend === "up"
                ? "text-green-600"
                : "text-red-600";
            return (
              <Card key={kpi.title}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
                      <TrendIcon className="h-4 w-4" />
                      {kpi.change}
                    </div>
                  </div>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                  <p className="text-sm text-muted-foreground">{kpi.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Message Volume Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Nachrichtenvolumen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-end gap-2 h-48">
                  {MONTHS.map((month) => (
                    <div key={month.label} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-primary/80 rounded-t-sm transition-all hover:bg-primary min-h-[4px]"
                        style={{ height: `${(month.value / maxValue) * 100}%` }}
                      />
                      <span className="text-xs text-muted-foreground">{month.label}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-3">
                  <span>Gesamt: {MONTHS.reduce((sum, m) => sum + m.value, 0)} Nachrichten</span>
                  <span>
                    Durchschnitt: {Math.round(MONTHS.reduce((sum, m) => sum + m.value, 0) / 12)}/Monat
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Channel Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Kanal-Aufschlüsselung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {CHANNEL_DATA.map((channel) => {
                  const Icon = channel.icon;
                  const totalSent = CHANNEL_DATA.reduce((sum, c) => sum + c.sent, 0);
                  const percentage = Math.round((channel.sent / totalSent) * 100);
                  return (
                    <div key={channel.channel} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{channel.channel}</p>
                            <p className="text-xs text-muted-foreground">
                              {channel.sent} gesendet
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className={channel.color}>
                            {percentage}%
                          </Badge>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Öffnungsrate: {channel.openRate}</span>
                        <span>Antwortrate: {channel.responseRate}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Communication Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Letzte Kommunikationsaktivität
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kanal</TableHead>
                  <TableHead>Empfänger</TableHead>
                  <TableHead>Betreff</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Datum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {RECENT_ACTIVITY.map((activity) => {
                  const TypeIcon = TYPE_ICON[activity.type] || Mail;
                  const statusConfig = STATUS_CONFIG[activity.status] || STATUS_CONFIG.sent;
                  return (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TypeIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {activity.type === "portal"
                              ? "Portal"
                              : activity.type === "letter"
                              ? "Brief"
                              : "E-Mail"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {activity.recipient}
                      </TableCell>
                      <TableCell className="text-sm max-w-[250px] truncate">
                        {activity.subject}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusConfig.className}>
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {activity.date}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
