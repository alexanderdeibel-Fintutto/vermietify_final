import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import Breadcrumbs from '@/components/Breadcrumbs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Briefcase,
  AlertTriangle,
  Calendar,
  FileText,
  Clock,
  ArrowUpDown,
  Filter,
  ChevronRight,
  Hash,
  FolderOpen,
  CalendarClock,
  Scale,
  ExternalLink,
  Info,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Widerspruch {
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

interface AktenzeichenEntry {
  id: string
  nummer: string
  behoerde: string
  art: string
  datum: string
  notiz: string
}

interface AktenzeichenData {
  aktenzeichen: AktenzeichenEntry[]
  sachbearbeiter: unknown[]
}

interface Termin {
  id: string
  titel: string
  datum: string
  uhrzeit: string
  ort: string
  art: string
  sachbearbeiter: string
  vorbereitung: string
  erledigt: boolean
  notizen: string
}

interface Dokument {
  id: string
  name: string
  kategorie: string
  datum: string
}

interface Fall {
  widerspruch: Widerspruch
  relatedAktenzeichen: AktenzeichenEntry[]
  relatedTermine: Termin[]
  relatedDokumente: Dokument[]
  fristTage: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TYP_LABELS: Record<string, string> = {
  widerspruch: 'Widerspruch',
  klage: 'Klage',
  ueberpruefung: 'Ueberpruefungsantrag',
  eilantrag: 'Eilantrag',
  beschwerde: 'Beschwerde',
}

const TYP_BADGE_CLASSES: Record<string, string> = {
  widerspruch:
    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
  klage:
    'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
  ueberpruefung:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
  eilantrag:
    'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
  beschwerde:
    'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
}

const STATUS_LABELS: Record<string, string> = {
  eingereicht: 'Eingereicht',
  in_bearbeitung: 'In Bearbeitung',
  beschieden: 'Beschieden',
  erledigt: 'Erledigt',
  abgelehnt: 'Abgelehnt',
}

const STATUS_BADGE_CLASSES: Record<string, string> = {
  eingereicht: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  in_bearbeitung: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  beschieden: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  erledigt: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  abgelehnt: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
}

type StatusFilter = 'alle' | 'offen' | 'erledigt'
type SortMode = 'fristende' | 'datum'

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

function loadWidersprueche(): Widerspruch[] {
  try {
    const raw = localStorage.getItem('bescheidboxer_widersprueche')
    if (!raw) return []
    return JSON.parse(raw) as Widerspruch[]
  } catch {
    return []
  }
}

function loadAktenzeichen(): AktenzeichenEntry[] {
  try {
    const raw = localStorage.getItem('bescheidboxer_aktenzeichen')
    if (!raw) return []
    const parsed = JSON.parse(raw)
    // The AktenzeichenPage stores as { aktenzeichen: [...], sachbearbeiter: [...] }
    if (Array.isArray(parsed)) return parsed as AktenzeichenEntry[]
    if (parsed && Array.isArray((parsed as AktenzeichenData).aktenzeichen)) {
      return (parsed as AktenzeichenData).aktenzeichen
    }
    return []
  } catch {
    return []
  }
}

function loadTermine(): Termin[] {
  try {
    const raw = localStorage.getItem('bescheidboxer_termine')
    if (!raw) return []
    return JSON.parse(raw) as Termin[]
  } catch {
    return []
  }
}

function loadDokumente(): Dokument[] {
  try {
    const raw = localStorage.getItem('bescheidboxer_dokumente')
    if (!raw) return []
    return JSON.parse(raw) as Dokument[]
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDateDE(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function isUpcoming(datum: string, uhrzeit: string): boolean {
  const now = new Date()
  const terminDate = new Date(`${datum}T${uhrzeit || '00:00'}:00`)
  return terminDate.getTime() >= now.getTime()
}

function textContainsKeyword(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase()
  return keywords.some((kw) => kw.length > 2 && lower.includes(kw.toLowerCase()))
}

function extractKeywords(widerspruch: Widerspruch): string[] {
  const parts: string[] = []
  if (widerspruch.betreff) {
    parts.push(
      ...widerspruch.betreff
        .split(/[\s,;./\-()]+/)
        .filter((w) => w.length > 2)
    )
  }
  if (widerspruch.notizen) {
    parts.push(
      ...widerspruch.notizen
        .split(/[\s,;./\-()]+/)
        .filter((w) => w.length > 2)
    )
  }
  return [...new Set(parts)]
}

function fristColorClass(days: number): string {
  if (days < 0) return 'text-red-600 dark:text-red-400'
  if (days < 7) return 'text-red-600 dark:text-red-400'
  if (days < 14) return 'text-amber-600 dark:text-amber-400'
  return 'text-green-600 dark:text-green-400'
}

function fristBgClass(days: number): string {
  if (days < 0) return 'bg-red-50 dark:bg-red-950/30'
  if (days < 7) return 'bg-red-50 dark:bg-red-950/30'
  if (days < 14) return 'bg-amber-50 dark:bg-amber-950/30'
  return 'bg-green-50 dark:bg-green-950/30'
}

function fristText(days: number): string {
  if (days < 0) return `${Math.abs(days)} Tage ueberschritten`
  if (days === 0) return 'Heute!'
  if (days === 1) return 'Morgen'
  return `Noch ${days} Tage`
}

function getNextTermin(termine: Termin[]): Termin | null {
  const upcoming = termine
    .filter((t) => !t.erledigt && isUpcoming(t.datum, t.uhrzeit))
    .sort((a, b) => {
      const da = new Date(`${a.datum}T${a.uhrzeit || '00:00'}:00`).getTime()
      const db = new Date(`${b.datum}T${b.uhrzeit || '00:00'}:00`).getTime()
      return da - db
    })
  return upcoming[0] ?? null
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MeineFaellePage() {
  useDocumentTitle('Meine Faelle - BescheidBoxer')

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('alle')
  const [sortMode, setSortMode] = useState<SortMode>('fristende')

  // Load all data sources
  const widersprueche = useMemo(() => loadWidersprueche(), [])
  const aktenzeichen = useMemo(() => loadAktenzeichen(), [])
  const termine = useMemo(() => loadTermine(), [])
  const dokumente = useMemo(() => loadDokumente(), [])

  const hasAnyData =
    widersprueche.length > 0 ||
    aktenzeichen.length > 0 ||
    termine.length > 0 ||
    dokumente.length > 0

  // Build Fall objects from Widersprueche, linking related data
  const faelle: Fall[] = useMemo(() => {
    const usedAktenzeichenIds = new Set<string>()
    const usedTerminIds = new Set<string>()
    const usedDokumentIds = new Set<string>()

    const result = widersprueche.map((w) => {
      const keywords = extractKeywords(w)

      // Match Aktenzeichen by behoerde appearing in betreff/notizen,
      // or if the widerspruch has an aktenzeichen field matching nummer
      const relatedAz = aktenzeichen.filter((az) => {
        if (w.aktenzeichen && az.nummer === w.aktenzeichen) return true
        if (
          az.behoerde &&
          textContainsKeyword(
            [w.betreff, w.notizen ?? ''].join(' '),
            [az.behoerde]
          )
        )
          return true
        if (textContainsKeyword(az.notiz || '', keywords)) return true
        return false
      })
      relatedAz.forEach((az) => usedAktenzeichenIds.add(az.id))

      // Match Termine by keyword overlap with titel
      const relatedTerm = termine.filter((t) => {
        if (textContainsKeyword(t.titel, keywords)) return true
        if (t.sachbearbeiter && textContainsKeyword(w.betreff, [t.sachbearbeiter]))
          return true
        return false
      })
      relatedTerm.forEach((t) => usedTerminIds.add(t.id))

      // Match Dokumente by keyword overlap with name or kategorie
      const relatedDok = dokumente.filter((d) => {
        if (textContainsKeyword(d.name, keywords)) return true
        return false
      })
      relatedDok.forEach((d) => usedDokumentIds.add(d.id))

      return {
        widerspruch: w,
        relatedAktenzeichen: relatedAz,
        relatedTermine: relatedTerm.sort((a, b) => {
          const da = new Date(`${a.datum}T${a.uhrzeit || '00:00'}:00`).getTime()
          const db = new Date(`${b.datum}T${b.uhrzeit || '00:00'}:00`).getTime()
          return da - db
        }),
        relatedDokumente: relatedDok,
        fristTage: daysUntil(w.fristende),
      }
    })

    return result
  }, [widersprueche, aktenzeichen, termine, dokumente])

  // Standalone items not linked to any Fall
  const standaloneAktenzeichen = useMemo(() => {
    const usedIds = new Set<string>()
    faelle.forEach((f) => f.relatedAktenzeichen.forEach((az) => usedIds.add(az.id)))
    return aktenzeichen.filter((az) => !usedIds.has(az.id))
  }, [aktenzeichen, faelle])

  const standaloneTermine = useMemo(() => {
    const usedIds = new Set<string>()
    faelle.forEach((f) => f.relatedTermine.forEach((t) => usedIds.add(t.id)))
    return termine.filter((t) => !usedIds.has(t.id))
  }, [termine, faelle])

  const standaloneDokumente = useMemo(() => {
    const usedIds = new Set<string>()
    faelle.forEach((f) => f.relatedDokumente.forEach((d) => usedIds.add(d.id)))
    return dokumente.filter((d) => !usedIds.has(d.id))
  }, [dokumente, faelle])

  const hasStandaloneItems =
    standaloneAktenzeichen.length > 0 ||
    standaloneTermine.length > 0 ||
    standaloneDokumente.length > 0

  // Filter faelle by status
  const filteredFaelle = useMemo(() => {
    let filtered = faelle
    if (statusFilter === 'offen') {
      filtered = faelle.filter(
        (f) =>
          f.widerspruch.status === 'eingereicht' ||
          f.widerspruch.status === 'in_bearbeitung' ||
          f.widerspruch.status === 'beschieden'
      )
    } else if (statusFilter === 'erledigt') {
      filtered = faelle.filter(
        (f) =>
          f.widerspruch.status === 'erledigt' ||
          f.widerspruch.status === 'abgelehnt'
      )
    }

    // Sort
    return [...filtered].sort((a, b) => {
      if (sortMode === 'fristende') {
        return (
          new Date(a.widerspruch.fristende).getTime() -
          new Date(b.widerspruch.fristende).getTime()
        )
      }
      return (
        new Date(b.widerspruch.eingereichtAm).getTime() -
        new Date(a.widerspruch.eingereichtAm).getTime()
      )
    })
  }, [faelle, statusFilter, sortMode])

  // Summary stats
  const offeneWidersprueche = widersprueche.filter(
    (w) =>
      w.status === 'eingereicht' ||
      w.status === 'in_bearbeitung'
  ).length

  const nextTermin = getNextTermin(termine)

  // -------------------------------------------------------------------------
  // Empty State
  // -------------------------------------------------------------------------

  if (!hasAnyData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
        <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Meine Faelle' },
            ]}
            className="mb-4"
          />

          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-boxer rounded-full mb-6">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              Noch keine Faelle vorhanden
            </h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto mb-8 leading-relaxed">
              Sobald Sie Widersprueche, Aktenzeichen, Termine oder Dokumente anlegen,
              werden diese hier automatisch als Faelle zusammengefuehrt und uebersichtlich
              dargestellt.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/tracker">
                <Button className="gap-2">
                  <Scale className="h-4 w-4" />
                  Widerspruch-Tracker
                </Button>
              </Link>
              <Link to="/termine">
                <Button variant="outline" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Termine verwalten
                </Button>
              </Link>
              <Link to="/dokumente">
                <Button variant="outline" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Dokumente ablegen
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Main Render
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Meine Faelle' },
          ]}
          className="mb-4"
        />

        {/* ---------------------------------------------------------------- */}
        {/* Hero Header                                                      */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex items-center gap-4 mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-boxer rounded-2xl shadow-lg">
            <Briefcase className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Meine Faelle
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Alle Vorgaenge auf einen Blick
            </p>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Zusammenfassung Cards                                            */}
        {/* ---------------------------------------------------------------- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Briefcase className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {widersprueche.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {widersprueche.length === 1 ? 'Fall' : 'Faelle'} gesamt
              </p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 dark:border-amber-800/50">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {offeneWidersprueche}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Offene Verfahren</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 dark:border-blue-800/50">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <CalendarClock className="h-5 w-5 text-blue-500" />
              </div>
              {nextTermin ? (
                <>
                  <p className="text-sm font-bold text-blue-600 dark:text-blue-400 truncate">
                    {formatDateDE(nextTermin.datum)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {nextTermin.titel}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-400 dark:text-gray-500">--</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Kein Termin</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-800/50">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <FileText className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {dokumente.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Dokumente</p>
            </CardContent>
          </Card>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Filter & Sort Controls                                           */}
        {/* ---------------------------------------------------------------- */}
        {widersprueche.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <div className="flex gap-1.5">
                {(
                  [
                    { key: 'alle', label: 'Alle' },
                    { key: 'offen', label: 'Offen' },
                    { key: 'erledigt', label: 'Erledigt' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setStatusFilter(opt.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      statusFilter === opt.key
                        ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Mode */}
            <div className="flex items-center gap-2 sm:ml-auto">
              <ArrowUpDown className="h-4 w-4 text-gray-400" />
              <div className="flex gap-1.5">
                {(
                  [
                    { key: 'fristende', label: 'Fristende' },
                    { key: 'datum', label: 'Datum' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setSortMode(opt.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      sortMode === opt.key
                        ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Fall-Karten                                                      */}
        {/* ---------------------------------------------------------------- */}
        {filteredFaelle.length > 0 && (
          <div className="space-y-5 mb-10">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Scale className="h-5 w-5 text-gray-500" />
              Verfahren
              <span className="text-sm font-normal text-gray-500">
                ({filteredFaelle.length})
              </span>
            </h2>

            {filteredFaelle.map((fall) => {
              const w = fall.widerspruch
              const days = fall.fristTage
              const isActive =
                w.status === 'eingereicht' || w.status === 'in_bearbeitung'

              return (
                <Card
                  key={w.id}
                  className={`overflow-hidden transition-all hover:shadow-md ${
                    isActive && days < 7
                      ? 'border-red-200 dark:border-red-800/50'
                      : ''
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-start gap-2 mb-2">
                      {/* Typ Badge */}
                      <Badge
                        variant="outline"
                        className={
                          TYP_BADGE_CLASSES[w.typ] ??
                          'bg-gray-50 text-gray-700 border-gray-200'
                        }
                      >
                        {TYP_LABELS[w.typ] ?? w.typ}
                      </Badge>

                      {/* Status Badge */}
                      <Badge
                        className={`border-0 ${
                          STATUS_BADGE_CLASSES[w.status] ??
                          'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {STATUS_LABELS[w.status] ?? w.status}
                      </Badge>
                    </div>

                    <CardTitle className="text-base sm:text-lg">
                      {w.betreff}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Meta: dates & Frist */}
                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                      <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                        <Calendar className="h-3.5 w-3.5" />
                        Eingereicht: {formatDateDE(w.eingereichtAm)}
                      </span>

                      {w.aktenzeichen && (
                        <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                          <Hash className="h-3.5 w-3.5" />
                          Az: {w.aktenzeichen}
                        </span>
                      )}
                    </div>

                    {/* Frist countdown */}
                    {isActive && (
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${fristBgClass(days)} ${fristColorClass(days)}`}
                      >
                        <Clock className="h-4 w-4" />
                        <span>
                          Frist: {formatDateDE(w.fristende)}
                          {' - '}
                          <span className="font-semibold">{fristText(days)}</span>
                        </span>
                        {days < 7 && days >= 0 && (
                          <AlertTriangle className="h-4 w-4" />
                        )}
                      </div>
                    )}

                    {/* Related Aktenzeichen */}
                    {fall.relatedAktenzeichen.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Verknuepfte Aktenzeichen
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {fall.relatedAktenzeichen.map((az) => (
                            <span
                              key={az.id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 font-mono"
                            >
                              <Hash className="h-3 w-3 text-gray-400" />
                              {az.nummer}
                              {az.behoerde && (
                                <span className="text-gray-400 dark:text-gray-500 font-sans text-xs">
                                  ({az.behoerde})
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Related Termine */}
                    {fall.relatedTermine.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Verknuepfte Termine
                        </p>
                        <div className="space-y-1">
                          {fall.relatedTermine
                            .filter((t) => isUpcoming(t.datum, t.uhrzeit) && !t.erledigt)
                            .slice(0, 3)
                            .map((t) => (
                              <div
                                key={t.id}
                                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                              >
                                <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                <span>
                                  {formatDateDE(t.datum)}{' '}
                                  {t.uhrzeit && `um ${t.uhrzeit} Uhr`}
                                </span>
                                <span className="text-gray-400 dark:text-gray-500">-</span>
                                <span className="truncate">{t.titel}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Related Dokumente count */}
                    {fall.relatedDokumente.length > 0 && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                        <FileText className="h-3.5 w-3.5" />
                        <span>
                          {fall.relatedDokumente.length}{' '}
                          {fall.relatedDokumente.length === 1
                            ? 'verknuepftes Dokument'
                            : 'verknuepfte Dokumente'}
                        </span>
                      </div>
                    )}

                    {/* Link to tracker */}
                    <div className="pt-1">
                      <Link to="/tracker">
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Im Tracker ansehen
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* No faelle match the current filter */}
        {widersprueche.length > 0 && filteredFaelle.length === 0 && (
          <div className="text-center py-12 mb-10">
            <Filter className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Keine Faelle fuer diesen Filter
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Aendern Sie den Filter, um alle Faelle anzuzeigen.
            </p>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Standalone Items (not linked to any Fall)                        */}
        {/* ---------------------------------------------------------------- */}
        {hasStandaloneItems && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-gray-500" />
              Weitere Eintraege
              <span className="text-sm font-normal text-gray-500">
                (keinem Fall zugeordnet)
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Standalone Aktenzeichen */}
              {standaloneAktenzeichen.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Hash className="h-4 w-4 text-gray-500" />
                      Aktenzeichen
                      <Badge variant="secondary" className="text-xs ml-auto">
                        {standaloneAktenzeichen.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {standaloneAktenzeichen.slice(0, 5).map((az) => (
                      <div
                        key={az.id}
                        className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <span className="font-mono font-medium">{az.nummer}</span>
                        {az.behoerde && (
                          <span className="text-xs text-gray-400 dark:text-gray-500 truncate">
                            {az.behoerde}
                          </span>
                        )}
                      </div>
                    ))}
                    {standaloneAktenzeichen.length > 5 && (
                      <p className="text-xs text-gray-400">
                        + {standaloneAktenzeichen.length - 5} weitere
                      </p>
                    )}
                    <Link to="/aktenzeichen">
                      <Button variant="ghost" size="sm" className="gap-1 text-xs mt-1">
                        Alle anzeigen
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {/* Standalone Termine */}
              {standaloneTermine.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      Termine
                      <Badge variant="secondary" className="text-xs ml-auto">
                        {standaloneTermine.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {standaloneTermine
                      .filter((t) => !t.erledigt)
                      .sort((a, b) => {
                        const da = new Date(`${a.datum}T${a.uhrzeit || '00:00'}:00`).getTime()
                        const db = new Date(`${b.datum}T${b.uhrzeit || '00:00'}:00`).getTime()
                        return da - db
                      })
                      .slice(0, 5)
                      .map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                        >
                          <span className="text-gray-400 shrink-0">
                            {formatDateDE(t.datum)}
                          </span>
                          <span className="truncate">{t.titel}</span>
                        </div>
                      ))}
                    {standaloneTermine.length > 5 && (
                      <p className="text-xs text-gray-400">
                        + {standaloneTermine.length - 5} weitere
                      </p>
                    )}
                    <Link to="/termine">
                      <Button variant="ghost" size="sm" className="gap-1 text-xs mt-1">
                        Alle anzeigen
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {/* Standalone Dokumente */}
              {standaloneDokumente.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      Dokumente
                      <Badge variant="secondary" className="text-xs ml-auto">
                        {standaloneDokumente.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {standaloneDokumente.slice(0, 5).map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <FileText className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{d.name}</span>
                        <span className="text-xs text-gray-400 shrink-0">
                          {formatDateDE(d.datum)}
                        </span>
                      </div>
                    ))}
                    {standaloneDokumente.length > 5 && (
                      <p className="text-xs text-gray-400">
                        + {standaloneDokumente.length - 5} weitere
                      </p>
                    )}
                    <Link to="/dokumente">
                      <Button variant="ghost" size="sm" className="gap-1 text-xs mt-1">
                        Alle anzeigen
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Tipp Box                                                         */}
        {/* ---------------------------------------------------------------- */}
        <Card className="mb-8 border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="p-4 sm:p-5">
            <div className="flex gap-3">
              <div className="shrink-0 mt-0.5">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <Info className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-1 text-sm">
                  Tipp: Faelle verknuepfen sich automatisch
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                  Diese Uebersicht verknuepft Ihre Widersprueche automatisch mit
                  passenden Aktenzeichen, Terminen und Dokumenten anhand uebereinstimmender
                  Begriffe. Je aussagekraeftiger Sie Betreff und Notizen formulieren,
                  desto besser funktioniert die Zuordnung. Eintraege ohne Zuordnung
                  erscheinen unter &quot;Weitere Eintraege&quot;.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ---------------------------------------------------------------- */}
        {/* Quick Links                                                      */}
        {/* ---------------------------------------------------------------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          <Link to="/tracker">
            <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
              <Scale className="h-4 w-4 text-blue-500 shrink-0" />
              <span className="text-left">
                <span className="block text-sm font-medium">Widerspruch-Tracker</span>
                <span className="block text-xs text-gray-400">Verfahren verwalten</span>
              </span>
            </Button>
          </Link>
          <Link to="/aktenzeichen">
            <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
              <Hash className="h-4 w-4 text-emerald-500 shrink-0" />
              <span className="text-left">
                <span className="block text-sm font-medium">Aktenzeichen</span>
                <span className="block text-xs text-gray-400">Nummern & Kontakte</span>
              </span>
            </Button>
          </Link>
          <Link to="/termine">
            <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
              <Calendar className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-left">
                <span className="block text-sm font-medium">Termine</span>
                <span className="block text-xs text-gray-400">Termine planen</span>
              </span>
            </Button>
          </Link>
          <Link to="/dokumente">
            <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
              <FileText className="h-4 w-4 text-purple-500 shrink-0" />
              <span className="text-left">
                <span className="block text-sm font-medium">Dokumente</span>
                <span className="block text-xs text-gray-400">Unterlagen ablegen</span>
              </span>
            </Button>
          </Link>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Footer                                                           */}
        {/* ---------------------------------------------------------------- */}
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-6 max-w-2xl mx-auto leading-relaxed">
          Alle Daten werden lokal in Ihrem Browser gespeichert und nicht an unsere
          Server uebertragen. Die automatische Verknuepfung erfolgt anhand von
          Textvergleichen und erhebt keinen Anspruch auf Vollstaendigkeit. Alle Angaben
          ohne Gewaehr - diese Seite ersetzt keine Rechtsberatung.
        </p>
      </div>
    </div>
  )
}
