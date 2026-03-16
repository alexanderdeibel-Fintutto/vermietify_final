import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Search,
  BookOpen,
  Video,
  MessageSquare,
  Sparkles,
  HelpCircle,
  CreditCard,
  FileText,
  Receipt,
  User,
  ExternalLink,
  Play,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FAQArticle {
  id: string;
  category: string;
  question: string;
  answer: string;
  tags: string[];
  view_count: number;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  getting_started: <Sparkles className="h-5 w-5" />,
  payments: <CreditCard className="h-5 w-5" />,
  contracts: <FileText className="h-5 w-5" />,
  billing: <Receipt className="h-5 w-5" />,
  account: <User className="h-5 w-5" />,
};

const CATEGORY_LABELS: Record<string, string> = {
  getting_started: "Erste Schritte",
  payments: "Zahlungen",
  contracts: "Verträge",
  billing: "Abrechnung",
  account: "Konto",
};

const VIDEO_TUTORIALS = [
  {
    id: "1",
    title: "Erste Schritte mit Vermietify",
    description: "Lernen Sie die Grundfunktionen kennen",
    duration: "5:30",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  {
    id: "2",
    title: "Mietverträge erstellen",
    description: "So erstellen Sie Ihren ersten Mietvertrag",
    duration: "8:15",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  {
    id: "3",
    title: "Nebenkostenabrechnung",
    description: "Schritt für Schritt zur korrekten Abrechnung",
    duration: "12:00",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
];

const CHANGELOG = [
  {
    version: "2.4.0",
    date: "2026-02-05",
    changes: [
      "Neues Benachrichtigungssystem mit Push-Support",
      "Dark Mode und Mehrsprachigkeit",
      "Verbessertes Onboarding",
    ],
  },
  {
    version: "2.3.0",
    date: "2026-01-15",
    changes: [
      "ELSTER-Integration für Steuerübermittlung",
      "CO2-Kostenaufteilung",
      "WhatsApp-Integration",
    ],
  },
  {
    version: "2.2.0",
    date: "2025-12-01",
    changes: [
      "Automatisierungs-Workflows",
      "Banking-Integration mit finAPI",
      "Verbesserte Zählerstandsverwaltung",
    ],
  },
];

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: faqArticles = [], isLoading } = useQuery({
    queryKey: ["faq-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faq_articles")
        .select("*")
        .eq("is_published", true)
        .order("order_index");

      if (error) throw error;
      return data as FAQArticle[];
    },
  });

  const filteredArticles = faqArticles.filter(
    (article) =>
      article.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const groupedArticles = filteredArticles.reduce((acc, article) => {
    if (!acc[article.category]) {
      acc[article.category] = [];
    }
    acc[article.category].push(article);
    return acc;
  }, {} as Record<string, FAQArticle[]>);

  return (
    <MainLayout
      title="Hilfe"
      breadcrumbs={[{ label: "Hilfe" }]}
    >
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Search Header */}
        <div className="text-center space-y-4 py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <HelpCircle className="h-4 w-4" />
            Hilfe-Center
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Wie können wir helfen?
          </h1>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Suchen Sie nach Themen, Fragen oder Begriffen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <Card
              key={key}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setSearchQuery(key === "getting_started" ? "start" : key)}
            >
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 text-primary">
                  {CATEGORY_ICONS[key]}
                </div>
                <span className="font-medium">{label}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="faq" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="faq">
              <BookOpen className="h-4 w-4 mr-2" />
              FAQ
            </TabsTrigger>
            <TabsTrigger value="videos">
              <Video className="h-4 w-4 mr-2" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="contact">
              <MessageSquare className="h-4 w-4 mr-2" />
              Kontakt
            </TabsTrigger>
            <TabsTrigger value="changelog">
              <Sparkles className="h-4 w-4 mr-2" />
              Neuigkeiten
            </TabsTrigger>
          </TabsList>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Laden...</p>
              </div>
            ) : Object.keys(groupedArticles).length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <HelpCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium text-lg mb-2">Keine Ergebnisse</h3>
                  <p className="text-muted-foreground">
                    Versuchen Sie einen anderen Suchbegriff oder kontaktieren Sie uns direkt.
                  </p>
                </CardContent>
              </Card>
            ) : (
              Object.entries(groupedArticles).map(([category, articles]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {CATEGORY_ICONS[category]}
                      {CATEGORY_LABELS[category] || category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {articles.map((article) => (
                        <AccordionItem key={article.id} value={article.id}>
                          <AccordionTrigger className="text-left">
                            {article.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {article.answer}
                            {article.tags && article.tags.length > 0 && (
                              <div className="flex gap-1 mt-3">
                                {article.tags.map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {VIDEO_TUTORIALS.map((video) => (
                <Card key={video.id} className="overflow-hidden">
                  <div className="relative aspect-video bg-muted">
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="h-14 w-14 rounded-full bg-primary/90 flex items-center justify-center text-primary-foreground">
                        <Play className="h-6 w-6 ml-1" />
                      </div>
                    </div>
                    <span className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/80 text-white text-xs">
                      {video.duration}
                    </span>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-1">{video.title}</h3>
                    <p className="text-sm text-muted-foreground">{video.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>E-Mail Support</CardTitle>
                  <CardDescription>
                    Wir antworten in der Regel innerhalb von 24 Stunden
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" asChild>
                    <a href="mailto:support@vermietify.de">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      support@vermietify.de
                    </a>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dokumentation</CardTitle>
                  <CardDescription>
                    Ausführliche Anleitungen und Guides
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" asChild>
                    <a href="https://docs.vermietify.de" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Dokumentation öffnen
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Changelog Tab */}
          <TabsContent value="changelog" className="space-y-6">
            {CHANGELOG.map((release) => (
              <Card key={release.version}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Badge variant="default">v{release.version}</Badge>
                    </CardTitle>
                    <span className="text-sm text-muted-foreground">{release.date}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {release.changes.map((change, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
