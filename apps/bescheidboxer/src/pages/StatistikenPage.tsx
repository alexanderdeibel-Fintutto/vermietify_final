import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  Calculator,
  FileText,
  FolderOpen,
  MessageCircle,
  TrendingUp,
  Activity,
  Calendar,
  Info,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import Breadcrumbs from '@/components/Breadcrumbs'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RechnerVerlaufEntry {
  id: string
  rechnerName?: string
  rechner?: string
  rechnerSlug: string
  ergebnis: Record<string, string | number>
  datum: string
}

interface WiderspruchEntry {
  id: string
  typ: string
  betreff: string
  bescheidDatum?: string
  eingereichtAm: string
  fristende: string
  aktenzeichen?: string
  status: string
  datum?: string
  behoerde?: string
  notizen?: string
  ergebnis?: string
}

interface DokumentEntry {
  id: string
  name: string
  kategorie: string
  datum: string
  groesse: number
  typ: string
}

interface NotizEntry {
  id: string
  title?: string
  titel?: string
  content?: string
  inhalt?: string
  category?: string
  kategorie?: string
  createdAt?: string
  datum?: string
}

interface ChatMessage {
  role: string
  content: string
  timestamp?: string
}

// ---------------------------------------------------------------------------
// localStorage Readers
// ---------------------------------------------------------------------------

function loadRechnerVerlauf(): RechnerVerlaufEntry[] {
  try {
    const raw = localStorage.getItem('bescheidboxer_rechner_verlauf')
    if (!raw) return []
    return JSON.parse(raw) as RechnerVerlaufEntry[]
  } catch {
    return []
  }
}

function loadWidersprueche(): WiderspruchEntry[] {
  try {
    const raw = localStorage.getItem('bescheidboxer_widersprueche')
    if (!raw) return []
    return JSON.parse(raw) as WiderspruchEntry[]
  } catch {
    return []
  }
}

function loadDokumente(): DokumentEntry[] {
  try {
    const raw = localStorage.getItem('bescheidboxer_dokumente')
    if (!raw) return []
    return JSON.parse(raw) as DokumentEntry[]
  } catch {
    return []
  }
}

function loadNotizen(): NotizEntry[] {
  try {
    const raw = localStorage.getItem('bescheidboxer_notizen')
    if (!raw) return []
    return JSON.parse(raw) as NotizEntry[]
  } catch {
    return []
  }
}

function loadChatHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem('bescheidboxer_chat_history')
    if (!raw) return []
    return JSON.parse(raw) as ChatMessage[]
  } catch {
    return []
  }
}

function loadChecklistenCount(): number {
  try {
    const raw = localStorage.getItem('bescheidboxer_checklisten')
    if (!raw) return 0
    const data = JSON.parse(raw) as Record<string, Record<string, boolean>>
    let completed = 0
    for (const checklistId of Object.keys(data)) {
      for (const itemId of Object.keys(data[checklistId])) {
        if (data[checklistId][itemId]) completed++
      }
    }
    return completed
  } catch {
    return 0
  }
}

// ---------------------------------------------------------------------------
// Date Helpers
// ---------------------------------------------------------------------------

function getEntryDate(entry: { datum?: string; eingereichtAm?: string; createdAt?: string }): Date {
  const dateStr = entry.datum || entry.eingereichtAm || entry.createdAt
  if (!dateStr) return new Date()
  return new Date(dateStr)
}

function getWeekKey(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  // Set to Monday of the week
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().slice(0, 10)
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-')
  const monthNames = [
    'Jan', 'Feb', 'Maer', 'Apr', 'Mai', 'Jun',
    'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez',
  ]
  return `${monthNames[parseInt(month, 10) - 1]} ${year}`
}

function formatWeekLabel(weekKey: string): string {
  const date = new Date(weekKey)
  return `${date.getDate()}.${date.getMonth() + 1}.`
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = bytes / Math.pow(1024, i)
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

// ---------------------------------------------------------------------------
// Data Processing Hooks
// ---------------------------------------------------------------------------

function useStatistikData() {
  return useMemo(() => {
    const rechnerVerlauf = loadRechnerVerlauf()
    const widersprueche = loadWidersprueche()
    const dokumente = loadDokumente()
    const notizen = loadNotizen()
    const chatMessages = loadChatHistory()
    const checklistenCompleted = loadChecklistenCount()

    // --- Total counts ---
    const totalActivities =
      rechnerVerlauf.length +
      widersprueche.length +
      dokumente.length +
      notizen.length +
      chatMessages.filter((m) => m.role === 'user').length

    // --- Collect all dated activities for weekly/monthly charts ---
    const allDates: Date[] = []
    rechnerVerlauf.forEach((r) => allDates.push(new Date(r.datum)))
    widersprueche.forEach((w) => allDates.push(getEntryDate(w)))
    dokumente.forEach((d) => allDates.push(new Date(d.datum)))
    notizen.forEach((n) => allDates.push(getEntryDate(n)))
    chatMessages.forEach((m) => {
      if (m.timestamp) allDates.push(new Date(m.timestamp))
    })

    // --- Activity per week (last 8 weeks) ---
    const now = new Date()
    const eightWeeksAgo = new Date(now)
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56)

    const weekCounts: Record<string, number> = {}
    // Pre-fill last 8 weeks
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i * 7)
      weekCounts[getWeekKey(d)] = 0
    }
    allDates
      .filter((d) => d >= eightWeeksAgo)
      .forEach((d) => {
        const key = getWeekKey(d)
        if (key in weekCounts) {
          weekCounts[key]++
        }
      })
    const weeklyData = Object.entries(weekCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, count]) => ({ label: formatWeekLabel(key), count }))

    // --- Activity per month (last 6 months) ---
    const sixMonthsAgo = new Date(now)
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthCounts: Record<string, number> = {}
    // Pre-fill last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now)
      d.setMonth(d.getMonth() - i)
      monthCounts[getMonthKey(d)] = 0
    }
    allDates
      .filter((d) => d >= sixMonthsAgo)
      .forEach((d) => {
        const key = getMonthKey(d)
        if (key in monthCounts) {
          monthCounts[key]++
        }
      })
    const monthlyData = Object.entries(monthCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, count]) => ({ label: formatMonthLabel(key), count }))

    // --- Beliebteste Rechner ---
    const rechnerCounts: Record<string, number> = {}
    rechnerVerlauf.forEach((r) => {
      const name = r.rechnerName || r.rechner || r.rechnerSlug
      rechnerCounts[name] = (rechnerCounts[name] || 0) + 1
    })
    const rechnerRanking = Object.entries(rechnerCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }))

    // --- Widerspruch-Status Verteilung ---
    const statusCounts: Record<string, number> = {
      eingereicht: 0,
      in_bearbeitung: 0,
      beschieden: 0,
      erledigt: 0,
      abgelehnt: 0,
    }
    widersprueche.forEach((w) => {
      const s = w.status
      if (s in statusCounts) {
        statusCounts[s]++
      } else {
        statusCounts[s] = (statusCounts[s] || 0) + 1
      }
    })

    // --- Dokumente nach Kategorie ---
    const dokKategorien: Record<string, { count: number; size: number }> = {}
    dokumente.forEach((d) => {
      const kat = d.kategorie || 'Sonstiges'
      if (!dokKategorien[kat]) {
        dokKategorien[kat] = { count: 0, size: 0 }
      }
      dokKategorien[kat].count++
      dokKategorien[kat].size += d.groesse || 0
    })
    const dokumenteByKategorie = Object.entries(dokKategorien)
      .sort(([, a], [, b]) => b.count - a.count)
      .map(([kategorie, data]) => ({ kategorie, ...data }))
    const totalStorageSize = dokumente.reduce((sum, d) => sum + (d.groesse || 0), 0)

    // --- Tipp generation ---
    const tipps: string[] = []
    if (rechnerVerlauf.length === 0) {
      tipps.push(
        'Du hast noch keinen Rechner genutzt. Probiere den Buergergeld-Rechner aus, um deine Ansprueche zu pruefen!'
      )
    }
    if (widersprueche.length === 0 && rechnerVerlauf.length > 0) {
      tipps.push(
        'Du hast noch keinen Widerspruch erfasst. Wenn dein Bescheid Fehler enthaelt, lege rechtzeitig Widerspruch ein!'
      )
    }
    if (dokumente.length === 0) {
      tipps.push(
        'Lege deine wichtigen Dokumente in der Dokumentenverwaltung ab, damit du im Ernstfall alles griffbereit hast.'
      )
    }
    if (chatMessages.length === 0) {
      tipps.push(
        'Unser KI-Rechtsberater kann dir Fragen zu deinem Bescheid beantworten. Starte jetzt einen Chat!'
      )
    }
    if (widersprueche.filter((w) => w.status === 'eingereicht').length > 0) {
      tipps.push(
        'Du hast offene Widersprueche. Pruefe regelmaessig den Status und halte Fristen im Blick.'
      )
    }
    if (checklistenCompleted > 0) {
      tipps.push(
        `Du hast bereits ${checklistenCompleted} Checklisten-Punkte abgehakt. Weiter so!`
      )
    }
    if (tipps.length === 0) {
      tipps.push(
        'Du bist gut aufgestellt! Schaue regelmaessig vorbei, um deine Ansprueche im Blick zu behalten.'
      )
    }

    return {
      totalActivities,
      rechnerVerlauf,
      widersprueche,
      dokumente,
      chatMessages,
      weeklyData,
      monthlyData,
      rechnerRanking,
      statusCounts,
      dokumenteByKategorie,
      totalStorageSize,
      tipps,
    }
  }, [])
}

// ---------------------------------------------------------------------------
// Sub-Components
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: number
  color: string
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center py-5 px-3 text-center">
        <Icon className={`h-5 w-5 mb-2 ${color}`} />
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}

function CSSBarChart({
  data,
  barColor = 'bg-primary',
}: {
  data: { label: string; count: number }[]
  barColor?: string
}) {
  const maxVal = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="space-y-2">
      {data.map((item, idx) => (
        <div key={idx} className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-16 shrink-0 text-right">
            {item.label}
          </span>
          <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: `${Math.max((item.count / maxVal) * 100, item.count > 0 ? 4 : 0)}%` }}
            />
          </div>
          <span className="text-xs font-semibold w-8 text-right">{item.count}</span>
        </div>
      ))}
    </div>
  )
}

function HorizontalRechnerChart({
  data,
}: {
  data: { name: string; count: number }[]
}) {
  const maxVal = Math.max(...data.map((d) => d.count), 1)
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-amber-500',
    'bg-purple-500',
    'bg-red-500',
    'bg-cyan-500',
    'bg-pink-500',
    'bg-indigo-500',
  ]

  return (
    <div className="space-y-3">
      {data.map((item, idx) => (
        <div key={idx}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-foreground truncate pr-2">
              {item.name}
            </span>
            <span className="text-sm font-semibold shrink-0">
              {item.count}x
            </span>
          </div>
          <div className="bg-muted rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${colors[idx % colors.length]}`}
              style={{ width: `${Math.max((item.count / maxVal) * 100, 6)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Status Config
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  eingereicht: { label: 'Eingereicht', color: 'text-blue-700', bg: 'bg-blue-100' },
  in_bearbeitung: { label: 'In Bearbeitung', color: 'text-amber-700', bg: 'bg-amber-100' },
  beschieden: { label: 'Beschieden', color: 'text-green-700', bg: 'bg-green-100' },
  erledigt: { label: 'Erledigt', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  abgelehnt: { label: 'Abgelehnt', color: 'text-red-700', bg: 'bg-red-100' },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StatistikenPage() {
  useDocumentTitle('Statistiken - BescheidBoxer')

  const {
    totalActivities,
    rechnerVerlauf,
    widersprueche,
    dokumente,
    chatMessages,
    weeklyData,
    monthlyData,
    rechnerRanking,
    statusCounts,
    dokumenteByKategorie,
    totalStorageSize,
    tipps,
  } = useStatistikData()

  const userChatCount = chatMessages.filter((m) => m.role === 'user').length
  const hasAnyData =
    totalActivities > 0 ||
    dokumente.length > 0 ||
    chatMessages.length > 0

  return (
    <div className="min-h-screen bg-background">
      {/* ------------------------------------------------------------------ */}
      {/* Page Header                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Statistiken' },
            ]}
            className="mb-4"
          />
          <div className="flex items-center gap-3 mb-1">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">
              Statistiken
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Deine Nutzung von BescheidBoxer auf einen Blick — alle Daten werden lokal
            aus deinem Browser gelesen.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* ---------------------------------------------------------------- */}
        {/* Empty State                                                      */}
        {/* ---------------------------------------------------------------- */}
        {!hasAnyData && (
          <div className="text-center py-16">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">
              Noch keine Statistiken vorhanden
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Sobald du Rechner nutzt, Widersprueche erfasst, den Chat verwendest
              oder Dokumente ablegst, erscheinen hier deine Auswertungen.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/rechner">
                <Button className="gap-2">
                  <Calculator className="h-4 w-4" />
                  Rechner nutzen
                </Button>
              </Link>
              <Link to="/chat">
                <Button variant="outline" className="gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Chat starten
                </Button>
              </Link>
            </div>
          </div>
        )}

        {hasAnyData && (
          <>
            {/* -------------------------------------------------------------- */}
            {/* 1. Uebersicht - Top Stats Row                                  */}
            {/* -------------------------------------------------------------- */}
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Uebersicht
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  icon={TrendingUp}
                  label="Aktivitaeten gesamt"
                  value={totalActivities}
                  color="text-primary"
                />
                <StatCard
                  icon={Calculator}
                  label="Rechner genutzt"
                  value={rechnerVerlauf.length}
                  color="text-amber-500"
                />
                <StatCard
                  icon={FileText}
                  label="Widersprueche"
                  value={widersprueche.length}
                  color="text-blue-500"
                />
                <StatCard
                  icon={FolderOpen}
                  label="Dokumente"
                  value={dokumente.length}
                  color="text-green-500"
                />
              </div>
            </div>

            {/* -------------------------------------------------------------- */}
            {/* 2. Aktivitaet nach Woche (Bar Chart)                           */}
            {/* -------------------------------------------------------------- */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4 text-primary" />
                  Aktivitaet nach Woche
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Deine Aktivitaeten pro Woche (letzte 8 Wochen)
                </p>
              </CardHeader>
              <CardContent>
                <CSSBarChart data={weeklyData} barColor="bg-primary" />
              </CardContent>
            </Card>

            {/* -------------------------------------------------------------- */}
            {/* Two-Column Layout                                              */}
            {/* -------------------------------------------------------------- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ------------------------------------------------------------ */}
              {/* 3. Beliebteste Rechner                                       */}
              {/* ------------------------------------------------------------ */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calculator className="h-4 w-4 text-amber-500" />
                    Beliebteste Rechner
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {rechnerRanking.length > 0 ? (
                    <HorizontalRechnerChart data={rechnerRanking} />
                  ) : (
                    <div className="text-center py-6">
                      <Calculator className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Noch keine Rechner genutzt
                      </p>
                      <Link to="/rechner">
                        <Button variant="outline" size="sm" className="mt-3 gap-1">
                          <Calculator className="h-3.5 w-3.5" />
                          Zur Rechner-Suite
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ------------------------------------------------------------ */}
              {/* 4. Widerspruch-Status                                        */}
              {/* ------------------------------------------------------------ */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Widerspruch-Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {widersprueche.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(statusCounts)
                          .filter(([, count]) => count > 0)
                          .map(([status, count]) => {
                            const config = STATUS_CONFIG[status] || {
                              label: status,
                              color: 'text-gray-700',
                              bg: 'bg-gray-100',
                            }
                            return (
                              <span
                                key={status}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${config.bg} ${config.color}`}
                              >
                                {config.label}
                                <span className="font-bold">{count}</span>
                              </span>
                            )
                          })}
                      </div>
                      {/* Visual bar breakdown */}
                      <div className="flex h-4 rounded-full overflow-hidden bg-muted">
                        {Object.entries(statusCounts)
                          .filter(([, count]) => count > 0)
                          .map(([status, count]) => {
                            const pct = (count / widersprueche.length) * 100
                            const barColors: Record<string, string> = {
                              eingereicht: 'bg-blue-500',
                              in_bearbeitung: 'bg-amber-500',
                              beschieden: 'bg-green-500',
                              erledigt: 'bg-emerald-500',
                              abgelehnt: 'bg-red-500',
                            }
                            return (
                              <div
                                key={status}
                                className={`h-full ${barColors[status] || 'bg-gray-400'}`}
                                style={{ width: `${pct}%` }}
                                title={`${STATUS_CONFIG[status]?.label || status}: ${count}`}
                              />
                            )
                          })}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Gesamt: {widersprueche.length} Widersprueche erfasst
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Noch keine Widersprueche erfasst
                      </p>
                      <Link to="/tracker">
                        <Button variant="outline" size="sm" className="mt-3 gap-1">
                          <FileText className="h-3.5 w-3.5" />
                          Zum Tracker
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* -------------------------------------------------------------- */}
            {/* 5. Dokumente nach Kategorie                                    */}
            {/* -------------------------------------------------------------- */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FolderOpen className="h-4 w-4 text-green-500" />
                  Dokumente nach Kategorie
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dokumenteByKategorie.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {dokumenteByKategorie.map((kat) => (
                        <div
                          key={kat.kategorie}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-green-50 shrink-0">
                            <FolderOpen className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {kat.kategorie}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {kat.count} Dokument{kat.count !== 1 ? 'e' : ''} — {formatFileSize(kat.size)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground border-t pt-3">
                      Gesamtspeicher: {formatFileSize(totalStorageSize)} in {dokumente.length} Dokument{dokumente.length !== 1 ? 'en' : ''}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <FolderOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Noch keine Dokumente abgelegt
                    </p>
                    <Link to="/dokumente">
                      <Button variant="outline" size="sm" className="mt-3 gap-1">
                        <FolderOpen className="h-3.5 w-3.5" />
                        Zur Dokumentenverwaltung
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* -------------------------------------------------------------- */}
            {/* 6. Zeitlicher Verlauf (Monthly Trend)                          */}
            {/* -------------------------------------------------------------- */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  Zeitlicher Verlauf
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Deine Aktivitaeten pro Monat (letzte 6 Monate)
                </p>
              </CardHeader>
              <CardContent>
                {/* Visual bar chart - vertical style using CSS flexbox */}
                <div className="flex items-end gap-2 h-40 mb-3">
                  {monthlyData.map((item, idx) => {
                    const maxMonthly = Math.max(...monthlyData.map((d) => d.count), 1)
                    const heightPct = (item.count / maxMonthly) * 100
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs font-semibold text-foreground">
                          {item.count > 0 ? item.count : ''}
                        </span>
                        <div className="w-full flex items-end justify-center" style={{ height: '120px' }}>
                          <div
                            className="w-full max-w-12 rounded-t-md bg-purple-500 transition-all"
                            style={{
                              height: `${item.count > 0 ? Math.max(heightPct, 5) : 0}%`,
                              minHeight: item.count > 0 ? '4px' : '0px',
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {item.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* -------------------------------------------------------------- */}
            {/* Additional Info: Chat & Notizen                                */}
            {/* -------------------------------------------------------------- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardContent className="flex items-center gap-4 py-5">
                  <div className="flex items-center justify-center h-11 w-11 rounded-full bg-blue-50 shrink-0">
                    <MessageCircle className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{userChatCount}</p>
                    <p className="text-xs text-muted-foreground">
                      Chat-Nachrichten gesendet
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ({chatMessages.length} Nachrichten gesamt inkl. Antworten)
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 py-5">
                  <div className="flex items-center justify-center h-11 w-11 rounded-full bg-amber-50 shrink-0">
                    <Activity className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">
                      {rechnerVerlauf.length}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Berechnungen durchgefuehrt
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ({rechnerRanking.length} verschiedene Rechner)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* -------------------------------------------------------------- */}
            {/* 7. Tipp Box                                                    */}
            {/* -------------------------------------------------------------- */}
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-blue-900">
                  <Info className="h-4 w-4 text-blue-600" />
                  Tipps fuer dich
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tipps.map((tipp, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-sm text-blue-800 leading-relaxed"
                    >
                      <span className="text-blue-400 mt-1 shrink-0">&#8226;</span>
                      <span>{tipp}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-blue-200">
                  <Link to="/rechner">
                    <Button size="sm" variant="outline" className="gap-1 text-xs">
                      <Calculator className="h-3.5 w-3.5" />
                      Rechner
                    </Button>
                  </Link>
                  <Link to="/chat">
                    <Button size="sm" variant="outline" className="gap-1 text-xs">
                      <MessageCircle className="h-3.5 w-3.5" />
                      Chat
                    </Button>
                  </Link>
                  <Link to="/tracker">
                    <Button size="sm" variant="outline" className="gap-1 text-xs">
                      <FileText className="h-3.5 w-3.5" />
                      Tracker
                    </Button>
                  </Link>
                  <Link to="/dokumente">
                    <Button size="sm" variant="outline" className="gap-1 text-xs">
                      <FolderOpen className="h-3.5 w-3.5" />
                      Dokumente
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Footer                                                           */}
        {/* ---------------------------------------------------------------- */}
        <p className="text-xs text-muted-foreground text-center mt-4 max-w-2xl mx-auto leading-relaxed">
          Alle Statistiken werden aus lokal gespeicherten Daten in deinem Browser berechnet.
          Es werden keine Daten an unsere Server uebertragen.
        </p>
      </div>
    </div>
  )
}
