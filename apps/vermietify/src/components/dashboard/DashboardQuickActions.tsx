import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  UserPlus,
  FileText,
  CreditCard,
  Building2,
  Wrench,
  CalendarPlus,
} from "lucide-react";

const quickActions = [
  { icon: Building2, label: "Gebäude anlegen", path: "/immobilien", color: "text-primary" },
  { icon: UserPlus, label: "Mieter hinzufügen", path: "/mieter", color: "text-blue-500" },
  { icon: CreditCard, label: "Zahlung erfassen", path: "/finanzen/zahlungen", color: "text-green-500" },
  { icon: Wrench, label: "Aufgabe erstellen", path: "/aufgaben/neu", color: "text-orange-500" },
  { icon: FileText, label: "Dokument hochladen", path: "/dokumente", color: "text-purple-500" },
  { icon: CalendarPlus, label: "Termin anlegen", path: "/kalender", color: "text-pink-500" },
];

export function DashboardQuickActions() {
  return (
    <Card className="backdrop-blur-md bg-white/10 border-white/15 text-white">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Schnellaktionen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {quickActions.map((action) => (
            <Button
              key={action.path}
              variant="outline"
              className="h-auto py-4 flex-col gap-2 backdrop-blur-sm bg-white/5 border-white/10 hover:bg-white/15 text-white"
              asChild
            >
              <Link to={action.path}>
                <action.icon className={`h-6 w-6 ${action.color}`} />
                <span className="text-xs text-center">{action.label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
