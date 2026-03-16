import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Bell, AlertTriangle, Clock, Info, Lightbulb, CheckCheck, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import useDocumentTitle from '@/hooks/useDocumentTitle'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WiderspruchEntry {
  id: string
  typ: 'widerspruch' | 'klage' | 'ueberpruefung' | 'eilantrag' | 'beschwerde'
  betreff: string
  bescheidDatum: string
  eingereichtAm: string
  fristende: string
  aktenzeichen?: string
  status: 'eingereicht' | 'in_bearbeitung' | 'beschieden' | 'erledigt' | 'abgelehnt'
  notizen?: string
}

type NotificationType = 'frist' | 'system' | 'tipp'
type Severity = 'urgent' | 'warning' | 'info'
type FilterTab = 'alle' | 'fristen' | 'system' | 'tipps'

interface Notification {
  id: string
  type: NotificationType
  severity: Severity
  title: string
  description: string
  timestamp: Date
  actionLink: string
  actionLabel: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WIDERSPRUECHE_KEY = 'bescheidboxer_widersprueche'
const READ_KEY = 'bescheidboxer_notifications_read'

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'alle', label: 'Alle' },
  { key: 'fristen', label: 'Fristen' },
  { key: 'system', label: 'System' },
  { key: 'tipps', label: 'Tipps' },
]

const TYP_LABELS: Record<WiderspruchEntry['typ'], string> = {
  widerspruch: 'Widerspruch',
  klage: 'Klage',
  ueberpruefung: 'Ueberpruefungsantrag',
  eilantrag: 'Eilantrag',
  beschwerde: 'Beschwerde',
}

// ---------------------------------------------------------------------------
// Static system notifications (always present)
// ---------------------------------------------------------------------------

const SYSTEM_NOTIFICATIONS: Notification[] = [
  {
    id: 'sys-welcome',
    type: 'system',
    severity: 'info',
    title: 'Willkommen bei BescheidBoxer!',
    description:
      'Erfahre in unserem Wissensbereich alles ueber deine Rechte bei Buergergeld, Widerspruch und Klage.',
    timestamp: new Date('2026-01-01T10:00:00'),
    actionLink: '/wissen',
    actionLabel: 'Zum Wissensbereich',
  },
  {
    id: 'sys-rechner',
    type: 'system',
    severity: 'info',
    title: 'Neue Rechner verfuegbar: Erstausstattung & Umzugskosten',
    description:
      'Berechne deinen Anspruch auf Erstausstattung oder pruefe, ob deine Umzugskosten uebernommen werden muessen.',
    timestamp: new Date('2026-01-15T09:00:00'),
    actionLink: '/rechner',
    actionLabel: 'Rechner oeffnen',
  },
  {
    id: 'sys-tipp-frist',
    type: 'tipp',
    severity: 'warning',
    title: 'Tipp: Pruefe jeden Bescheid innerhalb von 4 Wochen',
    description:
      'Die Widerspruchsfrist betraegt in der Regel einen Monat ab Zustellung. Scanne deinen Bescheid rechtzeitig, um keine Frist zu verpassen.',
    timestamp: new Date('2026-01-20T08:00:00'),
    actionLink: '/scan',
    actionLabel: 'Bescheid scannen',
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadWidersprueche(): WiderspruchEntry[] {
  try {
    const raw = localStorage.getItem(WIDERSPRUECHE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as WiderspruchEntry[]
  } catch {
    return []
  }
}

function loadReadIds(): string[] {
  try {
    const raw = localStorage.getItem(READ_KEY)
    if (!raw) return []
    return JSON.parse(raw) as string[]
  } catch {
    return []
  }
}

function saveReadIds(ids: string[]) {
  localStorage.setItem(READ_KEY, JSON.stringify(ids))
}

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function relativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMin / 60)
  const diffD = Math.floor(diffH / 24)

  if (diffMin < 1) return 'Gerade eben'
  if (diffMin < 60) return `Vor ${diffMin} Min.`
  if (diffH < 24) return `Vor ${diffH} Std.`
  if (diffD < 7) return `Vor ${diffD} ${diffD === 1 ? 'Tag' : 'Tagen'}`
  return formatDate(date)
}

function severityBorderClass(severity: Severity): string {
  switch (severity) {
    case 'urgent':
      return 'border-l-4 border-l-red-500'
    case 'warning':
      return 'border-l-4 border-l-amber-500'
    case 'info':
      return 'border-l-4 border-l-blue-500'
  }
}

function severityBadgeVariant(severity: Severity): string {
  switch (severity) {
    case 'urgent':
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
    case 'warning':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
    case 'info':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
  }
}

function severityLabel(severity: Severity): string {
  switch (severity) {
    case 'urgent':
      return 'Dringend'
    case 'warning':
      return 'Warnung'
    case 'info':
      return 'Info'
  }
}

function typeIcon(type: NotificationType, severity: Severity) {
  switch (type) {
    case 'frist':
      return severity === 'urgent' ? (
        <AlertTriangle className="h-5 w-5 text-red-500" />
      ) : (
        <Clock className="h-5 w-5 text-amber-500" />
      )
    case 'system':
      return <Info className="h-5 w-5 text-blue-500" />
    case 'tipp':
      return <Lightbulb className="h-5 w-5 text-amber-500" />
  }
}

function typeIconBg(type: NotificationType, severity: Severity): string {
  switch (type) {
    case 'frist':
      return severity === 'urgent'
        ? 'bg-red-100 dark:bg-red-900/30'
        : 'bg-amber-100 dark:bg-amber-900/30'
    case 'system':
      return 'bg-blue-100 dark:bg-blue-900/30'
    case 'tipp':
      return 'bg-amber-100 dark:bg-amber-900/30'
  }
}

// ---------------------------------------------------------------------------
// Build deadline notifications from Widerspruch entries
// ---------------------------------------------------------------------------

function buildFristNotifications(entries: WiderspruchEntry[]): Notification[] {
  const notifications: Notification[] = []
  const activeStatuses: WiderspruchEntry['status'][] = ['eingereicht', 'in_bearbeitung']

  for (const entry of entries) {
    if (!activeStatuses.includes(entry.status)) continue

    const days = daysUntil(entry.fristende)

    // Only generate notifications for upcoming or overdue deadlines (within 30 days or overdue)
    if (days > 30) continue

    let severity: Severity
    let title: string
    let description: string

    if (days < 0) {
      severity = 'urgent'
      title = `Frist abgelaufen: ${entry.betreff}`
      description = `Die Frist fuer deinen ${TYP_LABELS[entry.typ]} ist seit ${Math.abs(days)} ${Math.abs(days) === 1 ? 'Tag' : 'Tagen'} ueberschritten. Pruefe dringend, ob du noch handeln kannst.`
    } else if (days <= 3) {
      severity = 'urgent'
      title = `Frist in ${days} ${days === 1 ? 'Tag' : 'Tagen'}: ${entry.betreff}`
      description = `Dein ${TYP_LABELS[entry.typ]} laeuft am ${formatDate(new Date(entry.fristende))} ab. Handele jetzt!`
    } else if (days <= 7) {
      severity = 'warning'
      title = `Frist in ${days} Tagen: ${entry.betreff}`
      description = `Der ${TYP_LABELS[entry.typ]} muss bis ${formatDate(new Date(entry.fristende))} eingereicht sein.${entry.aktenzeichen ? ` Az: ${entry.aktenzeichen}` : ''}`
    } else {
      severity = 'info'
      title = `Frist in ${days} Tagen: ${entry.betreff}`
      description = `Der ${TYP_LABELS[entry.typ]} laeuft am ${formatDate(new Date(entry.fristende))} ab.${entry.aktenzeichen ? ` Az: ${entry.aktenzeichen}` : ''}`
    }

    // Use fristende as approximate timestamp for sorting
    const fristDate = new Date(entry.fristende)

    notifications.push({
      id: `frist-${entry.id}`,
      type: 'frist',
      severity,
      title,
      description,
      timestamp: fristDate,
      actionLink: '/tracker',
      actionLabel: 'Zum Tracker',
    })
  }

  return notifications
}

// ---------------------------------------------------------------------------
// Build tip notifications based on user activity
// ---------------------------------------------------------------------------

function buildTippNotifications(): Notification[] {
  const tipps: Notification[] = []

  // Check if user has any chat history
  try {
    const chatRaw = localStorage.getItem('bescheidboxer_chat_history')
    if (!chatRaw || JSON.parse(chatRaw).length === 0) {
      tipps.push({
        id: 'tipp-chat',
        type: 'tipp',
        severity: 'info',
        title: 'Tipp: Nutze den KI-Rechtsberater',
        description:
          'Stelle dem KI-Berater Fragen zu deinem Bescheid, Widerspruch oder Buergergeld-Anspruch — kostenlos im Schnupperer-Tarif.',
        timestamp: new Date(),
        actionLink: '/chat',
        actionLabel: 'Chat starten',
      })
    }
  } catch {
    // ignore
  }

  // Check if user has any Widerspruch entries
  try {
    const trackerRaw = localStorage.getItem(WIDERSPRUECHE_KEY)
    if (!trackerRaw || JSON.parse(trackerRaw).length === 0) {
      tipps.push({
        id: 'tipp-tracker',
        type: 'tipp',
        severity: 'info',
        title: 'Tipp: Behalte Fristen im Blick',
        description:
          'Erfasse deine laufenden Widersprueche und Klagen im Tracker, damit du keine Frist verpasst.',
        timestamp: new Date(),
        actionLink: '/tracker',
        actionLabel: 'Tracker oeffnen',
      })
    }
  } catch {
    // ignore
  }

  // Check if user has any rechner results
  try {
    const rechnerRaw = localStorage.getItem('bescheidboxer_rechner_verlauf')
    if (!rechnerRaw || JSON.parse(rechnerRaw).length === 0) {
      tipps.push({
        id: 'tipp-rechner',
        type: 'tipp',
        severity: 'info',
        title: 'Tipp: Berechne deinen Anspruch',
        description:
          'Mit unseren 10 Rechnern kannst du pruefen, ob dir mehr Buergergeld, Mehrbedarf oder Erstausstattung zusteht.',
        timestamp: new Date(),
        actionLink: '/rechner',
        actionLabel: 'Rechner ansehen',
      })
    }
  } catch {
    // ignore
  }

  return tipps
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BenachrichtigungenPage() {
  useDocumentTitle('Benachrichtigungen')

  const [readIds, setReadIds] = useState<string[]>(loadReadIds)
  const [activeTab, setActiveTab] = useState<FilterTab>('alle')

  // Build all notifications
  const [widersprueche, setWidersprueche] = useState<WiderspruchEntry[]>([])

  useEffect(() => {
    setWidersprueche(loadWidersprueche())
  }, [])

  const allNotifications = useMemo(() => {
    const fristNotifications = buildFristNotifications(widersprueche)
    const tippNotifications = buildTippNotifications()

    const all = [...fristNotifications, ...SYSTEM_NOTIFICATIONS, ...tippNotifications]

    // Sort: urgent first, then by date (newest/soonest first)
    all.sort((a, b) => {
      const severityOrder: Record<Severity, number> = { urgent: 0, warning: 1, info: 2 }
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity]
      if (severityDiff !== 0) return severityDiff
      return b.timestamp.getTime() - a.timestamp.getTime()
    })

    return all
  }, [widersprueche])

  // Filter by tab
  const filteredNotifications = useMemo(() => {
    if (activeTab === 'alle') return allNotifications
    const typeMap: Record<FilterTab, NotificationType | null> = {
      alle: null,
      fristen: 'frist',
      system: 'system',
      tipps: 'tipp',
    }
    const filterType = typeMap[activeTab]
    return allNotifications.filter((n) => n.type === filterType)
  }, [allNotifications, activeTab])

  // Unread count
  const unreadCount = allNotifications.filter((n) => !readIds.includes(n.id)).length

  // Mark single as read
  function markAsRead(id: string) {
    if (readIds.includes(id)) return
    const updated = [...readIds, id]
    setReadIds(updated)
    saveReadIds(updated)
  }

  // Mark all as read
  function markAllAsRead() {
    const allIds = allNotifications.map((n) => n.id)
    const merged = Array.from(new Set([...readIds, ...allIds]))
    setReadIds(merged)
    saveReadIds(merged)
  }

  // Count per tab for badges
  const tabCounts: Record<FilterTab, number> = useMemo(() => {
    const counts: Record<FilterTab, number> = { alle: 0, fristen: 0, system: 0, tipps: 0 }
    for (const n of allNotifications) {
      if (!readIds.includes(n.id)) {
        counts.alle++
        if (n.type === 'frist') counts.fristen++
        else if (n.type === 'system') counts.system++
        else if (n.type === 'tipp') counts.tipps++
      }
    }
    return counts
  }, [allNotifications, readIds])

  return (
    <div className="min-h-screen bg-background">
      {/* ------------------------------------------------------------------ */}
      {/* Hero Section                                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Benachrichtigungen</h1>
            {unreadCount > 0 && (
              <Badge className="bg-primary text-primary-foreground text-xs">
                {unreadCount} neu
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Fristenwarnungen, System-Hinweise und persoenliche Tipps — alles auf einen Blick.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* ---------------------------------------------------------------- */}
        {/* Filter Tabs + Mark All Read                                      */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`}
              >
                {tab.label}
                {tabCounts[tab.key] > 0 && (
                  <span
                    className={`inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full text-xs font-bold ${
                      activeTab === tab.key
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {tabCounts[tab.key]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 shrink-0"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-4 w-4" />
              Alle als gelesen markieren
            </Button>
          )}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Notification List                                                */}
        {/* ---------------------------------------------------------------- */}
        {filteredNotifications.length > 0 ? (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => {
              const isRead = readIds.includes(notification.id)

              return (
                <Card
                  key={notification.id}
                  className={`overflow-hidden transition-colors ${severityBorderClass(notification.severity)} ${
                    !isRead ? 'bg-primary/5' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className={`flex items-center justify-center h-10 w-10 rounded-xl shrink-0 ${typeIconBg(notification.type, notification.severity)}`}
                      >
                        {typeIcon(notification.type, notification.severity)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3
                                className={`text-sm leading-snug ${
                                  !isRead ? 'font-bold' : 'font-medium'
                                }`}
                              >
                                {notification.title}
                              </h3>
                              <span
                                className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${severityBadgeVariant(notification.severity)}`}
                              >
                                {severityLabel(notification.severity)}
                              </span>
                              {!isRead && (
                                <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {notification.description}
                            </p>
                          </div>

                          {/* Timestamp */}
                          <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0 pt-0.5">
                            {relativeTime(notification.timestamp)}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 mt-3">
                          <Link to={notification.actionLink}>
                            <Button
                              size="sm"
                              variant={notification.severity === 'urgent' ? 'destructive' : 'outline'}
                              className="gap-1.5 h-8 text-xs"
                              onClick={() => markAsRead(notification.id)}
                            >
                              {notification.actionLabel}
                            </Button>
                          </Link>
                          {!isRead && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              Als gelesen markieren
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          /* ---------------------------------------------------------------- */
          /* Empty State                                                      */
          /* ---------------------------------------------------------------- */
          <div className="text-center py-16">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Keine Benachrichtigungen</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {activeTab === 'alle'
                ? 'Es liegen aktuell keine Benachrichtigungen vor. Sobald sich etwas tut, wirst du hier informiert.'
                : `Keine Benachrichtigungen in der Kategorie "${FILTER_TABS.find((t) => t.key === activeTab)?.label}".`}
            </p>
            {activeTab !== 'alle' && (
              <Button variant="outline" onClick={() => setActiveTab('alle')}>
                Alle anzeigen
              </Button>
            )}
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Summary Footer                                                   */}
        {/* ---------------------------------------------------------------- */}
        {allNotifications.length > 0 && (
          <div className="text-center text-xs text-muted-foreground pt-4 border-t">
            {allNotifications.length} {allNotifications.length === 1 ? 'Benachrichtigung' : 'Benachrichtigungen'} insgesamt
            {unreadCount > 0 && ` — ${unreadCount} ungelesen`}
          </div>
        )}
      </div>
    </div>
  )
}
