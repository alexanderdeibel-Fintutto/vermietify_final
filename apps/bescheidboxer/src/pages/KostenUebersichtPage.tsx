import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Wallet,
  Plus,
  Trash2,
  Edit2,
  Download,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  CircleDollarSign,
  ArrowUpDown,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  BarChart3,
  Receipt,
  Info,
  CalendarDays,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import useDocumentTitle from '@/hooks/useDocumentTitle'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FinanzEintrag {
  id: string
  typ: 'einnahme' | 'ausgabe' | 'forderung' | 'erstattung'
  kategorie: string
  bezeichnung: string
  betrag: number
  datum: string
  wiederkehrend: boolean
  intervall?: 'monatlich' | 'quartalsweise' | 'jaehrlich'
  status: 'offen' | 'bezahlt' | 'storniert' | 'ueberfaellig'
  notiz: string
  erstelltAm: string
}

type TabId = 'uebersicht' | 'einnahmen' | 'ausgaben' | 'forderungen'
type SortField = 'datum' | 'betrag'
type SortDir = 'asc' | 'desc'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'bescheidboxer_finanzen'

const TYP_LABELS: Record<FinanzEintrag['typ'], string> = {
  einnahme: 'Einnahme',
  ausgabe: 'Ausgabe',
  forderung: 'Forderung',
  erstattung: 'Erstattung',
}

const TYP_COLORS: Record<FinanzEintrag['typ'], { bg: string; text: string; border: string }> = {
  einnahme: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  ausgabe: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  forderung: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  erstattung: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
}

const STATUS_CONFIG: Record<FinanzEintrag['status'], { label: string; color: string; icon: typeof CheckCircle }> = {
  offen: { label: 'Offen', color: 'bg-blue-100 text-blue-800', icon: Clock },
  bezahlt: { label: 'Bezahlt', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  storniert: { label: 'Storniert', color: 'bg-gray-100 text-gray-600', icon: XCircle },
  ueberfaellig: { label: 'Ueberfaellig', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
}

const KATEGORIEN_MAP: Record<FinanzEintrag['typ'], string[]> = {
  einnahme: [
    'Regelsatz',
    'Kosten der Unterkunft (KdU)',
    'Heizkosten',
    'Mehrbedarf Alleinerziehend',
    'Mehrbedarf Schwangerschaft',
    'Mehrbedarf Ernaehrung',
    'Mehrbedarf Behindert',
    'Einmalleistung',
    'Bildung und Teilhabe',
    'Kindergeld',
    'Unterhalt',
    'Wohngeld',
    'Sonstige Einnahme',
  ],
  ausgabe: [
    'Miete (tatsaechlich)',
    'Miete (anerkannt)',
    'Strom',
    'Heizung/Gas',
    'Versicherungen',
    'Telefon/Internet',
    'Lebensmittel',
    'Kleidung',
    'Fahrtkosten',
    'Medikamente/Zuzahlung',
    'Sonstige Ausgabe',
  ],
  forderung: [
    'Rueckforderung Ueberzahlung',
    'Erstattung wg. Einkommen',
    'Erstattung wg. Vermoegen',
    'Darlehen Jobcenter',
    'Kostenersatz',
    'Sonstige Forderung',
  ],
  erstattung: [
    'Nachzahlung Regelsatz',
    'Nachzahlung KdU',
    'Nachzahlung Heizkosten',
    'Nachzahlung Mehrbedarf',
    'Erstattung Betriebskosten',
    'Sonstige Erstattung',
  ],
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'uebersicht', label: 'Uebersicht' },
  { id: 'einnahmen', label: 'Einnahmen' },
  { id: 'ausgaben', label: 'Ausgaben' },
  { id: 'forderungen', label: 'Forderungen' },
]

const MONTH_NAMES = ['Jan', 'Feb', 'Maer', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2)
}

const formatCurrency = (betrag: number): string =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(betrag)

const formatDateDE = (dateStr: string): string => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const todayISO = (): string => new Date().toISOString().split('T')[0]

function loadEintraege(): FinanzEintrag[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as FinanzEintrag[]
  } catch {
    return []
  }
}

function saveEintraege(eintraege: FinanzEintrag[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(eintraege))
  } catch {
    // ignore storage errors
  }
}

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-')
  return `${MONTH_NAMES[parseInt(month, 10) - 1]} ${year}`
}

function getLast6Months(): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return months
}

// ---------------------------------------------------------------------------
// Empty form state
// ---------------------------------------------------------------------------

interface FormState {
  typ: FinanzEintrag['typ']
  kategorie: string
  bezeichnung: string
  betrag: string
  datum: string
  wiederkehrend: boolean
  intervall: 'monatlich' | 'quartalsweise' | 'jaehrlich'
  status: FinanzEintrag['status']
  notiz: string
}

function emptyForm(): FormState {
  return {
    typ: 'einnahme',
    kategorie: '',
    bezeichnung: '',
    betrag: '',
    datum: todayISO(),
    wiederkehrend: false,
    intervall: 'monatlich',
    status: 'offen',
    notiz: '',
  }
}

function formFromEntry(e: FinanzEintrag): FormState {
  return {
    typ: e.typ,
    kategorie: e.kategorie,
    bezeichnung: e.bezeichnung,
    betrag: e.betrag.toFixed(2).replace('.', ','),
    datum: e.datum,
    wiederkehrend: e.wiederkehrend,
    intervall: e.intervall ?? 'monatlich',
    status: e.status,
    notiz: e.notiz,
  }
}

function parseBetrag(value: string): number {
  const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : Math.round(num * 100) / 100
}

// ---------------------------------------------------------------------------
// Demo Data
// ---------------------------------------------------------------------------

function generateDemoData(): FinanzEintrag[] {
  const now = new Date()
  const entries: FinanzEintrag[] = []

  // Helper to create dates in past months
  const monthAgo = (m: number, day: number = 1): string => {
    const d = new Date(now.getFullYear(), now.getMonth() - m, day)
    return d.toISOString().split('T')[0]
  }

  // Monthly Einnahmen (last 3 months)
  for (let m = 0; m < 3; m++) {
    entries.push({
      id: generateId(),
      typ: 'einnahme',
      kategorie: 'Regelsatz',
      bezeichnung: 'Regelsatz Regelbedarfsstufe 1',
      betrag: 563,
      datum: monthAgo(m, 1),
      wiederkehrend: true,
      intervall: 'monatlich',
      status: m === 0 ? 'offen' : 'bezahlt',
      notiz: '',
      erstelltAm: monthAgo(m, 1),
    })
    entries.push({
      id: generateId(),
      typ: 'einnahme',
      kategorie: 'Kosten der Unterkunft (KdU)',
      bezeichnung: 'Kosten der Unterkunft',
      betrag: 450,
      datum: monthAgo(m, 1),
      wiederkehrend: true,
      intervall: 'monatlich',
      status: m === 0 ? 'offen' : 'bezahlt',
      notiz: 'Angemessenheitsgrenze: 501,50 EUR',
      erstelltAm: monthAgo(m, 1),
    })
    entries.push({
      id: generateId(),
      typ: 'einnahme',
      kategorie: 'Heizkosten',
      bezeichnung: 'Heizkosten (pauschal)',
      betrag: 80,
      datum: monthAgo(m, 1),
      wiederkehrend: true,
      intervall: 'monatlich',
      status: m === 0 ? 'offen' : 'bezahlt',
      notiz: '',
      erstelltAm: monthAgo(m, 1),
    })
  }

  // Monthly Ausgaben (last 3 months)
  for (let m = 0; m < 3; m++) {
    entries.push({
      id: generateId(),
      typ: 'ausgabe',
      kategorie: 'Miete (tatsaechlich)',
      bezeichnung: 'Warmmiete an Vermieter',
      betrag: 500,
      datum: monthAgo(m, 3),
      wiederkehrend: true,
      intervall: 'monatlich',
      status: m === 0 ? 'offen' : 'bezahlt',
      notiz: 'Tatsaechliche Miete 50 EUR ueber KdU-Grenze',
      erstelltAm: monthAgo(m, 3),
    })
    entries.push({
      id: generateId(),
      typ: 'ausgabe',
      kategorie: 'Strom',
      bezeichnung: 'Stromabschlag Stadtwerke',
      betrag: 45,
      datum: monthAgo(m, 5),
      wiederkehrend: true,
      intervall: 'monatlich',
      status: m === 0 ? 'offen' : 'bezahlt',
      notiz: '',
      erstelltAm: monthAgo(m, 5),
    })
    entries.push({
      id: generateId(),
      typ: 'ausgabe',
      kategorie: 'Telefon/Internet',
      bezeichnung: 'Internet-Flatrate',
      betrag: 30,
      datum: monthAgo(m, 10),
      wiederkehrend: true,
      intervall: 'monatlich',
      status: m === 0 ? 'offen' : 'bezahlt',
      notiz: '',
      erstelltAm: monthAgo(m, 10),
    })
  }

  // Versicherung
  entries.push({
    id: generateId(),
    typ: 'ausgabe',
    kategorie: 'Versicherungen',
    bezeichnung: 'Haftpflichtversicherung',
    betrag: 5.9,
    datum: monthAgo(0, 15),
    wiederkehrend: true,
    intervall: 'monatlich',
    status: 'offen',
    notiz: '',
    erstelltAm: monthAgo(0, 15),
  })

  // Rueckforderung
  entries.push({
    id: generateId(),
    typ: 'forderung',
    kategorie: 'Rueckforderung Ueberzahlung',
    bezeichnung: 'Erstattungsbescheid - Ueberzahlung Jan-Maer',
    betrag: 1200,
    datum: monthAgo(2, 15),
    wiederkehrend: false,
    status: 'offen',
    notiz: 'Ratenzahlung vereinbart: 200 EUR/Monat ueber 6 Monate. 2 Raten bereits bezahlt.',
    erstelltAm: monthAgo(2, 15),
  })

  // Teilzahlungen als Erstattungen
  entries.push({
    id: generateId(),
    typ: 'erstattung',
    kategorie: 'Sonstige Erstattung',
    bezeichnung: 'Rate 1/6 Erstattungsbescheid',
    betrag: 200,
    datum: monthAgo(1, 20),
    wiederkehrend: false,
    status: 'bezahlt',
    notiz: '',
    erstelltAm: monthAgo(1, 20),
  })
  entries.push({
    id: generateId(),
    typ: 'erstattung',
    kategorie: 'Sonstige Erstattung',
    bezeichnung: 'Rate 2/6 Erstattungsbescheid',
    betrag: 200,
    datum: monthAgo(0, 20),
    wiederkehrend: false,
    status: 'bezahlt',
    notiz: '',
    erstelltAm: monthAgo(0, 20),
  })

  // Einmalleistung
  entries.push({
    id: generateId(),
    typ: 'einnahme',
    kategorie: 'Einmalleistung',
    bezeichnung: 'Erstausstattung Wohnung (Bewilligung)',
    betrag: 890,
    datum: monthAgo(1, 12),
    wiederkehrend: false,
    status: 'bezahlt',
    notiz: 'Bewilligt nach ss 24 Abs. 3 SGB II',
    erstelltAm: monthAgo(1, 12),
  })

  return entries
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function KostenUebersichtPage() {
  useDocumentTitle('Kosten-Uebersicht - BescheidBoxer')

  const [eintraege, setEintraege] = useState<FinanzEintrag[]>(loadEintraege)
  const [activeTab, setActiveTab] = useState<TabId>('uebersicht')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>('datum')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [filterTyp, setFilterTyp] = useState<FinanzEintrag['typ'] | 'alle'>('alle')
  const [filterStatus, setFilterStatus] = useState<FinanzEintrag['status'] | 'alle'>('alle')

  // Persist
  useEffect(() => {
    saveEintraege(eintraege)
  }, [eintraege])

  // ---------------------------------------------------------------------------
  // Computed values
  // ---------------------------------------------------------------------------

  const monatlicheEinnahmen = useMemo(() => {
    const currentMonth = getMonthKey(todayISO())
    return eintraege
      .filter((e) => e.typ === 'einnahme' && getMonthKey(e.datum) === currentMonth && e.status !== 'storniert')
      .reduce((sum, e) => sum + e.betrag, 0)
  }, [eintraege])

  const monatlicheAusgaben = useMemo(() => {
    const currentMonth = getMonthKey(todayISO())
    return eintraege
      .filter((e) => e.typ === 'ausgabe' && getMonthKey(e.datum) === currentMonth && e.status !== 'storniert')
      .reduce((sum, e) => sum + e.betrag, 0)
  }, [eintraege])

  const offeneForderungen = useMemo(() => {
    return eintraege
      .filter(
        (e) =>
          e.typ === 'forderung' && (e.status === 'offen' || e.status === 'ueberfaellig')
      )
      .reduce((sum, e) => sum + e.betrag, 0)
  }, [eintraege])

  const saldo = monatlicheEinnahmen - monatlicheAusgaben

  // Chart data: last 6 months
  const chartData = useMemo(() => {
    const months = getLast6Months()
    return months.map((monthKey) => {
      const monthEntries = eintraege.filter((e) => getMonthKey(e.datum) === monthKey && e.status !== 'storniert')
      const einnahmen = monthEntries
        .filter((e) => e.typ === 'einnahme')
        .reduce((s, e) => s + e.betrag, 0)
      const ausgaben = monthEntries
        .filter((e) => e.typ === 'ausgabe')
        .reduce((s, e) => s + e.betrag, 0)
      return { monthKey, label: getMonthLabel(monthKey), einnahmen, ausgaben }
    })
  }, [eintraege])

  const chartMax = useMemo(() => {
    const allValues = chartData.flatMap((d) => [d.einnahmen, d.ausgaben])
    return Math.max(100, ...allValues)
  }, [chartData])

  // Forderungen with payment tracking
  const forderungenDetails = useMemo(() => {
    const forderungen = eintraege.filter((e) => e.typ === 'forderung')
    const erstattungen = eintraege.filter((e) => e.typ === 'erstattung' && e.status === 'bezahlt')
    const totalErstattungen = erstattungen.reduce((s, e) => s + e.betrag, 0)

    return forderungen.map((f) => {
      // Rough approximation: divide erstattungen proportionally
      const totalForderungen = forderungen.reduce((s, e) => s + e.betrag, 0)
      const anteil = totalForderungen > 0 ? f.betrag / totalForderungen : 0
      const bezahlt = Math.min(f.betrag, Math.round(totalErstattungen * anteil * 100) / 100)
      const restbetrag = Math.max(0, f.betrag - bezahlt)
      const fortschritt = f.betrag > 0 ? Math.round((bezahlt / f.betrag) * 100) : 0

      return { ...f, bezahlt, restbetrag, fortschritt }
    })
  }, [eintraege])

  // Filtered + sorted list for table
  const filteredSortedEntries = useMemo(() => {
    let list = [...eintraege]

    // Tab-based filtering
    if (activeTab === 'einnahmen') list = list.filter((e) => e.typ === 'einnahme')
    else if (activeTab === 'ausgaben') list = list.filter((e) => e.typ === 'ausgabe')
    else if (activeTab === 'forderungen') list = list.filter((e) => e.typ === 'forderung' || e.typ === 'erstattung')

    // Additional filters
    if (filterTyp !== 'alle') list = list.filter((e) => e.typ === filterTyp)
    if (filterStatus !== 'alle') list = list.filter((e) => e.status === filterStatus)

    // Sort
    list.sort((a, b) => {
      let cmp = 0
      if (sortField === 'datum') {
        cmp = a.datum.localeCompare(b.datum)
      } else {
        cmp = a.betrag - b.betrag
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return list
  }, [eintraege, activeTab, filterTyp, filterStatus, sortField, sortDir])

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const updateField = useCallback(
    <K extends keyof FormState>(field: K, value: FormState[K]) => {
      setForm((prev) => {
        const next = { ...prev, [field]: value }
        // Reset kategorie when typ changes
        if (field === 'typ') {
          next.kategorie = ''
        }
        return next
      })
    },
    []
  )

  const handleSave = useCallback(() => {
    const betrag = parseBetrag(form.betrag)
    if (betrag <= 0) return
    if (!form.kategorie) return

    const entry: FinanzEintrag = {
      id: editingId ?? generateId(),
      typ: form.typ,
      kategorie: form.kategorie,
      bezeichnung: form.bezeichnung || form.kategorie,
      betrag,
      datum: form.datum || todayISO(),
      wiederkehrend: form.wiederkehrend,
      intervall: form.wiederkehrend ? form.intervall : undefined,
      status: form.status,
      notiz: form.notiz,
      erstelltAm: editingId
        ? eintraege.find((e) => e.id === editingId)?.erstelltAm ?? new Date().toISOString()
        : new Date().toISOString(),
    }

    if (editingId) {
      setEintraege((prev) => prev.map((e) => (e.id === editingId ? entry : e)))
    } else {
      setEintraege((prev) => [...prev, entry])
    }

    setForm(emptyForm())
    setShowForm(false)
    setEditingId(null)
  }, [form, editingId, eintraege])

  const handleEdit = useCallback(
    (entry: FinanzEintrag) => {
      setForm(formFromEntry(entry))
      setEditingId(entry.id)
      setShowForm(true)
    },
    []
  )

  const handleDelete = useCallback((id: string) => {
    setEintraege((prev) => prev.filter((e) => e.id !== id))
    setDeleteConfirmId(null)
  }, [])

  const handleCancel = useCallback(() => {
    setForm(emptyForm())
    setShowForm(false)
    setEditingId(null)
  }, [])

  const handleLoadDemo = useCallback(() => {
    const demo = generateDemoData()
    setEintraege(demo)
  }, [])

  const handleExportJSON = useCallback(() => {
    const json = JSON.stringify(eintraege, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `bescheidboxer-finanzen-${todayISO()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [eintraege])

  const toggleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortField(field)
        setSortDir('desc')
      }
    },
    [sortField]
  )

  // ---------------------------------------------------------------------------
  // Sub-renders
  // ---------------------------------------------------------------------------

  const renderStatusBadge = (status: FinanzEintrag['status']) => {
    const cfg = STATUS_CONFIG[status]
    const IconComp = cfg.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
        {status === 'ueberfaellig' && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
        )}
        {status !== 'ueberfaellig' && <IconComp className="w-3 h-3" />}
        {cfg.label}
      </span>
    )
  }

  const renderDashboardCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Einnahmen */}
      <Card className="border-green-200">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Monatl. Einnahmen</span>
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(monatlicheEinnahmen)}</p>
          <p className="text-xs text-gray-400 mt-1">Aktueller Monat</p>
        </CardContent>
      </Card>

      {/* Ausgaben */}
      <Card className="border-red-200">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Monatl. Ausgaben</span>
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-700">{formatCurrency(monatlicheAusgaben)}</p>
          <p className="text-xs text-gray-400 mt-1">Aktueller Monat</p>
        </CardContent>
      </Card>

      {/* Offene Forderungen */}
      <Card className="border-amber-200">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Offene Forderungen</span>
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-700">{formatCurrency(offeneForderungen)}</p>
          <p className="text-xs text-gray-400 mt-1">Offen + ueberfaellig</p>
        </CardContent>
      </Card>

      {/* Saldo */}
      <Card className={saldo >= 0 ? 'border-blue-200' : 'border-red-200'}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Saldo</span>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                saldo >= 0 ? 'bg-blue-100' : 'bg-red-100'
              }`}
            >
              <CircleDollarSign className={`w-4 h-4 ${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
            </div>
          </div>
          <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
            {formatCurrency(saldo)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Einnahmen - Ausgaben</p>
        </CardContent>
      </Card>
    </div>
  )

  const renderChart = () => {
    const hasData = chartData.some((d) => d.einnahmen > 0 || d.ausgaben > 0)
    if (!hasData) return null

    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5 text-gray-500" />
            Monatlicher Verlauf (letzte 6 Monate)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chartData.map((data) => (
              <div key={data.monthKey} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700 w-20 shrink-0">{data.label}</span>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span className="text-green-600">{formatCurrency(data.einnahmen)}</span>
                    <span className="text-red-600">{formatCurrency(data.ausgaben)}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  {/* Einnahmen bar */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-6 shrink-0">E</span>
                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-400 rounded-full transition-all duration-500"
                        style={{ width: `${chartMax > 0 ? (data.einnahmen / chartMax) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  {/* Ausgaben bar */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-6 shrink-0">A</span>
                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-400 rounded-full transition-all duration-500"
                        style={{ width: `${chartMax > 0 ? (data.ausgaben / chartMax) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-6 mt-4 pt-3 border-t text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-green-400" />
              Einnahmen
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              Ausgaben
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderForderungenTimeline = () => {
    if (forderungenDetails.length === 0) return null

    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Receipt className="w-5 h-5 text-gray-500" />
            Forderungen und Ratenzahlung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {forderungenDetails.map((f) => (
            <div key={f.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">{f.bezeichnung}</h4>
                  <p className="text-sm text-gray-500">{f.kategorie}</p>
                </div>
                {renderStatusBadge(f.status)}
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                <div>
                  <span className="text-gray-400 text-xs block">Gesamtbetrag</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(f.betrag)}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-xs block">Bezahlt</span>
                  <span className="font-semibold text-green-700">{formatCurrency(f.bezahlt)}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-xs block">Restbetrag</span>
                  <span className="font-semibold text-amber-700">{formatCurrency(f.restbetrag)}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Fortschritt</span>
                  <span>{f.fortschritt}%</span>
                </div>
                <Progress value={f.fortschritt} className="h-2" />
              </div>

              {f.notiz && (
                <p className="text-xs text-gray-500 mt-2 italic">{f.notiz}</p>
              )}

              <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                <CalendarDays className="w-3.5 h-3.5" />
                Erstellt am {formatDateDE(f.erstelltAm)}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  const renderForm = () => {
    if (!showForm) return null

    const kategorien = KATEGORIEN_MAP[form.typ] ?? []

    return (
      <Card className="mb-8 border-gray-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {editingId ? (
              <>
                <Edit2 className="w-5 h-5" />
                Eintrag bearbeiten
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Neuen Eintrag erfassen
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Typ */}
          <div className="space-y-1.5">
            <Label>Art des Eintrags</Label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(TYP_LABELS) as FinanzEintrag['typ'][]).map((typ) => {
                const colors = TYP_COLORS[typ]
                const isSelected = form.typ === typ
                return (
                  <button
                    key={typ}
                    type="button"
                    onClick={() => updateField('typ', typ)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                      isSelected
                        ? `${colors.bg} ${colors.text} ${colors.border} ring-2 ring-current/20`
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {TYP_LABELS[typ]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Kategorie */}
          <div className="space-y-1.5">
            <Label htmlFor="fin-kategorie">Kategorie</Label>
            <select
              id="fin-kategorie"
              value={form.kategorie}
              onChange={(e) => updateField('kategorie', e.target.value)}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">-- Kategorie waehlen --</option>
              {kategorien.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          {/* Bezeichnung + Betrag */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fin-bezeichnung">Bezeichnung (optional)</Label>
              <Input
                id="fin-bezeichnung"
                placeholder="z.B. Regelsatz Stufe 1"
                value={form.bezeichnung}
                onChange={(e) => updateField('bezeichnung', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fin-betrag">Betrag (EUR)</Label>
              <Input
                id="fin-betrag"
                placeholder="0,00"
                value={form.betrag}
                onChange={(e) => updateField('betrag', e.target.value)}
              />
            </div>
          </div>

          {/* Datum + Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fin-datum">Datum</Label>
              <Input
                id="fin-datum"
                type="date"
                value={form.datum}
                onChange={(e) => updateField('datum', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fin-status">Status</Label>
              <select
                id="fin-status"
                value={form.status}
                onChange={(e) => updateField('status', e.target.value as FinanzEintrag['status'])}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {(Object.keys(STATUS_CONFIG) as FinanzEintrag['status'][]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_CONFIG[s].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Wiederkehrend */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="fin-wiederkehrend"
                checked={form.wiederkehrend}
                onChange={(e) => updateField('wiederkehrend', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <Label htmlFor="fin-wiederkehrend" className="cursor-pointer">
                Wiederkehrend
              </Label>
            </div>
            {form.wiederkehrend && (
              <div className="space-y-1.5 pl-6">
                <Label htmlFor="fin-intervall">Intervall</Label>
                <select
                  id="fin-intervall"
                  value={form.intervall}
                  onChange={(e) =>
                    updateField('intervall', e.target.value as 'monatlich' | 'quartalsweise' | 'jaehrlich')
                  }
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="monatlich">Monatlich</option>
                  <option value="quartalsweise">Quartalsweise</option>
                  <option value="jaehrlich">Jaehrlich</option>
                </select>
              </div>
            )}
          </div>

          {/* Notiz */}
          <div className="space-y-1.5">
            <Label htmlFor="fin-notiz">Notiz</Label>
            <Textarea
              id="fin-notiz"
              placeholder="Optionale Anmerkungen..."
              value={form.notiz}
              onChange={(e) => updateField('notiz', e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="amt" className="gap-1.5" onClick={handleSave}>
              {editingId ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Speichern
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Eintrag erfassen
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              Abbrechen
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderEntryTable = () => {
    if (filteredSortedEntries.length === 0 && eintraege.length > 0) {
      return (
        <Card className="mb-8">
          <CardContent className="py-12 text-center">
            <Filter className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Keine Eintraege fuer diesen Filter</p>
            <p className="text-sm text-gray-400 mt-1">Aendere den Filter oder den Tab, um Eintraege zu sehen.</p>
          </CardContent>
        </Card>
      )
    }

    if (filteredSortedEntries.length === 0) return null

    return (
      <Card className="mb-8">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-lg">
              Eintraege ({filteredSortedEntries.length})
            </CardTitle>
            {/* Filters */}
            {activeTab === 'uebersicht' && (
              <div className="flex gap-2 flex-wrap">
                <select
                  value={filterTyp}
                  onChange={(e) => setFilterTyp(e.target.value as FinanzEintrag['typ'] | 'alle')}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="alle">Alle Typen</option>
                  {(Object.keys(TYP_LABELS) as FinanzEintrag['typ'][]).map((t) => (
                    <option key={t} value={t}>
                      {TYP_LABELS[t]}
                    </option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as FinanzEintrag['status'] | 'alle')}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="alle">Alle Status</option>
                  {(Object.keys(STATUS_CONFIG) as FinanzEintrag['status'][]).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_CONFIG[s].label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Sort controls */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => toggleSort('datum')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                sortField === 'datum'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ArrowUpDown className="w-3 h-3" />
              Datum {sortField === 'datum' && (sortDir === 'asc' ? '\u2191' : '\u2193')}
            </button>
            <button
              onClick={() => toggleSort('betrag')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                sortField === 'betrag'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ArrowUpDown className="w-3 h-3" />
              Betrag {sortField === 'betrag' && (sortDir === 'asc' ? '\u2191' : '\u2193')}
            </button>
          </div>

          {/* Entry list */}
          <div className="space-y-2">
            {filteredSortedEntries.map((entry) => {
              const colors = TYP_COLORS[entry.typ]
              const isDeleting = deleteConfirmId === entry.id

              return (
                <div
                  key={entry.id}
                  className={`rounded-lg border p-3 transition-all hover:shadow-sm ${colors.border} ${colors.bg}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={`${colors.bg} ${colors.text} border ${colors.border} text-xs`}>
                          {TYP_LABELS[entry.typ]}
                        </Badge>
                        {renderStatusBadge(entry.status)}
                        {entry.wiederkehrend && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            {entry.intervall === 'monatlich'
                              ? 'mtl.'
                              : entry.intervall === 'quartalsweise'
                              ? 'qtl.'
                              : 'jrl.'}
                          </span>
                        )}
                      </div>
                      <h4 className="font-medium text-gray-900 text-sm">{entry.bezeichnung}</h4>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span>{entry.kategorie}</span>
                        <span>{formatDateDE(entry.datum)}</span>
                      </div>
                      {entry.notiz && (
                        <p className="text-xs text-gray-500 mt-1 italic line-clamp-1">{entry.notiz}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`font-bold text-lg ${
                          entry.typ === 'einnahme' || entry.typ === 'erstattung'
                            ? 'text-green-700'
                            : 'text-red-700'
                        }`}
                      >
                        {entry.typ === 'einnahme' || entry.typ === 'erstattung' ? '+' : '-'}
                        {formatCurrency(entry.betrag)}
                      </p>
                    </div>
                  </div>

                  {/* Delete confirmation */}
                  {isDeleting && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm text-red-800 mb-2">Eintrag wirklich loeschen?</p>
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleDelete(entry.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Loeschen
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)}>
                          Abbrechen
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {!isDeleting && (
                    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-200/60">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-xs h-7"
                        onClick={() => handleEdit(entry)}
                      >
                        <Edit2 className="w-3 h-3" />
                        Bearbeiten
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-xs h-7 text-gray-400 hover:text-red-600 hover:bg-red-50 ml-auto"
                        onClick={() => setDeleteConfirmId(entry.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderBudgetTipps = () => (
    <Card className="mb-8 border-amber-200 bg-amber-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-amber-900">
          <Lightbulb className="w-5 h-5 text-amber-600" />
          Spar-Tipps und Hinweise
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white rounded-lg p-3 border border-amber-200">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Miete ueber KdU-Grenze?</h4>
                <p className="text-xs text-gray-600">
                  Pruefen Sie, ob Ihre tatsaechliche Miete hoeher als die anerkannten Kosten der Unterkunft (KdU) ist.
                  Falls ja, haben Sie 6 Monate Zeit, die Kosten zu senken (Kostensenkungsverfahren).
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 border border-amber-200">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Mehrbedarf beantragen</h4>
                <p className="text-xs text-gray-600">
                  Alleinerziehende, Schwangere oder Menschen mit bestimmten Ernaehrungsbeduerfnissen haben Anspruch auf
                  Mehrbedarf (ss 21 SGB II). Stellen Sie einen Antrag beim Jobcenter.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 border border-amber-200">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Ratenzahlung bei Rueckforderungen</h4>
                <p className="text-xs text-gray-600">
                  Rueckforderungen koennen in Raten gezahlt werden (ss 43 SGB II). Die Aufrechnung darf maximal 30%
                  des Regelbedarfs betragen. Beantragen Sie eine angemessene Ratenzahlung.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 border border-amber-200">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Stromkosten-Haertefall</h4>
                <p className="text-xs text-gray-600">
                  Stromkosten muessen aus dem Regelsatz bezahlt werden. Bei unerwartet hohen Nachzahlungen koennen
                  Sie einen Haertefall-Antrag stellen oder ein Darlehen nach ss 24 SGB II beantragen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderEmptyState = () => (
    <div className="text-center py-16">
      <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-4" />
      <h3 className="font-semibold text-lg text-gray-900 mb-2">Noch keine Finanzdaten erfasst</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
        Erfassen Sie hier Ihre Einnahmen, Ausgaben und Forderungen, um den finanziellen Ueberblick ueber Ihr
        Buergergeld zu behalten.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          variant="amt"
          className="gap-2"
          onClick={() => {
            setForm(emptyForm())
            setEditingId(null)
            setShowForm(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Ersten Eintrag erfassen
        </Button>
        <Button variant="outline" className="gap-2" onClick={handleLoadDemo}>
          <Download className="h-4 w-4" />
          Demo-Daten laden
        </Button>
      </div>
    </div>
  )

  // ---------------------------------------------------------------------------
  // Einnahmen Section (tab)
  // ---------------------------------------------------------------------------

  const renderEinnahmenSection = () => {
    const einnahmen = eintraege.filter((e) => e.typ === 'einnahme')
    const grouped = einnahmen.reduce<Record<string, FinanzEintrag[]>>((acc, e) => {
      const key = e.kategorie
      if (!acc[key]) acc[key] = []
      acc[key].push(e)
      return acc
    }, {})

    const currentMonth = getMonthKey(todayISO())
    const currentMonthEinnahmen = einnahmen.filter((e) => getMonthKey(e.datum) === currentMonth && e.status !== 'storniert')
    const total = currentMonthEinnahmen.reduce((s, e) => s + e.betrag, 0)

    return (
      <div className="space-y-6">
        {/* Monthly summary card */}
        <Card className="border-green-200 bg-green-50/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Einnahmen aktueller Monat</p>
                <p className="text-3xl font-bold text-green-700 mt-1">{formatCurrency(total)}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-300" />
            </div>
          </CardContent>
        </Card>

        {/* Grouped by category */}
        {Object.keys(grouped).length > 0 ? (
          Object.entries(grouped).map(([kategorie, items]) => (
            <Card key={kategorie}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{kategorie}</span>
                  <span className="text-sm font-normal text-gray-500">
                    {items.length} {items.length === 1 ? 'Eintrag' : 'Eintraege'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {items.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{entry.bezeichnung}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{formatDateDE(entry.datum)}</span>
                          {renderStatusBadge(entry.status)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-semibold text-green-700">{formatCurrency(entry.betrag)}</span>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(entry)}>
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <TrendingUp className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm">Noch keine Einnahmen erfasst</p>
          </div>
        )}
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Ausgaben Section (tab)
  // ---------------------------------------------------------------------------

  const renderAusgabenSection = () => {
    const ausgaben = eintraege.filter((e) => e.typ === 'ausgabe')
    const grouped = ausgaben.reduce<Record<string, FinanzEintrag[]>>((acc, e) => {
      const key = e.kategorie
      if (!acc[key]) acc[key] = []
      acc[key].push(e)
      return acc
    }, {})

    const currentMonth = getMonthKey(todayISO())
    const currentMonthAusgaben = ausgaben.filter((e) => getMonthKey(e.datum) === currentMonth && e.status !== 'storniert')
    const total = currentMonthAusgaben.reduce((s, e) => s + e.betrag, 0)

    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Ausgaben aktueller Monat</p>
                <p className="text-3xl font-bold text-red-700 mt-1">{formatCurrency(total)}</p>
              </div>
              <TrendingDown className="w-10 h-10 text-red-300" />
            </div>
          </CardContent>
        </Card>

        {Object.keys(grouped).length > 0 ? (
          Object.entries(grouped).map(([kategorie, items]) => (
            <Card key={kategorie}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{kategorie}</span>
                  <span className="text-sm font-normal text-gray-500">
                    {items.length} {items.length === 1 ? 'Eintrag' : 'Eintraege'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {items.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{entry.bezeichnung}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{formatDateDE(entry.datum)}</span>
                          {renderStatusBadge(entry.status)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-semibold text-red-700">-{formatCurrency(entry.betrag)}</span>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(entry)}>
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <TrendingDown className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm">Noch keine Ausgaben erfasst</p>
          </div>
        )}
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Forderungen Tab
  // ---------------------------------------------------------------------------

  const renderForderungenTab = () => {
    const forderungen = eintraege.filter((e) => e.typ === 'forderung' || e.typ === 'erstattung')

    if (forderungen.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Receipt className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm">Keine Forderungen oder Erstattungen erfasst</p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {renderForderungenTimeline()}
        {renderEntryTable()}
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Main Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-12 h-12 gradient-amt rounded-full">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Kosten-Uebersicht</h1>
              <p className="text-sm text-gray-500">
                Finanzen, Einnahmen und Forderungen im Blick
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {eintraege.length > 0 && (
              <>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportJSON}>
                  <Download className="h-4 w-4" />
                  Export JSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-amber-700 hover:text-amber-800 hover:bg-amber-50"
                  onClick={handleLoadDemo}
                >
                  Demo-Daten laden
                </Button>
              </>
            )}
            {!showForm && (
              <Button
                variant="amt"
                size="sm"
                className="gap-2"
                onClick={() => {
                  setForm(emptyForm())
                  setEditingId(null)
                  setShowForm(true)
                }}
              >
                <Plus className="h-4 w-4" />
                Neuer Eintrag
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 mb-6 bg-gray-100 rounded-lg p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                setFilterTyp('alle')
                setFilterStatus('alle')
              }}
              className={`flex-1 min-w-[80px] px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form */}
        {renderForm()}

        {/* Empty state */}
        {eintraege.length === 0 && !showForm && renderEmptyState()}

        {/* Content based on active tab */}
        {eintraege.length > 0 && (
          <>
            {activeTab === 'uebersicht' && (
              <>
                {renderDashboardCards()}
                {renderChart()}
                {renderForderungenTimeline()}
                {renderEntryTable()}
                {renderBudgetTipps()}
              </>
            )}

            {activeTab === 'einnahmen' && renderEinnahmenSection()}
            {activeTab === 'ausgaben' && renderAusgabenSection()}
            {activeTab === 'forderungen' && renderForderungenTab()}
          </>
        )}

        {/* Footer */}
        {eintraege.length > 0 && (
          <p className="text-xs text-gray-400 text-center mt-10 max-w-2xl mx-auto leading-relaxed">
            Ihre Finanzdaten werden lokal in Ihrem Browser gespeichert und nicht an unsere Server uebertragen. Nutzen
            Sie die Export-Funktion, um ein Backup Ihrer Daten zu erstellen. Alle Angaben ohne Gewaehr - diese Seite
            ersetzt keine Finanz- oder Rechtsberatung.
          </p>
        )}
      </div>
    </div>
  )
}
