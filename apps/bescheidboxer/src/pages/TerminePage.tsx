import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  AlertTriangle,
  Download,
  ChevronDown,
  ChevronUp,
  Info,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import Breadcrumbs from '@/components/Breadcrumbs'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Termin {
  id: string
  titel: string
  datum: string // ISO date
  uhrzeit: string // "HH:MM"
  ort: string
  art: 'einladung' | 'beratung' | 'massnahme' | 'mek' | 'wiederbewilligung' | 'sonstiges'
  sachbearbeiter: string
  vorbereitung: string // notes about what to prepare
  erledigt: boolean
  notizen: string // post-appointment notes
}

type TerminArt = Termin['art']

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'bescheidboxer_termine'

const TERMIN_ARTEN: { value: TerminArt; label: string; color: string; bgColor: string; borderColor: string }[] = [
  { value: 'einladung', label: 'Einladung', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  { value: 'beratung', label: 'Beratungsgespraech', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  { value: 'massnahme', label: 'Massnahme/Kurs', color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
  { value: 'mek', label: 'Meldetermin (MEK)', color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  { value: 'wiederbewilligung', label: 'Wiederbewilligung', color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
  { value: 'sonstiges', label: 'Sonstiges', color: 'text-gray-700', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' },
]

const TERMIN_ART_MAP = Object.fromEntries(
  TERMIN_ARTEN.map((a) => [a.value, a])
) as Record<TerminArt, (typeof TERMIN_ARTEN)[number]>

const VORBEREITUNG_CHECKLISTEN: Partial<Record<TerminArt, string[]>> = {
  einladung: ['Personalausweis', 'Kontoauszuege', 'Aktuelle Bescheide'],
  beratung: ['Fragen notieren', 'Bewerbungen mitbringen'],
  wiederbewilligung: ['Weiterbewilligungsantrag', 'Einkommensnachweise', 'Mietvertrag'],
  mek: ['Personalausweis', 'Meldeaufforderung'],
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

function loadTermine(): Termin[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Termin[]
  } catch {
    return []
  }
}

function saveTermine(termine: Termin[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(termine))
  } catch {
    // ignore storage errors
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function formatDateDE(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function getCountdownText(datum: string, uhrzeit: string): string {
  const now = new Date()
  const terminDate = new Date(`${datum}T${uhrzeit}:00`)
  const diffMs = terminDate.getTime() - now.getTime()

  if (diffMs < 0) return 'vergangen'

  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 60) return `in ${diffMinutes} Minuten`
  if (diffHours < 24) return `in ${diffHours} Stunden`
  if (diffDays === 1) return 'morgen'
  if (diffDays < 7) return `in ${diffDays} Tagen`
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `in ${weeks} ${weeks === 1 ? 'Woche' : 'Wochen'}`
  }
  const months = Math.floor(diffDays / 30)
  return `in ${months} ${months === 1 ? 'Monat' : 'Monaten'}`
}

function isUpcoming(datum: string, uhrzeit: string): boolean {
  const now = new Date()
  const terminDate = new Date(`${datum}T${uhrzeit}:00`)
  return terminDate.getTime() >= now.getTime()
}

function isMandatory(art: TerminArt): boolean {
  return art === 'einladung' || art === 'mek'
}

function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function generateICS(termin: Termin): string {
  const artInfo = TERMIN_ART_MAP[termin.art]
  const dtStart = termin.datum.replace(/-/g, '') + 'T' + termin.uhrzeit.replace(':', '') + '00'
  // Assume 1 hour duration
  const startDate = new Date(`${termin.datum}T${termin.uhrzeit}:00`)
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000)
  const dtEnd =
    endDate.toISOString().slice(0, 10).replace(/-/g, '') +
    'T' +
    endDate.toTimeString().slice(0, 5).replace(':', '') +
    '00'

  const description = [
    `Art: ${artInfo.label}`,
    termin.sachbearbeiter ? `Sachbearbeiter: ${termin.sachbearbeiter}` : '',
    termin.vorbereitung ? `Vorbereitung: ${termin.vorbereitung}` : '',
  ]
    .filter(Boolean)
    .join('\\n')

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BescheidBoxer//Termine//DE',
    'BEGIN:VEVENT',
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${termin.titel}`,
    `LOCATION:${termin.ort}`,
    `DESCRIPTION:${description}`,
    `UID:${termin.id}@bescheidboxer`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

function downloadICS(termin: Termin) {
  const icsContent = generateICS(termin)
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `termin-${termin.datum}-${termin.art}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// Empty form state
// ---------------------------------------------------------------------------

function emptyForm(): Omit<Termin, 'id' | 'erledigt' | 'notizen'> {
  return {
    titel: '',
    datum: getTodayISO(),
    uhrzeit: '09:00',
    ort: '',
    art: 'einladung',
    sachbearbeiter: '',
    vorbereitung: '',
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TerminePage() {
  useDocumentTitle('Termine - BescheidBoxer')

  const [termine, setTermine] = useState<Termin[]>(loadTermine)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [showPast, setShowPast] = useState(false)
  const [doneNotesId, setDoneNotesId] = useState<string | null>(null)
  const [doneNotesText, setDoneNotesText] = useState('')

  // Persist to localStorage
  useEffect(() => {
    saveTermine(termine)
  }, [termine])

  // --- Derived data ---
  const { upcoming, past } = useMemo(() => {
    const up: Termin[] = []
    const pa: Termin[] = []
    for (const t of termine) {
      if (t.erledigt || !isUpcoming(t.datum, t.uhrzeit)) {
        pa.push(t)
      } else {
        up.push(t)
      }
    }
    // Sort upcoming by nearest first
    up.sort((a, b) => {
      const da = new Date(`${a.datum}T${a.uhrzeit}:00`).getTime()
      const db = new Date(`${b.datum}T${b.uhrzeit}:00`).getTime()
      return da - db
    })
    // Sort past by most recent first
    pa.sort((a, b) => {
      const da = new Date(`${a.datum}T${a.uhrzeit}:00`).getTime()
      const db = new Date(`${b.datum}T${b.uhrzeit}:00`).getTime()
      return db - da
    })
    return { upcoming: up, past: pa }
  }, [termine])

  // --- Form field updater ---
  const updateField = useCallback(
    <K extends keyof ReturnType<typeof emptyForm>>(field: K, value: ReturnType<typeof emptyForm>[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  // --- Save new / edited termin ---
  const handleSave = useCallback(() => {
    const titel =
      form.titel.trim() ||
      TERMIN_ART_MAP[form.art].label + ' am ' + formatDateDE(form.datum)

    if (editingId) {
      setTermine((prev) =>
        prev.map((t) =>
          t.id === editingId
            ? { ...t, ...form, titel }
            : t
        )
      )
    } else {
      const newTermin: Termin = {
        ...form,
        titel,
        id: generateId(),
        erledigt: false,
        notizen: '',
      }
      setTermine((prev) => [...prev, newTermin])
    }

    setForm(emptyForm())
    setShowForm(false)
    setEditingId(null)
  }, [form, editingId])

  // --- Start editing ---
  const handleEdit = useCallback((termin: Termin) => {
    setForm({
      titel: termin.titel,
      datum: termin.datum,
      uhrzeit: termin.uhrzeit,
      ort: termin.ort,
      art: termin.art,
      sachbearbeiter: termin.sachbearbeiter,
      vorbereitung: termin.vorbereitung,
    })
    setEditingId(termin.id)
    setShowForm(true)
  }, [])

  // --- Cancel form ---
  const handleCancel = useCallback(() => {
    setForm(emptyForm())
    setShowForm(false)
    setEditingId(null)
  }, [])

  // --- Delete ---
  const handleDelete = useCallback((id: string) => {
    setTermine((prev) => prev.filter((t) => t.id !== id))
    setDeleteConfirmId(null)
  }, [])

  // --- Toggle done ---
  const handleToggleDone = useCallback(
    (id: string) => {
      const termin = termine.find((t) => t.id === id)
      if (!termin) return

      if (!termin.erledigt) {
        // Opening the "mark as done" flow with optional notes
        setDoneNotesId(id)
        setDoneNotesText('')
      } else {
        // Simply un-mark
        setTermine((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, erledigt: false, notizen: '' } : t
          )
        )
      }
    },
    [termine]
  )

  // --- Confirm done with notes ---
  const handleConfirmDone = useCallback(() => {
    if (!doneNotesId) return
    setTermine((prev) =>
      prev.map((t) =>
        t.id === doneNotesId
          ? { ...t, erledigt: true, notizen: doneNotesText }
          : t
      )
    )
    setDoneNotesId(null)
    setDoneNotesText('')
  }, [doneNotesId, doneNotesText])

  // --- Preparation checklist for current form art ---
  const currentChecklist = VORBEREITUNG_CHECKLISTEN[form.art]

  // --- Render a single termin card ---
  const renderTerminCard = (termin: Termin) => {
    const artInfo = TERMIN_ART_MAP[termin.art]
    const mandatory = isMandatory(termin.art)
    const countdown = getCountdownText(termin.datum, termin.uhrzeit)
    const isDeleting = deleteConfirmId === termin.id
    const isDoneFlow = doneNotesId === termin.id

    return (
      <Card
        key={termin.id}
        className={`transition-all ${
          termin.erledigt ? 'opacity-70' : ''
        } ${mandatory && !termin.erledigt ? artInfo.borderColor : ''}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge
                  className={`${artInfo.bgColor} ${artInfo.color} border-0`}
                >
                  {artInfo.label}
                </Badge>
                {mandatory && !termin.erledigt && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                    <AlertTriangle className="w-3 h-3" />
                    Pflichttermin
                  </span>
                )}
                {termin.erledigt && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                    <CheckCircle className="w-3 h-3" />
                    Erledigt
                  </span>
                )}
              </div>
              <CardTitle className={`text-lg ${termin.erledigt ? 'line-through text-gray-400' : ''}`}>
                {termin.titel}
              </CardTitle>
            </div>

            {/* Countdown badge for upcoming */}
            {!termin.erledigt && isUpcoming(termin.datum, termin.uhrzeit) && (
              <span
                className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  mandatory ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {countdown}
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
              <span>{formatDateDE(termin.datum)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4 text-gray-400 shrink-0" />
              <span>{termin.uhrzeit} Uhr</span>
            </div>
            {termin.ort && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                <span>{termin.ort}</span>
              </div>
            )}
            {termin.sachbearbeiter && (
              <div className="flex items-center gap-2 text-gray-600">
                <User className="w-4 h-4 text-gray-400 shrink-0" />
                <span>{termin.sachbearbeiter}</span>
              </div>
            )}
          </div>

          {/* Preparation notes */}
          {termin.vorbereitung && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1">
                <FileText className="w-3.5 h-3.5" />
                Vorbereitung
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {termin.vorbereitung}
              </p>
            </div>
          )}

          {/* Post-appointment notes */}
          {termin.erledigt && termin.notizen && (
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 mb-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Nachbereitung
              </div>
              <p className="text-sm text-green-800 whitespace-pre-wrap">
                {termin.notizen}
              </p>
            </div>
          )}

          {/* Mark-as-done flow with optional notes */}
          {isDoneFlow && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200 space-y-3">
              <p className="text-sm font-medium text-green-800">
                Termin als erledigt markieren
              </p>
              <Textarea
                placeholder="Optionale Notizen zum Termin (z.B. was wurde besprochen, was wurde vereinbart)..."
                value={doneNotesText}
                onChange={(e) => setDoneNotesText(e.target.value)}
                className="bg-white"
              />
              <div className="flex gap-2">
                <Button size="sm" className="gap-1" onClick={handleConfirmDone}>
                  <CheckCircle className="w-3.5 h-3.5" />
                  Erledigt
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDoneNotesId(null)
                    setDoneNotesText('')
                  }}
                >
                  Abbrechen
                </Button>
              </div>
            </div>
          )}

          {/* Delete confirmation */}
          {isDeleting && (
            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
              <p className="text-sm text-red-800 mb-2">
                Termin wirklich loeschen?
              </p>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1"
                  onClick={() => handleDelete(termin.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Loeschen
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteConfirmId(null)}
                >
                  Abbrechen
                </Button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            {!termin.erledigt && !isDoneFlow && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-green-700 hover:text-green-800 hover:bg-green-50"
                onClick={() => handleToggleDone(termin.id)}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Erledigt
              </Button>
            )}
            {termin.erledigt && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => handleToggleDone(termin.id)}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Wieder oeffnen
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => handleEdit(termin)}
            >
              <Edit2 className="w-3.5 h-3.5" />
              Bearbeiten
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => downloadICS(termin)}
            >
              <Download className="w-3.5 h-3.5" />
              Kalender
            </Button>
            {!isDeleting && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 ml-auto"
                onClick={() => setDeleteConfirmId(termin.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Termine' },
          ]}
          className="mb-4"
        />

        {/* ---------------------------------------------------------------- */}
        {/* Header                                                          */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-boxer rounded-full">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Meine Termine</h1>
              <p className="text-sm text-gray-500">
                Jobcenter-Termine verwalten und vorbereiten
              </p>
            </div>
          </div>
          {!showForm && (
            <Button
              size="sm"
              className="gap-2"
              onClick={() => {
                setForm(emptyForm())
                setEditingId(null)
                setShowForm(true)
              }}
            >
              <Plus className="h-4 w-4" />
              Neuer Termin
            </Button>
          )}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Tipp-Box: Meldepflicht                                          */}
        {/* ---------------------------------------------------------------- */}
        <Card className="mb-8 border-amber-200 bg-amber-50/50">
          <CardContent className="p-4 sm:p-5">
            <div className="flex gap-3">
              <div className="shrink-0 mt-0.5">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <Info className="w-4 h-4 text-amber-700" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-amber-900 mb-1">
                  Wichtig: Meldepflicht nach ss 59 SGB II
                </h3>
                <div className="text-sm text-amber-800 space-y-1.5">
                  <p>
                    Bei einer <strong>Einladung</strong> oder einem <strong>Meldetermin (MEK)</strong> besteht
                    eine gesetzliche Pflicht zum Erscheinen. Versaeumnisse koennen zu
                    Leistungsminderungen (Sanktionen) fuehren.
                  </p>
                  <p>
                    <strong>Koennen Sie nicht erscheinen?</strong> Informieren Sie Ihr
                    Jobcenter <em>vor</em> dem Termin schriftlich und legen Sie den
                    wichtigen Grund dar (z.B. Krankheit mit aerztlichem Attest, fehlende
                    Kinderbetreuung). Bewahren Sie den Nachweis der Mitteilung auf.
                  </p>
                  <p className="text-xs text-amber-700">
                    Folgen bei Nichterscheinen ohne wichtigen Grund: 10% Minderung des
                    Regelbedarfs fuer einen Monat (ss 31a Abs. 1 SGB II). Bei wiederholten
                    Verstoessen erhoehen sich die Sanktionen stufenweise.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ---------------------------------------------------------------- */}
        {/* Add/Edit Form                                                    */}
        {/* ---------------------------------------------------------------- */}
        {showForm && (
          <Card className="mb-8 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                {editingId ? (
                  <>
                    <Edit2 className="w-5 h-5" />
                    Termin bearbeiten
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Neuen Termin anlegen
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="termin-titel">Titel (optional)</Label>
                <Input
                  id="termin-titel"
                  placeholder="z.B. Einladung Sachbearbeiter Meier"
                  value={form.titel}
                  onChange={(e) => updateField('titel', e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Wird automatisch erzeugt, wenn leer gelassen.
                </p>
              </div>

              {/* Type selector */}
              <div className="space-y-1.5">
                <Label>Art des Termins</Label>
                <div className="flex flex-wrap gap-2">
                  {TERMIN_ARTEN.map((art) => {
                    const isSelected = form.art === art.value
                    return (
                      <button
                        key={art.value}
                        type="button"
                        onClick={() => updateField('art', art.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                          isSelected
                            ? `${art.bgColor} ${art.color} border-current ring-2 ring-current/20`
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {art.label}
                        {(art.value === 'einladung' || art.value === 'mek') && (
                          <span className="ml-1 text-red-500">*</span>
                        )}
                      </button>
                    )
                  })}
                </div>
                {isMandatory(form.art) && (
                  <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-3 h-3" />
                    Pflichttermin - Erscheinen ist gesetzlich vorgeschrieben
                  </p>
                )}
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="termin-datum">Datum</Label>
                  <Input
                    id="termin-datum"
                    type="date"
                    value={form.datum}
                    onChange={(e) => updateField('datum', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="termin-uhrzeit">Uhrzeit</Label>
                  <Input
                    id="termin-uhrzeit"
                    type="time"
                    value={form.uhrzeit}
                    onChange={(e) => updateField('uhrzeit', e.target.value)}
                  />
                </div>
              </div>

              {/* Location and Caseworker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="termin-ort">Ort</Label>
                  <Input
                    id="termin-ort"
                    placeholder="z.B. Jobcenter Mitte, Raum 203"
                    value={form.ort}
                    onChange={(e) => updateField('ort', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="termin-sachbearbeiter">Sachbearbeiter/in</Label>
                  <Input
                    id="termin-sachbearbeiter"
                    placeholder="z.B. Frau Mueller"
                    value={form.sachbearbeiter}
                    onChange={(e) => updateField('sachbearbeiter', e.target.value)}
                  />
                </div>
              </div>

              {/* Preparation checklist suggestion */}
              {currentChecklist && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-xs font-medium text-blue-700 mb-2 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    Empfohlene Vorbereitung fuer {TERMIN_ART_MAP[form.art].label}:
                  </p>
                  <ul className="text-xs text-blue-800 space-y-1">
                    {currentChecklist.map((item) => (
                      <li key={item} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  {!form.vorbereitung && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-xs text-blue-700 hover:text-blue-800 hover:bg-blue-100 h-7 px-2"
                      onClick={() =>
                        updateField(
                          'vorbereitung',
                          currentChecklist.map((item) => '- ' + item).join('\n')
                        )
                      }
                    >
                      In Vorbereitung uebernehmen
                    </Button>
                  )}
                </div>
              )}

              {/* Preparation notes */}
              <div className="space-y-1.5">
                <Label htmlFor="termin-vorbereitung">Vorbereitung / Notizen</Label>
                <Textarea
                  id="termin-vorbereitung"
                  placeholder="Was moechten Sie zum Termin mitbringen oder vorbereiten?"
                  value={form.vorbereitung}
                  onChange={(e) => updateField('vorbereitung', e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button className="gap-1.5" onClick={handleSave}>
                  {editingId ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Speichern
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Termin anlegen
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Abbrechen
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Empty state                                                     */}
        {/* ---------------------------------------------------------------- */}
        {termine.length === 0 && !showForm && (
          <div className="text-center py-16">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-lg text-gray-900 mb-2">
              Noch keine Termine vorhanden
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              Erfassen Sie hier Ihre Jobcenter-Termine, um den Ueberblick zu
              behalten und sich optimal vorzubereiten.
            </p>
            <Button
              className="gap-2"
              onClick={() => {
                setForm(emptyForm())
                setEditingId(null)
                setShowForm(true)
              }}
            >
              <Plus className="h-4 w-4" />
              Ersten Termin anlegen
            </Button>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Upcoming Termine                                                */}
        {/* ---------------------------------------------------------------- */}
        {upcoming.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              Anstehende Termine
              <span className="text-sm font-normal text-gray-500">
                ({upcoming.length})
              </span>
            </h2>
            <div className="space-y-4">
              {upcoming.map(renderTerminCard)}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Past Termine (collapsed by default)                             */}
        {/* ---------------------------------------------------------------- */}
        {past.length > 0 && (
          <div>
            <button
              onClick={() => setShowPast(!showPast)}
              className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4 hover:text-gray-700 transition-colors w-full text-left"
            >
              <Clock className="w-5 h-5 text-gray-400" />
              Vergangene Termine
              <span className="text-sm font-normal text-gray-500">
                ({past.length})
              </span>
              {showPast ? (
                <ChevronUp className="w-5 h-5 text-gray-400 ml-auto" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400 ml-auto" />
              )}
            </button>
            {showPast && (
              <div className="space-y-4">
                {past.map(renderTerminCard)}
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Footer                                                          */}
        {/* ---------------------------------------------------------------- */}
        <p className="text-xs text-gray-400 text-center mt-10 max-w-2xl mx-auto leading-relaxed">
          Ihre Termine werden lokal in Ihrem Browser gespeichert und nicht an
          unsere Server uebertragen. Nutzen Sie die Kalender-Export-Funktion, um
          Termine in Ihren persoenlichen Kalender zu uebernehmen. Alle Angaben
          ohne Gewaehr - diese Seite ersetzt keine Rechtsberatung.
        </p>
      </div>
    </div>
  )
}
