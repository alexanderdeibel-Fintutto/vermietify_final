import { Link } from 'react-router-dom'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import {
  LayoutDashboard,
  MessageCircle,
  FileText,
  Users,
  Clock,
  ArrowRight,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Swords,
  ScanSearch,
  Trophy,
  Target,
  ClipboardList,
  Calculator,
  Scale,
  Briefcase,
  Calendar,
  FolderOpen,
  FolderKanban,
  GraduationCap,
  Archive,
  Wallet,
  Bell,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PLANS } from '@/lib/credits'
import { useCreditsContext } from '@/contexts/CreditsContext'
import { loadRechnerVerlauf } from '@/lib/rechner-verlauf'
import Fortschritt from '@/components/Fortschritt'
import Zeitstrahl from '@/components/Zeitstrahl'
import {
  getLevelForPoints,
  getNextLevel,
  getProgressToNextLevel,
} from '@/lib/gamification'

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

const DEMO_POINTS = 350
const DEMO_MONEY_RECOVERED = 1847.52

const DEMO_DEADLINES = [
  {
    id: '1',
    title: 'Widerspruch Bewilligungsbescheid 01/2026',
    dueDate: '2026-02-10',
    daysLeft: 4,
    urgent: true,
  },
  {
    id: '2',
    title: 'Mitwirkungsaufforderung beantworten',
    dueDate: '2026-02-28',
    daysLeft: 22,
    urgent: false,
  },
]

const DEMO_SCANS = [
  {
    id: '1',
    title: 'Bewilligungsbescheid Feb 2026',
    date: '2026-02-04',
    errorsFound: 3,
    potentialRecovery: 127.5,
    status: 'fehler_gefunden' as const,
  },
  {
    id: '2',
    title: 'Aenderungsbescheid KdU Jan 2026',
    date: '2026-01-22',
    errorsFound: 1,
    potentialRecovery: 48.0,
    status: 'fehler_gefunden' as const,
  },
  {
    id: '3',
    title: 'Erstbescheid Dez 2025',
    date: '2025-12-15',
    errorsFound: 0,
    potentialRecovery: 0,
    status: 'korrekt' as const,
  },
]

const DEMO_LETTERS = [
  {
    id: '1',
    title: 'Widerspruch gegen Bewilligungsbescheid',
    date: '2026-02-05',
    type: 'widerspruch' as const,
    status: 'versendet' as const,
  },
  {
    id: '2',
    title: 'Antrag auf Uebernahme der Heizkosten-Nachforderung',
    date: '2026-01-20',
    type: 'antrag' as const,
    status: 'entwurf' as const,
  },
]

const DEMO_BADGES = [
  { id: 'erster_scan', name: 'Erster Scan', icon: '🔍' },
  { id: 'erster_widerspruch', name: 'Erster Widerspruch', icon: '✊' },
  { id: 'geld_zurueck', name: 'Geld zurueck!', icon: '💰' },
  { id: 'rechte_kenner', name: 'Rechte-Kenner', icon: '📚' },
]

const DEMO_COMMUNITY_STATS = {
  totalMembers: 3842,
  widerspruchSuccess: 68,
  moneyRecoveredTotal: 487320,
  activeThreads: 127,
}

const DEMO_TIPS = [
  {
    id: '1',
    text: 'Dein Bewilligungsbescheid hat 3 Fehler. Lege jetzt Widerspruch ein, bevor die Frist am 10.02. ablaeuft!',
    priority: 'high' as const,
    action: '/generator/widerspruch',
    actionLabel: 'Widerspruch erstellen',
  },
  {
    id: '2',
    text: 'Tipp: Pruefe, ob deine Heizkosten vollstaendig uebernommen werden. Viele Jobcenter kuerzen hier rechtswidrig.',
    priority: 'medium' as const,
    action: '/chat',
    actionLabel: 'KI-Chat fragen',
  },
  {
    id: '3',
    text: 'Du hast 4 Badges! Noch 1 Badge bis zum naechsten Punktebonus. Hilf im Forum, um den "Helfer"-Badge zu bekommen.',
    priority: 'low' as const,
    action: '/forum',
    actionLabel: 'Zum Forum',
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatEur(amount: number): string {
  return amount.toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function scanStatusBadge(status: 'fehler_gefunden' | 'korrekt') {
  if (status === 'fehler_gefunden') {
    return (
      <Badge variant="destructive" className="text-xs">
        Fehler gefunden
      </Badge>
    )
  }
  return (
    <Badge className="bg-green-600 hover:bg-green-700 text-xs">
      Korrekt
    </Badge>
  )
}

function letterStatusBadge(status: 'versendet' | 'entwurf') {
  if (status === 'versendet') {
    return (
      <Badge className="bg-green-600 hover:bg-green-700 text-xs">
        Versendet
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="text-xs">
      Entwurf
    </Badge>
  )
}

function tipPriorityStyles(priority: 'high' | 'medium' | 'low') {
  switch (priority) {
    case 'high':
      return 'border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/30'
    case 'medium':
      return 'border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/30'
    case 'low':
      return 'border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950/30'
  }
}

// ---------------------------------------------------------------------------
// Activity Statistics - reads real data from localStorage
// ---------------------------------------------------------------------------

function AktivitaetsStatistik() {
  const rechnerVerlauf = loadRechnerVerlauf()
  let chatCount = 0
  let trackerCount = 0
  try {
    const chat = localStorage.getItem('bescheidboxer_chat_history')
    if (chat) chatCount = JSON.parse(chat).length
  } catch { /* ignore */ }
  try {
    const tracker = localStorage.getItem('bescheidboxer_widersprueche')
    if (tracker) trackerCount = JSON.parse(tracker).length
  } catch { /* ignore */ }

  const totalActivity = rechnerVerlauf.length + chatCount + trackerCount
  if (totalActivity === 0) return null

  const stats = [
    { label: 'Chat-Nachrichten', value: chatCount, color: 'bg-blue-500', pct: chatCount },
    { label: 'Berechnungen', value: rechnerVerlauf.length, color: 'bg-green-500', pct: rechnerVerlauf.length },
    { label: 'Tracker-Eintraege', value: trackerCount, color: 'bg-purple-500', pct: trackerCount },
  ]
  const maxVal = Math.max(...stats.map(s => s.value), 1)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" />
            Deine Aktivitaet
          </CardTitle>
          <Link to="/verlauf">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              Verlauf anzeigen
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-36 shrink-0">{s.label}</span>
              <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${s.color}`}
                  style={{ width: `${Math.max((s.value / maxVal) * 100, 4)}%` }}
                />
              </div>
              <span className="text-sm font-semibold w-8 text-right">{s.value}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Gesamt: {totalActivity} Aktivitaeten
          {rechnerVerlauf.length > 0 && ` — Letzte Berechnung: ${new Date(rechnerVerlauf[0].datum).toLocaleDateString('de-DE')}`}
        </p>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Tracker Preview - reads real data from localStorage
// ---------------------------------------------------------------------------

function TrackerPreview() {
  let entries: { typ: string; betreff: string; fristende: string; status: string }[] = []
  try {
    const raw = localStorage.getItem('bescheidboxer_widersprueche')
    if (raw) entries = JSON.parse(raw)
  } catch { /* ignore */ }

  const aktive = entries.filter(e => e.status === 'eingereicht' || e.status === 'in_bearbeitung')

  if (aktive.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground mb-3">Noch keine Widersprueche erfasst</p>
        <div className="flex gap-2 justify-center">
          <Link to="/tracker">
            <Button size="sm" variant="outline" className="gap-1">
              <ClipboardList className="h-3.5 w-3.5" />
              Tracker oeffnen
            </Button>
          </Link>
          <Link to="/musterschreiben">
            <Button size="sm" className="gap-1">
              <FileText className="h-3.5 w-3.5" />
              Schreiben erstellen
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {aktive.slice(0, 3).map((entry, idx) => {
        const frist = new Date(entry.fristende)
        const heute = new Date()
        const tageVerbleibend = Math.ceil((frist.getTime() - heute.getTime()) / (1000 * 60 * 60 * 24))
        const dringend = tageVerbleibend < 7

        return (
          <div key={idx} className={`flex items-center gap-3 p-2.5 rounded-lg border ${dringend ? 'border-red-300 bg-red-50 dark:bg-red-950/20' : ''}`}>
            {dringend ? (
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
            ) : (
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{entry.betreff}</p>
              <p className={`text-xs ${dringend ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
                {tageVerbleibend > 0 ? `Noch ${tageVerbleibend} Tage` : 'Frist abgelaufen!'} — {entry.typ}
              </p>
            </div>
          </div>
        )
      })}
      {aktive.length > 3 && (
        <p className="text-xs text-muted-foreground text-center">+ {aktive.length - 3} weitere</p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  useDocumentTitle('Dashboard')
  const { credits } = useCreditsContext()

  const userPlan = credits?.plan ?? 'schnupperer'
  const planConfig = PLANS[userPlan]
  const creditsLeft = credits?.creditsAktuell ?? 0
  const chatUsedToday = credits?.chatMessagesUsedToday ?? 0

  const currentLevel = getLevelForPoints(DEMO_POINTS)
  const nextLevel = getNextLevel(DEMO_POINTS)
  const progressPercent = getProgressToNextLevel(DEMO_POINTS)

  return (
    <div className="min-h-screen bg-background">
      {/* ---------------------------------------------------------------- */}
      {/* Page header                                                      */}
      {/* ---------------------------------------------------------------- */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-1">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">
              Mein BescheidBoxer Dashboard
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Willkommen zurueck! Hier siehst du alles auf einen Blick.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* ---------------------------------------------------------------- */}
        {/* Level Banner                                                     */}
        {/* ---------------------------------------------------------------- */}
        <Card className="overflow-hidden border-2 border-primary/20">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row items-stretch">
              {/* Level info */}
              <div className="flex-1 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl" role="img" aria-label={currentLevel.name}>
                    {currentLevel.icon}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold">
                        Level: {currentLevel.name}
                      </h2>
                      <Badge variant="outline" className="text-xs font-mono">
                        {DEMO_POINTS} Punkte
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {currentLevel.description}
                    </p>
                  </div>
                </div>

                {nextLevel && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Fortschritt zu {nextLevel.name} {nextLevel.icon}</span>
                      <span>
                        {DEMO_POINTS} / {nextLevel.minPoints} Punkte
                      </span>
                    </div>
                    <Progress value={progressPercent} className="h-2.5" />
                    <p className="text-xs text-muted-foreground">
                      Noch {nextLevel.minPoints - DEMO_POINTS} Punkte bis zum
                      naechsten Level
                    </p>
                  </div>
                )}
              </div>

              {/* Badges earned */}
              <div className="border-t md:border-t-0 md:border-l p-5 md:w-72 bg-muted/30">
                <div className="flex items-center gap-1.5 mb-3">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-semibold">
                    Badges ({DEMO_BADGES.length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {DEMO_BADGES.map((badge) => (
                    <div
                      key={badge.id}
                      className="flex items-center gap-1 rounded-full bg-background border px-2.5 py-1 text-xs"
                      title={badge.name}
                    >
                      <span>{badge.icon}</span>
                      <span className="font-medium">{badge.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ---------------------------------------------------------------- */}
        {/* Money Recovered Highlight                                        */}
        {/* ---------------------------------------------------------------- */}
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/30">
          <CardContent className="flex flex-col sm:flex-row items-center gap-4 py-6">
            <div className="flex items-center justify-center h-14 w-14 rounded-full bg-primary/20">
              <TrendingUp className="h-7 w-7 text-primary" />
            </div>
            <div className="text-center sm:text-left flex-1">
              <p className="text-sm text-muted-foreground font-medium mb-0.5">
                Du hast bisher durchgesetzt:
              </p>
              <p className="text-3xl font-extrabold tracking-tight text-primary">
                {formatEur(DEMO_MONEY_RECOVERED)} EUR
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Durch Widersprueche und korrigierte Bescheide — weiter so!
              </p>
            </div>
            <Link to="/scan">
              <Button className="gap-2">
                <ScanSearch className="h-4 w-4" />
                Neuen Bescheid pruefen
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* ---------------------------------------------------------------- */}
        {/* Quick Stats Grid                                                 */}
        {/* ---------------------------------------------------------------- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex flex-col items-center py-5 px-3 text-center">
              <ScanSearch className="h-5 w-5 text-blue-500 mb-2" />
              <p className="text-2xl font-bold">{DEMO_SCANS.length}</p>
              <p className="text-xs text-muted-foreground">BescheidScans</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center py-5 px-3 text-center">
              <FileText className="h-5 w-5 text-green-500 mb-2" />
              <p className="text-2xl font-bold">{DEMO_LETTERS.length}</p>
              <p className="text-xs text-muted-foreground">Schreiben</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center py-5 px-3 text-center">
              <Users className="h-5 w-5 text-purple-500 mb-2" />
              <p className="text-2xl font-bold">
                {DEMO_COMMUNITY_STATS.totalMembers.toLocaleString('de-DE')}
              </p>
              <p className="text-xs text-muted-foreground">Forum-Mitglieder</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center py-5 px-3 text-center">
              <CreditCard className="h-5 w-5 text-orange-500 mb-2" />
              <p className="text-2xl font-bold">{creditsLeft}</p>
              <p className="text-xs text-muted-foreground">Credits uebrig</p>
            </CardContent>
          </Card>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Quick-Action Tiles                                               */}
        {/* ---------------------------------------------------------------- */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { name: 'Bescheid scannen', href: '/scan', icon: ScanSearch, color: 'text-blue-600 bg-blue-50' },
            { name: 'KI-Berater', href: '/chat', icon: MessageCircle, color: 'text-green-600 bg-green-50' },
            { name: 'Meine Faelle', href: '/faelle', icon: FolderKanban, color: 'text-indigo-600 bg-indigo-50' },
            { name: 'Rechner', href: '/rechner', icon: Calculator, color: 'text-amber-600 bg-amber-50' },
            { name: 'Lernbereich', href: '/lernen', icon: GraduationCap, color: 'text-teal-600 bg-teal-50' },
            { name: 'Bewerbungen', href: '/bewerbungen', icon: Briefcase, color: 'text-purple-600 bg-purple-50' },
            { name: 'Bescheid-Archiv', href: '/bescheid-archiv', icon: Archive, color: 'text-rose-600 bg-rose-50' },
            { name: 'Kosten', href: '/kosten', icon: Wallet, color: 'text-emerald-600 bg-emerald-50' },
            { name: 'Erinnerungen', href: '/erinnerungen', icon: Bell, color: 'text-orange-600 bg-orange-50' },
            { name: 'Termine', href: '/termine', icon: Calendar, color: 'text-red-600 bg-red-50' },
            { name: 'Dokumente', href: '/dokumente', icon: FolderOpen, color: 'text-cyan-600 bg-cyan-50' },
          ].map((tile) => (
            <Link key={tile.name} to={tile.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-3 flex flex-col items-center text-center gap-2">
                  <div className={`p-2.5 rounded-xl ${tile.color}`}>
                    <tile.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium">{tile.name}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Activity Stats from localStorage                                 */}
        {/* ---------------------------------------------------------------- */}
        <AktivitaetsStatistik />

        {/* ---------------------------------------------------------------- */}
        {/* Fortschritts-System (Milestones & Gamification)                  */}
        {/* ---------------------------------------------------------------- */}
        <Fortschritt />

        {/* ---------------------------------------------------------------- */}
        {/* Zeitstrahl (Timeline)                                            */}
        {/* ---------------------------------------------------------------- */}
        <Zeitstrahl />

        {/* ---------------------------------------------------------------- */}
        {/* Main + Sidebar layout                                            */}
        {/* ---------------------------------------------------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ============================================================== */}
          {/* Main column (2/3)                                              */}
          {/* ============================================================== */}
          <div className="lg:col-span-2 space-y-6">
            {/* -------------------------------------------------------------- */}
            {/* Active Deadlines                                               */}
            {/* -------------------------------------------------------------- */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4 text-orange-500" />
                  Aktive Fristen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {DEMO_DEADLINES.map((deadline) => (
                  <div
                    key={deadline.id}
                    className={`flex items-start gap-3 rounded-lg border p-3 ${
                      deadline.urgent
                        ? 'border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800'
                        : ''
                    }`}
                  >
                    {deadline.urgent ? (
                      <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                    ) : (
                      <Clock className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug">
                        {deadline.title}
                      </p>
                      <p
                        className={`text-xs mt-0.5 ${
                          deadline.urgent
                            ? 'text-red-600 dark:text-red-400 font-semibold'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {deadline.urgent && '⚠ DRINGEND — '}
                        Noch {deadline.daysLeft} Tage (bis {deadline.dueDate})
                      </p>
                    </div>
                    {deadline.urgent && (
                      <Link to="/generator/widerspruch">
                        <Button size="sm" variant="destructive" className="gap-1 shrink-0">
                          Jetzt handeln
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* -------------------------------------------------------------- */}
            {/* Recent BescheidScans                                           */}
            {/* -------------------------------------------------------------- */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ScanSearch className="h-4 w-4 text-blue-500" />
                    Letzte BescheidScans
                  </CardTitle>
                  <Link to="/scan">
                    <Button variant="ghost" size="sm" className="gap-1 text-xs">
                      Alle anzeigen
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {DEMO_SCANS.map((scan) => (
                    <div
                      key={scan.id}
                      className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div
                        className={`flex items-center justify-center h-9 w-9 rounded-full shrink-0 ${
                          scan.errorsFound > 0
                            ? 'bg-red-100 dark:bg-red-900/30'
                            : 'bg-green-100 dark:bg-green-900/30'
                        }`}
                      >
                        {scan.errorsFound > 0 ? (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {scan.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {scan.date}
                          {scan.errorsFound > 0 &&
                            ` — ${scan.errorsFound} Fehler, ca. ${formatEur(scan.potentialRecovery)} EUR`}
                        </p>
                      </div>
                      {scanStatusBadge(scan.status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* -------------------------------------------------------------- */}
            {/* Recent Letters / Widersprueche                                 */}
            {/* -------------------------------------------------------------- */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Swords className="h-4 w-4 text-green-500" />
                    Letzte Schreiben &amp; Widersprueche
                  </CardTitle>
                  <Link to="/generator">
                    <Button variant="ghost" size="sm" className="gap-1 text-xs">
                      Alle anzeigen
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {DEMO_LETTERS.map((letter) => (
                    <div
                      key={letter.id}
                      className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 shrink-0">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {letter.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {letter.date} —{' '}
                          <span className="capitalize">{letter.type}</span>
                        </p>
                      </div>
                      {letterStatusBadge(letter.status)}
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t">
                  <Link to="/generator">
                    <Button className="w-full gap-2" variant="outline">
                      <FileText className="h-4 w-4" />
                      Neues Schreiben erstellen
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* -------------------------------------------------------------- */}
            {/* Widerspruch-Tracker Preview                                    */}
            {/* -------------------------------------------------------------- */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ClipboardList className="h-4 w-4 text-indigo-500" />
                    Widerspruch-Tracker
                  </CardTitle>
                  <Link to="/tracker">
                    <Button variant="ghost" size="sm" className="gap-1 text-xs">
                      Alle anzeigen
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <TrackerPreview />
              </CardContent>
            </Card>

            {/* -------------------------------------------------------------- */}
            {/* Community Stats                                                */}
            {/* -------------------------------------------------------------- */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4 text-purple-500" />
                  BescheidBoxer-Community
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-xl font-bold">
                      {DEMO_COMMUNITY_STATS.totalMembers.toLocaleString('de-DE')}
                    </p>
                    <p className="text-xs text-muted-foreground">Mitglieder</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-green-600">
                      {DEMO_COMMUNITY_STATS.widerspruchSuccess}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Widerspruch-Erfolg
                    </p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-primary">
                      {(DEMO_COMMUNITY_STATS.moneyRecoveredTotal / 1000).toFixed(0)}k EUR
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Insgesamt durchgesetzt
                    </p>
                  </div>
                  <div>
                    <p className="text-xl font-bold">
                      {DEMO_COMMUNITY_STATS.activeThreads}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Aktive Diskussionen
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t">
                  <Link to="/forum">
                    <Button variant="outline" size="sm" className="gap-1">
                      <MessageCircle className="h-3.5 w-3.5" />
                      Zum Forum
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ============================================================== */}
          {/* Sidebar (1/3)                                                  */}
          {/* ============================================================== */}
          <div className="space-y-6">
            {/* -------------------------------------------------------------- */}
            {/* Plan Info + Upgrade CTA                                        */}
            {/* -------------------------------------------------------------- */}
            <Card className="border-primary/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Dein Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg">{planConfig.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {planConfig.price === 0
                        ? 'Kostenlos'
                        : `${formatEur(planConfig.price)} EUR / Monat`}
                    </p>
                  </div>
                  {planConfig.badge && (
                    <Badge className="text-xs">{planConfig.badge}</Badge>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chat / Tag</span>
                    <span className="font-medium">
                      {planConfig.chatMessagesPerDay === -1
                        ? 'Unbegrenzt'
                        : `${chatUsedToday} / ${planConfig.chatMessagesPerDay}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Credits</span>
                    <span className="font-medium">
                      {creditsLeft}
                      {planConfig.creditsPerMonth > 0 &&
                        ` / ${planConfig.creditsPerMonth}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Scans / Monat</span>
                    <span className="font-medium">
                      {planConfig.bescheidScansPerMonth === -1
                        ? 'Unbegrenzt'
                        : planConfig.bescheidScansPerMonth}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Schreiben / Monat</span>
                    <span className="font-medium">
                      {planConfig.lettersPerMonth === -1
                        ? 'Unbegrenzt'
                        : planConfig.lettersPerMonth}
                    </span>
                  </div>
                </div>

                {planConfig.tier < 3 && (
                  <Link to="/pricing" className="block">
                    <Button className="w-full gap-2">
                      <TrendingUp className="h-4 w-4" />
                      {planConfig.tier === 0
                        ? 'Jetzt upgraden'
                        : 'Auf ' +
                          PLANS[
                            planConfig.tier === 1 ? 'kaempfer' : 'vollschutz'
                          ].name +
                          ' upgraden'}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* -------------------------------------------------------------- */}
            {/* Personalized Tips                                              */}
            {/* -------------------------------------------------------------- */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-4 w-4 text-orange-500" />
                  Persoenliche Tipps
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {DEMO_TIPS.map((tip) => (
                  <div
                    key={tip.id}
                    className={`rounded-lg p-3 ${tipPriorityStyles(tip.priority)}`}
                  >
                    <p className="text-sm leading-relaxed">{tip.text}</p>
                    <Link to={tip.action}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 gap-1 h-7 px-2 text-xs"
                      >
                        {tip.actionLabel}
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* -------------------------------------------------------------- */}
            {/* Quick Links                                                    */}
            {/* -------------------------------------------------------------- */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Schnellzugriff</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                <Link to="/chat" className="block">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 h-9 text-sm"
                  >
                    <MessageCircle className="h-4 w-4 text-blue-500" />
                    KI-Rechtsberater fragen
                  </Button>
                </Link>
                <Link to="/scan" className="block">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 h-9 text-sm"
                  >
                    <ScanSearch className="h-4 w-4 text-green-500" />
                    Bescheid scannen
                  </Button>
                </Link>
                <Link to="/generator" className="block">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 h-9 text-sm"
                  >
                    <FileText className="h-4 w-4 text-orange-500" />
                    Schreiben erstellen
                  </Button>
                </Link>
                <Link to="/forum" className="block">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 h-9 text-sm"
                  >
                    <Users className="h-4 w-4 text-purple-500" />
                    Forum besuchen
                  </Button>
                </Link>
                <Link to="/musterschreiben" className="block">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 h-9 text-sm"
                  >
                    <Swords className="h-4 w-4 text-red-500" />
                    Musterschreiben
                  </Button>
                </Link>
                <Link to="/tracker" className="block">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 h-9 text-sm"
                  >
                    <ClipboardList className="h-4 w-4 text-indigo-500" />
                    Widerspruch-Tracker
                  </Button>
                </Link>
                <Link to="/rechner" className="block">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 h-9 text-sm"
                  >
                    <Calculator className="h-4 w-4 text-amber-500" />
                    Rechner-Suite
                  </Button>
                </Link>
                <Link to="/rechner/pkh" className="block">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 h-9 text-sm"
                  >
                    <Scale className="h-4 w-4 text-cyan-500" />
                    PKH-Rechner
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* -------------------------------------------------------------- */}
            {/* Ecosystem Links                                                */}
            {/* -------------------------------------------------------------- */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ExternalLink className="h-4 w-4" />
                  Fintutto Oekosystem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground mb-3">
                  Auch Probleme als Mieter? Unser Schwester-Portal hilft!
                </p>
                <a
                  href="https://mieter.fintutto.de"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 justify-start"
                  >
                    🏠 MieterEngel — Mietrecht-Hilfe
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </Button>
                </a>
                {planConfig.mieterAppInklusive && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {planConfig.mieterAppInklusive === 'premium'
                      ? 'Premium-Zugang inklusive in deinem Plan!'
                      : 'Basis-Zugang inklusive in deinem Plan!'}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
