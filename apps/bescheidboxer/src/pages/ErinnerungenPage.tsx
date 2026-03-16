import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Bell,
  BellOff,
  BellRing,
  Scale,
  AlertTriangle,
  FileUp,
  CalendarClock,
  FileCheck,
  MapPin,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Info,
  Clock,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import useDocumentTitle from '@/hooks/useDocumentTitle'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Erinnerung {
  id: string
  titel: string
  beschreibung: string
  typ: 'widerspruchsfrist' | 'klagefrist' | 'abgabefrist' | 'termin' | 'weiterbewilligungsantrag' | 'meldetermin' | 'sonstiges'
  fristDatum: string
  erinnerungsDatum: string
  vorlaufTage: number
  prioritaet: 'niedrig' | 'mittel' | 'hoch' | 'kritisch'
  status: 'aktiv' | 'erledigt' | 'verpasst' | 'stummgeschaltet'
  aktenzeichen?: string
  wiederholend: boolean
  wiederholungsIntervall?: 'monatlich' | 'quartalsweise' | 'halbjaehrlich' | 'jaehrlich'
  erstelltAm: string
  erledigtAm?: string
}

type ErinnerungTyp = Erinnerung['typ']
type Prioritaet = Erinnerung['prioritaet']
type ErinnerungStatus = Erinnerung['status']
type SortKey = 'fristDatum' | 'prioritaet' | 'status'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'bescheidboxer_erinnerungen'

const TYP_LABELS: Record<ErinnerungTyp, string> = {
  widerspruchsfrist: 'Widerspruchsfrist',
  klagefrist: 'Klagefrist',
  abgabefrist: 'Abgabefrist fuer Unterlagen',
  termin: 'Termin beim Jobcenter',
  weiterbewilligungsantrag: 'Weiterbewilligungsantrag',
  meldetermin: 'Meldetermin',
  sonstiges: 'Sonstige Erinnerung',
}

const TYP_ICON_COLORS: Record<ErinnerungTyp, string> = {
  widerspruchsfrist: 'text-red-600',
  klagefrist: 'text-red-800',
  abgabefrist: 'text-blue-600',
  termin: 'text-purple-600',
  weiterbewilligungsantrag: 'text-green-600',
  meldetermin: 'text-amber-600',
  sonstiges: 'text-gray-500',
}

const TYP_BG_COLORS: Record<ErinnerungTyp, { bg: string; text: string; border: string }> = {
  widerspruchsfrist: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  klagefrist: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
  abgabefrist: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  termin: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  weiterbewilligungsantrag: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  meldetermin: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  sonstiges: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
}

const DEFAULT_VORLAUF: Record<ErinnerungTyp, number> = {
  widerspruchsfrist: 14,
  klagefrist: 14,
  abgabefrist: 3,
  termin: 1,
  weiterbewilligungsantrag: 30,
  meldetermin: 1,
  sonstiges: 3,
}

const PRIORITAET_CONFIG: Record<Prioritaet, { label: string; color: string; bgColor: string; dotColor: string }> = {
  niedrig: { label: 'Niedrig', color: 'text-slate-600', bgColor: 'bg-slate-100', dotColor: 'bg-slate-400' },
  mittel: { label: 'Mittel', color: 'text-blue-600', bgColor: 'bg-blue-100', dotColor: 'bg-blue-500' },
  hoch: { label: 'Hoch', color: 'text-amber-600', bgColor: 'bg-amber-100', dotColor: 'bg-amber-500' },
  kritisch: { label: 'Kritisch', color: 'text-red-600', bgColor: 'bg-red-100', dotColor: 'bg-red-500' },
}

const PRIORITAET_ORDER: Record<Prioritaet, number> = {
  kritisch: 0,
  hoch: 1,
  mittel: 2,
  niedrig: 3,
}

const STATUS_LABELS: Record<ErinnerungStatus, string> = {
  aktiv: 'Aktiv',
  erledigt: 'Erledigt',
  verpasst: 'Verpasst',
  stummgeschaltet: 'Stumm',
}

const STATUS_COLORS: Record<ErinnerungStatus, { color: string; bgColor: string }> = {
  aktiv: { color: 'text-green-700', bgColor: 'bg-green-100' },
  erledigt: { color: 'text-gray-500', bgColor: 'bg-gray-100' },
  verpasst: { color: 'text-red-700', bgColor: 'bg-red-100' },
  stummgeschaltet: { color: 'text-amber-700', bgColor: 'bg-amber-100' },
}

const STATUS_ORDER: Record<ErinnerungStatus, number> = {
  verpasst: 0,
  aktiv: 1,
  stummgeschaltet: 2,
  erledigt: 3,
}

const INTERVALL_LABELS: Record<NonNullable<Erinnerung['wiederholungsIntervall']>, string> = {
  monatlich: 'Monatlich',
  quartalsweise: 'Quartalsweise',
  halbjaehrlich: 'Halbjaehrlich',
  jaehrlich: 'Jaehrlich',
}

const ALL_TYPEN: ErinnerungTyp[] = [
  'widerspruchsfrist',
  'klagefrist',
  'abgabefrist',
  'termin',
  'weiterbewilligungsantrag',
  'meldetermin',
  'sonstiges',
]

const ALL_PRIORITAETEN: Prioritaet[] = ['kritisch', 'hoch', 'mittel', 'niedrig']
const ALL_STATUS: ErinnerungStatus[] = ['aktiv', 'verpasst', 'stummgeschaltet', 'erledigt']
const ALL_INTERVALLE: NonNullable<Erinnerung['wiederholungsIntervall']>[] = [
  'monatlich',
  'quartalsweise',
  'halbjaehrlich',
  'jaehrlich',
]

const WEEKDAY_HEADERS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

function loadErinnerungen(): Erinnerung[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Erinnerung[]
  } catch {
    return []
  }
}

function saveErinnerungen(items: Erinnerung[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // ignore storage errors
  }
}

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

function generateId(): string {
  return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatDateDE(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatDateLong(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function getDaysDiff(fromISO: string, toISO: string): number {
  const from = new Date(fromISO + 'T00:00:00')
  const to = new Date(toISO + 'T00:00:00')
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}

function getCountdownText(fristDatum: string): string {
  const today = getTodayISO()
  const diff = getDaysDiff(today, fristDatum)
  if (diff < 0) return `${Math.abs(diff)} ${Math.abs(diff) === 1 ? 'Tag' : 'Tage'} ueberfaellig!`
  if (diff === 0) return 'HEUTE!'
  if (diff === 1) return 'Noch 1 Tag'
  return `Noch ${diff} Tage`
}

function addDays(dateISO: string, days: number): string {
  const d = new Date(dateISO + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function addOneMonth(dateISO: string): string {
  const d = new Date(dateISO + 'T00:00:00')
  const originalDay = d.getDate()
  d.setMonth(d.getMonth() + 1)
  if (d.getDate() !== originalDay) {
    d.setDate(0) // last day of the previous month
  }
  return d.toISOString().slice(0, 10)
}

function getMonthName(month: number): string {
  const names = [
    'Januar', 'Februar', 'Maerz', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
  ]
  return names[month] ?? ''
}

function isInCurrentWeek(dateISO: string): boolean {
  const today = new Date(getTodayISO() + 'T00:00:00')
  const target = new Date(dateISO + 'T00:00:00')
  const dayOfWeek = (today.getDay() + 6) % 7 // Monday=0
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - dayOfWeek)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  return target >= startOfWeek && target <= endOfWeek
}

function isInCurrentMonth(dateISO: string): boolean {
  const today = new Date()
  const target = new Date(dateISO + 'T00:00:00')
  return target.getMonth() === today.getMonth() && target.getFullYear() === today.getFullYear()
}

// ---------------------------------------------------------------------------
// TypIcon component
// ---------------------------------------------------------------------------

function TypIcon({ typ, className }: { typ: ErinnerungTyp; className?: string }) {
  const size = className ?? `w-4 h-4 ${TYP_ICON_COLORS[typ]}`
  switch (typ) {
    case 'widerspruchsfrist':
      return <Scale className={size} />
    case 'klagefrist':
      return <AlertTriangle className={size} />
    case 'abgabefrist':
      return <FileUp className={size} />
    case 'termin':
      return <CalendarClock className={size} />
    case 'weiterbewilligungsantrag':
      return <FileCheck className={size} />
    case 'meldetermin':
      return <MapPin className={size} />
    case 'sonstiges':
      return <Bell className={size} />
  }
}

// ---------------------------------------------------------------------------
// Empty form helper
// ---------------------------------------------------------------------------

interface FormData {
  titel: string
  beschreibung: string
  typ: ErinnerungTyp
  fristDatum: string
  vorlaufTage: number
  prioritaet: Prioritaet
  aktenzeichen: string
  wiederholend: boolean
  wiederholungsIntervall: NonNullable<Erinnerung['wiederholungsIntervall']>
}

function emptyForm(): FormData {
  return {
    titel: '',
    beschreibung: '',
    typ: 'widerspruchsfrist',
    fristDatum: addDays(getTodayISO(), 30),
    vorlaufTage: DEFAULT_VORLAUF.widerspruchsfrist,
    prioritaet: 'mittel',
    aktenzeichen: '',
    wiederholend: false,
    wiederholungsIntervall: 'monatlich',
  }
}

// ---------------------------------------------------------------------------
// Demo data generator
// ---------------------------------------------------------------------------

function generateDemoData(): Erinnerung[] {
  const today = getTodayISO()

  function relativeDate(days: number): string {
    return addDays(today, days)
  }

  return [
    {
      id: generateId(),
      titel: 'Widerspruch gegen Aufhebungsbescheid',
      beschreibung: 'Bescheid vom Jobcenter zur Aufhebung der Leistungen erhalten. Widerspruchsfrist laeuft!',
      typ: 'widerspruchsfrist',
      fristDatum: relativeDate(5),
      erinnerungsDatum: relativeDate(5 - 14),
      vorlaufTage: 14,
      prioritaet: 'hoch',
      status: 'aktiv',
      aktenzeichen: 'JC-2024-12345',
      wiederholend: false,
      erstelltAm: relativeDate(-10),
    },
    {
      id: generateId(),
      titel: 'Weiterbewilligungsantrag stellen',
      beschreibung: 'Bewilligungszeitraum endet bald. Rechtzeitig Weiterbewilligungsantrag einreichen!',
      typ: 'weiterbewilligungsantrag',
      fristDatum: relativeDate(21),
      erinnerungsDatum: relativeDate(21 - 30),
      vorlaufTage: 30,
      prioritaet: 'mittel',
      status: 'aktiv',
      wiederholend: true,
      wiederholungsIntervall: 'halbjaehrlich',
      erstelltAm: relativeDate(-5),
    },
    {
      id: generateId(),
      titel: 'Meldetermin beim Jobcenter',
      beschreibung: 'Pflichttermin zur persoenlichen Vorsprache. Personalausweis nicht vergessen!',
      typ: 'meldetermin',
      fristDatum: relativeDate(1),
      erinnerungsDatum: today,
      vorlaufTage: 1,
      prioritaet: 'hoch',
      status: 'aktiv',
      wiederholend: false,
      erstelltAm: relativeDate(-14),
    },
    {
      id: generateId(),
      titel: 'Klagefrist gegen Widerspruchsbescheid',
      beschreibung: 'Widerspruchsbescheid erhalten. Klagefrist beim Sozialgericht beachten!',
      typ: 'klagefrist',
      fristDatum: relativeDate(14),
      erinnerungsDatum: today,
      vorlaufTage: 14,
      prioritaet: 'kritisch',
      status: 'aktiv',
      aktenzeichen: 'SG-2024-67890',
      wiederholend: false,
      erstelltAm: relativeDate(-2),
    },
    {
      id: generateId(),
      titel: 'Kontoauszuege eingereicht',
      beschreibung: 'Kontoauszuege der letzten 3 Monate beim Jobcenter eingereicht.',
      typ: 'abgabefrist',
      fristDatum: relativeDate(-7),
      erinnerungsDatum: relativeDate(-10),
      vorlaufTage: 3,
      prioritaet: 'mittel',
      status: 'erledigt',
      wiederholend: false,
      erstelltAm: relativeDate(-14),
      erledigtAm: relativeDate(-8),
    },
    {
      id: generateId(),
      titel: 'Verpasster Meldetermin',
      beschreibung: 'Meldetermin beim Jobcenter wurde leider verpasst. Sanktionsgefahr!',
      typ: 'meldetermin',
      fristDatum: relativeDate(-2),
      erinnerungsDatum: relativeDate(-3),
      vorlaufTage: 1,
      prioritaet: 'hoch',
      status: 'verpasst',
      wiederholend: false,
      erstelltAm: relativeDate(-7),
    },
  ]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ErinnerungenPage() {
  useDocumentTitle('Erinnerungen - BescheidBoxer')

  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------
  const [erinnerungen, setErinnerungen] = useState<Erinnerung[]>(loadErinnerungen)
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) return Notification.permission
    return 'unsupported'
  })

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)

  // Calendar state
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear())
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  // Filter / sort state
  const [filterTyp, setFilterTyp] = useState<ErinnerungTyp | null>(null)
  const [filterStatus, setFilterStatus] = useState<ErinnerungStatus | null>(null)
  const [filterPrioritaet, setFilterPrioritaet] = useState<Prioritaet | null>(null)
  const [sortBy, setSortBy] = useState<SortKey>('fristDatum')

  // Misc state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Frist-Rechner state
  const [bescheidDatum, setBescheidDatum] = useState('')

  // -------------------------------------------------------------------------
  // Effects
  // -------------------------------------------------------------------------

  // Persist to localStorage
  useEffect(() => {
    saveErinnerungen(erinnerungen)
  }, [erinnerungen])

  // Update overdue items on mount
  useEffect(() => {
    const today = getTodayISO()
    setErinnerungen(prev => {
      let changed = false
      const updated = prev.map(e => {
        if (e.status === 'aktiv' && e.fristDatum < today) {
          changed = true
          return { ...e, status: 'verpasst' as const }
        }
        return e
      })
      return changed ? updated : prev
    })
  }, [])

  // Send browser notifications on mount for due reminders
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    const today = getTodayISO()
    erinnerungen.forEach(e => {
      if (e.status === 'aktiv' && e.erinnerungsDatum <= today) {
        try {
          new Notification('BescheidBoxer Erinnerung', {
            body: `${e.titel} - Frist: ${formatDateDE(e.fristDatum)}`,
            icon: '/favicon.ico',
          })
        } catch {
          // notification may fail in some environments
        }
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // -------------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------------

  const today = getTodayISO()

  const counts = useMemo(() => {
    let aktiv = 0
    let faelligDieseWoche = 0
    let ueberfaellig = 0
    let erledigtDiesenMonat = 0

    for (const e of erinnerungen) {
      if (e.status === 'aktiv' || e.status === 'stummgeschaltet') aktiv++
      if ((e.status === 'aktiv' || e.status === 'stummgeschaltet') && isInCurrentWeek(e.fristDatum) && e.fristDatum >= today) {
        faelligDieseWoche++
      }
      if (e.status === 'verpasst') ueberfaellig++
      if (e.status === 'erledigt' && e.erledigtAm && isInCurrentMonth(e.erledigtAm)) {
        erledigtDiesenMonat++
      }
    }

    return { aktiv, faelligDieseWoche, ueberfaellig, erledigtDiesenMonat }
  }, [erinnerungen, today])

  const urgentItems = useMemo(() => {
    const sevenDaysFromNow = addDays(today, 7)
    return erinnerungen
      .filter(e =>
        (e.status === 'aktiv' || e.status === 'verpasst') &&
        e.fristDatum <= sevenDaysFromNow
      )
      .sort((a, b) => {
        if (a.fristDatum < b.fristDatum) return -1
        if (a.fristDatum > b.fristDatum) return 1
        return PRIORITAET_ORDER[a.prioritaet] - PRIORITAET_ORDER[b.prioritaet]
      })
  }, [erinnerungen, today])

  const filteredAndSorted = useMemo(() => {
    let result = [...erinnerungen]

    if (filterTyp) result = result.filter(e => e.typ === filterTyp)
    if (filterStatus) result = result.filter(e => e.status === filterStatus)
    if (filterPrioritaet) result = result.filter(e => e.prioritaet === filterPrioritaet)

    result.sort((a, b) => {
      switch (sortBy) {
        case 'fristDatum':
          if (a.fristDatum < b.fristDatum) return -1
          if (a.fristDatum > b.fristDatum) return 1
          return 0
        case 'prioritaet':
          return PRIORITAET_ORDER[a.prioritaet] - PRIORITAET_ORDER[b.prioritaet]
        case 'status':
          return STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
        default:
          return 0
      }
    })

    return result
  }, [erinnerungen, filterTyp, filterStatus, filterPrioritaet, sortBy])

  // Calendar: map dates to erinnerungen for the current calendar month
  const calendarErinnerungen = useMemo(() => {
    const map: Record<string, Erinnerung[]> = {}
    for (const e of erinnerungen) {
      const d = new Date(e.fristDatum + 'T00:00:00')
      if (d.getFullYear() === calendarYear && d.getMonth() === calendarMonth) {
        if (!map[e.fristDatum]) map[e.fristDatum] = []
        map[e.fristDatum].push(e)
      }
    }
    return map
  }, [erinnerungen, calendarYear, calendarMonth])

  // Selected day erinnerungen
  const selectedDayItems = useMemo(() => {
    if (!selectedDay) return []
    return erinnerungen.filter(e => e.fristDatum === selectedDay)
  }, [erinnerungen, selectedDay])

  // Frist-Rechner calculations
  const fristRechnerResult = useMemo(() => {
    if (!bescheidDatum) return null
    const zustellung = addDays(bescheidDatum, 3)
    const fristEnde = addOneMonth(zustellung)
    return { bescheidDatum, zustellung, fristEnde }
  }, [bescheidDatum])

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleRequestNotification = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    try {
      const permission = await Notification.requestPermission()
      setNotifPermission(permission)
    } catch {
      // ignore errors
    }
  }, [])

  const updateFormField = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      // Auto-update vorlaufTage when typ changes
      if (field === 'typ') {
        next.vorlaufTage = DEFAULT_VORLAUF[value as ErinnerungTyp]
      }
      return next
    })
  }, [])

  const handleOpenAdd = useCallback(() => {
    setForm(emptyForm())
    setEditingId(null)
    setShowForm(true)
  }, [])

  const handleOpenEdit = useCallback((erinnerung: Erinnerung) => {
    setForm({
      titel: erinnerung.titel,
      beschreibung: erinnerung.beschreibung,
      typ: erinnerung.typ,
      fristDatum: erinnerung.fristDatum,
      vorlaufTage: erinnerung.vorlaufTage,
      prioritaet: erinnerung.prioritaet,
      aktenzeichen: erinnerung.aktenzeichen ?? '',
      wiederholend: erinnerung.wiederholend,
      wiederholungsIntervall: erinnerung.wiederholungsIntervall ?? 'monatlich',
    })
    setEditingId(erinnerung.id)
    setShowForm(true)
  }, [])

  const handleCloseForm = useCallback(() => {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm())
  }, [])

  const handleSave = useCallback(() => {
    const titel = form.titel.trim() || TYP_LABELS[form.typ]
    const erinnerungsDatum = addDays(form.fristDatum, -form.vorlaufTage)

    if (editingId) {
      setErinnerungen(prev =>
        prev.map(e =>
          e.id === editingId
            ? {
                ...e,
                titel,
                beschreibung: form.beschreibung,
                typ: form.typ,
                fristDatum: form.fristDatum,
                erinnerungsDatum,
                vorlaufTage: form.vorlaufTage,
                prioritaet: form.prioritaet,
                aktenzeichen: form.aktenzeichen || undefined,
                wiederholend: form.wiederholend,
                wiederholungsIntervall: form.wiederholend ? form.wiederholungsIntervall : undefined,
              }
            : e
        )
      )
    } else {
      const newItem: Erinnerung = {
        id: generateId(),
        titel,
        beschreibung: form.beschreibung,
        typ: form.typ,
        fristDatum: form.fristDatum,
        erinnerungsDatum,
        vorlaufTage: form.vorlaufTage,
        prioritaet: form.prioritaet,
        status: 'aktiv',
        aktenzeichen: form.aktenzeichen || undefined,
        wiederholend: form.wiederholend,
        wiederholungsIntervall: form.wiederholend ? form.wiederholungsIntervall : undefined,
        erstelltAm: new Date().toISOString(),
      }
      setErinnerungen(prev => [...prev, newItem])
    }

    handleCloseForm()
  }, [form, editingId, handleCloseForm])

  const handleDelete = useCallback((id: string) => {
    setErinnerungen(prev => prev.filter(e => e.id !== id))
    setDeleteConfirmId(null)
  }, [])

  const handleMarkErledigt = useCallback((id: string) => {
    setErinnerungen(prev =>
      prev.map(e =>
        e.id === id
          ? { ...e, status: 'erledigt' as const, erledigtAm: new Date().toISOString() }
          : e
      )
    )
  }, [])

  const handleStummschalten = useCallback((id: string) => {
    setErinnerungen(prev =>
      prev.map(e => {
        if (e.id !== id) return e
        const newStatus = e.status === 'stummgeschaltet' ? 'aktiv' as const : 'stummgeschaltet' as const
        return { ...e, status: newStatus }
      })
    )
  }, [])

  const handleLoadDemo = useCallback(() => {
    setErinnerungen(generateDemoData())
  }, [])

  const handleCreateFromRechner = useCallback(() => {
    if (!fristRechnerResult) return
    setForm({
      ...emptyForm(),
      typ: 'widerspruchsfrist',
      fristDatum: fristRechnerResult.fristEnde,
      vorlaufTage: 14,
      prioritaet: 'hoch',
      titel: 'Widerspruchsfrist',
      beschreibung: `Bescheid vom ${formatDateDE(fristRechnerResult.bescheidDatum)}. Zustellung am ${formatDateDE(fristRechnerResult.zustellung)}. Fristende: ${formatDateDE(fristRechnerResult.fristEnde)}.`,
    })
    setEditingId(null)
    setShowForm(true)
  }, [fristRechnerResult])

  const handlePrevMonth = useCallback(() => {
    setCalendarMonth(prev => {
      if (prev === 0) {
        setCalendarYear(y => y - 1)
        return 11
      }
      return prev - 1
    })
    setSelectedDay(null)
  }, [])

  const handleNextMonth = useCallback(() => {
    setCalendarMonth(prev => {
      if (prev === 11) {
        setCalendarYear(y => y + 1)
        return 0
      }
      return prev + 1
    })
    setSelectedDay(null)
  }, [])

  // -------------------------------------------------------------------------
  // Calendar grid builder
  // -------------------------------------------------------------------------

  const calendarCells = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth, 1)
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate()
    const startDow = (firstDay.getDay() + 6) % 7 // Monday=0

    const cells: (number | null)[] = []
    for (let i = 0; i < startDow; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)

    return cells
  }, [calendarYear, calendarMonth])

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  function renderCountdownBadge(fristDatum: string) {
    const diff = getDaysDiff(today, fristDatum)
    let colorClass = 'bg-gray-100 text-gray-700'
    if (diff < 0) colorClass = 'bg-red-100 text-red-700'
    else if (diff === 0) colorClass = 'bg-red-100 text-red-700 font-bold'
    else if (diff <= 3) colorClass = 'bg-red-50 text-red-600'
    else if (diff <= 7) colorClass = 'bg-amber-50 text-amber-700'

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        <Clock className="w-3 h-3" />
        {getCountdownText(fristDatum)}
      </span>
    )
  }

  // -------------------------------------------------------------------------
  // JSX
  // -------------------------------------------------------------------------

  const calculatedErinnerungsDatum = addDays(form.fristDatum, -form.vorlaufTage)
  const hasActiveFilters = filterTyp !== null || filterStatus !== null || filterPrioritaet !== null

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">

        {/* ---------------------------------------------------------------- */}
        {/* Notification Permission Banner                                   */}
        {/* ---------------------------------------------------------------- */}
        {notifPermission !== 'unsupported' && notifPermission !== 'granted' && (
          <div className={`mb-6 rounded-xl border p-4 ${
            notifPermission === 'denied'
              ? 'bg-red-50 border-red-200'
              : 'bg-amber-50 border-amber-200'
          }`}>
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                {notifPermission === 'denied' ? (
                  <BellOff className="w-5 h-5 text-red-500" />
                ) : (
                  <BellRing className="w-5 h-5 text-amber-600" />
                )}
              </div>
              <div className="flex-1">
                {notifPermission === 'denied' ? (
                  <>
                    <p className="font-medium text-red-800 mb-1">
                      Browser-Benachrichtigungen blockiert
                    </p>
                    <p className="text-sm text-red-700">
                      Benachrichtigungen wurden in den Browser-Einstellungen blockiert.
                      Um keine Frist zu verpassen, aktiviere Benachrichtigungen fuer diese
                      Seite in den Browser-Einstellungen (Klick auf das Schloss-Symbol
                      in der Adressleiste).
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-amber-800 mb-1">
                      Aktiviere Browser-Benachrichtigungen um keine Frist zu verpassen
                    </p>
                    <p className="text-sm text-amber-700 mb-3">
                      Du erhaeltst dann automatisch eine Erinnerung, wenn eine Frist naht.
                    </p>
                    <Button
                      size="sm"
                      variant="amt"
                      className="gap-2"
                      onClick={handleRequestNotification}
                    >
                      <Bell className="w-4 h-4" />
                      Benachrichtigungen aktivieren
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {notifPermission === 'granted' && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-3">
            <div className="flex items-center gap-2 text-green-700 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">Browser-Benachrichtigungen sind aktiviert</span>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Page Header                                                      */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-12 h-12 gradient-amt rounded-full">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Erinnerungen &amp; Fristen</h1>
              <p className="text-sm text-gray-500">
                Behalte alle Fristen im Blick und verpasse keine Deadline
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {erinnerungen.length > 0 && (
              <Button variant="outline" size="sm" className="gap-2" onClick={handleLoadDemo}>
                Demo-Daten laden
              </Button>
            )}
            <Button variant="amt" size="sm" className="gap-2" onClick={handleOpenAdd}>
              <Plus className="w-4 h-4" />
              Neue Erinnerung
            </Button>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Overview Dashboard Cards                                         */}
        {/* ---------------------------------------------------------------- */}
        {erinnerungen.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-medium text-gray-500 mb-1">Aktive Erinnerungen</p>
                <p className="text-2xl font-bold text-gray-900">{counts.aktiv}</p>
              </CardContent>
            </Card>
            <Card className={counts.faelligDieseWoche > 0 ? 'border-amber-300' : ''}>
              <CardContent className="p-4">
                <p className="text-xs font-medium text-gray-500 mb-1">Faellig diese Woche</p>
                <p className={`text-2xl font-bold ${counts.faelligDieseWoche > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                  {counts.faelligDieseWoche}
                </p>
              </CardContent>
            </Card>
            <Card className={counts.ueberfaellig > 0 ? 'border-red-300' : ''}>
              <CardContent className="p-4">
                <p className="text-xs font-medium text-gray-500 mb-1">Ueberfaellig</p>
                <div className="flex items-center gap-2">
                  <p className={`text-2xl font-bold ${counts.ueberfaellig > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {counts.ueberfaellig}
                  </p>
                  {counts.ueberfaellig > 0 && (
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-medium text-gray-500 mb-1">Erledigt diesen Monat</p>
                <p className="text-2xl font-bold text-gray-900">{counts.erledigtDiesenMonat}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Urgent Fristen Alert Section                                     */}
        {/* ---------------------------------------------------------------- */}
        {urgentItems.length > 0 && (
          <Card className="mb-8 border-red-300 bg-red-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-red-800">
                <AlertTriangle className="w-5 h-5" />
                Dringende Fristen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {urgentItems.map(item => {
                  const diff = getDaysDiff(today, item.fristDatum)
                  const isWiderspruch = item.typ === 'widerspruchsfrist'

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        isWiderspruch
                          ? 'bg-red-100 border-red-300'
                          : diff < 0
                          ? 'bg-red-50 border-red-200'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <TypIcon
                        typ={item.typ}
                        className={`w-5 h-5 shrink-0 ${isWiderspruch ? 'text-red-700' : TYP_ICON_COLORS[item.typ]}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isWiderspruch ? 'font-bold text-red-900' : 'text-gray-900'}`}>
                          {item.titel}
                        </p>
                        <p className="text-xs text-gray-500">
                          Frist: {formatDateDE(item.fristDatum)}
                          {item.aktenzeichen && ` | Az: ${item.aktenzeichen}`}
                        </p>
                      </div>
                      <div className="shrink-0">
                        {renderCountdownBadge(item.fristDatum)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Calendar View                                                    */}
        {/* ---------------------------------------------------------------- */}
        {erinnerungen.length > 0 && (
          <Card className="mb-8">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  Fristenkalender
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium w-36 text-center">
                    {getMonthName(calendarMonth)} {calendarYear}
                  </span>
                  <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {WEEKDAY_HEADERS.map(d => (
                  <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
                    {d}
                  </div>
                ))}
              </div>
              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((day, i) => {
                  if (day === null) {
                    return <div key={`empty-${i}`} className="h-10 sm:h-12" />
                  }

                  const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const dayItems = calendarErinnerungen[dateStr] ?? []
                  const isToday = dateStr === today
                  const isSelected = dateStr === selectedDay

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => setSelectedDay(selectedDay === dateStr ? null : dateStr)}
                      className={`relative h-10 sm:h-12 rounded-lg text-sm transition-colors
                        ${isToday ? 'font-bold bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}
                        ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
                        ${dayItems.length > 0 ? 'cursor-pointer' : ''}
                      `}
                    >
                      <span className="block">{day}</span>
                      {dayItems.length > 0 && (
                        <div className="flex justify-center gap-0.5 mt-0.5">
                          {dayItems.slice(0, 3).map(e => (
                            <span
                              key={e.id}
                              className={`w-1.5 h-1.5 rounded-full ${PRIORITAET_CONFIG[e.prioritaet].dotColor}`}
                            />
                          ))}
                          {dayItems.length > 3 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Color legend */}
              <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t text-xs text-gray-500">
                {ALL_PRIORITAETEN.map(p => (
                  <span key={p} className="inline-flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${PRIORITAET_CONFIG[p].dotColor}`} />
                    {PRIORITAET_CONFIG[p].label}
                  </span>
                ))}
              </div>

              {/* Selected day panel */}
              {selectedDay && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {formatDateLong(selectedDay)}
                  </p>
                  {selectedDayItems.length === 0 ? (
                    <p className="text-sm text-gray-400">Keine Fristen an diesem Tag.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedDayItems.map(item => (
                        <div
                          key={item.id}
                          className={`flex items-center gap-2 p-2 rounded-lg ${TYP_BG_COLORS[item.typ].bg}`}
                        >
                          <TypIcon typ={item.typ} className={`w-4 h-4 ${TYP_ICON_COLORS[item.typ]}`} />
                          <span className={`text-sm font-medium ${TYP_BG_COLORS[item.typ].text}`}>
                            {item.titel}
                          </span>
                          <Badge className={`ml-auto ${PRIORITAET_CONFIG[item.prioritaet].bgColor} ${PRIORITAET_CONFIG[item.prioritaet].color} border-0 text-xs`}>
                            {PRIORITAET_CONFIG[item.prioritaet].label}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Frist-Rechner Section                                            */}
        {/* ---------------------------------------------------------------- */}
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Info className="w-5 h-5 text-gray-500" />
              Frist-Rechner: Widerspruchsfrist berechnen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Gib das Datum auf dem Bescheid ein und erhalte automatisch das Fristende
              fuer deinen Widerspruch.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end mb-4">
              <div className="space-y-1.5 flex-1 w-full sm:w-auto">
                <Label htmlFor="bescheid-datum">Datum des Bescheids</Label>
                <Input
                  id="bescheid-datum"
                  type="date"
                  value={bescheidDatum}
                  onChange={(e) => setBescheidDatum(e.target.value)}
                />
              </div>
            </div>

            {fristRechnerResult && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                    <span className="text-gray-600">Bescheid-Datum:</span>
                    <span className="font-medium">{formatDateDE(fristRechnerResult.bescheidDatum)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-gray-600">+ 3 Tage Zustellungsfiktion:</span>
                    <span className="font-medium">{formatDateDE(fristRechnerResult.zustellung)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-gray-600">+ 1 Monat Widerspruchsfrist:</span>
                    <span className="font-medium text-red-700">{formatDateDE(fristRechnerResult.fristEnde)}</span>
                  </div>
                </div>

                <div className="bg-red-50 rounded-lg p-3 mt-3 border border-red-200">
                  <p className="text-sm font-semibold text-red-800">
                    Fristende: {formatDateLong(fristRechnerResult.fristEnde)}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Rechtsgrundlage: ss 37 Abs. 2 SGB X (Zustellungsfiktion) + ss 84 SGG (Widerspruchsfrist)
                  </p>
                </div>

                <Button
                  variant="amt"
                  size="sm"
                  className="gap-2 mt-3"
                  onClick={handleCreateFromRechner}
                >
                  <Plus className="w-4 h-4" />
                  Erinnerung aus Fristende erstellen
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ---------------------------------------------------------------- */}
        {/* Filter / Sort Controls                                           */}
        {/* ---------------------------------------------------------------- */}
        {erinnerungen.length > 0 && (
          <div className="mb-6 space-y-3">
            {/* Sort */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-gray-500">Sortieren:</span>
              {([
                { key: 'fristDatum' as SortKey, label: 'Datum' },
                { key: 'prioritaet' as SortKey, label: 'Prioritaet' },
                { key: 'status' as SortKey, label: 'Status' },
              ]).map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSortBy(opt.key)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    sortBy === opt.key
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Filter: Typ */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-gray-500">Typ:</span>
              <button
                type="button"
                onClick={() => setFilterTyp(null)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterTyp === null
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Alle
              </button>
              {ALL_TYPEN.map(typ => (
                <button
                  key={typ}
                  type="button"
                  onClick={() => setFilterTyp(filterTyp === typ ? null : typ)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    filterTyp === typ
                      ? 'bg-gray-900 text-white'
                      : `${TYP_BG_COLORS[typ].bg} ${TYP_BG_COLORS[typ].text} hover:opacity-80`
                  }`}
                >
                  {TYP_LABELS[typ].split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Filter: Status */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-gray-500">Status:</span>
              <button
                type="button"
                onClick={() => setFilterStatus(null)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterStatus === null
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Alle
              </button>
              {ALL_STATUS.map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFilterStatus(filterStatus === status ? null : status)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    filterStatus === status
                      ? 'bg-gray-900 text-white'
                      : `${STATUS_COLORS[status].bgColor} ${STATUS_COLORS[status].color} hover:opacity-80`
                  }`}
                >
                  {STATUS_LABELS[status]}
                </button>
              ))}
            </div>

            {/* Filter: Prioritaet */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-gray-500">Prioritaet:</span>
              <button
                type="button"
                onClick={() => setFilterPrioritaet(null)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterPrioritaet === null
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Alle
              </button>
              {ALL_PRIORITAETEN.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFilterPrioritaet(filterPrioritaet === p ? null : p)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    filterPrioritaet === p
                      ? 'bg-gray-900 text-white'
                      : `${PRIORITAET_CONFIG[p].bgColor} ${PRIORITAET_CONFIG[p].color} hover:opacity-80`
                  }`}
                >
                  {PRIORITAET_CONFIG[p].label}
                </button>
              ))}
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setFilterTyp(null)
                  setFilterStatus(null)
                  setFilterPrioritaet(null)
                }}
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-3 h-3" />
                Filter zuruecksetzen
              </button>
            )}
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Erinnerungen List                                                */}
        {/* ---------------------------------------------------------------- */}
        {erinnerungen.length > 0 && filteredAndSorted.length > 0 && (
          <div className="space-y-3 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-gray-500" />
              Alle Erinnerungen
              <span className="text-sm font-normal text-gray-500">
                ({filteredAndSorted.length}{hasActiveFilters ? ` von ${erinnerungen.length}` : ''})
              </span>
            </h2>

            {filteredAndSorted.map(item => {
              const typBg = TYP_BG_COLORS[item.typ]
              const prioConfig = PRIORITAET_CONFIG[item.prioritaet]
              const statusConfig = STATUS_COLORS[item.status]
              const isDeleting = deleteConfirmId === item.id
              const isOverdue = item.status === 'verpasst'
              const isErledigt = item.status === 'erledigt'

              return (
                <Card
                  key={item.id}
                  className={`transition-all ${
                    isErledigt ? 'opacity-70' : ''
                  } ${isOverdue ? 'border-red-300' : ''} ${
                    item.prioritaet === 'kritisch' && item.status === 'aktiv' ? 'border-red-300' : ''
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
                        <TypIcon typ={item.typ} className={`w-5 h-5 shrink-0 ${TYP_ICON_COLORS[item.typ]}`} />
                        <Badge className={`${typBg.bg} ${typBg.text} border-0 text-xs`}>
                          {TYP_LABELS[item.typ]}
                        </Badge>
                        <Badge className={`${prioConfig.bgColor} ${prioConfig.color} border-0 text-xs`}>
                          {prioConfig.label}
                        </Badge>
                        <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border-0 text-xs`}>
                          {STATUS_LABELS[item.status]}
                        </Badge>
                        {item.prioritaet === 'kritisch' && item.status === 'aktiv' && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                          </span>
                        )}
                      </div>
                      <div className="shrink-0">
                        {renderCountdownBadge(item.fristDatum)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h3 className={`font-semibold text-gray-900 ${isErledigt ? 'line-through text-gray-400' : ''}`}>
                        {item.titel}
                      </h3>
                      {item.beschreibung && (
                        <p className="text-sm text-gray-600 mt-1">{item.beschreibung}</p>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Frist: {formatDateDE(item.fristDatum)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Erinnerung: {formatDateDE(item.erinnerungsDatum)} ({item.vorlaufTage} Tage vorher)
                      </span>
                      {item.aktenzeichen && (
                        <span>Az: {item.aktenzeichen}</span>
                      )}
                      {item.wiederholend && item.wiederholungsIntervall && (
                        <span>Wiederholend: {INTERVALL_LABELS[item.wiederholungsIntervall]}</span>
                      )}
                      {item.erledigtAm && (
                        <span className="text-green-600">
                          Erledigt am {formatDateDE(item.erledigtAm.slice(0, 10))}
                        </span>
                      )}
                    </div>

                    {/* Delete confirmation */}
                    {isDeleting && (
                      <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                        <p className="text-sm text-red-800 mb-2">
                          Erinnerung wirklich loeschen?
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="gap-1"
                            onClick={() => handleDelete(item.id)}
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
                      {item.status === 'aktiv' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-green-700 hover:text-green-800 hover:bg-green-50"
                          onClick={() => handleMarkErledigt(item.id)}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Erledigt
                        </Button>
                      )}
                      {(item.status === 'aktiv' || item.status === 'stummgeschaltet') && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => handleStummschalten(item.id)}
                        >
                          <BellOff className="w-3.5 h-3.5" />
                          {item.status === 'stummgeschaltet' ? 'Aktivieren' : 'Stumm'}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => handleOpenEdit(item)}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Bearbeiten
                      </Button>
                      {!isDeleting && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 ml-auto"
                          onClick={() => setDeleteConfirmId(item.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* No results after filter */}
        {erinnerungen.length > 0 && filteredAndSorted.length === 0 && (
          <div className="text-center py-12 mb-8">
            <Bell className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">
              Keine Erinnerungen gefunden
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Versuche andere Filter-Einstellungen.
            </p>
            <button
              type="button"
              onClick={() => {
                setFilterTyp(null)
                setFilterStatus(null)
                setFilterPrioritaet(null)
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              Alle Filter zuruecksetzen
            </button>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Empty State                                                      */}
        {/* ---------------------------------------------------------------- */}
        {erinnerungen.length === 0 && (
          <div className="text-center py-16 mb-8">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-lg text-gray-900 mb-2">
              Keine Erinnerungen eingerichtet
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              Erstelle Erinnerungen fuer wichtige Fristen wie Widerspruchsfristen,
              Klagetermine oder den Weiterbewilligungsantrag. So verpasst du
              keine Deadline mehr.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="amt" className="gap-2" onClick={handleOpenAdd}>
                <Plus className="h-4 w-4" />
                Erste Erinnerung erstellen
              </Button>
              <Button variant="outline" className="gap-2" onClick={handleLoadDemo}>
                Demo-Daten laden
              </Button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Info Section: Wichtige Fristen                                   */}
        {/* ---------------------------------------------------------------- */}
        <Card className="mb-8 border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-blue-800">
              <Info className="w-5 h-5" />
              Wichtige Fristen im Ueberblick
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-100">
                <Scale className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Widerspruchsfrist</p>
                  <p className="text-gray-600">
                    1 Monat nach Zustellung des Bescheids (ss 84 SGG).
                    Die Zustellung gilt 3 Tage nach Aufgabe zur Post als erfolgt (ss 37 Abs. 2 SGB X).
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-100">
                <AlertTriangle className="w-5 h-5 text-red-800 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Klagefrist</p>
                  <p className="text-gray-600">
                    1 Monat nach Zustellung des Widerspruchsbescheids (ss 87 SGG).
                    Bei versaeumter Klagefrist kann nur in Ausnahmefaellen Wiedereinsetzung
                    beantragt werden.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-100">
                <FileCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Weiterbewilligungsantrag</p>
                  <p className="text-gray-600">
                    Spaetestens am letzten Tag des Bewilligungszeitraums stellen.
                    Empfehlung: Mindestens 30 Tage vorher einreichen, um Luecken zu vermeiden.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-100">
                <MapPin className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Meldetermine</p>
                  <p className="text-gray-600">
                    Unentschuldigtes Fehlen kann zu Sanktionen fuehren (10% Minderung
                    des Regelbedarfs fuer 1 Monat gem. ss 31a Abs. 1 SGB II).
                    Bei Verhinderung rechtzeitig absagen!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ---------------------------------------------------------------- */}
        {/* Footer                                                           */}
        {/* ---------------------------------------------------------------- */}
        <p className="text-xs text-gray-400 text-center mt-10 max-w-2xl mx-auto leading-relaxed">
          Deine Erinnerungen werden lokal in deinem Browser gespeichert und nicht an
          unsere Server uebertragen. Alle Fristberechnungen sind Richtwerte und ersetzen
          keine Rechtsberatung. Im Zweifel konsultiere eine Beratungsstelle oder einen
          Anwalt fuer Sozialrecht.
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Add/Edit Form Dialog (Modal Overlay)                               */}
      {/* ------------------------------------------------------------------ */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={handleCloseForm}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dialog header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                {editingId ? (
                  <>
                    <Edit2 className="w-5 h-5" />
                    Erinnerung bearbeiten
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Neue Erinnerung erstellen
                  </>
                )}
              </h2>
              <button
                type="button"
                onClick={handleCloseForm}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dialog body */}
            <div className="p-6 space-y-5">
              {/* Titel */}
              <div className="space-y-1.5">
                <Label htmlFor="erinnerung-titel">Titel</Label>
                <Input
                  id="erinnerung-titel"
                  placeholder="z.B. Widerspruch gegen Aufhebungsbescheid"
                  value={form.titel}
                  onChange={(e) => updateFormField('titel', e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Wird automatisch aus dem Typ erzeugt, wenn leer gelassen.
                </p>
              </div>

              {/* Beschreibung */}
              <div className="space-y-1.5">
                <Label htmlFor="erinnerung-beschreibung">Beschreibung (optional)</Label>
                <Textarea
                  id="erinnerung-beschreibung"
                  placeholder="Zusaetzliche Details zur Frist oder Erinnerung..."
                  value={form.beschreibung}
                  onChange={(e) => updateFormField('beschreibung', e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              {/* Typ selection */}
              <div className="space-y-1.5">
                <Label>Art der Frist</Label>
                <div className="flex flex-wrap gap-2">
                  {ALL_TYPEN.map(typ => {
                    const isSelected = form.typ === typ
                    const colors = TYP_BG_COLORS[typ]
                    return (
                      <button
                        key={typ}
                        type="button"
                        onClick={() => updateFormField('typ', typ)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                          isSelected
                            ? `${colors.bg} ${colors.text} border-current ring-2 ring-current/20`
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {TYP_LABELS[typ]}
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Empfohlener Vorlauf fuer {TYP_LABELS[form.typ]}:{' '}
                  <strong>{DEFAULT_VORLAUF[form.typ]} Tage</strong>
                </p>
              </div>

              {/* Frist-Datum + Vorlauf */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="erinnerung-frist">Frist-Datum (Deadline)</Label>
                  <Input
                    id="erinnerung-frist"
                    type="date"
                    value={form.fristDatum}
                    onChange={(e) => updateFormField('fristDatum', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="erinnerung-vorlauf">Vorlauf (Tage vor Frist)</Label>
                  <Input
                    id="erinnerung-vorlauf"
                    type="number"
                    min={0}
                    max={365}
                    value={form.vorlaufTage}
                    onChange={(e) => updateFormField('vorlaufTage', Math.max(0, parseInt(e.target.value) || 0))}
                  />
                </div>
              </div>

              {/* Calculated reminder date */}
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Erinnerung am:</span>{' '}
                  {formatDateDE(calculatedErinnerungsDatum)}{' '}
                  <span className="text-blue-600">
                    ({form.vorlaufTage} Tage vor Fristende am {formatDateDE(form.fristDatum)})
                  </span>
                </p>
              </div>

              {/* Prioritaet */}
              <div className="space-y-1.5">
                <Label>Prioritaet</Label>
                <div className="flex flex-wrap gap-2">
                  {ALL_PRIORITAETEN.map(p => {
                    const config = PRIORITAET_CONFIG[p]
                    const isSelected = form.prioritaet === p
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => updateFormField('prioritaet', p)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                          isSelected
                            ? `${config.bgColor} ${config.color} border-current ring-2 ring-current/20`
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {config.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Aktenzeichen */}
              <div className="space-y-1.5">
                <Label htmlFor="erinnerung-az">Aktenzeichen (optional)</Label>
                <Input
                  id="erinnerung-az"
                  placeholder="z.B. JC-2024-12345"
                  value={form.aktenzeichen}
                  onChange={(e) => updateFormField('aktenzeichen', e.target.value)}
                />
              </div>

              {/* Wiederholend */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateFormField('wiederholend', !form.wiederholend)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      form.wiederholend ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        form.wiederholend ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                  <Label>Wiederholend</Label>
                </div>

                {form.wiederholend && (
                  <div className="flex flex-wrap gap-2 ml-14">
                    {ALL_INTERVALLE.map(intervall => {
                      const isSelected = form.wiederholungsIntervall === intervall
                      return (
                        <button
                          key={intervall}
                          type="button"
                          onClick={() => updateFormField('wiederholungsIntervall', intervall)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                            isSelected
                              ? 'bg-blue-100 text-blue-700 border-blue-300 ring-2 ring-blue-200'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {INTERVALL_LABELS[intervall]}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Dialog footer */}
            <div className="flex items-center justify-end gap-2 p-6 pt-4 border-t">
              <Button variant="outline" onClick={handleCloseForm}>
                Abbrechen
              </Button>
              <Button variant="amt" className="gap-1.5" onClick={handleSave}>
                {editingId ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Speichern
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Erinnerung erstellen
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
