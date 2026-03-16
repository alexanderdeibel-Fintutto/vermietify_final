import { useState } from 'react'
import { Link } from 'react-router-dom'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import {
  FileText,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  Calendar,
  Trash2,
  Edit3,
  ChevronRight,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  ergebnis?: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'bescheidboxer_widersprueche'

const TYP_LABELS: Record<WiderspruchEntry['typ'], string> = {
  widerspruch: 'Widerspruch',
  klage: 'Klage',
  ueberpruefung: 'Ueberpruefungsantrag',
  eilantrag: 'Eilantrag',
  beschwerde: 'Beschwerde',
}

const STATUS_LABELS: Record<WiderspruchEntry['status'], string> = {
  eingereicht: 'Eingereicht',
  in_bearbeitung: 'In Bearbeitung',
  beschieden: 'Beschieden',
  erledigt: 'Erledigt',
  abgelehnt: 'Abgelehnt',
}

const STATUS_OPTIONS: WiderspruchEntry['status'][] = [
  'eingereicht',
  'in_bearbeitung',
  'beschieden',
  'erledigt',
  'abgelehnt',
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadEntries(): WiderspruchEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as WiderspruchEntry[]
  } catch {
    return []
  }
}

function saveEntries(entries: WiderspruchEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().split('T')[0]
}

function calcFristende(typ: WiderspruchEntry['typ'], bescheidDatum: string): string {
  switch (typ) {
    case 'widerspruch':
    case 'klage':
      return addMonths(bescheidDatum, 1)
    case 'ueberpruefung':
      return addMonths(bescheidDatum, 48)
    case 'beschwerde':
      return addMonths(bescheidDatum, 1)
    case 'eilantrag':
      // No fixed deadline -- default to +3 months as a soft reminder
      return addMonths(bescheidDatum, 3)
  }
}

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function statusBadgeClasses(status: WiderspruchEntry['status']): string {
  switch (status) {
    case 'eingereicht':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
    case 'in_bearbeitung':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
    case 'beschieden':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
    case 'erledigt':
      return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
    case 'abgelehnt':
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
  }
}

function typBadgeClasses(typ: WiderspruchEntry['typ']): string {
  switch (typ) {
    case 'widerspruch':
      return 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
    case 'klage':
      return 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
    case 'ueberpruefung':
      return 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800'
    case 'eilantrag':
      return 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800'
    case 'beschwerde':
      return 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800'
  }
}

function fristColorClasses(days: number): string {
  if (days < 0) return 'text-red-600 dark:text-red-400 font-bold'
  if (days < 7) return 'text-red-600 dark:text-red-400 font-semibold'
  if (days < 14) return 'text-amber-600 dark:text-amber-400 font-medium'
  return 'text-green-600 dark:text-green-400'
}

function sortEntries(entries: WiderspruchEntry[]): WiderspruchEntry[] {
  return [...entries].sort((a, b) => {
    // Primary: fristende soonest first
    const fristCmp = new Date(a.fristende).getTime() - new Date(b.fristende).getTime()
    if (fristCmp !== 0) return fristCmp
    // Secondary: eingereichtAm newest first
    return new Date(b.eingereichtAm).getTime() - new Date(a.eingereichtAm).getTime()
  })
}

// ---------------------------------------------------------------------------
// ICS Calendar Export
// ---------------------------------------------------------------------------

function toIcsDate(dateStr: string): string {
  return dateStr.replace(/-/g, '') + 'T090000'
}

function exportToIcs(entries: WiderspruchEntry[]) {
  const aktive = entries.filter(
    (e) => e.status === 'eingereicht' || e.status === 'in_bearbeitung'
  )
  if (aktive.length === 0) return

  const events = aktive.map((e) => {
    const alarmDate = new Date(e.fristende)
    alarmDate.setDate(alarmDate.getDate() - 3)
    return [
      'BEGIN:VEVENT',
      `DTSTART:${toIcsDate(e.fristende)}`,
      `DTEND:${toIcsDate(e.fristende)}`,
      `SUMMARY:Frist: ${TYP_LABELS[e.typ]} - ${e.betreff}`,
      `DESCRIPTION:${TYP_LABELS[e.typ]}${e.aktenzeichen ? ' (Az: ' + e.aktenzeichen + ')' : ''}\\nStatus: ${STATUS_LABELS[e.status]}${e.notizen ? '\\n' + e.notizen : ''}`,
      'BEGIN:VALARM',
      'TRIGGER:-P3D',
      'ACTION:DISPLAY',
      'DESCRIPTION:Frist in 3 Tagen!',
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      'DESCRIPTION:Frist morgen!',
      'END:VALARM',
      `UID:bescheidboxer-${e.id}@fintutto.cloud`,
      'END:VEVENT',
    ].join('\r\n')
  })

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BescheidBoxer//Fristen//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:BescheidBoxer Fristen',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'bescheidboxer-fristen.ics'
  a.click()
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WiderspruchTracker() {
  useDocumentTitle('Widerspruch-Tracker - BescheidBoxer')
  const [entries, setEntries] = useState<WiderspruchEntry[]>(loadEntries)
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [statusDropdownId, setStatusDropdownId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Form state
  const [formTyp, setFormTyp] = useState<WiderspruchEntry['typ']>('widerspruch')
  const [formBetreff, setFormBetreff] = useState('')
  const [formBescheidDatum, setFormBescheidDatum] = useState('')
  const [formEingereichtAm, setFormEingereichtAm] = useState('')
  const [formAktenzeichen, setFormAktenzeichen] = useState('')
  const [formNotizen, setFormNotizen] = useState('')

  // Persist helper
  function persist(updated: WiderspruchEntry[]) {
    setEntries(updated)
    saveEntries(updated)
  }

  // Form handlers
  function resetForm() {
    setFormTyp('widerspruch')
    setFormBetreff('')
    setFormBescheidDatum('')
    setFormEingereichtAm('')
    setFormAktenzeichen('')
    setFormNotizen('')
  }

  function handleSave() {
    if (!formBetreff.trim() || !formBescheidDatum || !formEingereichtAm) return

    const entry: WiderspruchEntry = {
      id: generateId(),
      typ: formTyp,
      betreff: formBetreff.trim(),
      bescheidDatum: formBescheidDatum,
      eingereichtAm: formEingereichtAm,
      fristende: calcFristende(formTyp, formBescheidDatum),
      aktenzeichen: formAktenzeichen.trim() || undefined,
      status: 'eingereicht',
      notizen: formNotizen.trim() || undefined,
    }

    persist([...entries, entry])
    resetForm()
    setShowForm(false)
  }

  function handleDelete(id: string) {
    persist(entries.filter((e) => e.id !== id))
    setDeleteConfirmId(null)
  }

  function handleStatusChange(id: string, newStatus: WiderspruchEntry['status']) {
    persist(entries.map((e) => (e.id === id ? { ...e, status: newStatus } : e)))
    setStatusDropdownId(null)
  }

  // Counts for overview
  const aktivCount = entries.filter(
    (e) => e.status === 'eingereicht' || e.status === 'in_bearbeitung'
  ).length
  const offenCount = entries.filter((e) => daysUntil(e.fristende) > 0).length
  const erfolgCount = entries.filter((e) => e.status === 'erledigt').length
  const abgelehntCount = entries.filter((e) => e.status === 'abgelehnt').length

  const sorted = sortEntries(entries)

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-background">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                             */}
      {/* ------------------------------------------------------------------ */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurueck zum Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-1">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Widerspruch-Tracker</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Behalte den Ueberblick ueber deine laufenden Verfahren
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* ---------------------------------------------------------------- */}
        {/* Status Overview Cards                                            */}
        {/* ---------------------------------------------------------------- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border bg-card p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{aktivCount}</p>
            <p className="text-xs text-muted-foreground">Aktiv</p>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{offenCount}</p>
            <p className="text-xs text-muted-foreground">Offen</p>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{erfolgCount}</p>
            <p className="text-xs text-muted-foreground">Erfolg</p>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{abgelehntCount}</p>
            <p className="text-xs text-muted-foreground">Abgelehnt</p>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Add New Entry Toggle                                             */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => setShowForm(!showForm)}
            className="gap-2"
            variant={showForm ? 'outline' : 'default'}
          >
            <Plus className="h-4 w-4" />
            {showForm ? 'Formular schliessen' : 'Neuen Eintrag hinzufuegen'}
          </Button>
          {entries.length > 0 && (
            <Button
              onClick={() => exportToIcs(entries)}
              variant="outline"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Fristen exportieren (.ics)
            </Button>
          )}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Add New Entry Form                                               */}
        {/* ---------------------------------------------------------------- */}
        {showForm && (
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" />
              Neues Verfahren eintragen
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Typ */}
              <div>
                <label className="block text-sm font-medium mb-1">Typ</label>
                <select
                  value={formTyp}
                  onChange={(e) => setFormTyp(e.target.value as WiderspruchEntry['typ'])}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="widerspruch">Widerspruch</option>
                  <option value="klage">Klage</option>
                  <option value="ueberpruefung">Ueberpruefungsantrag</option>
                  <option value="eilantrag">Eilantrag</option>
                  <option value="beschwerde">Beschwerde</option>
                </select>
              </div>

              {/* Betreff */}
              <div>
                <label className="block text-sm font-medium mb-1">Betreff</label>
                <input
                  type="text"
                  value={formBetreff}
                  onChange={(e) => setFormBetreff(e.target.value)}
                  placeholder="z.B. Bewilligungsbescheid Januar 2026"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
              </div>

              {/* Bescheid-Datum */}
              <div>
                <label className="block text-sm font-medium mb-1">Bescheid-Datum</label>
                <input
                  type="date"
                  value={formBescheidDatum}
                  onChange={(e) => setFormBescheidDatum(e.target.value)}
                  max={todayStr}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
              </div>

              {/* Eingereicht am */}
              <div>
                <label className="block text-sm font-medium mb-1">Eingereicht am</label>
                <input
                  type="date"
                  value={formEingereichtAm}
                  onChange={(e) => setFormEingereichtAm(e.target.value)}
                  max={todayStr}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
              </div>

              {/* Aktenzeichen */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Aktenzeichen <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formAktenzeichen}
                  onChange={(e) => setFormAktenzeichen(e.target.value)}
                  placeholder="z.B. W-1234/26"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
              </div>
            </div>

            {/* Notizen */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Notizen <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <textarea
                value={formNotizen}
                onChange={(e) => setFormNotizen(e.target.value)}
                rows={3}
                placeholder="Zusaetzliche Hinweise oder Notizen zu diesem Verfahren..."
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-y"
              />
            </div>

            {/* Auto-calculated Fristende preview */}
            {formBescheidDatum && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                <Calendar className="h-4 w-4" />
                <span>
                  Berechnetes Fristende:{' '}
                  <span className="font-medium text-foreground">
                    {formatDate(calcFristende(formTyp, formBescheidDatum))}
                  </span>
                  {formTyp === 'eilantrag' && (
                    <span className="text-xs ml-1">(Richtwert, keine feste Frist)</span>
                  )}
                </span>
              </div>
            )}

            {/* Save */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSave}
                disabled={!formBetreff.trim() || !formBescheidDatum || !formEingereichtAm}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Speichern
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  resetForm()
                  setShowForm(false)
                }}
              >
                Abbrechen
              </Button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Entry List                                                       */}
        {/* ---------------------------------------------------------------- */}
        {sorted.length > 0 ? (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">
              Deine Verfahren ({entries.length})
            </h2>

            {sorted.map((entry) => {
              const days = daysUntil(entry.fristende)
              const isExpanded = expandedId === entry.id
              const showStatusDropdown = statusDropdownId === entry.id
              const showDeleteConfirm = deleteConfirmId === entry.id

              return (
                <div
                  key={entry.id}
                  className="rounded-xl border bg-card overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="p-4">
                    <div className="flex flex-wrap items-start gap-2 mb-3">
                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${statusBadgeClasses(entry.status)}`}
                      >
                        {STATUS_LABELS[entry.status]}
                      </span>
                      {/* Typ Badge */}
                      <span
                        className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${typBadgeClasses(entry.typ)}`}
                      >
                        {TYP_LABELS[entry.typ]}
                      </span>
                    </div>

                    {/* Betreff */}
                    <h3 className="font-semibold text-base mb-2">{entry.betreff}</h3>

                    {/* Meta row */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        Eingereicht: {formatDate(entry.eingereichtAm)}
                      </span>
                      <span className={`flex items-center gap-1 ${fristColorClasses(days)}`}>
                        <Clock className="h-3.5 w-3.5" />
                        Frist: {formatDate(entry.fristende)}
                        {days < 0
                          ? ` (${Math.abs(days)} Tage ueberschritten)`
                          : days === 0
                            ? ' (heute!)'
                            : ` (noch ${days} Tage)`}
                      </span>
                      {entry.aktenzeichen && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <FileText className="h-3.5 w-3.5" />
                          Az: {entry.aktenzeichen}
                        </span>
                      )}
                    </div>

                    {/* Expandable Notizen toggle */}
                    {entry.notizen && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                        className="flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                      >
                        <ChevronRight
                          className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        />
                        {isExpanded ? 'Notizen ausblenden' : 'Notizen anzeigen'}
                      </button>
                    )}
                  </div>

                  {/* Expanded Notizen */}
                  {isExpanded && entry.notizen && (
                    <div className="px-4 pb-4">
                      <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground whitespace-pre-wrap">
                        {entry.notizen}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="border-t px-4 py-3 flex flex-wrap items-center gap-2 bg-muted/20">
                    {/* Status Change */}
                    <div className="relative">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-xs"
                        onClick={() =>
                          setStatusDropdownId(showStatusDropdown ? null : entry.id)
                        }
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Status aendern
                      </Button>
                      {showStatusDropdown && (
                        <div className="absolute left-0 top-full mt-1 z-10 rounded-lg border bg-card shadow-lg py-1 min-w-[180px]">
                          {STATUS_OPTIONS.map((s) => (
                            <button
                              key={s}
                              onClick={() => handleStatusChange(entry.id, s)}
                              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors ${
                                entry.status === s ? 'font-semibold text-primary' : ''
                              }`}
                            >
                              {STATUS_LABELS[s]}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Delete */}
                    {!showDeleteConfirm ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={() => setDeleteConfirmId(entry.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Loeschen
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-red-600 font-medium">Wirklich loeschen?</span>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => handleDelete(entry.id)}
                        >
                          Ja, loeschen
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => setDeleteConfirmId(null)}
                        >
                          Abbrechen
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Noch keine Widersprueche eingetragen</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Trage deine laufenden Verfahren ein, um Fristen im Blick zu behalten. Oder erstelle
              zuerst ein Musterschreiben.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Eintrag hinzufuegen
              </Button>
              <Link to="/musterschreiben">
                <Button variant="outline" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Musterschreiben ansehen
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* CTA Section                                                      */}
        {/* ---------------------------------------------------------------- */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="font-semibold text-lg mb-4">Weitere Werkzeuge</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link to="/musterschreiben">
              <Button variant="outline" className="w-full justify-start gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                Neues Schreiben erstellen
                <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
              </Button>
            </Link>
            <Link to="/rechner/fristen">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Calendar className="h-4 w-4 text-amber-500" />
                Frist berechnen
                <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
              </Button>
            </Link>
            <Link to="/chat">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Clock className="h-4 w-4 text-green-500" />
                KI-Berater fragen
                <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
