import { Link } from 'react-router-dom'
import { Mail, MessageCircle, HelpCircle, ExternalLink, MapPin, Clock, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import useDocumentTitle from '@/hooks/useDocumentTitle'

export default function KontaktPage() {
  useDocumentTitle('Kontakt & Hilfe')

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Kontakt & Hilfe</h1>
        <p className="text-xl text-muted-foreground">Wir helfen dir weiter</p>
      </div>

      {/* Quick Help Cards Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <MessageCircle className="w-10 h-10 mb-2 text-primary" />
            <CardTitle>KI-Rechtsberater</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Sofort Antworten auf deine Fragen
            </p>
            <Button asChild className="w-full">
              <Link to="/chat">Zum Chat</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <HelpCircle className="w-10 h-10 mb-2 text-primary" />
            <CardTitle>FAQ</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Antworten auf haeufige Fragen
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/faq">Zur FAQ</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <Shield className="w-10 h-10 mb-2 text-primary" />
            <CardTitle>BescheidScan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Bescheid automatisch pruefen lassen
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/scan">Zum Scan</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Beratungsstellen Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Kostenlose Beratungsstellen</CardTitle>
          <p className="text-muted-foreground">
            Diese Organisationen bieten kostenlose professionelle Hilfe
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-l-4 border-primary pl-4 py-2">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">VdK (Sozialverband VdK Deutschland)</h3>
                <p className="text-muted-foreground">Kostenlose Sozialrechtsberatung</p>
              </div>
              <a
                href="https://www.vdk.de"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                www.vdk.de <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="border-l-4 border-primary pl-4 py-2">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">SoVD (Sozialverband Deutschland)</h3>
                <p className="text-muted-foreground">Beratung zu SGB II-Anspruechen</p>
              </div>
              <a
                href="https://www.sovd.de"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                www.sovd.de <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="border-l-4 border-primary pl-4 py-2">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">Caritas</h3>
                <p className="text-muted-foreground">Allgemeine Sozialberatung</p>
              </div>
              <a
                href="https://www.caritas.de"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                www.caritas.de <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="border-l-4 border-primary pl-4 py-2">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">Diakonie</h3>
                <p className="text-muted-foreground">Sozialberatung fuer Betroffene</p>
              </div>
              <a
                href="https://www.diakonie.de"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                www.diakonie.de <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="border-l-4 border-primary pl-4 py-2">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">Pro Bono Anwaelte</h3>
                <p className="text-muted-foreground">Kostenlose Rechtsberatung</p>
              </div>
              <a
                href="https://www.anwaltauskunft.de"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                www.anwaltauskunft.de <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kontaktdaten Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Kontaktdaten BescheidBoxer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-primary mt-1" />
            <div>
              <h3 className="font-semibold">E-Mail</h3>
              <a href="mailto:support@bescheidboxer.de" className="text-primary hover:underline">
                support@bescheidboxer.de
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-primary mt-1" />
            <div>
              <h3 className="font-semibold">Anschrift</h3>
              <p className="text-muted-foreground">
                Fintutto UG (haftungsbeschraenkt) i.G.<br />
                Musterstrasse 1<br />
                10115 Berlin
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-primary mt-1" />
            <div>
              <h3 className="font-semibold">Erreichbarkeit</h3>
              <p className="text-muted-foreground">Mo-Fr 9:00-17:00 Uhr</p>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-4">
            <p className="text-sm text-amber-900 dark:text-amber-100">
              <strong>Bitte beachte:</strong> Wir bieten keine Rechtsberatung an. Fuer individuelle Rechtsberatung wende dich an eine der oben genannten Beratungsstellen.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Legal Disclaimer Card */}
      <Card className="bg-muted">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            <strong>Wichtiger Hinweis:</strong> BescheidBoxer ist ein KI-gestuetztes Informationsangebot und ersetzt keine individuelle Rechtsberatung. Alle Angaben ohne Gewaehr.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
