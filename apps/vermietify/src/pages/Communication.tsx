import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus, Mail, Send, Inbox } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Communication() {
  return (
    <MainLayout title="Kommunikation">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Kommunikation</h1>
            <p className="text-muted-foreground">
              Nachrichten an Ihre Mieter senden und verwalten
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Neue Nachricht
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gesendet</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Diesen Monat
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entwürfe</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Unveröffentlicht
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vorlagen</CardTitle>
              <Inbox className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Gespeichert
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="inbox" className="space-y-4">
          <TabsList>
            <TabsTrigger value="inbox">Posteingang</TabsTrigger>
            <TabsTrigger value="sent">Gesendet</TabsTrigger>
            <TabsTrigger value="templates">Vorlagen</TabsTrigger>
          </TabsList>
          
          <TabsContent value="inbox">
            <Card>
              <CardHeader>
                <CardTitle>Posteingang</CardTitle>
                <CardDescription>
                  Ihre empfangenen Nachrichten
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Inbox className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Posteingang leer
                  </h3>
                  <p className="text-muted-foreground">
                    Sie haben keine neuen Nachrichten
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sent">
            <Card>
              <CardHeader>
                <CardTitle>Gesendete Nachrichten</CardTitle>
                <CardDescription>
                  Ihre gesendeten Nachrichten an Mieter
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Send className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Keine gesendeten Nachrichten
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Senden Sie Ihre erste Nachricht an einen Mieter
                  </p>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nachricht erstellen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle>Nachrichtenvorlagen</CardTitle>
                <CardDescription>
                  Wiederverwendbare Vorlagen für häufige Anschreiben
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Keine Vorlagen
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Erstellen Sie Vorlagen für häufige Anschreiben
                  </p>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Vorlage erstellen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
