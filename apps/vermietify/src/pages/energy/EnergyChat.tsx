import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Send,
  User,
  Zap,
  Lightbulb,
  Sun,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const suggestedQuestions = [
  { label: "Energiespartipps", icon: Lightbulb, question: "Welche Energiespartipps gibt es für meine Mietobjekte?" },
  { label: "Tarifvergleich", icon: BarChart3, question: "Wie kann ich die Stromtarife für meine Gebäude vergleichen?" },
  { label: "Solarempfehlung", icon: Sun, question: "Lohnt sich eine Solaranlage für mein Mehrfamilienhaus?" },
  { label: "Verbrauchsanalyse", icon: Zap, question: "Wie hoch ist der durchschnittliche Energieverbrauch meiner Gebäude?" },
];

const initialMessages: ChatMessage[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Willkommen beim Energie-Berater! Ich helfe Ihnen bei Fragen rund um Energieeffizienz, Tarifoptimierung und nachhaltige Maßnahmen für Ihre Immobilien. Was möchten Sie wissen?",
    timestamp: "10:00",
  },
  {
    id: "2",
    role: "user",
    content: "Welche Energiespartipps gibt es für meine Mietobjekte?",
    timestamp: "10:01",
  },
  {
    id: "3",
    role: "assistant",
    content:
      "Hier sind einige bewährte Energiespartipps für Ihre Mietobjekte:\n\n1. **Heizungsoptimierung**: Hydraulischer Abgleich der Heizungsanlage kann 10-15% Energie einsparen.\n\n2. **LED-Umrüstung**: Austausch der Beleuchtung in Gemeinschaftsflächen auf LED spart bis zu 80% Stromkosten.\n\n3. **Dämmung**: Kellerdecken- und oberste Geschossdecken-Dämmung sind oft mit niedrigem Aufwand realisierbar.\n\n4. **Smarte Thermostate**: Programmierbare Thermostate in den Einheiten können 5-10% Heizenergie sparen.\n\n5. **Regelmäßige Wartung**: Jährliche Heizungswartung sichert optimale Effizienz.\n\nMöchten Sie zu einem dieser Punkte mehr erfahren?",
    timestamp: "10:01",
  },
];

const mockResponses: Record<string, string> = {
  tarifvergleich:
    "Für einen effektiven Tarifvergleich empfehle ich:\n\n1. **Gesamtverbrauch ermitteln**: Sammeln Sie die Verbrauchsdaten der letzten 12 Monate für alle Gebäude.\n\n2. **Vergleichsportale nutzen**: CHECK24, Verivox oder direkte Anfragen bei Stadtwerken.\n\n3. **Bündelung prüfen**: Bei mehreren Objekten kann ein Rahmenvertrag günstiger sein.\n\n4. **Aktuell**: Die durchschnittlichen Stromkosten liegen bei ca. 30-35 ct/kWh. Vergleichen Sie regelmäßig!\n\nSoll ich die Verbrauchsdaten Ihrer Gebäude analysieren?",
  solar:
    "Eine Solaranlage für Ihr Mehrfamilienhaus kann sich lohnen!\n\n**Vorteile:**\n- Mieterstrom-Modell möglich (Strom direkt an Mieter verkaufen)\n- EEG-Vergütung für eingespeisten Strom\n- Wertsteigerung der Immobilie\n- CO₂-Reduktion\n\n**Richtwerte:**\n- 10 kWp-Anlage: ca. 12.000-15.000 EUR\n- Jährliche Erzeugung: ca. 9.000-10.000 kWh\n- Amortisation: 8-12 Jahre\n\n**Nächste Schritte:**\n1. Dachfläche und Ausrichtung prüfen\n2. Statik-Gutachten einholen\n3. Mehrere Angebote vergleichen\n\nMöchten Sie eine detaillierte Wirtschaftlichkeitsberechnung?",
  default:
    "Das ist eine gute Frage! Basierend auf den Daten Ihrer Immobilien kann ich Ihnen folgende Einschätzung geben:\n\nDer durchschnittliche Energieverbrauch Ihrer Gebäude liegt im mittleren Bereich. Es gibt Optimierungspotenzial, insbesondere bei der Heizungsanlage und der Gebäudehülle.\n\nIch empfehle eine detaillierte Energieberatung für die Objekte mit dem höchsten Verbrauch. Soll ich die Verbrauchsdaten zusammenstellen?",
};

function getResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("tarif") || lower.includes("vergleich") || lower.includes("strom")) {
    return mockResponses["tarifvergleich"];
  }
  if (lower.includes("solar") || lower.includes("photovoltaik") || lower.includes("pv")) {
    return mockResponses["solar"];
  }
  return mockResponses["default"];
}

export default function EnergyChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: String(Date.now()),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
    };

    const aiResponse: ChatMessage = {
      id: String(Date.now() + 1),
      role: "assistant",
      content: getResponse(inputValue),
      timestamp: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage, aiResponse]);
    setInputValue("");
  };

  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
  };

  return (
    <MainLayout
      title="Energie-Berater"
      breadcrumbs={[
        { label: "Energie", href: "/energy" },
        { label: "KI-Berater" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="KI Energie-Berater"
          subtitle="Fragen Sie unseren KI-Assistenten zu Energiethemen."
        />

        {/* Quick Questions */}
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((sq) => (
            <Button
              key={sq.label}
              variant="outline"
              size="sm"
              onClick={() => handleQuickQuestion(sq.question)}
              className="gap-2"
            >
              <sq.icon className="h-4 w-4" />
              {sq.label}
            </Button>
          ))}
        </div>

        {/* Chat Container */}
        <Card className="flex flex-col" style={{ minHeight: "500px" }}>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="h-5 w-5" />
              Energie-Chat
              <Badge variant="outline" className="bg-green-50 text-green-700 ml-2">Online</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === "assistant" && (
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-blue-600" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[70%] rounded-lg px-4 py-3 text-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  <p
                    className={cn(
                      "text-xs mt-1",
                      msg.role === "user"
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    )}
                  >
                    {msg.timestamp}
                  </p>
                </div>
                {msg.role === "user" && (
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-green-600" />
                  </div>
                )}
              </div>
            ))}
          </CardContent>

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Stellen Sie eine Frage zum Thema Energie..."
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={!inputValue.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
