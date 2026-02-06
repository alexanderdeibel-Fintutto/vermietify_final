import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  Circle, 
  User, 
  Building2, 
  Home, 
  Users, 
  FileText,
  ChevronRight,
  Sparkles,
  X,
} from "lucide-react";
import { useOnboardingProgress } from "@/hooks/useOnboardingProgress";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  completed: boolean;
}

interface OnboardingChecklistProps {
  onDismiss?: () => void;
}

export function OnboardingChecklist({ onDismiss }: OnboardingChecklistProps) {
  const navigate = useNavigate();
  const { progress, progressPercent, isComplete, isLoading } = useOnboardingProgress();

  if (isLoading || isComplete) {
    return null;
  }

  const items: ChecklistItem[] = [
    {
      id: "profile",
      label: "Profil vervollständigen",
      description: "Name und Kontaktdaten hinterlegen",
      icon: <User className="h-5 w-5" />,
      href: "/einstellungen",
      completed: progress?.profile_completed || false,
    },
    {
      id: "building",
      label: "Erstes Gebäude anlegen",
      description: "Fügen Sie Ihre erste Immobilie hinzu",
      icon: <Building2 className="h-5 w-5" />,
      href: "/immobilien",
      completed: progress?.first_building_created || false,
    },
    {
      id: "unit",
      label: "Erste Einheit anlegen",
      description: "Erstellen Sie eine Wohneinheit",
      icon: <Home className="h-5 w-5" />,
      href: "/immobilien",
      completed: progress?.first_unit_created || false,
    },
    {
      id: "tenant",
      label: "Ersten Mieter anlegen",
      description: "Optional: Fügen Sie einen Mieter hinzu",
      icon: <Users className="h-5 w-5" />,
      href: "/mieter",
      completed: progress?.first_tenant_created || false,
    },
    {
      id: "contract",
      label: "Ersten Vertrag erstellen",
      description: "Optional: Erstellen Sie einen Mietvertrag",
      icon: <FileText className="h-5 w-5" />,
      href: "/vertraege/neu",
      completed: progress?.first_contract_created || false,
    },
  ];

  const nextIncompleteItem = items.find((item) => !item.completed);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Erste Schritte</CardTitle>
              <CardDescription>
                Richten Sie Ihre Immobilienverwaltung ein
              </CardDescription>
            </div>
          </div>
          {onDismiss && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDismiss}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Fortschritt</span>
            <span className="font-medium">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Checklist Items */}
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.href)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                item.completed
                  ? "bg-muted/50"
                  : "hover:bg-accent"
              }`}
            >
              <div
                className={`shrink-0 ${
                  item.completed ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                }`}
              >
                {item.completed ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`font-medium text-sm ${
                    item.completed ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {item.description}
                </p>
              </div>
              {!item.completed && (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </button>
          ))}
        </div>

        {/* Quick Action */}
        {nextIncompleteItem && (
          <Button
            className="w-full"
            onClick={() => navigate(nextIncompleteItem.href)}
          >
            {nextIncompleteItem.icon}
            <span className="ml-2">{nextIncompleteItem.label}</span>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
