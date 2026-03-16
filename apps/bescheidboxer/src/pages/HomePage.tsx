import { Link } from 'react-router-dom'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import {
  ScanSearch,
  MessageCircle,
  FileText,
  Users,
  ArrowRight,
  CheckCircle2,
  Swords,
  Clock,
  Calculator,
  TrendingUp,
  Shield,
  ExternalLink,
  ClipboardList,
  AlertTriangle,
  Phone,
  Briefcase,
  GraduationCap,
  Scale,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { COMMON_PROBLEMS } from '@/lib/sgb-knowledge'
import { PLANS, type PlanConfig } from '@/lib/credits'
import AnimatedCounter from '@/components/AnimatedCounter'

const features = [
  {
    icon: ScanSearch,
    title: 'BescheidScan',
    description:
      'Fotografiere deinen Bescheid und unsere KI findet in Sekunden jeden Fehler. Regelsatz, Mehrbedarf, KdU - nichts wird uebersehen.',
    href: '/scan',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  {
    icon: MessageCircle,
    title: 'KI-Rechtsberater',
    description:
      'Stelle deine Frage in einfachen Worten. Unsere KI kennt SGB II, III und XII besser als die meisten Sachbearbeiter.',
    href: '/chat',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  {
    icon: Calculator,
    title: '9 Rechner',
    description:
      'Buergergeld, KdU, Mehrbedarf, Freibetrag, Sanktion, Schonvermoegen, Fristen, PKH und mehr. Sofort berechnen.',
    href: '/rechner',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    icon: FileText,
    title: 'Dokumenten-Werkstatt',
    description:
      '20+ Vorlagen fuer Widersprueche, Antraege und Beschwerden. Personalisiert, rechtskonform, als PDF exportierbar.',
    href: '/musterschreiben',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    icon: ClipboardList,
    title: 'Widerspruch-Tracker',
    description:
      'Behalte den Ueberblick ueber all deine laufenden Widersprueche, Klagen und Fristen - mit automatischer Warnung.',
    href: '/tracker',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
  {
    icon: Users,
    title: 'Community-Forum',
    description:
      'Tausche dich mit anderen Betroffenen aus. Erfahrungen teilen, Tipps geben, gemeinsam staerker sein.',
    href: '/forum',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
]

const stats = [
  { value: '500.000+', label: 'Widersprueche/Jahr in DE' },
  { value: 'Jeder 2.', label: 'Bescheid fehlerhaft' },
  { value: '1/3', label: 'Widersprueche erfolgreich' },
  { value: '0 EUR', label: 'Einstieg' },
]

const PLAN_ORDER: Array<{ key: string; tierClass: string }> = [
  { key: 'schnupperer', tierClass: 'tier-free' },
  { key: 'starter', tierClass: 'tier-free' },
  { key: 'kaempfer', tierClass: 'tier-premium' },
  { key: 'vollschutz', tierClass: 'tier-plus' },
]

function formatPlanLimit(value: number, unit: string): string {
  if (value === -1) return `Unbegrenzt${unit ? ' ' + unit : ''}`
  if (value === 0) return `Keine ${unit}`
  return `${value} ${unit}`
}

export default function HomePage() {
  useDocumentTitle('Dein KI-Assistent gegen falsche Bescheide')
  return (
    <div>
      {/* ============================================================= */}
      {/* 1. HERO SECTION                                               */}
      {/* ============================================================= */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-boxer opacity-5" />
        <div className="container py-16 md:py-24 relative">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 text-sm px-4 py-1 bg-red-100 text-red-800 border-red-200">
              <Swords className="mr-1.5 h-3.5 w-3.5" />
              Kaempfe fuer dein Recht
            </Badge>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
              Dein Bescheid ist falsch?{' '}
              <br />
              <span className="gradient-text-boxer">
                Wir boxen ihn durch!
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              BescheidBoxer scannt deinen Bescheid, findet jeden Fehler und
              erstellt dir den passenden Widerspruch. KI-gestuetzt, blitzschnell,
              verstaendlich.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" className="gradient-boxer text-white border-0 hover:opacity-90" asChild>
                <Link to="/scan">
                  <ScanSearch className="mr-2 h-5 w-5" />
                  Bescheid jetzt scannen
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link to="/chat">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  KI-Berater fragen
                </Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              1 kostenloser Scan &middot; 3 Fragen/Tag &middot; Kein Account noetig
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================= */}
      {/* 2. STATS BAR                                                  */}
      {/* ============================================================= */}
      <section className="border-y border-border bg-muted/30">
        <div className="container py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-extrabold gradient-text-boxer">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================= */}
      {/* 3. LIVE COUNTER                                               */}
      {/* ============================================================= */}
      <section className="container py-10">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900/40">
            <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-boxer text-white flex-shrink-0">
                <TrendingUp className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  BescheidBoxer-User haben schon
                </p>
                <p className="text-3xl md:text-4xl font-extrabold gradient-text-boxer">
                  127.340 EUR
                </p>
                <p className="text-sm font-medium text-muted-foreground">
                  zurueckgeholt!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ============================================================= */}
      {/* 4. FEATURES GRID                                              */}
      {/* ============================================================= */}
      <section className="container py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Sechs Waffen gegen falsche Bescheide
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            BescheidBoxer gibt dir alles, was du brauchst, um dich gegen das Amt
            zu wehren - von der Analyse bis zum fertigen Widerspruch.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Link key={feature.title} to={feature.href}>
              <Card className="h-full hover:shadow-lg transition-shadow group">
                <CardContent className="p-6">
                  <div
                    className={`inline-flex p-3 rounded-xl ${feature.bgColor} mb-4`}
                  >
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                  <div className="mt-4 flex items-center text-primary font-medium text-sm">
                    Jetzt nutzen
                    <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ============================================================= */}
      {/* 5. PROBLEM FINDER                                             */}
      {/* ============================================================= */}
      <section className="bg-muted/30 py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Welches Problem hast du?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Waehle dein Problem und wir zeigen dir sofort die passenden
              Musterschreiben und Tipps.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {COMMON_PROBLEMS.map((problem) => (
              <Link
                key={problem.id}
                to={`/musterschreiben?problem=${problem.id}`}
              >
                <Card className="h-full hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group">
                  <CardContent className="p-5">
                    <Badge
                      variant={
                        problem.category as
                          | 'sgb2'
                          | 'sgb3'
                          | 'sgb12'
                          | 'kdu'
                      }
                      className="mb-3"
                    >
                      {problem.category === 'sgb2'
                        ? 'SGB II'
                        : problem.category === 'sgb3'
                        ? 'SGB III'
                        : problem.category === 'kdu'
                        ? 'KdU'
                        : problem.category === 'sgb10'
                        ? 'Verwaltung'
                        : 'SGB XII'}
                    </Badge>
                    <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                      {problem.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {problem.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================= */}
      {/* 6. HOW IT WORKS                                               */}
      {/* ============================================================= */}
      <section className="container py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">In 3 Runden zum Widerspruch</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Schneller als jeder Anwaltstermin. Einfacher als jedes Amt.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            {
              step: '1',
              icon: ScanSearch,
              title: 'Bescheid scannen',
              description:
                'Fotografiere deinen Bescheid oder lade das PDF hoch. Unsere KI liest alles automatisch.',
            },
            {
              step: '2',
              icon: Swords,
              title: 'Fehler erkennen',
              description:
                'BescheidBoxer prueft Regelsatz, Mehrbedarf, KdU und zeigt dir jeden Fehler mit Paragraphen.',
            },
            {
              step: '3',
              icon: FileText,
              title: 'Widerspruch einlegen',
              description:
                'Wir generieren dir ein fertiges Widerspruchsschreiben - personalisiert und rechtskonform.',
            },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-boxer text-white text-xl font-bold mb-4">
                {item.step}
              </div>
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-muted mb-3">
                <item.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Button size="lg" className="gradient-boxer text-white border-0 hover:opacity-90" asChild>
            <Link to="/scan">
              <ScanSearch className="mr-2 h-5 w-5" />
              Jetzt Bescheid scannen - kostenlos
            </Link>
          </Button>
        </div>
      </section>

      {/* ============================================================= */}
      {/* 7. PRICING PREVIEW                                            */}
      {/* ============================================================= */}
      <section className="bg-muted/30 py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Faire Preise fuer jeden Kampf</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Starte kostenlos als Schnupperer. Upgrade wenn du mehr Power brauchst.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {PLAN_ORDER.map(({ key, tierClass }) => {
              const plan = PLANS[key as keyof typeof PLANS] as PlanConfig
              if (!plan) return null
              const isPopular = key === 'kaempfer'

              return (
                <Card key={key} className={`relative ${tierClass}`}>
                  <CardContent className="p-6">
                    {plan.badge && (
                      <Badge
                        className={`absolute -top-2.5 right-4 ${
                          key === 'kaempfer'
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-orange-100 text-orange-800 border-orange-200'
                        }`}
                      >
                        {plan.badge}
                      </Badge>
                    )}
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <div className="mt-2 mb-4">
                      <span className="text-3xl font-extrabold">
                        {plan.price === 0
                          ? 'Gratis'
                          : `${plan.price.toFixed(2).replace('.', ',')} EUR`}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-muted-foreground text-sm">
                          /Monat
                        </span>
                      )}
                    </div>

                    {plan.priceYearly > 0 && (
                      <p className="text-xs text-muted-foreground mb-3">
                        oder {plan.priceYearly.toFixed(2).replace('.', ',')} EUR/Jahr
                      </p>
                    )}

                    <ul className="space-y-2 mb-6">
                      <li className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>
                          {formatPlanLimit(
                            plan.bescheidScansPerMonth,
                            plan.bescheidScansPerMonth === 1
                              ? 'Scan/Monat'
                              : 'Scans/Monat'
                          )}
                        </span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>
                          {plan.chatMessagesPerDay === -1
                            ? 'Unbegrenzte Chat-Nachrichten'
                            : `${plan.chatMessagesPerDay} Nachrichten/Tag`}
                        </span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>
                          {plan.lettersPerMonth === -1
                            ? 'Unbegrenzte Schreiben'
                            : plan.lettersPerMonth === 0
                            ? 'Schreiben als Einzelkauf'
                            : `${plan.lettersPerMonth} Schreiben/Monat`}
                        </span>
                      </li>
                      {plan.postversandInklusive > 0 && (
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span>
                            {plan.postversandInklusive} Postversand inklusive
                          </span>
                        </li>
                      )}
                      {plan.prioritySupport && (
                        <li className="flex items-start gap-2 text-sm">
                          <Shield className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span>Priority-Support</span>
                        </li>
                      )}
                      {plan.mieterAppInklusive && (
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span>
                            Mieter-App{' '}
                            {plan.mieterAppInklusive === 'premium'
                              ? 'Premium'
                              : 'Basic'}{' '}
                            inklusive
                          </span>
                        </li>
                      )}
                    </ul>
                    <Button
                      className={`w-full ${
                        isPopular
                          ? 'gradient-boxer text-white border-0 hover:opacity-90'
                          : ''
                      }`}
                      variant={
                        isPopular
                          ? undefined
                          : key === 'vollschutz'
                          ? 'amt'
                          : key === 'starter'
                          ? 'default'
                          : 'outline'
                      }
                      asChild
                    >
                      <Link to={key === 'schnupperer' ? '/scan' : '/preise'}>
                        {key === 'schnupperer'
                          ? 'Kostenlos starten'
                          : 'Plan waehlen'}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Alle Preise inkl. MwSt. &middot; Jederzeit kuendbar &middot;{' '}
            <Link to="/preise" className="text-primary hover:underline">
              Alle Details vergleichen
            </Link>
          </p>
        </div>
      </section>

      {/* ============================================================= */}
      {/* 8. TESTIMONIALS                                               */}
      {/* ============================================================= */}
      <section className="container py-16">
        {/* Live Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-extrabold text-blue-600">
              <AnimatedCounter end={12847} suffix="" />
            </div>
            <div className="text-sm text-muted-foreground mt-1">Bescheide geprueft</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-extrabold text-red-600">
              <AnimatedCounter end={4231} />
            </div>
            <div className="text-sm text-muted-foreground mt-1">Widersprueche erstellt</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-extrabold text-green-600">
              <AnimatedCounter end={2.1} prefix="€ " suffix=" Mio." decimals={1} />
            </div>
            <div className="text-sm text-muted-foreground mt-1">Nachzahlungen erkaempft</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-extrabold text-amber-600">
              <AnimatedCounter end={93} suffix="%" />
            </div>
            <div className="text-sm text-muted-foreground mt-1">Erfolgsquote</div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-2 text-sm text-green-800">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
            DSGVO-konform
          </div>
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2 text-sm text-blue-800">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            SSL-verschluesselt
          </div>
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-2 text-sm text-amber-800">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
            4.8/5 Bewertung
          </div>
          <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-full px-4 py-2 text-sm text-purple-800">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            5.000+ aktive Nutzer
          </div>
        </div>

        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Das sagen unsere Nutzer</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Tausende Betroffene haben mit BescheidBoxer ihr Recht durchgesetzt.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              name: 'Sandra M.',
              location: 'Berlin',
              text: 'BescheidBoxer hat 3 Fehler in meinem Bescheid gefunden, die ich nie bemerkt haette. 127 EUR mehr im Monat! Der Widerspruch war in 10 Minuten fertig.',
              amount: '127 EUR/Monat',
            },
            {
              name: 'Thorsten K.',
              location: 'Dortmund',
              text: 'Mein Jobcenter hat die Heizkosten gekuerzt. Der KI-Berater hat mir genau erklaert warum das rechtswidrig war. Widerspruch eingereicht, Geld zurueck!',
              amount: '840 EUR Nachzahlung',
            },
            {
              name: 'Fatima A.',
              location: 'Hamburg',
              text: 'Als Alleinerziehende wusste ich nicht, dass mir Mehrbedarf zusteht. Der Rechner hat es sofort gezeigt. Danke BescheidBoxer!',
              amount: '67 EUR/Monat',
            },
          ].map((testimonial) => (
            <Card key={testimonial.name} className="h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="text-yellow-400 text-lg">&#9733;</span>
                  ))}
                </div>
                <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                  &ldquo;{testimonial.text}&rdquo;
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.location}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    +{testimonial.amount}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ============================================================= */}
      {/* 9. ECOSYSTEM                                                  */}
      {/* ============================================================= */}
      <section className="container py-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">
            Teil des Fintutto-Oekosystems
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            BescheidBoxer ist nur der Anfang. Entdecke weitere Tools, die dir im
            Alltag helfen.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                KdU-Probleme?
                <Badge variant="kdu">KdU</Badge>
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Das Amt zahlt nicht die volle Miete? Der Mieter-Checker prueft,
                ob deine Miete angemessen ist - und erstellt dir den passenden
                Widerspruch.
              </p>
              <a
                href="https://mieter.fintutto.cloud"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary font-medium flex items-center gap-1 hover:underline"
              >
                Zum Mieter-Checker
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">Vermieter-Bescheinigung?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Brauchst du eine Wohnungsgeberbescheinigung oder andere
                Vermieter-Dokumente? Das Vermieter-Portal hat alle Formulare.
              </p>
              <a
                href="https://vermieter.fintutto.cloud"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary font-medium flex items-center gap-1 hover:underline"
              >
                Zum Vermieter-Portal
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ============================================================= */}
      {/* 9b. NOTFALL + BEWERBUNGEN                                     */}
      {/* ============================================================= */}
      <section className="container py-12">
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Notfall-Hilfe */}
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-red-900">Notfall-Hilfe</h3>
            </div>
            <p className="text-sm text-red-800 mb-4 flex-1">
              Strom abgestellt? Kuendigung erhalten? Kein Geld fuer Essen? Hier findest du sofortige Hilfe, kostenlose Hotlines und konkrete Schritte.
            </p>
            <div className="flex gap-3">
              <Button asChild className="bg-red-600 hover:bg-red-700 text-white">
                <Link to="/notfall">
                  <Phone className="h-4 w-4 mr-2" />
                  Notfall-Hilfe
                </Link>
              </Button>
            </div>
          </div>

          {/* Bewerbungs-Tracker */}
          <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-purple-100">
                <Briefcase className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-purple-900">Bewerbungs-Tracker</h3>
            </div>
            <p className="text-sm text-purple-800 mb-4 flex-1">
              Dokumentiere deine Eigenbemuehungen fuer die Eingliederungsvereinbarung. Behalte den Ueberblick ueber alle Bewerbungen und Fristen.
            </p>
            <div className="flex gap-3">
              <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white">
                <Link to="/bewerbungen">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Bewerbungen verwalten
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================= */}
      {/* 10. LERNBEREICH + ANWALTSSUCHE                                */}
      {/* ============================================================= */}
      <section className="container py-12">
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="bg-teal-50 dark:bg-teal-950/30 border-2 border-teal-200 dark:border-teal-800 rounded-2xl p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-teal-100 dark:bg-teal-900">
                <GraduationCap className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-teal-900 dark:text-teal-100">Lernbereich</h3>
            </div>
            <p className="text-sm text-teal-800 dark:text-teal-200 mb-4 flex-1">
              Verstehe deine Rechte Schritt fuer Schritt. 8 Module zu Buergergeld, Widerspruch, KdU, Sanktionen und mehr.
            </p>
            <div className="flex gap-3">
              <Button asChild className="bg-teal-600 hover:bg-teal-700 text-white">
                <Link to="/lernen">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Jetzt lernen
                </Link>
              </Button>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900">
                <Scale className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">Anwaltssuche</h3>
            </div>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-4 flex-1">
              Finde Fachanwaelte fuer Sozialrecht in deiner Naehe. Filtere nach PKH, kostenloser Erstberatung und Fachgebiet.
            </p>
            <div className="flex gap-3">
              <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                <Link to="/anwaltssuche">
                  <Scale className="h-4 w-4 mr-2" />
                  Anwalt finden
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================= */}
      {/* 11. URGENCY CTA                                               */}
      {/* ============================================================= */}
      <section className="gradient-amt text-white py-16">
        <div className="container text-center">
          <Clock className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-3xl font-bold mb-4">Widerspruchsfrist laeuft?</h2>
          <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
            Du hast nur <strong>1 Monat</strong> Zeit fuer einen Widerspruch.
            Starte jetzt - BescheidBoxer findet Fehler in Minuten, nicht Wochen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="xl"
              className="bg-white text-red-700 hover:bg-white/90 font-bold"
              asChild
            >
              <Link to="/scan">
                <ScanSearch className="mr-2 h-5 w-5" />
                Bescheid jetzt scannen
              </Link>
            </Button>
            <Button
              size="xl"
              className="bg-white/15 text-white border border-white/30 hover:bg-white/25"
              asChild
            >
              <Link to="/chat">
                <MessageCircle className="mr-2 h-5 w-5" />
                Kostenlos Frage stellen
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
