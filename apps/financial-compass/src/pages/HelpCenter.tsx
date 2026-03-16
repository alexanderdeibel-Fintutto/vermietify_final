import { useState } from 'react';
import { Search, HelpCircle, BookOpen, Receipt, FileText, FolderOpen, BarChart3, Building2, Mail, ExternalLink, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

const categories = [
  { id: 'getting-started', name: 'Erste Schritte', icon: BookOpen, color: 'bg-blue-500' },
  { id: 'transactions', name: 'Buchungen', icon: Receipt, color: 'bg-green-500' },
  { id: 'invoices', name: 'Rechnungen', icon: FileText, color: 'bg-purple-500' },
  { id: 'receipts', name: 'Belege', icon: FolderOpen, color: 'bg-orange-500' },
  { id: 'reports', name: 'Berichte', icon: BarChart3, color: 'bg-cyan-500' },
  { id: 'datev', name: 'DATEV', icon: Building2, color: 'bg-pink-500' },
];

const faqs = [
  {
    category: 'getting-started',
    questions: [
      {
        q: 'Wie erstelle ich meine erste Firma?',
        a: 'Klicken Sie in der Sidebar auf "Firmen" und dann auf "Neue Firma". Geben Sie den Firmennamen und optional die Rechtsform ein. Nach dem Speichern können Sie sofort mit der Buchhaltung beginnen.',
      },
      {
        q: 'Wie verbinde ich mein Bankkonto?',
        a: 'Navigieren Sie zu "Bankverbindung" in der Sidebar. Klicken Sie auf "Bank verbinden" und wählen Sie Ihre Bank aus der Liste. Folgen Sie den Anweisungen zur sicheren Authentifizierung über FinAPI.',
      },
      {
        q: 'Kann ich mehrere Firmen verwalten?',
        a: 'Ja! Fintutto unterstützt die Verwaltung mehrerer Firmen. Wechseln Sie einfach über das Dropdown-Menü in der Sidebar zwischen Ihren Firmen. Alle Daten werden getrennt gehalten.',
      },
      {
        q: 'Wie lade ich Mitarbeiter ein?',
        a: 'Gehen Sie zu Einstellungen > Team und klicken Sie auf "Mitglied einladen". Geben Sie die E-Mail-Adresse ein und wählen Sie die Rolle (Admin, Buchhalter, etc.).',
      },
    ],
  },
  {
    category: 'transactions',
    questions: [
      {
        q: 'Wie erstelle ich eine neue Buchung?',
        a: 'Unter "Buchungen" klicken Sie auf "Neue Buchung". Wählen Sie den Typ (Einnahme/Ausgabe), geben Sie Betrag, Datum und optional eine Kategorie ein. Die Buchung wird automatisch der aktuellen Firma zugeordnet.',
      },
      {
        q: 'Was ist der Unterschied zwischen Einnahme und Ausgabe?',
        a: 'Eine Einnahme erhöht Ihr Guthaben (z.B. Kundenrechnungen), eine Ausgabe verringert es (z.B. Lieferantenrechnungen, Miete). Die Unterscheidung ist wichtig für die korrekte Gewinn- und Verlustrechnung.',
      },
      {
        q: 'Wie importiere ich Bankumsätze?',
        a: 'Verbinden Sie zuerst Ihre Bank unter "Bankverbindung". Danach können Sie unter "Bankkonten" auf "Umsätze importieren" klicken. Die Transaktionen werden automatisch als Buchungen angelegt.',
      },
      {
        q: 'Kann ich Buchungen nachträglich bearbeiten?',
        a: 'Ja, klicken Sie auf eine Buchung um sie zu öffnen. Dort können Sie alle Felder bearbeiten. Änderungen werden mit Zeitstempel protokolliert.',
      },
    ],
  },
  {
    category: 'invoices',
    questions: [
      {
        q: 'Wie erstelle ich eine Rechnung?',
        a: 'Unter "Rechnungen" klicken Sie auf "Neue Rechnung". Wählen Sie einen Kontakt, geben Sie Positionen ein und die Rechnung wird automatisch nummeriert. Sie können direkt als PDF exportieren.',
      },
      {
        q: 'Wie funktioniert das Mahnwesen?',
        a: 'Überfällige Rechnungen werden automatisch markiert. Unter E-Mail-Vorlagen finden Sie vordefinierte Mahnschreiben (1. und 2. Mahnung), die Sie mit einem Klick versenden können.',
      },
      {
        q: 'Kann ich eigene Rechnungsvorlagen erstellen?',
        a: 'Ja, unter Einstellungen > Dokumente können Sie Logo, Farben und Texte Ihrer Rechnungen anpassen. Die Änderungen werden auf alle neuen Rechnungen angewendet.',
      },
    ],
  },
  {
    category: 'receipts',
    questions: [
      {
        q: 'Wie lade ich Belege hoch?',
        a: 'Unter "Belege" können Sie Dateien per Drag & Drop hochladen oder über den Upload-Button auswählen. Unterstützt werden PDF, JPG und PNG.',
      },
      {
        q: 'Werden Belege automatisch erkannt?',
        a: 'Ja! Unser KI-System analysiert hochgeladene Belege und extrahiert automatisch Betrag, Datum und Lieferant. Sie können die Daten vor dem Speichern überprüfen.',
      },
      {
        q: 'Wie verknüpfe ich einen Beleg mit einer Buchung?',
        a: 'Öffnen Sie den Beleg und klicken Sie auf "Mit Buchung verknüpfen". Sie können eine bestehende Buchung auswählen oder eine neue erstellen.',
      },
    ],
  },
  {
    category: 'reports',
    questions: [
      {
        q: 'Welche Berichte sind verfügbar?',
        a: 'Fintutto bietet: Gewinn- und Verlustrechnung, Einnahmen-Überschuss-Rechnung (EÜR), Umsatzsteuer-Zusammenfassung, Kontenübersicht und benutzerdefinierte Auswertungen.',
      },
      {
        q: 'Kann ich Berichte exportieren?',
        a: 'Ja, alle Berichte können als PDF oder Excel exportiert werden. Klicken Sie einfach auf den Export-Button oben rechts im jeweiligen Bericht.',
      },
      {
        q: 'Wie erstelle ich einen Jahresabschluss?',
        a: 'Unter Berichte > Jahresabschluss können Sie das Geschäftsjahr auswählen. Der Bericht wird automatisch aus allen Buchungen generiert und kann für den Steuerberater exportiert werden.',
      },
    ],
  },
  {
    category: 'datev',
    questions: [
      {
        q: 'Wie exportiere ich für DATEV?',
        a: 'Unter Einstellungen > DATEV-Export können Sie einen Zeitraum auswählen und das passende Format wählen (ASCII, XML). Der Export enthält alle Buchungen mit SKR03/04-Konten.',
      },
      {
        q: 'Was ist der Unterschied zwischen SKR03 und SKR04?',
        a: 'SKR03 (Prozessgliederungsprinzip) und SKR04 (Abschlussgliederungsprinzip) sind Standard-Kontenrahmen. Sprechen Sie mit Ihrem Steuerberater, welcher für Sie passend ist.',
      },
      {
        q: 'Wie funktioniert die GDPdU-Schnittstelle?',
        a: 'Unter Einstellungen > GDPdU können Sie einen rechtskonformen Export für Betriebsprüfungen erstellen. Das Format entspricht den Anforderungen der Finanzverwaltung.',
      },
    ],
  },
];

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredFaqs = faqs
    .filter((cat) => !selectedCategory || cat.category === selectedCategory)
    .map((cat) => ({
      ...cat,
      questions: cat.questions.filter(
        (faq) =>
          !searchQuery ||
          faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.a.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((cat) => cat.questions.length > 0);

  const totalResults = filteredFaqs.reduce((acc, cat) => acc + cat.questions.length, 0);

  return (
    <div className="space-y-6">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Hilfe-Center</h1>
        <p className="text-muted-foreground mb-6">
          Finden Sie Antworten auf häufige Fragen oder kontaktieren Sie unser Support-Team.
        </p>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Suchen Sie nach Hilfe..."
            className="pl-10 h-12 text-lg"
          />
        </div>

        {searchQuery && (
          <p className="text-sm text-muted-foreground mt-2">
            {totalResults} Ergebnis{totalResults !== 1 ? 'se' : ''} gefunden
          </p>
        )}
      </div>

      {/* Categories */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategory === category.id;
          const questionCount = faqs.find((f) => f.category === category.id)?.questions.length || 0;

          return (
            <Card
              key={category.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedCategory(isSelected ? null : category.id)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`p-3 rounded-lg ${category.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{category.name}</p>
                  <p className="text-sm text-muted-foreground">{questionCount} Artikel</p>
                </div>
                {isSelected && <Badge>Ausgewählt</Badge>}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FAQ Accordion */}
      <div className="space-y-6">
        {filteredFaqs.map((categoryFaqs) => {
          const category = categories.find((c) => c.id === categoryFaqs.category);
          if (!category) return null;

          return (
            <Card key={categoryFaqs.category}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${category.color}`}>
                    <category.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <CardDescription>{categoryFaqs.questions.length} Fragen</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {categoryFaqs.questions.map((faq, index) => (
                    <AccordionItem key={index} value={`${categoryFaqs.category}-${index}`}>
                      <AccordionTrigger className="text-left">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Contact Box */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardContent className="flex flex-col md:flex-row items-center justify-between gap-6 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/20">
              <HelpCircle className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Noch Fragen?</h3>
              <p className="text-muted-foreground">
                Unser Support-Team hilft Ihnen gerne weiter.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <a href="mailto:support@fintutto.cloud">
                <Mail className="h-4 w-4 mr-2" />
                support@fintutto.cloud
              </a>
            </Button>
            <Button variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Dokumentation
            </Button>
            <Button variant="outline">
              <MessageCircle className="h-4 w-4 mr-2" />
              Community
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
