import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Trophy,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Clock,
  MapPin,
  Quote,
  Heart,
  ArrowRight,
  ScanSearch,
  MessageCircle,
  FileText,
  Calculator,
  Scale,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Breadcrumbs from '@/components/Breadcrumbs'
import useDocumentTitle from '@/hooks/useDocumentTitle'

type ProblemTyp =
  | 'kdu'
  | 'sanktion'
  | 'mehrbedarf'
  | 'regelsatz'
  | 'erstausstattung'
  | 'heizkosten'
  | 'bewilligungszeitraum'
  | 'anrechnung'

interface Erfolgsgeschichte {
  id: string
  name: string
  stadt: string
  problemTyp: ProblemTyp
  titel: string
  kurzfassung: string
  details: string
  betragZurueck: number
  werkzeugGenutzt: string[]
  datum: string
  dauer: string
  zitat: string
}

const PROBLEM_TYP_CONFIG: Record<ProblemTyp, { label: string; color: string; bg: string }> = {
  kdu: {
    label: 'Kosten der Unterkunft',
    color: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-100 dark:bg-blue-900/40',
  },
  sanktion: {
    label: 'Sanktion',
    color: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-100 dark:bg-red-900/40',
  },
  mehrbedarf: {
    label: 'Mehrbedarf',
    color: 'text-purple-700 dark:text-purple-300',
    bg: 'bg-purple-100 dark:bg-purple-900/40',
  },
  regelsatz: {
    label: 'Regelsatz',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-100 dark:bg-amber-900/40',
  },
  erstausstattung: {
    label: 'Erstausstattung',
    color: 'text-pink-700 dark:text-pink-300',
    bg: 'bg-pink-100 dark:bg-pink-900/40',
  },
  heizkosten: {
    label: 'Heizkosten',
    color: 'text-orange-700 dark:text-orange-300',
    bg: 'bg-orange-100 dark:bg-orange-900/40',
  },
  bewilligungszeitraum: {
    label: 'Bewilligungszeitraum',
    color: 'text-teal-700 dark:text-teal-300',
    bg: 'bg-teal-100 dark:bg-teal-900/40',
  },
  anrechnung: {
    label: 'Einkommensanrechnung',
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-100 dark:bg-emerald-900/40',
  },
}

const geschichten: Erfolgsgeschichte[] = [
  {
    id: 'petra-kdu',
    name: 'Petra M.',
    stadt: 'Dortmund',
    problemTyp: 'kdu',
    titel: 'Miete zu hoch? Jobcenter muss volle KdU zahlen',
    kurzfassung:
      'Petra sollte innerhalb von 6 Monaten umziehen, weil ihre Miete angeblich zu hoch war. Mit dem BescheidScan fand sie heraus, dass das Jobcenter veraltete Mietobergrenzen verwendete.',
    details:
      'Petra lebte seit 8 Jahren in ihrer 60-qm-Wohnung in Dortmund und zahlte 520 EUR Warmmiete. Das Jobcenter bewilligte nur 430 EUR und forderte sie auf, die Kosten zu senken. Der BescheidScan zeigte sofort: Das Jobcenter verwendete ein schluessiges Konzept von 2021, obwohl die Stadt die Werte 2024 aktualisiert hatte. Mit Hilfe des KI-Beraters formulierte Petra einen Widerspruch mit Verweis auf das aktuelle Konzept und die BSG-Rechtsprechung. Nach nur 3 Wochen lenkte das Jobcenter ein und uebernahm die volle Miete rueckwirkend. Petra erhielt 540 EUR Nachzahlung fuer die Monate, in denen sie die Differenz selbst getragen hatte.',
    betragZurueck: 540,
    werkzeugGenutzt: ['BescheidScan', 'KI-Berater', 'Briefgenerator'],
    datum: '2025-01',
    dauer: '3 Wochen',
    zitat:
      'Ich haette fast meine Wohnung verloren. Ohne den BescheidScan haette ich nie gemerkt, dass das Jobcenter mit veralteten Zahlen rechnet.',
  },
  {
    id: 'marcus-sanktion',
    name: 'Marcus T.',
    stadt: 'Berlin',
    problemTyp: 'sanktion',
    titel: 'Sanktion von 30% aufgehoben - Termin war nicht zumutbar',
    kurzfassung:
      'Marcus wurde mit 30% sanktioniert, weil er einen Vorstellungstermin nicht wahrgenommen hatte. Der KI-Berater half ihm nachzuweisen, dass der Termin nicht zumutbar war.',
    details:
      'Marcus erhielt eine Einladung zu einem Vorstellungsgespraech mit nur 2 Tagen Vorlauf. Der Termin lag 45 km entfernt, und Marcus hatte am selben Tag einen aertztlichen Termin, den er seit 3 Monaten wartete. Er informierte das Jobcenter vorab per E-Mail, wurde aber trotzdem mit 30% sanktioniert. Ueber den KI-Berater erfuhr Marcus, dass das Jobcenter einen wichtigen Grund nach § 31 Abs. 1 SGB II haette pruefen muessen. Der Briefgenerator erstellte einen Widerspruch mit Verweis auf den aerztlichen Nachweis und die kurze Vorlauffrist. Die Sanktion wurde vollstaendig aufgehoben, und Marcus bekam 169 EUR zurueck.',
    betragZurueck: 169,
    werkzeugGenutzt: ['KI-Berater', 'Briefgenerator', 'Sanktionsrechner'],
    datum: '2024-11',
    dauer: '5 Wochen',
    zitat:
      'Ich dachte, gegen das Jobcenter hat man sowieso keine Chance. Aber die KI hat mir genau gesagt, welche Paragraphen fuer mich sprechen.',
  },
  {
    id: 'ayse-mehrbedarf',
    name: 'Ayse K.',
    stadt: 'Hamburg',
    problemTyp: 'mehrbedarf',
    titel: 'Mehrbedarf Schwangerschaft endlich bewilligt',
    kurzfassung:
      'Ayse beantragte den Mehrbedarf fuer Schwangerschaft ab der 13. Woche. Das Jobcenter lehnte ab, weil angeblich ein Attest fehlte. Der BescheidScan deckte den Fehler auf.',
    details:
      'Ayse war in der 16. Schwangerschaftswoche und hatte den Mutterpass beim Jobcenter vorgelegt. Trotzdem wurde ihr Antrag auf Mehrbedarf nach § 21 Abs. 2 SGB II abgelehnt mit der Begruendung, es fehle ein aerztliches Attest. Der BescheidScan erkannte sofort: Ein Mutterpass genuegt als Nachweis, ein separates Attest ist nach BSG-Rechtsprechung nicht erforderlich. Ayse legte mit dem Briefgenerator Widerspruch ein und verwies auf das BSG-Urteil. Innerhalb von 2 Wochen wurde der Mehrbedarf rueckwirkend ab der 13. Woche bewilligt. Sie erhielt 96 EUR pro Monat zusaetzlich - insgesamt 384 EUR Nachzahlung fuer 4 Monate.',
    betragZurueck: 384,
    werkzeugGenutzt: ['BescheidScan', 'Briefgenerator', 'Mehrbedarfrechner'],
    datum: '2025-02',
    dauer: '2 Wochen',
    zitat:
      'In der Schwangerschaft hat man genug Sorgen. Dass der BescheidBoxer mir so schnell geholfen hat, war eine riesige Erleichterung.',
  },
  {
    id: 'thomas-regelsatz',
    name: 'Thomas W.',
    stadt: 'Leipzig',
    problemTyp: 'regelsatz',
    titel: 'Falsche Regelbedarfsstufe - 127 EUR pro Monat mehr',
    kurzfassung:
      'Thomas lebte allein, wurde aber in Regelbedarfsstufe 2 (Paare) eingestuft. Der BescheidScan fand den Fehler, den er selbst ueber ein Jahr uebersehen hatte.',
    details:
      'Thomas war seit seiner Scheidung alleinstehend und lebte allein in seiner Wohnung. Das Jobcenter hatte ihn aber weiterhin in Regelbedarfsstufe 2 eingestuft, was dem Satz fuer Paare entspricht. Statt 563 EUR (Stufe 1) erhielt er nur 506 EUR monatlich. Als Thomas seinen Bescheid mit dem BescheidScan pruefte, wurde der Fehler sofort markiert. Mit dem Briefgenerator forderte er eine Ueberpruefung nach § 44 SGB X an - denn der Fehler bestand bereits seit 14 Monaten. Das Jobcenter korrigierte den Bescheid und zahlte 1.524 EUR Nachzahlung aus. Ab sofort erhaelt Thomas monatlich 57 EUR mehr.',
    betragZurueck: 1524,
    werkzeugGenutzt: ['BescheidScan', 'Briefgenerator', 'Buergergeldrechner'],
    datum: '2024-12',
    dauer: '4 Wochen',
    zitat:
      'Ich habe ueber ein Jahr zu wenig Geld bekommen und es nicht gemerkt. Der BescheidScan hat den Fehler in 30 Sekunden gefunden.',
  },
  {
    id: 'sandra-erstausstattung',
    name: 'Sandra L.',
    stadt: 'Koeln',
    problemTyp: 'erstausstattung',
    titel: 'Baby-Erstausstattung doch bewilligt - 890 EUR fuer den Start',
    kurzfassung:
      'Sandras Antrag auf Erstausstattung fuer ihr erstes Kind wurde abgelehnt, weil sie angeblich schon Ausstattung habe. Der Widerspruch war erfolgreich.',
    details:
      'Sandra erwartete ihr erstes Kind und beantragte eine Erstausstattung nach § 24 Abs. 3 SGB II. Das Jobcenter lehnte ab mit der Begruendung, sie koenne gebrauchte Sachen nutzen. Sandra wusste nicht, dass dies kein zulaessiger Ablehnungsgrund ist. Der KI-Berater erklaerte ihr, dass bei einem ersten Kind ein Anspruch auf Erstausstattung besteht und das Jobcenter nicht auf gebrauchte Waren verweisen darf. Mit dem Briefgenerator erstellte sie einen ausfuehrlichen Widerspruch. Nach Pruefung bewilligte das Jobcenter die Erstausstattung in Hoehe von 890 EUR, aufgeteilt in Bekleidungspauschale und Sachleistungen fuer Kinderwagen, Bett und Zubehoer.',
    betragZurueck: 890,
    werkzeugGenutzt: ['KI-Berater', 'Briefgenerator', 'Erstausstattungsrechner'],
    datum: '2025-01',
    dauer: '6 Wochen',
    zitat:
      'Als werdende Mama hat man so viele Aengste. Dass das Jobcenter meinen Antrag einfach so abgelehnt hat, war ein Schock. Umso schoener, dass es doch geklappt hat!',
  },
  {
    id: 'harald-heizkosten',
    name: 'Harald B.',
    stadt: 'Dresden',
    problemTyp: 'heizkosten',
    titel: 'Heizkosten gedeckelt - Jobcenter muss volle Kosten tragen',
    kurzfassung:
      'Haralds Heizkosten wurden auf einen Pauschalbetrag gekappt, obwohl er in einem schlecht isolierten Altbau wohnte. Nach dem Widerspruch uebernahm das Jobcenter die tatsaechlichen Kosten.',
    details:
      'Harald bewohnte eine Altbauwohnung in Dresden mit Einzeloefen und schlechter Daemmung. Seine Heizkosten lagen bei 95 EUR monatlich, das Jobcenter bewilligte aber nur 65 EUR. Der BescheidScan identifizierte das Problem sofort: Nach BSG-Rechtsprechung muss das Jobcenter die tatsaechlichen Heizkosten uebernehmen, sofern kein unwirtschaftliches Heizverhalten vorliegt. Ein pauschaler Richtwert ist unzulaessig. Harald legte mit Hilfe des Briefgenerators Widerspruch ein und fuehrte den schlechten energetischen Zustand der Wohnung an. Das Jobcenter uebernahm daraufhin die vollen 95 EUR rueckwirkend. Die Nachzahlung fuer 5 Monate betrug 150 EUR.',
    betragZurueck: 150,
    werkzeugGenutzt: ['BescheidScan', 'Briefgenerator', 'KdU-Rechner'],
    datum: '2024-10',
    dauer: '4 Wochen',
    zitat:
      'Im Winter mit zu wenig Heizgeld - das ist nicht nur unangenehm, sondern gesundheitsgefaehrdend. Gut, dass ich den Widerspruch gewagt habe.',
  },
  {
    id: 'elena-anrechnung',
    name: 'Elena S.',
    stadt: 'Muenchen',
    problemTyp: 'anrechnung',
    titel: 'Freibetrag falsch berechnet - 186 EUR monatlich mehr',
    kurzfassung:
      'Elenas Minijob-Einkommen wurde komplett angerechnet. Dabei hatte das Jobcenter den Grundfreibetrag von 100 EUR und die weiteren Freibetraege vergessen.',
    details:
      'Elena arbeitete in einem Minijob fuer 520 EUR monatlich. Das Jobcenter rechnete den vollen Betrag auf ihr Buergergeld an und zahlte entsprechend weniger aus. Der BescheidScan deckte den Fehler auf: Nach § 11b SGB II stehen Elena ein Grundfreibetrag von 100 EUR sowie 20% des Einkommens zwischen 100 und 520 EUR zu. Das sind 100 EUR plus 84 EUR, also 184 EUR Freibetrag. Elena hatte also Anspruch auf 184 EUR mehr pro Monat. Mit dem Freibetragsrechner berechnete sie die genaue Summe, und der Briefgenerator erstellte einen Ueberpruefungsantrag nach § 44 SGB X. Das Jobcenter korrigierte den Fehler rueckwirkend fuer 6 Monate: 1.104 EUR Nachzahlung.',
    betragZurueck: 1104,
    werkzeugGenutzt: ['BescheidScan', 'Freibetragsrechner', 'Briefgenerator'],
    datum: '2025-03',
    dauer: '3 Wochen',
    zitat:
      'Ich habe gearbeitet und trotzdem weniger Geld gehabt als mir zusteht. Ohne den BescheidBoxer haette ich nie erfahren, was ein Freibetrag ist.',
  },
  {
    id: 'karsten-kdu-senkung',
    name: 'Karsten D.',
    stadt: 'Essen',
    problemTyp: 'kdu',
    titel: 'Kostensenkungsaufforderung abgewehrt - Wohnung behalten',
    kurzfassung:
      'Karsten erhielt eine Kostensenkungsaufforderung und sollte innerhalb von 6 Monaten umziehen. Er konnte nachweisen, dass keine guenstigere Wohnung verfuegbar war.',
    details:
      'Das Jobcenter forderte Karsten auf, seine Mietkosten um 80 EUR zu senken, da seine Wohnung unangemessen teuer sei. Als Alternative solle er umziehen. Karsten nutzte den KI-Berater, um seine Rechte zu verstehen. Die KI erklaerte: Nach der Rechtsprechung des BSG muss das Jobcenter nachweisen, dass angemessener Wohnraum tatsaechlich verfuegbar ist. Karsten dokumentierte mit Screenshots von Immobilienportalen, dass in seinem Stadtteil keine guenstigere vergleichbare Wohnung zu finden war. Den Widerspruch formulierte der Briefgenerator inklusive der Argumentation zur Verfuegbarkeit. Das Jobcenter nahm die Kostensenkungsaufforderung zurueck und bewilligte die volle Miete fuer weitere 12 Monate.',
    betragZurueck: 960,
    werkzeugGenutzt: ['KI-Berater', 'Briefgenerator', 'KdU-Rechner'],
    datum: '2024-09',
    dauer: '8 Wochen',
    zitat:
      'Der Gedanke, meine Wohnung verlassen zu muessen, hat mich krank gemacht. Jetzt kann ich bleiben. Danke, BescheidBoxer!',
  },
  {
    id: 'monika-pkh',
    name: 'Monika R.',
    stadt: 'Nuernberg',
    problemTyp: 'bewilligungszeitraum',
    titel: 'PKH bewilligt - erfolgreiche Klage am Sozialgericht',
    kurzfassung:
      'Monikas Widerspruch wurde abgelehnt. Mit Prozesskostenhilfe klagte sie vor dem Sozialgericht und gewann. Ihr Bewilligungszeitraum wurde rueckwirkend korrigiert.',
    details:
      'Monikas Bewilligungszeitraum war fuer 6 Monate festgelegt, aber das Jobcenter hatte den Bedarf falsch berechnet: Ein Umzug innerhalb des Zeitraums wurde nicht beruecksichtigt, und die neuen, hoeheren Mietkosten wurden erst ab dem Folgezeitraum anerkannt. Ihr Widerspruch wurde abgelehnt. Der KI-Berater riet zur Klage und erklaerte die Voraussetzungen fuer Prozesskostenhilfe. Mit dem PKH-Rechner stellte Monika fest, dass sie Anspruch auf volle PKH hatte. Der Briefgenerator erstellte den PKH-Antrag und die Klageschrift. Das Sozialgericht gab ihr Recht: Das Jobcenter musste die hoeheren Mietkosten ab dem Umzugsmonat zahlen. Die Nachzahlung betrug 720 EUR fuer 4 Monate.',
    betragZurueck: 720,
    werkzeugGenutzt: ['KI-Berater', 'PKH-Rechner', 'Briefgenerator'],
    datum: '2024-08',
    dauer: '4 Monate',
    zitat:
      'Klage einreichen klingt so einschuechternd. Aber mit dem BescheidBoxer hatte ich alle Unterlagen zusammen und wusste genau, was auf mich zukommt.',
  },
  {
    id: 'frank-mehrfach',
    name: 'Frank G.',
    stadt: 'Stuttgart',
    problemTyp: 'regelsatz',
    titel: 'Gleich 3 Fehler im Bescheid - 2.340 EUR Nachzahlung',
    kurzfassung:
      'Der BescheidScan fand in Franks Bescheid drei verschiedene Fehler gleichzeitig: falsche Regelbedarfsstufe, fehlender Mehrbedarf und falsche Einkommensanrechnung.',
    details:
      'Frank hatte seinen Bescheid nie genau geprueft und vertraute dem Jobcenter. Als er den BescheidScan zum ersten Mal nutzte, wurde er blass: Drei Fehler auf einmal. Erstens war Frank alleinerziehend, aber der Mehrbedarf nach § 21 Abs. 3 SGB II fehlte komplett - das waren 203 EUR monatlich. Zweitens wurde sein Kindergeld doppelt angerechnet, einmal als Einkommen des Kindes und einmal bei ihm. Drittens fehlten die Versicherungspauschale von 30 EUR beim Freibetrag. Der KI-Berater half Frank, die drei Fehler systematisch aufzuarbeiten. Mit dem Briefgenerator erstellte er einen umfassenden Ueberpruefungsantrag nach § 44 SGB X. Das Jobcenter korrigierte alle drei Fehler rueckwirkend fuer 9 Monate. Die Nachzahlung betrug insgesamt 2.340 EUR.',
    betragZurueck: 2340,
    werkzeugGenutzt: ['BescheidScan', 'KI-Berater', 'Briefgenerator', 'Mehrbedarfrechner'],
    datum: '2025-04',
    dauer: '6 Wochen',
    zitat:
      'Drei Fehler! Ich konnte es nicht glauben. 2.340 EUR, die mir zustanden und die ich ohne den BescheidBoxer nie bekommen haette. Prueft eure Bescheide, Leute!',
  },
]

const gesamtBetrag = geschichten.reduce((sum, g) => sum + g.betragZurueck, 0)

const formatEuro = (betrag: number): string =>
  betrag.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })

export default function ErfolgsgeschichtenPage() {
  useDocumentTitle('Erfolgsgeschichten - BescheidBoxer')

  const [filter, setFilter] = useState<ProblemTyp | 'alle'>('alle')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const gefilterteGeschichten =
    filter === 'alle' ? geschichten : geschichten.filter((g) => g.problemTyp === filter)

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Erfolgsgeschichten' }]} className="mb-6" />

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <Trophy className="w-8 h-8 text-amber-500" />
            <h1 className="text-3xl sm:text-4xl font-bold gradient-text-boxer">
              Erfolgsgeschichten
            </h1>
            <Trophy className="w-8 h-8 text-amber-500" />
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Echte Menschen, echte Erfolge. Diese anonymisierten Geschichten zeigen, wie
            BescheidBoxer-Nutzer erfolgreich gegen fehlerhafte Bescheide vorgegangen sind.
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-1" />
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {formatEuro(gesamtBetrag)}
              </div>
              <div className="text-sm text-muted-foreground">zurueckgeholt</div>
            </CardContent>
          </Card>
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
            <CardContent className="p-4 text-center">
              <Shield className="w-6 h-6 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">100%</div>
              <div className="text-sm text-muted-foreground">Erfolgsquote dieser Geschichten</div>
            </CardContent>
          </Card>
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {geschichten.length}
              </div>
              <div className="text-sm text-muted-foreground">Erfolgsgeschichten</div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="mb-8">
          <p className="text-sm font-medium text-muted-foreground mb-3">Filtern nach Problemtyp:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('alle')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === 'alle'
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Alle ({geschichten.length})
            </button>
            {(Object.keys(PROBLEM_TYP_CONFIG) as ProblemTyp[]).map((typ) => {
              const count = geschichten.filter((g) => g.problemTyp === typ).length
              if (count === 0) return null
              const config = PROBLEM_TYP_CONFIG[typ]
              return (
                <button
                  key={typ}
                  onClick={() => setFilter(typ)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filter === typ
                      ? `${config.bg} ${config.color} ring-2 ring-current ring-offset-1 ring-offset-background`
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {config.label} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {/* Story cards */}
        <div className="space-y-4 mb-12">
          {gefilterteGeschichten.map((geschichte) => {
            const isExpanded = expandedId === geschichte.id
            const typConfig = PROBLEM_TYP_CONFIG[geschichte.problemTyp]

            return (
              <Card
                key={geschichte.id}
                className="overflow-hidden transition-shadow hover:shadow-md"
              >
                <CardContent className="p-0">
                  <button
                    onClick={() => toggleExpand(geschichte.id)}
                    className="w-full text-left p-5 sm:p-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Badges row */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge
                            variant="secondary"
                            className={`${typConfig.bg} ${typConfig.color} border-0`}
                          >
                            {typConfig.label}
                          </Badge>
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {geschichte.dauer}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {geschichte.stadt}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="font-semibold text-lg mb-1.5">{geschichte.titel}</h3>

                        {/* Summary */}
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {geschichte.kurzfassung}
                        </p>

                        {/* Tools + amount row */}
                        <div className="flex flex-wrap items-center gap-3 mt-3">
                          <span className="inline-flex items-center gap-1 text-base font-bold text-green-600 dark:text-green-400">
                            +{formatEuro(geschichte.betragZurueck)}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {geschichte.werkzeugGenutzt.map((werkzeug) => (
                              <Badge
                                key={werkzeug}
                                variant="outline"
                                className="text-xs py-0 px-1.5"
                              >
                                {werkzeug}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Expand indicator */}
                      <div className="flex items-center self-center sm:self-start sm:mt-1 text-muted-foreground">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-5 sm:px-6 pb-5 sm:pb-6 border-t pt-4 space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          Die ganze Geschichte
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {geschichte.details}
                        </p>
                      </div>

                      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                        <div className="flex gap-2">
                          <Quote className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm italic text-amber-900 dark:text-amber-200 leading-relaxed">
                              &bdquo;{geschichte.zitat}&ldquo;
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1.5 font-medium">
                              &mdash; {geschichte.name}, {geschichte.stadt}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span>
                          <strong>Betrag:</strong>{' '}
                          <span className="text-green-600 dark:text-green-400 font-semibold">
                            {formatEuro(geschichte.betragZurueck)}
                          </span>
                        </span>
                        <span>
                          <strong>Dauer:</strong> {geschichte.dauer}
                        </span>
                        <span>
                          <strong>Datum:</strong> {geschichte.datum}
                        </span>
                        <span>
                          <strong>Ort:</strong> {geschichte.stadt}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}

          {gefilterteGeschichten.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Scale className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>Keine Geschichten fuer diesen Filtertyp vorhanden.</p>
            </div>
          )}
        </div>

        {/* Motivation section */}
        <Card className="mb-8 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/20">
          <CardContent className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <Heart className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
              <h2 className="text-2xl font-bold mb-2">Du kannst das auch!</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Jeder dieser Menschen hat sich getraut, seinen Bescheid zu pruefen. Mit den
                richtigen Werkzeugen ist ein Widerspruch keine Raketenwissenschaft. Starte jetzt:
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Link to="/scan">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 bg-background/80 hover:bg-background"
                >
                  <ScanSearch className="w-4 h-4 text-red-600" />
                  BescheidScan
                </Button>
              </Link>
              <Link to="/chat">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 bg-background/80 hover:bg-background"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  KI-Berater
                </Button>
              </Link>
              <Link to="/generator">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 bg-background/80 hover:bg-background"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  Briefgenerator
                </Button>
              </Link>
              <Link to="/rechner">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 bg-background/80 hover:bg-background"
                >
                  <Calculator className="w-4 h-4 text-orange-600" />
                  Rechner
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* CTA section */}
        <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20">
          <CardContent className="p-6 sm:p-8 text-center">
            <Trophy className="w-8 h-8 text-amber-600 dark:text-amber-400 mx-auto mb-3" />
            <h2 className="text-2xl font-bold mb-2">Deine Erfolgsgeschichte teilen?</h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-5">
              Hast du mit BescheidBoxer erfolgreich einen Widerspruch durchgesetzt? Deine
              Geschichte kann anderen Mut machen! Alle Geschichten werden anonymisiert
              veroeffentlicht.
            </p>
            <Link to="/kontakt">
              <Button className="gradient-boxer gap-2">
                Geschichte teilen
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
