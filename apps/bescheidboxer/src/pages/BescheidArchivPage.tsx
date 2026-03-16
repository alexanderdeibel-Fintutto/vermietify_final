import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Archive,
  Plus,
  Search,
  Trash2,
  Edit3,
  Download,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  RefreshCw,
  XCircle,
  AlertTriangle,
  Receipt,
  AlertOctagon,
  Scale,
  FileText,
  Database,
  Filter,
  ArrowUpDown,
  BarChart3,
  Clock,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import useDocumentTitle from '@/hooks/useDocumentTitle'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Bescheid {
  id: string
  titel: string
  typ:
    | 'bewilligungsbescheid'
    | 'aenderungsbescheid'
    | 'aufhebungsbescheid'
    | 'sanktionsbescheid'
    | 'erstattungsbescheid'
    | 'mahnbescheid'
    | 'widerspruchsbescheid'
    | 'sonstiger'
  datum: string
  behoerde: string
  aktenzeichen: string
  status:
    | 'neu'
    | 'geprueft'
    | 'widerspruch_eingelegt'
    | 'widerspruch_erfolgreich'
    | 'widerspruch_abgelehnt'
    | 'erledigt'
  zeitraumVon?: string
  zeitraumBis?: string
  betrag?: number
  notizen: string
  tags: string[]
  erstelltAm: string
  aktualisiertAm: string
}

type BescheidTyp = Bescheid['typ']
type BescheidStatus = Bescheid['status']
type SortOption = 'datum_desc' | 'datum_asc' | 'betrag_desc' | 'betrag_asc'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'bescheidboxer_bescheide'

const TYP_CONFIG: Record<
  BescheidTyp,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  bewilligungsbescheid: {
    label: 'Bewilligungsbescheid',
    icon: CheckCircle2,
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  aenderungsbescheid: {
    label: 'Änderungsbescheid',
    icon: RefreshCw,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  aufhebungsbescheid: {
    label: 'Aufhebungs-/Entziehungsbescheid',
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
  },
  sanktionsbescheid: {
    label: 'Sanktionsbescheid',
    icon: AlertTriangle,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
  erstattungsbescheid: {
    label: 'Erstattungsbescheid',
    icon: Receipt,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  mahnbescheid: {
    label: 'Mahnbescheid',
    icon: AlertOctagon,
    color: 'text-red-600',
    bg: 'bg-red-50',
  },
  widerspruchsbescheid: {
    label: 'Widerspruchsbescheid',
    icon: Scale,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  sonstiger: {
    label: 'Sonstiger Bescheid',
    icon: FileText,
    color: 'text-gray-600',
    bg: 'bg-gray-100',
  },
}

const TYP_OPTIONS: BescheidTyp[] = [
  'bewilligungsbescheid',
  'aenderungsbescheid',
  'aufhebungsbescheid',
  'sanktionsbescheid',
  'erstattungsbescheid',
  'mahnbescheid',
  'widerspruchsbescheid',
  'sonstiger',
]

const STATUS_CONFIG: Record<
  BescheidStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  neu: {
    label: 'Neu',
    color: 'text-blue-700',
    bg: 'bg-blue-100',
    border: 'border-blue-200',
  },
  geprueft: {
    label: 'Geprüft',
    color: 'text-green-700',
    bg: 'bg-green-100',
    border: 'border-green-200',
  },
  widerspruch_eingelegt: {
    label: 'Widerspruch eingelegt',
    color: 'text-amber-700',
    bg: 'bg-amber-100',
    border: 'border-amber-200',
  },
  widerspruch_erfolgreich: {
    label: 'Widerspruch erfolgreich',
    color: 'text-emerald-700',
    bg: 'bg-emerald-100',
    border: 'border-emerald-200',
  },
  widerspruch_abgelehnt: {
    label: 'Widerspruch abgelehnt',
    color: 'text-red-700',
    bg: 'bg-red-100',
    border: 'border-red-200',
  },
  erledigt: {
    label: 'Erledigt',
    color: 'text-slate-700',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
  },
}

const STATUS_OPTIONS: BescheidStatus[] = [
  'neu',
  'geprueft',
  'widerspruch_eingelegt',
  'widerspruch_erfolgreich',
  'widerspruch_abgelehnt',
  'erledigt',
]

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'datum_desc', label: 'Neueste zuerst' },
  { value: 'datum_asc', label: 'Älteste zuerst' },
  { value: 'betrag_desc', label: 'Höchster Betrag' },
  { value: 'betrag_asc', label: 'Niedrigster Betrag' },
]

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

function loadBescheide(): Bescheid[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Bescheid[]
  } catch {
    return []
  }
}

function saveBescheide(bescheide: Bescheid[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bescheide))
  } catch {
    // ignore storage errors
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

// ---------------------------------------------------------------------------
// Demo Data
// ---------------------------------------------------------------------------

function createDemoData(): Bescheid[] {
  const now = new Date().toISOString()
  return [
    {
      id: generateId(),
      titel: 'Bewilligungsbescheid ALG II - Januar bis Juni 2025',
      typ: 'bewilligungsbescheid',
      datum: '2025-01-15',
      behoerde: 'Jobcenter Berlin Mitte',
      aktenzeichen: 'BG-123-456-789',
      status: 'geprueft',
      zeitraumVon: '2025-01-01',
      zeitraumBis: '2025-06-30',
      betrag: 1102,
      notizen:
        'Regelleistung 563 EUR + KdU 539 EUR. Heizkosten wurden vollständig übernommen. Prüfung ergab keine Fehler.',
      tags: ['ALG II', 'Regelleistung', 'KdU'],
      erstelltAm: now,
      aktualisiertAm: now,
    },
    {
      id: generateId(),
      titel: 'Änderungsbescheid - Anrechnung Nebeneinkommen',
      typ: 'aenderungsbescheid',
      datum: '2025-02-20',
      behoerde: 'Jobcenter Berlin Mitte',
      aktenzeichen: 'BG-123-456-789-Ä1',
      status: 'widerspruch_eingelegt',
      zeitraumVon: '2025-03-01',
      zeitraumBis: '2025-06-30',
      betrag: 847,
      notizen:
        'Nebeneinkommen von 450 EUR wurde angerechnet. Freibeträge scheinen falsch berechnet. Widerspruch am 05.03.2025 eingelegt.',
      tags: ['Nebeneinkommen', 'Freibetrag', 'Widerspruch'],
      erstelltAm: now,
      aktualisiertAm: now,
    },
    {
      id: generateId(),
      titel: 'Sanktionsbescheid - Meldeversäumnis',
      typ: 'sanktionsbescheid',
      datum: '2025-03-10',
      behoerde: 'Jobcenter Hamburg Altona',
      aktenzeichen: 'BG-987-654-321',
      status: 'widerspruch_erfolgreich',
      betrag: 56.3,
      notizen:
        'Sanktion wegen angeblichem Meldeversäumnis am 28.02.2025. Einladung war aber nie zugestellt worden. Widerspruch erfolgreich - Sanktion aufgehoben.',
      tags: ['Sanktion', 'Meldeversäumnis'],
      erstelltAm: now,
      aktualisiertAm: now,
    },
    {
      id: generateId(),
      titel: 'Erstattungsbescheid - Überzahlung Heizkosten',
      typ: 'erstattungsbescheid',
      datum: '2025-04-05',
      behoerde: 'Jobcenter München Pasing',
      aktenzeichen: 'BG-555-333-111',
      status: 'neu',
      betrag: 234.5,
      notizen:
        'Rückforderung wegen angeblicher Überzahlung der Heizkosten im Zeitraum Oktober bis Dezember 2024. Noch zu prüfen ob die Berechnung korrekt ist.',
      tags: ['Erstattung', 'Heizkosten', 'Rückforderung'],
      erstelltAm: now,
      aktualisiertAm: now,
    },
    {
      id: generateId(),
      titel: 'Aufhebungsbescheid - Ende des Leistungsbezugs',
      typ: 'aufhebungsbescheid',
      datum: '2025-05-01',
      behoerde: 'Agentur für Arbeit Köln',
      aktenzeichen: 'BG-222-888-444',
      status: 'erledigt',
      zeitraumVon: '2025-06-01',
      betrag: 0,
      notizen:
        'Leistungsbezug endet zum 01.06.2025 aufgrund neuer Beschäftigung. Korrekt, keine weiteren Schritte nötig.',
      tags: ['Aufhebung', 'Beschäftigung'],
      erstelltAm: now,
      aktualisiertAm: now,
    },
  ]
}

// ---------------------------------------------------------------------------
// Empty form state
// ---------------------------------------------------------------------------

interface BescheidFormData {
  titel: string
  typ: BescheidTyp
  datum: string
  behoerde: string
  aktenzeichen: string
  status: BescheidStatus
  zeitraumVon: string
  zeitraumBis: string
  betrag: string
  notizen: string
  tagsInput: string
}

function emptyForm(): BescheidFormData {
  return {
    titel: '',
    typ: 'bewilligungsbescheid',
    datum: todayISO(),
    behoerde: '',
    aktenzeichen: '',
    status: 'neu',
    zeitraumVon: '',
    zeitraumBis: '',
    betrag: '',
    notizen: '',
    tagsInput: '',
  }
}

function bescheidToForm(b: Bescheid): BescheidFormData {
  return {
    titel: b.titel,
    typ: b.typ,
    datum: b.datum,
    behoerde: b.behoerde,
    aktenzeichen: b.aktenzeichen,
    status: b.status,
    zeitraumVon: b.zeitraumVon ?? '',
    zeitraumBis: b.zeitraumBis ?? '',
    betrag: b.betrag != null ? String(b.betrag) : '',
    notizen: b.notizen,
    tagsInput: b.tags.join(', '),
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BescheidArchivPage() {
  useDocumentTitle('Bescheid-Archiv - BescheidBoxer')

  // --- Core state ---
  const [bescheide, setBescheide] = useState<Bescheid[]>(loadBescheide)

  // --- Filter / Search / Sort state ---
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTyp, setFilterTyp] = useState<BescheidTyp | ''>('')
  const [filterStatus, setFilterStatus] = useState<BescheidStatus | ''>('')
  const [sortBy, setSortBy] = useState<SortOption>('datum_desc')

  // --- UI state ---
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<BescheidFormData>(emptyForm)
  const [formErrors, setFormErrors] = useState<string[]>([])

  // --- Persist ---
  useEffect(() => {
    saveBescheide(bescheide)
  }, [bescheide])

  // --- Dashboard stats ---
  const stats = useMemo(() => {
    const total = bescheide.length
    const byStatus = STATUS_OPTIONS.reduce(
      (acc, s) => {
        acc[s] = bescheide.filter((b) => b.status === s).length
        return acc
      },
      {} as Record<BescheidStatus, number>
    )
    const activeWidersprueche = bescheide.filter(
      (b) => b.status === 'widerspruch_eingelegt'
    ).length
    const totalBetrag = bescheide.reduce((sum, b) => sum + (b.betrag ?? 0), 0)
    return { total, byStatus, activeWidersprueche, totalBetrag }
  }, [bescheide])

  // --- Filtered & sorted list ---
  const filteredBescheide = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    return bescheide
      .filter((b) => {
        if (filterTyp && b.typ !== filterTyp) return false
        if (filterStatus && b.status !== filterStatus) return false
        if (query) {
          const haystack = [b.titel, b.aktenzeichen, b.behoerde, b.notizen]
            .join(' ')
            .toLowerCase()
          if (!haystack.includes(query)) return false
        }
        return true
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'datum_desc':
            return new Date(b.datum).getTime() - new Date(a.datum).getTime()
          case 'datum_asc':
            return new Date(a.datum).getTime() - new Date(b.datum).getTime()
          case 'betrag_desc':
            return (b.betrag ?? 0) - (a.betrag ?? 0)
          case 'betrag_asc':
            return (a.betrag ?? 0) - (b.betrag ?? 0)
          default:
            return 0
        }
      })
  }, [bescheide, searchQuery, filterTyp, filterStatus, sortBy])

  // --- Form helpers ---
  const updateForm = useCallback(
    (field: keyof BescheidFormData, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }))
      setFormErrors([])
    },
    []
  )

  const validateForm = useCallback((): string[] => {
    const errors: string[] = []
    if (!form.titel.trim()) errors.push('Titel ist erforderlich')
    if (!form.typ) errors.push('Typ ist erforderlich')
    if (!form.datum) errors.push('Datum ist erforderlich')
    return errors
  }, [form])

  const openAddForm = useCallback(() => {
    setEditingId(null)
    setForm(emptyForm())
    setFormErrors([])
    setShowForm(true)
  }, [])

  const openEditForm = useCallback((b: Bescheid) => {
    setEditingId(b.id)
    setForm(bescheidToForm(b))
    setFormErrors([])
    setShowForm(true)
  }, [])

  const closeForm = useCallback(() => {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm())
    setFormErrors([])
  }, [])

  const handleSubmit = useCallback(() => {
    const errors = validateForm()
    if (errors.length > 0) {
      setFormErrors(errors)
      return
    }

    const now = new Date().toISOString()
    const tags = form.tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    const betrag = form.betrag.trim() ? parseFloat(form.betrag) : undefined

    if (editingId) {
      setBescheide((prev) =>
        prev.map((b) =>
          b.id === editingId
            ? {
                ...b,
                titel: form.titel.trim(),
                typ: form.typ,
                datum: form.datum,
                behoerde: form.behoerde.trim(),
                aktenzeichen: form.aktenzeichen.trim(),
                status: form.status,
                zeitraumVon: form.zeitraumVon || undefined,
                zeitraumBis: form.zeitraumBis || undefined,
                betrag,
                notizen: form.notizen.trim(),
                tags,
                aktualisiertAm: now,
              }
            : b
        )
      )
    } else {
      const newBescheid: Bescheid = {
        id: generateId(),
        titel: form.titel.trim(),
        typ: form.typ,
        datum: form.datum,
        behoerde: form.behoerde.trim(),
        aktenzeichen: form.aktenzeichen.trim(),
        status: form.status,
        zeitraumVon: form.zeitraumVon || undefined,
        zeitraumBis: form.zeitraumBis || undefined,
        betrag,
        notizen: form.notizen.trim(),
        tags,
        erstelltAm: now,
        aktualisiertAm: now,
      }
      setBescheide((prev) => [newBescheid, ...prev])
    }

    closeForm()
  }, [form, editingId, validateForm, closeForm])

  // --- Status change ---
  const handleStatusChange = useCallback(
    (id: string, newStatus: BescheidStatus) => {
      setBescheide((prev) =>
        prev.map((b) =>
          b.id === id
            ? { ...b, status: newStatus, aktualisiertAm: new Date().toISOString() }
            : b
        )
      )
    },
    []
  )

  // --- Delete ---
  const handleDelete = useCallback((id: string) => {
    setBescheide((prev) => prev.filter((b) => b.id !== id))
    setDeleteConfirmId(null)
    setExpandedId(null)
  }, [])

  // --- Export ---
  const handleExport = useCallback(() => {
    const json = JSON.stringify(bescheide, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `bescheid-archiv-${todayISO()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [bescheide])

  // --- Demo data ---
  const handleLoadDemo = useCallback(() => {
    const demo = createDemoData()
    setBescheide((prev) => [...demo, ...prev])
  }, [])

  // --- Toggle expand ---
  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* ---------------------------------------------------------------- */}
        {/* Header                                                          */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-12 h-12 gradient-amt rounded-full">
              <Archive className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bescheid-Archiv</h1>
              <p className="text-sm text-gray-500">
                Alle Bescheide zentral verwalten und im Blick behalten
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {bescheide.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleExport}
              >
                <Download className="h-4 w-4" />
                JSON Export
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleLoadDemo}
            >
              <Database className="h-4 w-4" />
              Demo-Daten laden
            </Button>
            <Button
              variant="amt"
              size="sm"
              className="gap-2"
              onClick={openAddForm}
            >
              <Plus className="h-4 w-4" />
              Neuer Bescheid
            </Button>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Dashboard Overview                                              */}
        {/* ---------------------------------------------------------------- */}
        {bescheide.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Gesamt</p>
                    <p className="text-xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Aktive Widersprüche</p>
                    <p className="text-xl font-bold text-gray-900">
                      {stats.activeWidersprueche}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Geprüft</p>
                    <p className="text-xl font-bold text-gray-900">
                      {stats.byStatus.geprueft}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Gesamtbeträge</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(stats.totalBetrag)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Status badges overview */}
        {bescheide.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {STATUS_OPTIONS.map((s) => {
              const count = stats.byStatus[s]
              if (count === 0) return null
              const cfg = STATUS_CONFIG[s]
              return (
                <span
                  key={s}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${cfg.color.replace('text-', 'bg-')}`}
                  />
                  {cfg.label}: {count}
                </span>
              )
            })}
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Filter & Search Bar                                             */}
        {/* ---------------------------------------------------------------- */}
        {bescheide.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">
                  Filtern & Suchen
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Search */}
                <div className="relative sm:col-span-2 lg:col-span-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Suchen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filter by Typ */}
                <select
                  value={filterTyp}
                  onChange={(e) => setFilterTyp(e.target.value as BescheidTyp | '')}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Alle Typen</option>
                  {TYP_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {TYP_CONFIG[t].label}
                    </option>
                  ))}
                </select>

                {/* Filter by Status */}
                <select
                  value={filterStatus}
                  onChange={(e) =>
                    setFilterStatus(e.target.value as BescheidStatus | '')
                  }
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Alle Status</option>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_CONFIG[s].label}
                    </option>
                  ))}
                </select>

                {/* Sort */}
                <div className="relative">
                  <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="flex h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Empty State                                                     */}
        {/* ---------------------------------------------------------------- */}
        {bescheide.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
              <Archive className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="font-semibold text-lg text-gray-900 mb-2">
              Noch keine Bescheide archiviert
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              Erfassen Sie hier alle Bescheide vom Jobcenter oder der Agentur für Arbeit.
              So behalten Sie den Überblick über Fristen, Beträge und den Status
              Ihrer Widersprüche.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="amt" className="gap-2" onClick={openAddForm}>
                <Plus className="h-4 w-4" />
                Ersten Bescheid erfassen
              </Button>
              <Button variant="outline" className="gap-2" onClick={handleLoadDemo}>
                <Database className="h-4 w-4" />
                Demo-Daten laden
              </Button>
            </div>
          </div>
        )}

        {/* No search/filter results */}
        {bescheide.length > 0 && filteredBescheide.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">
              Keine Bescheide gefunden
            </h3>
            <p className="text-sm text-gray-500">
              Passen Sie Ihre Filter an oder verwenden Sie einen anderen Suchbegriff.
            </p>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Bescheid List                                                   */}
        {/* ---------------------------------------------------------------- */}
        <div className="space-y-3">
          {filteredBescheide.map((bescheid) => {
            const typCfg = TYP_CONFIG[bescheid.typ]
            const statusCfg = STATUS_CONFIG[bescheid.status]
            const TypIcon = typCfg.icon
            const isExpanded = expandedId === bescheid.id
            const isDeleting = deleteConfirmId === bescheid.id

            return (
              <Card
                key={bescheid.id}
                className={`transition-all ${
                  isDeleting ? 'border-red-300 ring-2 ring-red-500/10' : 'hover:shadow-md'
                }`}
              >
                <CardContent className="p-4">
                  {/* Main row */}
                  <div className="flex items-start gap-3">
                    {/* Typ icon */}
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${typCfg.bg}`}
                    >
                      <TypIcon className={`w-5 h-5 ${typCfg.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">
                            {bescheid.titel}
                          </h4>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                            <Badge
                              className={`${typCfg.bg} ${typCfg.color} border-0 text-[11px]`}
                            >
                              {typCfg.label}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatDate(bescheid.datum)}
                            </span>
                            {bescheid.aktenzeichen && (
                              <span className="text-xs text-gray-400 font-mono">
                                {bescheid.aktenzeichen}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right side: betrag + status */}
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          {bescheid.betrag != null && bescheid.betrag > 0 && (
                            <span className="text-sm font-semibold text-gray-900">
                              {formatCurrency(bescheid.betrag)}
                            </span>
                          )}
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${statusCfg.bg} ${statusCfg.color}`}
                          >
                            {statusCfg.label}
                          </span>
                        </div>
                      </div>

                      {/* Behoerde + tags */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                        {bescheid.behoerde && (
                          <span className="text-xs text-gray-500">
                            {bescheid.behoerde}
                          </span>
                        )}
                        {bescheid.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {bescheid.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEditForm(bescheid)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Bearbeiten"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteConfirmId(isDeleting ? null : bescheid.id)
                        }
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Löschen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleExpand(bescheid.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        title={isExpanded ? 'Zuklappen' : 'Details anzeigen'}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Delete confirmation */}
                  {isDeleting && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm text-red-800 mb-2">
                        Bescheid &quot;{bescheid.titel}&quot; wirklich löschen?
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleDelete(bescheid.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Löschen
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

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                      {/* Status change */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-gray-500">
                          Status ändern:
                        </span>
                        <select
                          value={bescheid.status}
                          onChange={(e) =>
                            handleStatusChange(
                              bescheid.id,
                              e.target.value as BescheidStatus
                            )
                          }
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_CONFIG[s].label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Zeitraum */}
                      {(bescheid.zeitraumVon || bescheid.zeitraumBis) && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium text-gray-700">Zeitraum: </span>
                          {bescheid.zeitraumVon && formatDate(bescheid.zeitraumVon)}
                          {bescheid.zeitraumVon && bescheid.zeitraumBis && ' – '}
                          {bescheid.zeitraumBis && formatDate(bescheid.zeitraumBis)}
                        </div>
                      )}

                      {/* Notizen */}
                      {bescheid.notizen && (
                        <div>
                          <span className="text-xs font-medium text-gray-500">
                            Notizen:
                          </span>
                          <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap leading-relaxed">
                            {bescheid.notizen}
                          </p>
                        </div>
                      )}

                      {/* Meta */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-400">
                        <span>Erstellt: {formatDate(bescheid.erstelltAm)}</span>
                        <span>
                          Aktualisiert: {formatDate(bescheid.aktualisiertAm)}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Footer info                                                     */}
        {/* ---------------------------------------------------------------- */}
        {bescheide.length > 0 && (
          <p className="text-xs text-gray-400 text-center mt-10 max-w-2xl mx-auto leading-relaxed">
            Ihre Bescheide werden lokal in Ihrem Browser gespeichert und nicht an
            unsere Server übertragen. Nutzen Sie die Export-Funktion, um eine
            Sicherungskopie Ihrer Daten zu erstellen.
          </p>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Add / Edit Dialog Overlay                                         */}
      {/* ------------------------------------------------------------------ */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-[5vh]">
          <div
            className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-label={editingId ? 'Bescheid bearbeiten' : 'Neuen Bescheid erfassen'}
          >
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Bescheid bearbeiten' : 'Neuen Bescheid erfassen'}
              </h2>
              <button
                onClick={closeForm}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Validation errors */}
              {formErrors.length > 0 && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  {formErrors.map((err) => (
                    <p key={err} className="text-sm text-red-700">
                      {err}
                    </p>
                  ))}
                </div>
              )}

              {/* Titel */}
              <div className="space-y-1.5">
                <Label htmlFor="form-titel">
                  Titel <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="form-titel"
                  placeholder="z.B. Bewilligungsbescheid ALG II - Januar 2025"
                  value={form.titel}
                  onChange={(e) => updateForm('titel', e.target.value)}
                />
              </div>

              {/* Typ + Status row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="form-typ">
                    Typ <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="form-typ"
                    value={form.typ}
                    onChange={(e) => updateForm('typ', e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {TYP_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {TYP_CONFIG[t].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="form-status">Status</Label>
                  <select
                    id="form-status"
                    value={form.status}
                    onChange={(e) => updateForm('status', e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_CONFIG[s].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Datum + Betrag row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="form-datum">
                    Bescheiddatum <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="form-datum"
                    type="date"
                    value={form.datum}
                    onChange={(e) => updateForm('datum', e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="form-betrag">Betrag (EUR)</Label>
                  <Input
                    id="form-betrag"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="z.B. 563.00"
                    value={form.betrag}
                    onChange={(e) => updateForm('betrag', e.target.value)}
                  />
                </div>
              </div>

              {/* Behörde + Aktenzeichen row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="form-behoerde">Behörde</Label>
                  <Input
                    id="form-behoerde"
                    placeholder="z.B. Jobcenter Berlin Mitte"
                    value={form.behoerde}
                    onChange={(e) => updateForm('behoerde', e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="form-aktenzeichen">Aktenzeichen</Label>
                  <Input
                    id="form-aktenzeichen"
                    placeholder="z.B. BG-123-456-789"
                    value={form.aktenzeichen}
                    onChange={(e) => updateForm('aktenzeichen', e.target.value)}
                  />
                </div>
              </div>

              {/* Zeitraum row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="form-zeitraum-von">Zeitraum von</Label>
                  <Input
                    id="form-zeitraum-von"
                    type="date"
                    value={form.zeitraumVon}
                    onChange={(e) => updateForm('zeitraumVon', e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="form-zeitraum-bis">Zeitraum bis</Label>
                  <Input
                    id="form-zeitraum-bis"
                    type="date"
                    value={form.zeitraumBis}
                    onChange={(e) => updateForm('zeitraumBis', e.target.value)}
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <Label htmlFor="form-tags">Tags (kommagetrennt)</Label>
                <Input
                  id="form-tags"
                  placeholder="z.B. ALG II, Regelleistung, KdU"
                  value={form.tagsInput}
                  onChange={(e) => updateForm('tagsInput', e.target.value)}
                />
                {form.tagsInput.trim() && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {form.tagsInput
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean)
                      .map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600"
                        >
                          {tag}
                        </span>
                      ))}
                  </div>
                )}
              </div>

              {/* Notizen */}
              <div className="space-y-1.5">
                <Label htmlFor="form-notizen">Notizen</Label>
                <Textarea
                  id="form-notizen"
                  rows={4}
                  placeholder="Eigene Anmerkungen, Prüfungsergebnisse, nächste Schritte..."
                  value={form.notizen}
                  onChange={(e) => updateForm('notizen', e.target.value)}
                />
              </div>
            </div>

            {/* Dialog footer */}
            <div className="flex items-center justify-end gap-2 p-6 pt-4 border-t">
              <Button variant="outline" onClick={closeForm}>
                Abbrechen
              </Button>
              <Button variant="amt" className="gap-2" onClick={handleSubmit}>
                {editingId ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Änderungen speichern
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Bescheid erfassen
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
