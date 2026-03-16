import { useState, useEffect, useCallback } from 'react'
import {
  FileText,
  Users,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Phone,
  Mail,
  Building,
  Search,
  Hash,
  Info,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import Breadcrumbs from '@/components/Breadcrumbs'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AktenzeichenArt = 'buergergeld' | 'widerspruch' | 'klage' | 'sonstiges'

interface Aktenzeichen {
  id: string
  nummer: string
  behoerde: string
  art: AktenzeichenArt
  datum: string
  notiz: string
}

interface Sachbearbeiter {
  id: string
  name: string
  behoerde: string
  telefon: string
  email: string
  zimmer: string
  notiz: string
}

interface AktenzeichenData {
  aktenzeichen: Aktenzeichen[]
  sachbearbeiter: Sachbearbeiter[]
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'bescheidboxer_aktenzeichen'

const ART_LABELS: Record<AktenzeichenArt, string> = {
  buergergeld: 'Buergergeld',
  widerspruch: 'Widerspruch',
  klage: 'Klage',
  sonstiges: 'Sonstiges',
}

const ART_COLORS: Record<AktenzeichenArt, string> = {
  buergergeld: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  widerspruch: 'bg-amber-100 text-amber-700 border-amber-200',
  klage: 'bg-red-100 text-red-700 border-red-200',
  sonstiges: 'bg-gray-100 text-gray-700 border-gray-200',
}

type ActiveTab = 'aktenzeichen' | 'sachbearbeiter'

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

function loadData(): AktenzeichenData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { aktenzeichen: [], sachbearbeiter: [] }
    return JSON.parse(raw) as AktenzeichenData
  } catch {
    return { aktenzeichen: [], sachbearbeiter: [] }
  }
}

function saveData(data: AktenzeichenData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
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

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// ---------------------------------------------------------------------------
// Sub-components: Aktenzeichen Form
// ---------------------------------------------------------------------------

interface AktenzeichenFormProps {
  initial?: Aktenzeichen
  onSave: (az: Aktenzeichen) => void
  onCancel: () => void
}

function AktenzeichenForm({ initial, onSave, onCancel }: AktenzeichenFormProps) {
  const [nummer, setNummer] = useState(initial?.nummer ?? '')
  const [behoerde, setBehoerde] = useState(initial?.behoerde ?? '')
  const [art, setArt] = useState<AktenzeichenArt>(initial?.art ?? 'buergergeld')
  const [notiz, setNotiz] = useState(initial?.notiz ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nummer.trim() || !behoerde.trim()) return
    onSave({
      id: initial?.id ?? generateId(),
      nummer: nummer.trim(),
      behoerde: behoerde.trim(),
      art,
      datum: initial?.datum ?? new Date().toISOString(),
      notiz: notiz.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="az-nummer">Aktenzeichen *</Label>
          <Input
            id="az-nummer"
            placeholder="z.B. 123-456-789"
            value={nummer}
            onChange={(e) => setNummer(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="az-behoerde">Behoerde *</Label>
          <Input
            id="az-behoerde"
            placeholder="z.B. Jobcenter Berlin Mitte"
            value={behoerde}
            onChange={(e) => setBehoerde(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Art</Label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(ART_LABELS) as AktenzeichenArt[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setArt(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                art === key
                  ? ART_COLORS[key]
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              {ART_LABELS[key]}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="az-notiz">Notiz (optional)</Label>
        <textarea
          id="az-notiz"
          placeholder="Zusaetzliche Informationen..."
          value={notiz}
          onChange={(e) => setNotiz(e.target.value)}
          className="w-full min-h-[80px] p-3 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="submit" size="sm" className="gap-1.5">
          <Check className="h-4 w-4" />
          Speichern
        </Button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Sub-components: Sachbearbeiter Form
// ---------------------------------------------------------------------------

interface SachbearbeiterFormProps {
  initial?: Sachbearbeiter
  onSave: (sb: Sachbearbeiter) => void
  onCancel: () => void
}

function SachbearbeiterForm({ initial, onSave, onCancel }: SachbearbeiterFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [behoerde, setBehoerde] = useState(initial?.behoerde ?? '')
  const [telefon, setTelefon] = useState(initial?.telefon ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [zimmer, setZimmer] = useState(initial?.zimmer ?? '')
  const [notiz, setNotiz] = useState(initial?.notiz ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !behoerde.trim()) return
    onSave({
      id: initial?.id ?? generateId(),
      name: name.trim(),
      behoerde: behoerde.trim(),
      telefon: telefon.trim(),
      email: email.trim(),
      zimmer: zimmer.trim(),
      notiz: notiz.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sb-name">Name *</Label>
          <Input
            id="sb-name"
            placeholder="Vor- und Nachname"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sb-behoerde">Behoerde *</Label>
          <Input
            id="sb-behoerde"
            placeholder="z.B. Jobcenter Berlin Mitte"
            value={behoerde}
            onChange={(e) => setBehoerde(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sb-telefon">Telefon (optional)</Label>
          <Input
            id="sb-telefon"
            type="tel"
            placeholder="030 123456"
            value={telefon}
            onChange={(e) => setTelefon(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sb-email">E-Mail (optional)</Label>
          <Input
            id="sb-email"
            type="email"
            placeholder="name@jobcenter.de"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sb-zimmer">Zimmer/Buero (optional)</Label>
          <Input
            id="sb-zimmer"
            placeholder="z.B. Raum 2.14"
            value={zimmer}
            onChange={(e) => setZimmer(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="sb-notiz">Notiz (optional)</Label>
        <textarea
          id="sb-notiz"
          placeholder="Zusaetzliche Informationen..."
          value={notiz}
          onChange={(e) => setNotiz(e.target.value)}
          className="w-full min-h-[80px] p-3 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="submit" size="sm" className="gap-1.5">
          <Check className="h-4 w-4" />
          Speichern
        </Button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function AktenzeichenPage() {
  useDocumentTitle('Aktenzeichen & Kontakte - BescheidBoxer')

  const [data, setData] = useState<AktenzeichenData>(loadData)
  const [activeTab, setActiveTab] = useState<ActiveTab>('aktenzeichen')
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Aktenzeichen state
  const [showAzForm, setShowAzForm] = useState(false)
  const [editingAz, setEditingAz] = useState<Aktenzeichen | null>(null)
  const [deleteAzConfirm, setDeleteAzConfirm] = useState<string | null>(null)

  // Sachbearbeiter state
  const [showSbForm, setShowSbForm] = useState(false)
  const [editingSb, setEditingSb] = useState<Sachbearbeiter | null>(null)
  const [deleteSbConfirm, setDeleteSbConfirm] = useState<string | null>(null)

  // Persist to localStorage
  useEffect(() => {
    saveData(data)
  }, [data])

  // --- Aktenzeichen CRUD ---

  const handleSaveAz = useCallback((az: Aktenzeichen) => {
    setData((prev) => {
      const exists = prev.aktenzeichen.some((a) => a.id === az.id)
      return {
        ...prev,
        aktenzeichen: exists
          ? prev.aktenzeichen.map((a) => (a.id === az.id ? az : a))
          : [az, ...prev.aktenzeichen],
      }
    })
    setShowAzForm(false)
    setEditingAz(null)
  }, [])

  const handleDeleteAz = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      aktenzeichen: prev.aktenzeichen.filter((a) => a.id !== id),
    }))
    setDeleteAzConfirm(null)
  }, [])

  const handleCopyAz = useCallback(async (nummer: string, id: string) => {
    try {
      await navigator.clipboard.writeText(nummer)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // fallback: do nothing
    }
  }, [])

  // --- Sachbearbeiter CRUD ---

  const handleSaveSb = useCallback((sb: Sachbearbeiter) => {
    setData((prev) => {
      const exists = prev.sachbearbeiter.some((s) => s.id === sb.id)
      return {
        ...prev,
        sachbearbeiter: exists
          ? prev.sachbearbeiter.map((s) => (s.id === sb.id ? sb : s))
          : [sb, ...prev.sachbearbeiter],
      }
    })
    setShowSbForm(false)
    setEditingSb(null)
  }, [])

  const handleDeleteSb = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      sachbearbeiter: prev.sachbearbeiter.filter((s) => s.id !== id),
    }))
    setDeleteSbConfirm(null)
  }, [])

  // --- Filtering ---

  const filteredAz = data.aktenzeichen.filter((az) => {
    if (searchQuery.trim() === '') return true
    const q = searchQuery.toLowerCase()
    return (
      az.nummer.toLowerCase().includes(q) ||
      az.behoerde.toLowerCase().includes(q) ||
      ART_LABELS[az.art].toLowerCase().includes(q) ||
      az.notiz.toLowerCase().includes(q)
    )
  })

  const filteredSb = data.sachbearbeiter.filter((sb) => {
    if (searchQuery.trim() === '') return true
    const q = searchQuery.toLowerCase()
    return (
      sb.name.toLowerCase().includes(q) ||
      sb.behoerde.toLowerCase().includes(q) ||
      sb.telefon.toLowerCase().includes(q) ||
      sb.email.toLowerCase().includes(q) ||
      sb.zimmer.toLowerCase().includes(q) ||
      sb.notiz.toLowerCase().includes(q)
    )
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Aktenzeichen & Kontakte' },
          ]}
          className="mb-4"
        />

        {/* -------------------------------------------------------------- */}
        {/* Header                                                         */}
        {/* -------------------------------------------------------------- */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-boxer rounded-full">
              <Hash className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Aktenzeichen & Kontakte
              </h1>
              <p className="text-sm text-gray-500">
                Verwalte deine Aktenzeichen und Sachbearbeiter-Kontakte
              </p>
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* Tipp Box                                                       */}
        {/* -------------------------------------------------------------- */}
        <div className="mb-6 flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Tipp: Aktenzeichen immer griffbereit</p>
            <p>
              Notiere hier alle Aktenzeichen deiner Bescheide, Widersprueche und Klagen.
              So hast du sie bei Telefonaten, Terminen und Schreiben sofort zur Hand.
              Du kannst sie mit einem Klick in die Zwischenablage kopieren.
            </p>
          </div>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* Tab navigation                                                 */}
        {/* -------------------------------------------------------------- */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => { setActiveTab('aktenzeichen'); setSearchQuery('') }}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'aktenzeichen'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="h-4 w-4" />
            Aktenzeichen
            {data.aktenzeichen.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">
                {data.aktenzeichen.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('sachbearbeiter'); setSearchQuery('') }}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'sachbearbeiter'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="h-4 w-4" />
            Sachbearbeiter
            {data.sachbearbeiter.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">
                {data.sachbearbeiter.length}
              </span>
            )}
          </button>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* Search + Add button                                            */}
        {/* -------------------------------------------------------------- */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={
                activeTab === 'aktenzeichen'
                  ? 'Aktenzeichen durchsuchen...'
                  : 'Sachbearbeiter durchsuchen...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-colors"
            />
          </div>
          <Button
            size="sm"
            className="gap-2 shrink-0"
            onClick={() => {
              if (activeTab === 'aktenzeichen') {
                setEditingAz(null)
                setShowAzForm(true)
              } else {
                setEditingSb(null)
                setShowSbForm(true)
              }
            }}
          >
            <Plus className="h-4 w-4" />
            {activeTab === 'aktenzeichen' ? 'Neues Aktenzeichen' : 'Neuer Sachbearbeiter'}
          </Button>
        </div>

        {/* ============================================================== */}
        {/* Aktenzeichen Tab                                               */}
        {/* ============================================================== */}
        {activeTab === 'aktenzeichen' && (
          <div className="space-y-4">
            {/* Add / Edit form */}
            {showAzForm && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    {editingAz ? 'Aktenzeichen bearbeiten' : 'Neues Aktenzeichen hinzufuegen'}
                  </h3>
                  <AktenzeichenForm
                    initial={editingAz ?? undefined}
                    onSave={handleSaveAz}
                    onCancel={() => { setShowAzForm(false); setEditingAz(null) }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Empty state */}
            {data.aktenzeichen.length === 0 && !showAzForm && (
              <div className="text-center py-16">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-semibold text-lg text-gray-900 mb-2">
                  Noch keine Aktenzeichen gespeichert
                </h3>
                <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                  Speichere hier deine Aktenzeichen von Bescheiden, Widerspruechen
                  und Klagen, damit du sie immer schnell zur Hand hast.
                </p>
                <Button className="gap-2" onClick={() => setShowAzForm(true)}>
                  <Plus className="h-4 w-4" />
                  Erstes Aktenzeichen hinzufuegen
                </Button>
              </div>
            )}

            {/* No search results */}
            {data.aktenzeichen.length > 0 && filteredAz.length === 0 && (
              <div className="text-center py-12">
                <Search className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">
                  Keine Aktenzeichen gefunden
                </h3>
                <p className="text-sm text-gray-500">
                  Versuche einen anderen Suchbegriff.
                </p>
              </div>
            )}

            {/* Aktenzeichen cards */}
            {filteredAz.map((az) => {
              const isDeleting = deleteAzConfirm === az.id
              return (
                <Card key={az.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="font-mono text-lg font-bold text-gray-900">
                            {az.nummer}
                          </span>
                          <Badge
                            className={`${ART_COLORS[az.art]} border text-xs`}
                          >
                            {ART_LABELS[az.art]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-1">
                          <Building className="h-3.5 w-3.5 shrink-0" />
                          <span>{az.behoerde}</span>
                        </div>
                        <p className="text-xs text-gray-400">
                          Hinzugefuegt am {formatDate(az.datum)}
                        </p>
                        {az.notiz && (
                          <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">
                            {az.notiz}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Aktenzeichen kopieren"
                          onClick={() => handleCopyAz(az.nummer, az.id)}
                        >
                          {copiedId === az.id ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Bearbeiten"
                          onClick={() => {
                            setEditingAz(az)
                            setShowAzForm(true)
                          }}
                        >
                          <Edit2 className="h-4 w-4 text-gray-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Loeschen"
                          onClick={() =>
                            setDeleteAzConfirm(isDeleting ? null : az.id)
                          }
                        >
                          <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-600" />
                        </Button>
                      </div>
                    </div>

                    {/* Delete confirmation */}
                    {isDeleting && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-sm text-red-800 mb-2">
                          Aktenzeichen wirklich loeschen?
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="gap-1"
                            onClick={() => handleDeleteAz(az.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Loeschen
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteAzConfirm(null)}
                          >
                            Abbrechen
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* ============================================================== */}
        {/* Sachbearbeiter Tab                                              */}
        {/* ============================================================== */}
        {activeTab === 'sachbearbeiter' && (
          <div className="space-y-4">
            {/* Add / Edit form */}
            {showSbForm && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    {editingSb ? 'Sachbearbeiter bearbeiten' : 'Neuen Sachbearbeiter hinzufuegen'}
                  </h3>
                  <SachbearbeiterForm
                    initial={editingSb ?? undefined}
                    onSave={handleSaveSb}
                    onCancel={() => { setShowSbForm(false); setEditingSb(null) }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Empty state */}
            {data.sachbearbeiter.length === 0 && !showSbForm && (
              <div className="text-center py-16">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-semibold text-lg text-gray-900 mb-2">
                  Noch keine Sachbearbeiter gespeichert
                </h3>
                <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                  Speichere hier die Kontaktdaten deiner Sachbearbeiter,
                  damit du sie bei Bedarf schnell erreichen kannst.
                </p>
                <Button className="gap-2" onClick={() => setShowSbForm(true)}>
                  <Plus className="h-4 w-4" />
                  Ersten Sachbearbeiter hinzufuegen
                </Button>
              </div>
            )}

            {/* No search results */}
            {data.sachbearbeiter.length > 0 && filteredSb.length === 0 && (
              <div className="text-center py-12">
                <Search className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">
                  Keine Sachbearbeiter gefunden
                </h3>
                <p className="text-sm text-gray-500">
                  Versuche einen anderen Suchbegriff.
                </p>
              </div>
            )}

            {/* Sachbearbeiter cards */}
            {filteredSb.map((sb) => {
              const isDeleting = deleteSbConfirm === sb.id
              return (
                <Card key={sb.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {sb.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-3">
                          <Building className="h-3.5 w-3.5 shrink-0" />
                          <span>{sb.behoerde}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                          {sb.telefon && (
                            <a
                              href={`tel:${sb.telefon}`}
                              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <Phone className="h-3.5 w-3.5" />
                              {sb.telefon}
                            </a>
                          )}
                          {sb.email && (
                            <a
                              href={`mailto:${sb.email}`}
                              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <Mail className="h-3.5 w-3.5" />
                              {sb.email}
                            </a>
                          )}
                          {sb.zimmer && (
                            <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                              <Building className="h-3.5 w-3.5" />
                              {sb.zimmer}
                            </span>
                          )}
                        </div>
                        {sb.notiz && (
                          <p className="text-sm text-gray-600 mt-3 whitespace-pre-wrap">
                            {sb.notiz}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Bearbeiten"
                          onClick={() => {
                            setEditingSb(sb)
                            setShowSbForm(true)
                          }}
                        >
                          <Edit2 className="h-4 w-4 text-gray-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Loeschen"
                          onClick={() =>
                            setDeleteSbConfirm(isDeleting ? null : sb.id)
                          }
                        >
                          <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-600" />
                        </Button>
                      </div>
                    </div>

                    {/* Delete confirmation */}
                    {isDeleting && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-sm text-red-800 mb-2">
                          Sachbearbeiter wirklich loeschen?
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="gap-1"
                            onClick={() => handleDeleteSb(sb.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Loeschen
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteSbConfirm(null)}
                          >
                            Abbrechen
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* -------------------------------------------------------------- */}
        {/* Footer info                                                    */}
        {/* -------------------------------------------------------------- */}
        {(data.aktenzeichen.length > 0 || data.sachbearbeiter.length > 0) && (
          <p className="text-xs text-gray-400 text-center mt-10 max-w-2xl mx-auto leading-relaxed">
            Deine Daten werden lokal in deinem Browser gespeichert und nicht an
            unsere Server uebertragen. Achte darauf, regelmaessig ein Backup zu
            erstellen.
          </p>
        )}
      </div>
    </div>
  )
}
