import { Link } from 'react-router-dom'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import {
  Calculator,
  Home,
  Heart,
  TrendingUp,
  AlertTriangle,
  PiggyBank,
  Clock,
  Scale,
  ShoppingBag,
  Truck,
  ArrowRight,
  MessageCircle,
  Info,
  GitCompare,
  Wallet,
  MapPin,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const calculators = [
  {
    id: 'buergergeld',
    title: 'Buergergeld-Rechner',
    description:
      'Berechne deinen vollen Buergergeld-Anspruch inkl. Regelbedarf, KdU und Mehrbedarf',
    icon: Calculator,
    route: '/rechner/buergergeld',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'kdu',
    title: 'KdU-Rechner',
    description:
      'Pruefe ob deine Mietkosten angemessen sind - fuer deine Stadt',
    icon: Home,
    route: '/rechner/kdu',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  {
    id: 'mehrbedarf',
    title: 'Mehrbedarf-Rechner',
    description:
      'Schwanger, alleinerziehend, behindert? Berechne deinen Mehrbedarf',
    icon: Heart,
    route: '/rechner/mehrbedarf',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
  },
  {
    id: 'freibetrag',
    title: 'Freibetrags-Rechner',
    description:
      'Wieviel darfst du verdienen ohne Kuerzung? Berechne deine Freibetraege',
    icon: TrendingUp,
    route: '/rechner/freibetrag',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    id: 'sanktion',
    title: 'Sanktions-Rechner',
    description:
      'Sanktion erhalten? Pruefe ob sie rechtmaessig ist und wie hoch sie maximal sein darf',
    icon: AlertTriangle,
    route: '/rechner/sanktion',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  {
    id: 'schonvermoegen',
    title: 'Schonvermoegens-Rechner',
    description:
      'Wieviel Vermoegen darfst du behalten? Pruefe deine Freibetraege',
    icon: PiggyBank,
    route: '/rechner/schonvermoegen',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  {
    id: 'fristen',
    title: 'Fristenrechner',
    description:
      'Wann laeuft deine Frist ab? Widerspruch, Klage, Anhoerung - berechne dein Fristende',
    icon: Clock,
    route: '/rechner/fristen',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    id: 'pkh',
    title: 'PKH-Rechner',
    description:
      'Prozesskostenhilfe: Pruefe ob du Anspruch auf kostenlose Anwaltshilfe beim Sozialgericht hast',
    icon: Scale,
    route: '/rechner/pkh',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
  },
  {
    id: 'erstausstattung',
    title: 'Erstausstattungs-Rechner',
    description:
      'Erste Wohnung, Baby oder Trennung? Berechne deinen Anspruch auf Erstausstattung nach § 24 SGB II',
    icon: ShoppingBag,
    route: '/rechner/erstausstattung',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    id: 'umzugskosten',
    title: 'Umzugskosten-Rechner',
    description:
      'Berechne erstattungsfaehige Umzugskosten nach § 22 Abs. 6 SGB II inkl. Kaution als Darlehen',
    icon: Truck,
    route: '/rechner/umzugskosten',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
  },
  {
    id: 'vergleich',
    title: 'Bescheid-Vergleich',
    description:
      'Vergleiche zwei Bescheide Seite an Seite und finde Abweichungen sofort',
    icon: GitCompare,
    route: '/rechner/vergleich',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
  {
    id: 'einkommen',
    title: 'Einkommens-Uebersicht',
    description:
      'Erfasse dein monatliches Einkommen und sieh, wie viel davon auf dein Buergergeld angerechnet wird',
    icon: Wallet,
    route: '/rechner/einkommen',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
  },
  {
    id: 'haushalt',
    title: 'Haushalts-Planer',
    description:
      'Plane dein monatliches Budget: Einnahmen und Ausgaben im Ueberblick mit Spar-Tipps',
    icon: Home,
    route: '/rechner/haushalt',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
  },
  {
    id: 'mietspiegel',
    title: 'Mietspiegel-Rechner',
    description:
      'Ist deine Miete angemessen? Pruefe die KdU-Grenzen fuer deine Stadt nach § 22 SGB II',
    icon: MapPin,
    route: '/rechner/mietspiegel',
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
  },
]

export default function RechnerPage() {
  useDocumentTitle('AmtsRechner-Suite')
  return (
    <div>
      {/* ============================================================= */}
      {/* 1. HERO SECTION                                               */}
      {/* ============================================================= */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-boxer opacity-5" />
        <div className="container py-12 md:py-16 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              <span className="gradient-text-boxer">AmtsRechner</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Berechne deine Ansprueche - kostenlos und anonym
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================= */}
      {/* 2. CALCULATOR GRID                                            */}
      {/* ============================================================= */}
      <section className="container py-8 md:py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {calculators.map((calc) => (
            <Link key={calc.id} to={calc.route}>
              <Card className="h-full hover:shadow-md transition-shadow group border rounded-xl shadow-sm bg-card">
                <CardContent className="p-6">
                  <div
                    className={`inline-flex p-3 rounded-xl ${calc.bgColor} mb-4`}
                  >
                    <calc.icon className={`h-6 w-6 ${calc.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                    {calc.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {calc.description}
                  </p>
                  <div className="flex items-center text-primary font-medium text-sm">
                    Jetzt berechnen
                    <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ============================================================= */}
      {/* 3. CTA SECTION                                                */}
      {/* ============================================================= */}
      <section className="container py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-primary/20 bg-primary/5 rounded-xl">
            <CardContent className="p-6 md:p-8 text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-3">
                Du brauchst persoenliche Hilfe?
              </h2>
              <p className="text-muted-foreground mb-6">
                Unsere KI-Rechtsberatung beantwortet deine individuellen Fragen
                zu Buergergeld, Widerspruch und mehr.
              </p>
              <Button
                size="lg"
                className="gradient-boxer text-white border-0 hover:opacity-90"
                asChild
              >
                <Link to="/chat">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Jetzt Frage stellen
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ============================================================= */}
      {/* 4. LEGAL DISCLAIMER                                           */}
      {/* ============================================================= */}
      <section className="container py-8 pb-16">
        <div className="max-w-3xl mx-auto">
          <Card className="border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/40 rounded-xl">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                    Rechtlicher Hinweis
                  </h3>
                  <p className="text-amber-800 dark:text-amber-200">
                    Die Rechner dienen zur ersten Orientierung. Alle Angaben
                    ohne Gewaehr. Rechtsverbindliche Auskuenfte erhaeltst du
                    nur von deinem Jobcenter oder einem Fachanwalt fuer
                    Sozialrecht.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
