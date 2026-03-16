import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Clock,
  MessageCircle,
  Calculator,
  ScanSearch,
  ClipboardList,
  Trash2,
  AlertTriangle,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import useDocumentTitle from '@/hooks/useDocumentTitle'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ActivityItem {
  id: string
  type: 'chat' | 'tracker' | 'scan' | 'consent' | 'rechner'
  title: string
  description: string
  timestamp: Date
  link?: string
}

interface RechnerVerlaufEntry {
  id: string
  rechnerName: string
  rechnerSlug: string
  ergebnis: Record<string, string | number>
  datum: string
}

interface WiderspruchEntry {
  id: string
  typ: string
  betreff: string
  bescheidDatum: string
  eingereichtAm: string
  fristende: string
  aktenzeichen?: string
  status: string
  notizen?: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string | Date
}

interface CookiePreferences {
  necessary: boolean
  statistics: boolean
  marketing: boolean
  timestamp: string
}

// ---------------------------------------------------------------------------
// localStorage Readers
// ---------------------------------------------------------------------------

function loadChatHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem('bescheidboxer_chat_history')
    if (!raw) return []
    return JSON.parse(raw) as ChatMessage[]
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

function loadCookieConsent(): CookiePreferences | null {
  try {
    const raw = localStorage.getItem('bescheidboxer_cookie_consent')
    if (!raw) return null
    return JSON.parse(raw) as CookiePreferences
  } catch {
    return null
  }
}

function loadRechnerVerlauf(): RechnerVerlaufEntry[] {
  try {
    const raw = localStorage.getItem('bescheidboxer_rechner_verlauf')
    if (!raw) return []
    return JSON.parse(raw) as RechnerVerlaufEntry[]
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(date: Date): string {
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getDateGroup(date: Date): 'heute' | 'gestern' | 'aeltere' {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (target.getTime() === today.getTime()) return 'heute'
  if (target.getTime() === yesterday.getTime()) return 'gestern'
  return 'aeltere'
}

const DATE_GROUP_LABELS: Record<string, string> = {
  heute: 'Heute',
  gestern: 'Gestern',
  aeltere: 'Aeltere Eintraege',
}

function activityIcon(type: ActivityItem['type']) {
  switch (type) {
    case 'chat':
      return <MessageCircle className="h-5 w-5 text-blue-500" />
    case 'tracker':
      return <ClipboardList className="h-5 w-5 text-indigo-500" />
    case 'scan':
      return <ScanSearch className="h-5 w-5 text-green-500" />
    case 'consent':
      return <FileText className="h-5 w-5 text-gray-500" />
    case 'rechner':
      return <Calculator className="h-5 w-5 text-amber-500" />
  }
}

// ---------------------------------------------------------------------------
// Build unified activity list from localStorage
// ---------------------------------------------------------------------------

function buildActivities(): ActivityItem[] {
  const activities: ActivityItem[] = []

  // --- Chat history ---
  const chatMessages = loadChatHistory()
  if (chatMessages.length > 0) {
    const userMessages = chatMessages.filter((m) => m.role === 'user')
    const lastMessage = chatMessages[chatMessages.length - 1]
    const lastTimestamp = new Date(lastMessage.timestamp)
    const totalCount = chatMessages.length
    const userCount = userMessages.length

    activities.push({
      id: 'chat-session',
      type: 'chat',
      title: 'Chat-Verlauf',
      description: `${totalCount} Nachrichten (${userCount} von dir)`,
      timestamp: lastTimestamp,
      link: '/chat',
    })
  }

  // --- Widersprueche ---
  const widersprueche = loadWidersprueche()
  for (const w of widersprueche) {
    const timestamp = new Date(w.eingereichtAm)
    const statusLabel =
      w.status === 'eingereicht'
        ? 'Eingereicht'
        : w.status === 'in_bearbeitung'
          ? 'In Bearbeitung'
          : w.status === 'beschieden'
            ? 'Beschieden'
            : w.status === 'erledigt'
              ? 'Erledigt'
              : w.status === 'abgelehnt'
                ? 'Abgelehnt'
                : w.status

    activities.push({
      id: `tracker-${w.id}`,
      type: 'tracker',
      title: w.betreff,
      description: `${w.typ.charAt(0).toUpperCase() + w.typ.slice(1)} — Status: ${statusLabel}`,
      timestamp,
      link: '/tracker',
    })
  }

  // --- Cookie consent ---
  const consent = loadCookieConsent()
  if (consent?.timestamp) {
    activities.push({
      id: 'cookie-consent',
      type: 'consent',
      title: 'Cookie-Einstellungen gespeichert',
      description: consent.statistics
        ? 'Alle Cookies akzeptiert'
        : 'Nur notwendige Cookies',
      timestamp: new Date(consent.timestamp),
      link: '/datenschutz',
    })
  }

  // --- Rechner-Verlauf ---
  const rechnerVerlauf = loadRechnerVerlauf()
  for (const r of rechnerVerlauf) {
    const keys = Object.keys(r.ergebnis)
    const preview =
      keys.length > 0
        ? keys
            .slice(0, 2)
            .map((k) => `${k}: ${r.ergebnis[k]}`)
            .join(', ')
        : 'Ergebnis gespeichert'

    activities.push({
      id: `rechner-${r.id}`,
      type: 'rechner',
      title: r.rechnerName,
      description: preview,
      timestamp: new Date(r.datum),
      link: `/rechner/${r.rechnerSlug}`,
    })
  }

  // Sort newest first
  activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  return activities
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function VerlaufPage() {
  useDocumentTitle('Mein Verlauf')

  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [rechnerVerlauf, setRechnerVerlauf] = useState<RechnerVerlaufEntry[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    setActivities(buildActivities())
    setRechnerVerlauf(loadRechnerVerlauf())
  }, [])

  // --- Delete handler ---
  function handleDeleteHistory() {
    localStorage.removeItem('bescheidboxer_chat_history')
    localStorage.removeItem('bescheidboxer_widersprueche')
    localStorage.removeItem('bescheidboxer_rechner_verlauf')
    setActivities([])
    setRechnerVerlauf([])
    setShowDeleteConfirm(false)
  }

  // --- Group activities by date ---
  const grouped: Record<string, ActivityItem[]> = {}
  for (const a of activities) {
    const group = getDateGroup(a.timestamp)
    if (!grouped[group]) grouped[group] = []
    grouped[group].push(a)
  }

  const groupOrder = ['heute', 'gestern', 'aeltere'] as const
  const hasAnyActivity = activities.length > 0
  const hasRechnerResults = rechnerVerlauf.length > 0

  return (
    <div className="min-h-screen bg-background">
      {/* ------------------------------------------------------------------ */}
      {/* Hero Section                                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Mein Verlauf</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Hier siehst du deine bisherigen Aktivitaeten auf BescheidBoxer — Chat-Nachrichten,
            Widersprueche, Rechner-Ergebnisse und mehr. Alles wird lokal in deinem Browser
            gespeichert.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* ---------------------------------------------------------------- */}
        {/* Empty State                                                      */}
        {/* ---------------------------------------------------------------- */}
        {!hasAnyActivity && !hasRechnerResults && (
          <div className="text-center py-16">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Noch kein Verlauf vorhanden</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Sobald du den Chat nutzt, Bescheide scannst oder Rechner verwendest,
              erscheinen deine Aktivitaeten hier.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/chat">
                <Button className="gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Chat starten
                </Button>
              </Link>
              <Link to="/scan">
                <Button variant="outline" className="gap-2">
                  <ScanSearch className="h-4 w-4" />
                  Bescheid scannen
                </Button>
              </Link>
              <Link to="/rechner">
                <Button variant="outline" className="gap-2">
                  <Calculator className="h-4 w-4" />
                  Rechner nutzen
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Activity Groups by Date                                          */}
        {/* ---------------------------------------------------------------- */}
        {hasAnyActivity && (
          <div className="space-y-6">
            {groupOrder.map((groupKey) => {
              const items = grouped[groupKey]
              if (!items || items.length === 0) return null

              return (
                <div key={groupKey}>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    {DATE_GROUP_LABELS[groupKey]}
                  </h2>
                  <div className="space-y-3">
                    {items.map((activity) => (
                      <Card key={activity.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-muted shrink-0">
                              {activityIcon(activity.type)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <h3 className="text-sm font-semibold truncate">
                                    {activity.title}
                                  </h3>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {activity.description}
                                  </p>
                                </div>
                                <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                                  {formatTime(activity.timestamp)}
                                  {getDateGroup(activity.timestamp) === 'aeltere' && (
                                    <span className="ml-1">
                                      ({formatDate(activity.timestamp)})
                                    </span>
                                  )}
                                </span>
                              </div>

                              {/* Link */}
                              {activity.link && (
                                <Link
                                  to={activity.link}
                                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                                >
                                  Oeffnen
                                  <span aria-hidden="true">&rarr;</span>
                                </Link>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Rechner-Ergebnisse Section                                       */}
        {/* ---------------------------------------------------------------- */}
        {hasRechnerResults && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-amber-500" />
              Rechner-Ergebnisse
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rechnerVerlauf.map((entry) => (
                <Card key={entry.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-amber-50 dark:bg-amber-900/20 shrink-0">
                          <Calculator className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold">{entry.rechnerName}</h3>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(new Date(entry.datum))}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Result values */}
                    <div className="space-y-1.5 mb-4">
                      {Object.entries(entry.ergebnis).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-muted-foreground">{key}</span>
                          <span className="font-medium">{value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Erneut berechnen link */}
                    <Link to={`/rechner/${entry.rechnerSlug}`}>
                      <Button variant="outline" size="sm" className="w-full gap-2">
                        <Calculator className="h-3.5 w-3.5" />
                        Erneut berechnen
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Verlauf loeschen                                                 */}
        {/* ---------------------------------------------------------------- */}
        {(hasAnyActivity || hasRechnerResults) && (
          <div className="border-t pt-6">
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                    <div>
                      <h3 className="text-sm font-semibold">Verlauf loeschen</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Loescht Chat-Verlauf, Widerspruch-Tracker-Eintraege und
                        gespeicherte Rechner-Ergebnisse aus deinem Browser.
                        Cookie-Einstellungen bleiben erhalten.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2 shrink-0"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Verlauf loeschen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Confirmation Modal Overlay                                         */}
      {/* ------------------------------------------------------------------ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-xl border bg-card p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <h2 className="text-lg font-semibold">Verlauf wirklich loeschen?</h2>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
              Diese Aktion loescht deinen gesamten Chat-Verlauf, alle Widerspruch-Tracker-Eintraege
              und gespeicherte Rechner-Ergebnisse unwiderruflich aus deinem Browser. Cookie-Einstellungen
              bleiben erhalten.
            </p>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Abbrechen
              </Button>
              <Button
                variant="destructive"
                className="gap-2"
                onClick={handleDeleteHistory}
              >
                <Trash2 className="h-4 w-4" />
                Ja, loeschen
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
