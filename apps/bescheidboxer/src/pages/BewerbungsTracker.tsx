import { useState, useMemo } from 'react'
import {
  Briefcase,
  Send,
  Building,
  Calendar,
  Search,
  Plus,
  Trash2,
  Edit2,
  Download,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpDown,
  Info,
  Mail,
  Globe,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { generateRechnerPdf } from '@/lib/pdf-export'
import type { RechnerSection } from '@/lib/pdf-export'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import Breadcrumbs from '@/components/Breadcrumbs'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Bewerbung {
  id: string
  firma: string
  position: string
  datum: string
  art: 'online' | 'email' | 'post' | 'persoenlich' | 'initiativ'
  status: 'gesendet' | 'eingangsbestaetigung' | 'vorstellungsgespraech' | 'absage' | 'zusage' | 'keine_antwort'
  quelle: string
  notizen: string
  kontakt: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'bescheidboxer_bewerbungen'

const ART_LABELS: Record<Bewerbung['art'], string> = {
  online: 'Online-Portal',
  email: 'E-Mail',
  post: 'Post',
  persoenlich: 'Persoenlich',
  initiativ: 'Initiativbewerbung',
}

const ART_ICONS: Record<Bewerbung['art'], typeof Globe> = {
  online: Globe,
  email: Mail,
  post: Send,
  persoenlich: User,
  initiativ: Briefcase,
}

const STATUS_LABELS: Record<Bewerbung['status'], string> = {
  gesendet: 'Gesendet',
  eingangsbestaetigung: 'Bestaetigt',
  vorstellungsgespraech: 'Vorstellungsgespraech',
  absage: 'Absage',
  zusage: 'Zusage',
  keine_antwort: 'Keine Antwort',
}

const STATUS_OPTIONS: Bewerbung['status'][] = [
  'gesendet',
  'eingangsbestaetigung',
  'vorstellungsgespraech',
  'absage',
  'zusage',
  'keine_antwort',
]

const ART_OPTIONS: Bewerbung['art'][] = [
  'online',
  'email',
  'post',
  'persoenlich',
  'initiativ',
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadBewerbungen(): Bewerbung[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Bewerbung[]
  } catch {
    return []
  }
}

function saveBewerbungen(entries: Bewerbung[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-')
  const monthNames = [
    'Januar', 'Februar', 'Maerz', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
  ]
  return `${monthNames[parseInt(month, 10) - 1]} ${year}`
}

function statusBadgeClasses(status: Bewerbung['status']): string {
  switch (status) {
    case 'gesendet':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
    case 'eingangsbestaetigung':
      return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300'
    case 'vorstellungsgespraech':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
    case 'absage':
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
    case 'zusage':
      return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
    case 'keine_antwort':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300'
  }
}

function statusIcon(status: Bewerbung['status']) {
  switch (status) {
    case 'gesendet':
      return Send
    case 'eingangsbestaetigung':
      return Mail
    case 'vorstellungsgespraech':
      return Calendar
    case 'absage':
      return XCircle
    case 'zusage':
      return CheckCircle
    case 'keine_antwort':
      return Clock
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BewerbungsTracker() {
  useDocumentTitle('Bewerbungen - BescheidBoxer')

  const [bewerbungen, setBewerbungen] = useState<Bewerbung[]>(loadBewerbungen)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<Bewerbung['status'] | 'alle'>('alle')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')

  // Form state
  const [formFirma, setFormFirma] = useState('')
  const [formPosition, setFormPosition] = useState('')
  const [formDatum, setFormDatum] = useState(todayISO())
  const [formArt, setFormArt] = useState<Bewerbung['art']>('online')
  const [formStatus, setFormStatus] = useState<Bewerbung['status']>('gesendet')
  const [formQuelle, setFormQuelle] = useState('')
  const [formNotizen, setFormNotizen] = useState('')
  const [formKontakt, setFormKontakt] = useState('')

  // Persist helper
  function persist(updated: Bewerbung[]) {
    setBewerbungen(updated)
    saveBewerbungen(updated)
  }

  // Form helpers
  function resetForm() {
    setFormFirma('')
    setFormPosition('')
    setFormDatum(todayISO())
    setFormArt('online')
    setFormStatus('gesendet')
    setFormQuelle('')
    setFormNotizen('')
    setFormKontakt('')
    setEditId(null)
  }

  function openAddForm() {
    resetForm()
    setShowForm(true)
  }

  function openEditForm(b: Bewerbung) {
    setFormFirma(b.firma)
    setFormPosition(b.position)
    setFormDatum(b.datum)
    setFormArt(b.art)
    setFormStatus(b.status)
    setFormQuelle(b.quelle)
    setFormNotizen(b.notizen)
    setFormKontakt(b.kontakt)
    setEditId(b.id)
    setShowForm(true)
  }

  function handleSave() {
    if (!formFirma.trim() || !formPosition.trim() || !formDatum) return

    if (editId) {
      // Update existing
      persist(
        bewerbungen.map((b) =>
          b.id === editId
            ? {
                ...b,
                firma: formFirma.trim(),
                position: formPosition.trim(),
                datum: formDatum,
                art: formArt,
                status: formStatus,
                quelle: formQuelle.trim(),
                notizen: formNotizen.trim(),
                kontakt: formKontakt.trim(),
              }
            : b
        )
      )
    } else {
      // Create new
      const entry: Bewerbung = {
        id: generateId(),
        firma: formFirma.trim(),
        position: formPosition.trim(),
        datum: formDatum,
        art: formArt,
        status: formStatus,
        quelle: formQuelle.trim(),
        notizen: formNotizen.trim(),
        kontakt: formKontakt.trim(),
      }
      persist([...bewerbungen, entry])
    }

    resetForm()
    setShowForm(false)
  }

  function handleDelete(id: string) {
    persist(bewerbungen.filter((b) => b.id !== id))
    setDeleteConfirmId(null)
  }

  function handleStatusChange(id: string, newStatus: Bewerbung['status']) {
    persist(bewerbungen.map((b) => (b.id === id ? { ...b, status: newStatus } : b)))
  }

  // ---------------------------------------------------------------------------
  // Statistics
  // ---------------------------------------------------------------------------

  const currentMonthKey = getMonthKey(todayISO())

  const stats = useMemo(() => {
    const thisMonth = bewerbungen.filter((b) => getMonthKey(b.datum) === currentMonthKey).length
    const total = bewerbungen.length
    const pending = bewerbungen.filter(
      (b) => b.status === 'gesendet' || b.status === 'eingangsbestaetigung' || b.status === 'keine_antwort'
    ).length
    const interviews = bewerbungen.filter((b) => b.status === 'vorstellungsgespraech').length
    const interviewRate = total > 0 ? Math.round((interviews / total) * 100) : 0
    return { thisMonth, total, pending, interviewRate }
  }, [bewerbungen, currentMonthKey])

  // Monthly breakdown
  const monthlyBreakdown = useMemo(() => {
    const map = new Map<string, number>()
    for (const b of bewerbungen) {
      const key = getMonthKey(b.datum)
      map.set(key, (map.get(key) || 0) + 1)
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
  }, [bewerbungen])

  // ---------------------------------------------------------------------------
  // Filtered & Sorted list
  // ---------------------------------------------------------------------------

  const filteredSorted = useMemo(() => {
    let list = [...bewerbungen]

    // Search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      list = list.filter(
        (b) =>
          b.firma.toLowerCase().includes(term) ||
          b.position.toLowerCase().includes(term)
      )
    }

    // Filter by status
    if (filterStatus !== 'alle') {
      list = list.filter((b) => b.status === filterStatus)
    }

    // Sort by date
    list.sort((a, b) => {
      const dateA = new Date(a.datum).getTime()
      const dateB = new Date(b.datum).getTime()
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })

    return list
  }, [bewerbungen, searchTerm, filterStatus, sortOrder])

  // ---------------------------------------------------------------------------
  // PDF Export
  // ---------------------------------------------------------------------------

  function handleExportPdf() {
    const sections: RechnerSection[] = bewerbungen
      .sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime())
      .map((b) => ({
        label: `${formatDate(b.datum)} - ${b.firma} (${b.position})`,
        value: STATUS_LABELS[b.status],
        highlight: b.status === 'vorstellungsgespraech' || b.status === 'zusage',
      }))

    generateRechnerPdf(
      'Bewerbungsuebersicht - Eigenbemuehungen',
      sections,
      { label: 'Bewerbungen gesamt', value: String(bewerbungen.length) }
    )
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const inputClasses =
    'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Bewerbungen' },
            ]}
            className="mb-4"
          />
          <div className="flex items-center gap-3 mb-1">
            <Briefcase className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Bewerbungs-Tracker</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Dokumentiere deine Eigenbemuehungen fuer das Jobcenter
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* ---------------------------------------------------------------- */}
        {/* Overview Stats                                                   */}
        {/* ---------------------------------------------------------------- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.thisMonth}</p>
              <p className="text-xs text-muted-foreground">Diesen Monat</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Briefcase className="h-5 w-5 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Gesamt</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Offen / Wartend</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.interviewRate}%</p>
              <p className="text-xs text-muted-foreground">Gespraechsquote</p>
            </CardContent>
          </Card>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Monthly Counter                                                  */}
        {/* ---------------------------------------------------------------- */}
        {monthlyBreakdown.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Bewerbungen pro Monat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {monthlyBreakdown.map(([monthKey, count]) => (
                  <div
                    key={monthKey}
                    className={`rounded-lg border p-3 text-center ${
                      monthKey === currentMonthKey
                        ? 'border-primary bg-primary/5'
                        : 'bg-muted/30'
                    }`}
                  >
                    <p className="text-lg font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">{getMonthLabel(monthKey)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Tipp-Box: Bewerbungspflicht                                      */}
        {/* ---------------------------------------------------------------- */}
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="p-5">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div className="space-y-2 text-sm">
                <h3 className="font-semibold text-blue-900 dark:text-blue-200">
                  Bewerbungspflicht &amp; Eigenbemuehungen
                </h3>
                <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-300">
                  <li>
                    Nach <strong>&#167; 2 SGB II</strong> sind Leistungsberechtigte verpflichtet, alle
                    Moeglichkeiten zur Beendigung oder Verringerung der Hilfebeduerfigkeit auszuschoepfen.
                  </li>
                  <li>
                    Die Eingliederungsvereinbarung legt fest, wie viele Bewerbungen pro Monat erwartet werden
                    (haeufig 5-10 Bewerbungen/Monat).
                  </li>
                  <li>
                    <strong>Gueltige Eigenbemuehungen:</strong> Online-Bewerbungen, E-Mail-Bewerbungen,
                    postalische Bewerbungen, persoenliche Vorstellungen, Initiativbewerbungen, Kontakt
                    mit Zeitarbeitsfirmen.
                  </li>
                  <li>
                    Dokumentiere jede Bewerbung sorgfaeltig mit Datum, Firma und Position -- das Jobcenter
                    kann Nachweise verlangen.
                  </li>
                  <li>
                    Bei Verstoessen gegen die Bewerbungspflicht drohen <strong>Leistungskuerzungen</strong> (Sanktionen)
                    nach &#167; 31 SGB II.
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ---------------------------------------------------------------- */}
        {/* Action Bar: Add, Export, Search, Filter, Sort                    */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <Button onClick={openAddForm} className="gap-2">
            <Plus className="h-4 w-4" />
            Neue Bewerbung
          </Button>
          {bewerbungen.length > 0 && (
            <Button onClick={handleExportPdf} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Als PDF exportieren
            </Button>
          )}
        </div>

        {/* Search, Filter & Sort Row */}
        {bewerbungen.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Firma oder Position suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${inputClasses} pl-9`}
              />
            </div>

            {/* Filter by status */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as Bewerbung['status'] | 'alle')}
                className={`${inputClasses} pl-9 pr-8 min-w-[180px]`}
              >
                <option value="alle">Alle Status</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort toggle */}
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            >
              <ArrowUpDown className="h-4 w-4" />
              {sortOrder === 'newest' ? 'Neueste zuerst' : 'Aelteste zuerst'}
            </Button>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Add / Edit Form                                                  */}
        {/* ---------------------------------------------------------------- */}
        {showForm && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-primary" />
                {editId ? 'Bewerbung bearbeiten' : 'Neue Bewerbung eintragen'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Firma */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    <Building className="inline h-3.5 w-3.5 mr-1" />
                    Firma *
                  </label>
                  <input
                    type="text"
                    value={formFirma}
                    onChange={(e) => setFormFirma(e.target.value)}
                    placeholder="z.B. Deutsche Bahn AG"
                    className={inputClasses}
                  />
                </div>

                {/* Position */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    <Briefcase className="inline h-3.5 w-3.5 mr-1" />
                    Position *
                  </label>
                  <input
                    type="text"
                    value={formPosition}
                    onChange={(e) => setFormPosition(e.target.value)}
                    placeholder="z.B. Sachbearbeiter Buchhaltung"
                    className={inputClasses}
                  />
                </div>

                {/* Datum */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    <Calendar className="inline h-3.5 w-3.5 mr-1" />
                    Bewerbungsdatum *
                  </label>
                  <input
                    type="date"
                    value={formDatum}
                    onChange={(e) => setFormDatum(e.target.value)}
                    max={todayISO()}
                    className={inputClasses}
                  />
                </div>

                {/* Art */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    <Send className="inline h-3.5 w-3.5 mr-1" />
                    Bewerbungsart
                  </label>
                  <select
                    value={formArt}
                    onChange={(e) => setFormArt(e.target.value as Bewerbung['art'])}
                    className={inputClasses}
                  >
                    {ART_OPTIONS.map((a) => (
                      <option key={a} value={a}>
                        {ART_LABELS[a]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as Bewerbung['status'])}
                    className={inputClasses}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quelle */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    <Globe className="inline h-3.5 w-3.5 mr-1" />
                    Quelle
                  </label>
                  <input
                    type="text"
                    value={formQuelle}
                    onChange={(e) => setFormQuelle(e.target.value)}
                    placeholder="z.B. Indeed, Arbeitsagentur, StepStone"
                    className={inputClasses}
                  />
                </div>

                {/* Kontakt */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    <User className="inline h-3.5 w-3.5 mr-1" />
                    Ansprechpartner
                  </label>
                  <input
                    type="text"
                    value={formKontakt}
                    onChange={(e) => setFormKontakt(e.target.value)}
                    placeholder="z.B. Frau Mueller, HR-Abteilung"
                    className={inputClasses}
                  />
                </div>
              </div>

              {/* Notizen */}
              <div>
                <label className="block text-sm font-medium mb-1">Notizen</label>
                <textarea
                  value={formNotizen}
                  onChange={(e) => setFormNotizen(e.target.value)}
                  rows={3}
                  placeholder="Zusaetzliche Anmerkungen zur Bewerbung..."
                  className={`${inputClasses} resize-y`}
                />
              </div>

              {/* Save / Cancel */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleSave}
                  disabled={!formFirma.trim() || !formPosition.trim() || !formDatum}
                  className="gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  {editId ? 'Aenderungen speichern' : 'Bewerbung speichern'}
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
            </CardContent>
          </Card>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Bewerbungs-Liste                                                 */}
        {/* ---------------------------------------------------------------- */}
        {filteredSorted.length > 0 ? (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">
              Deine Bewerbungen ({filteredSorted.length}
              {filteredSorted.length !== bewerbungen.length && ` von ${bewerbungen.length}`})
            </h2>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto rounded-xl border bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium">Datum</th>
                    <th className="text-left px-4 py-3 font-medium">Firma</th>
                    <th className="text-left px-4 py-3 font-medium">Position</th>
                    <th className="text-left px-4 py-3 font-medium">Art</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Quelle</th>
                    <th className="text-right px-4 py-3 font-medium">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSorted.map((b) => {
                    const ArtIcon = ART_ICONS[b.art]
                    const StatusIcon = statusIcon(b.status)
                    const showDeleteConfirm = deleteConfirmId === b.id

                    return (
                      <tr key={b.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">{formatDate(b.datum)}</td>
                        <td className="px-4 py-3 font-medium">{b.firma}</td>
                        <td className="px-4 py-3">{b.position}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-xs">
                            <ArtIcon className="h-3.5 w-3.5" />
                            {ART_LABELS[b.art]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative inline-block">
                            <button
                              onClick={() => {
                                const nextIdx = (STATUS_OPTIONS.indexOf(b.status) + 1) % STATUS_OPTIONS.length
                                handleStatusChange(b.id, STATUS_OPTIONS[nextIdx])
                              }}
                              className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full cursor-pointer hover:opacity-80 transition-opacity ${statusBadgeClasses(b.status)}`}
                              title="Klicken um Status zu aendern"
                            >
                              <StatusIcon className="h-3 w-3" />
                              {STATUS_LABELS[b.status]}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{b.quelle || '-'}</td>
                        <td className="px-4 py-3 text-right">
                          {showDeleteConfirm ? (
                            <div className="inline-flex items-center gap-2">
                              <span className="text-xs text-red-600 font-medium">Loeschen?</span>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => handleDelete(b.id)}
                              >
                                Ja
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => setDeleteConfirmId(null)}
                              >
                                Nein
                              </Button>
                            </div>
                          ) : (
                            <div className="inline-flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => openEditForm(b)}
                                title="Bearbeiten"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                onClick={() => setDeleteConfirmId(b.id)}
                                title="Loeschen"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {filteredSorted.map((b) => {
                const ArtIcon = ART_ICONS[b.art]
                const StatusIcon = statusIcon(b.status)
                const showDeleteConfirm = deleteConfirmId === b.id

                return (
                  <Card key={b.id}>
                    <CardContent className="p-4">
                      {/* Top row: badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${statusBadgeClasses(b.status)}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {STATUS_LABELS[b.status]}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                          <ArtIcon className="h-3 w-3" />
                          {ART_LABELS[b.art]}
                        </span>
                      </div>

                      {/* Firm & position */}
                      <h3 className="font-semibold text-base">
                        <Building className="inline h-4 w-4 mr-1 text-muted-foreground" />
                        {b.firma}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">{b.position}</p>

                      {/* Meta */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(b.datum)}
                        </span>
                        {b.quelle && (
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {b.quelle}
                          </span>
                        )}
                        {b.kontakt && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {b.kontakt}
                          </span>
                        )}
                      </div>

                      {/* Notizen */}
                      {b.notizen && (
                        <div className="rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground mb-3 whitespace-pre-wrap">
                          {b.notizen}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 text-xs"
                          onClick={() => {
                            const nextIdx = (STATUS_OPTIONS.indexOf(b.status) + 1) % STATUS_OPTIONS.length
                            handleStatusChange(b.id, STATUS_OPTIONS[nextIdx])
                          }}
                        >
                          <ArrowUpDown className="h-3.5 w-3.5" />
                          Status
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 text-xs"
                          onClick={() => openEditForm(b)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          Bearbeiten
                        </Button>
                        {showDeleteConfirm ? (
                          <div className="flex items-center gap-2 ml-auto">
                            <span className="text-xs text-red-600 font-medium">Loeschen?</span>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => handleDelete(b.id)}
                            >
                              Ja
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => setDeleteConfirmId(null)}
                            >
                              Nein
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 ml-auto"
                            onClick={() => setDeleteConfirmId(b.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Loeschen
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ) : bewerbungen.length > 0 ? (
          /* No results from filter/search */
          <div className="text-center py-12">
            <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-1">Keine Ergebnisse</h3>
            <p className="text-muted-foreground text-sm">
              Keine Bewerbungen gefunden fuer deine Suchkriterien.
            </p>
            <Button
              variant="outline"
              className="mt-4 gap-2"
              onClick={() => {
                setSearchTerm('')
                setFilterStatus('alle')
              }}
            >
              <XCircle className="h-4 w-4" />
              Filter zuruecksetzen
            </Button>
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Noch keine Bewerbungen eingetragen</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Trage deine Bewerbungen ein, um deine Eigenbemuehungen gegenueber dem Jobcenter
              lueckenlos zu dokumentieren.
            </p>
            <Button onClick={openAddForm} className="gap-2">
              <Plus className="h-4 w-4" />
              Erste Bewerbung eintragen
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
