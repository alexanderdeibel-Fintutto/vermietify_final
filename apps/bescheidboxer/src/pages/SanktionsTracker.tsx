import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import Breadcrumbs from '@/components/Breadcrumbs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ShieldAlert, Plus, Trash2, Clock, AlertTriangle, CheckCircle, Calendar, Euro,
  ChevronRight, ChevronDown, TrendingDown, Scale, MessageSquare, FileText, Info, Ban, Timer,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

interface Sanktion {
  id: string
  grund: 'termin_versaeumt' | 'massnahme_abgebrochen' | 'mitwirkung_verweigert' | 'arbeit_abgelehnt' | 'eingliederung_verstoss' | 'sonstiges'
  bescheidDatum: string
  startDatum: string
  endeDatum: string
  kuerzungProzent: number
  kuerzungBetrag: number
  status: 'aktiv' | 'widerspruch_eingereicht' | 'aufgehoben' | 'abgelaufen' | 'reduziert'
  aktenzeichen?: string
  notizen: string
}

const STORAGE_KEY = 'bescheidboxer_sanktionen'

const GRUND_LABELS: Record<Sanktion['grund'], string> = {
  termin_versaeumt: 'Termin versaeumt', massnahme_abgebrochen: 'Massnahme abgebrochen',
  mitwirkung_verweigert: 'Mitwirkung verweigert', arbeit_abgelehnt: 'Arbeit abgelehnt',
  eingliederung_verstoss: 'EGV-Verstoss', sonstiges: 'Sonstiges',
}
const GRUND_OPTIONS = Object.keys(GRUND_LABELS) as Sanktion['grund'][]

const STATUS_LABELS: Record<Sanktion['status'], string> = {
  aktiv: 'Aktiv', widerspruch_eingereicht: 'Widerspruch eingereicht',
  aufgehoben: 'Aufgehoben', abgelaufen: 'Abgelaufen', reduziert: 'Reduziert',
}
const STATUS_OPTIONS = Object.keys(STATUS_LABELS) as Sanktion['status'][]

const STATUS_COLORS: Record<Sanktion['status'], string> = {
  aktiv: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  widerspruch_eingereicht: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  aufgehoben: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  abgelaufen: 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300',
  reduziert: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
}

const GRUND_COLORS: Record<Sanktion['grund'], string> = {
  termin_versaeumt: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
  massnahme_abgebrochen: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
  mitwirkung_verweigert: 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
  arbeit_abgelehnt: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
  eingliederung_verstoss: 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
  sonstiges: 'bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const loadSanktionen = (): Sanktion[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
const saveSanktionen = (e: Sanktion[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(e))
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
const todayISO = () => new Date().toISOString().split('T')[0]
const addMonths = (d: string, m: number) => { const x = new Date(d); x.setMonth(x.getMonth() + m); return x.toISOString().split('T')[0] }
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''
const fmtEur = (n: number) => n.toFixed(2).replace('.', ',')

function daysBetween(from: string, to: string): number {
  const a = new Date(from); const b = new Date(to)
  a.setHours(0, 0, 0, 0); b.setHours(0, 0, 0, 0)
  return Math.ceil((b.getTime() - a.getTime()) / 86400000)
}
const daysUntil = (d: string) => daysBetween(todayISO(), d)

function progress(start: string, end: string): number {
  const total = daysBetween(start, end)
  if (total <= 0) return 100
  return Math.min(100, Math.max(0, Math.round((daysBetween(start, todayISO()) / total) * 100)))
}

function autoExpire(entries: Sanktion[]): Sanktion[] {
  const today = todayISO()
  let changed = false
  const updated = entries.map((s) => {
    if ((s.status === 'aktiv' || s.status === 'widerspruch_eingereicht') && s.endeDatum < today) {
      changed = true; return { ...s, status: 'abgelaufen' as const }
    }
    return s
  })
  if (changed) saveSanktionen(updated)
  return changed ? updated : entries
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SanktionsTracker() {
  useDocumentTitle('Sanktions-Tracker - BescheidBoxer')

  const [sanktionen, setSanktionen] = useState<Sanktion[]>(() => autoExpire(loadSanktionen()))
  const [showForm, setShowForm] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [statusDropdownId, setStatusDropdownId] = useState<string | null>(null)

  // Form state
  const [formGrund, setFormGrund] = useState<Sanktion['grund']>('termin_versaeumt')
  const [formBescheidDatum, setFormBescheidDatum] = useState('')
  const [formStartDatum, setFormStartDatum] = useState('')
  const [formKuerzung, setFormKuerzung] = useState<10 | 30>(10)
  const [formRegelsatz, setFormRegelsatz] = useState('563')
  const [formAz, setFormAz] = useState('')
  const [formNotizen, setFormNotizen] = useState('')

  useEffect(() => {
    const id = setInterval(() => setSanktionen((p) => autoExpire(p)), 60000)
    return () => clearInterval(id)
  }, [])

  const persist = (u: Sanktion[]) => { setSanktionen(u); saveSanktionen(u) }
  const resetForm = () => { setFormGrund('termin_versaeumt'); setFormBescheidDatum(''); setFormStartDatum(''); setFormKuerzung(10); setFormRegelsatz('563'); setFormAz(''); setFormNotizen('') }

  function handleSave() {
    if (!formBescheidDatum || !formStartDatum) return
    const rs = parseFloat(formRegelsatz) || 563
    const entry: Sanktion = {
      id: genId(), grund: formGrund, bescheidDatum: formBescheidDatum,
      startDatum: formStartDatum, endeDatum: addMonths(formStartDatum, 3),
      kuerzungProzent: formKuerzung, kuerzungBetrag: Math.round(rs * formKuerzung) / 100,
      status: 'aktiv', aktenzeichen: formAz.trim() || undefined, notizen: formNotizen.trim(),
    }
    persist(autoExpire([...sanktionen, entry])); resetForm(); setShowForm(false)
  }

  const handleDelete = (id: string) => { persist(sanktionen.filter((s) => s.id !== id)); setDeleteConfirmId(null) }
  const handleStatus = (id: string, st: Sanktion['status']) => { persist(sanktionen.map((s) => s.id === id ? { ...s, status: st } : s)); setStatusDropdownId(null) }

  // Computed values
  const stats = useMemo(() => {
    const aktive = sanktionen.filter((s) => s.status === 'aktiv' || s.status === 'widerspruch_eingereicht')
    const next = [...aktive].sort((a, b) => new Date(a.endeDatum).getTime() - new Date(b.endeDatum).getTime())[0]
    return { count: aktive.length, loss: aktive.reduce((s, x) => s + x.kuerzungBetrag, 0), daysNext: next ? daysUntil(next.endeDatum) : null }
  }, [sanktionen])

  const sorted = useMemo(() => [...sanktionen].sort((a, b) => {
    const aA = a.status === 'aktiv' || a.status === 'widerspruch_eingereicht'
    const bA = b.status === 'aktiv' || b.status === 'widerspruch_eingereicht'
    if (aA !== bA) return aA ? -1 : 1
    return aA ? new Date(a.endeDatum).getTime() - new Date(b.endeDatum).getTime() : new Date(b.endeDatum).getTime() - new Date(a.endeDatum).getTime()
  }), [sanktionen])

  const timeline = useMemo(() => [...sanktionen].sort((a, b) => new Date(a.startDatum).getTime() - new Date(b.startDatum).getTime()), [sanktionen])
  const previewBetrag = useMemo(() => Math.round((parseFloat(formRegelsatz) || 563) * formKuerzung) / 100, [formRegelsatz, formKuerzung])
  const cls = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Sanktions-Tracker' }]} className="mb-4" />
          <div className="flex items-center gap-3 mb-1">
            <ShieldAlert className="h-6 w-6 text-red-500" />
            <h1 className="text-2xl font-bold tracking-tight">Sanktions-Tracker</h1>
          </div>
          <p className="text-muted-foreground text-sm">Behalte den Ueberblick ueber deine Sanktionen und wehr dich gegen unrechtmaessige Kuerzungen</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card><CardContent className="p-4 text-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.count}</p>
            <p className="text-xs text-muted-foreground">Aktive Sanktionen</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Euro className="h-5 w-5 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{fmtEur(stats.loss)} &euro;</p>
            <p className="text-xs text-muted-foreground">Monatlicher Verlust</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Timer className="h-5 w-5 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.daysNext !== null ? `${stats.daysNext} Tage` : '--'}</p>
            <p className="text-xs text-muted-foreground">Bis naechste Sanktion endet</p>
          </CardContent></Card>
        </div>

        {/* Add button */}
        <Button onClick={() => setShowForm(!showForm)} className="gap-2" variant={showForm ? 'outline' : 'default'}>
          <Plus className="h-4 w-4" />
          {showForm ? 'Formular schliessen' : 'Neue Sanktion erfassen'}
        </Button>

        {/* Add Form */}
        {showForm && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-500" />
                Neue Sanktion erfassen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="block mb-1">Sanktionsgrund *</Label>
                  <select value={formGrund} onChange={(e) => { const v = e.target.value as Sanktion['grund']; setFormGrund(v); setFormKuerzung(v === 'termin_versaeumt' ? 10 : 30) }} className={cls}>
                    {GRUND_OPTIONS.map((g) => <option key={g} value={g}>{GRUND_LABELS[g]}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="block mb-1"><Calendar className="inline h-3.5 w-3.5 mr-1" />Bescheid-Datum *</Label>
                  <Input type="date" value={formBescheidDatum} onChange={(e) => setFormBescheidDatum(e.target.value)} max={todayISO()} />
                </div>
                <div>
                  <Label className="block mb-1"><Calendar className="inline h-3.5 w-3.5 mr-1" />Start-Datum (Beginn Kuerzung) *</Label>
                  <Input type="date" value={formStartDatum} onChange={(e) => setFormStartDatum(e.target.value)} />
                </div>
                <div>
                  <Label className="block mb-1">Kuerzung</Label>
                  <div className="flex gap-4 mt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="kuerzung" checked={formKuerzung === 10} onChange={() => setFormKuerzung(10)} className="accent-primary" />
                      <span className="text-sm">10% (Termin versaeumt)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="kuerzung" checked={formKuerzung === 30} onChange={() => setFormKuerzung(30)} className="accent-primary" />
                      <span className="text-sm">30% (Pflichtverletzung)</span>
                    </label>
                  </div>
                </div>
                <div>
                  <Label className="block mb-1"><Euro className="inline h-3.5 w-3.5 mr-1" />Regelsatz (EUR/Monat)</Label>
                  <Input type="number" value={formRegelsatz} onChange={(e) => setFormRegelsatz(e.target.value)} min="0" step="1" placeholder="563" />
                </div>
                <div>
                  <Label className="block mb-1">Aktenzeichen <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input type="text" value={formAz} onChange={(e) => setFormAz(e.target.value)} placeholder="z.B. S-1234/26" />
                </div>
              </div>
              <div>
                <Label className="block mb-1">Notizen <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <textarea value={formNotizen} onChange={(e) => setFormNotizen(e.target.value)} rows={2} placeholder="Zusaetzliche Notizen zur Sanktion..." className={`${cls} resize-y`} />
              </div>
              {formStartDatum && (
                <div className="flex flex-wrap items-center gap-4 text-sm bg-muted/50 rounded-lg px-3 py-2">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-4 w-4" />Ende: <span className="font-medium text-foreground">{fmtDate(addMonths(formStartDatum, 3))}</span>
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Euro className="h-4 w-4" />Kuerzung: <span className="font-medium text-red-600 dark:text-red-400">{fmtEur(previewBetrag)} &euro;/Monat</span>
                  </span>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <Button onClick={handleSave} disabled={!formBescheidDatum || !formStartDatum} className="gap-2">
                  <CheckCircle className="h-4 w-4" />Sanktion speichern
                </Button>
                <Button variant="outline" onClick={() => { resetForm(); setShowForm(false) }}>Abbrechen</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sanctions List */}
        {sorted.length > 0 ? (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Deine Sanktionen ({sanktionen.length})</h2>
            {sorted.map((s) => {
              const days = daysUntil(s.endeDatum)
              const pct = progress(s.startDatum, s.endeDatum)
              const isActive = s.status === 'aktiv' || s.status === 'widerspruch_eingereicht'
              const showDD = statusDropdownId === s.id
              const showDel = deleteConfirmId === s.id
              return (
                <Card key={s.id} className={isActive ? 'border-red-200 dark:border-red-800' : s.status === 'aufgehoben' ? 'border-green-200 dark:border-green-800' : ''}>
                  <CardContent className="p-4">
                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_COLORS[s.status]}`}>{STATUS_LABELS[s.status]}</span>
                      <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${GRUND_COLORS[s.grund]}`}>{GRUND_LABELS[s.grund]}</span>
                      <Badge variant="destructive" className="text-xs">-{s.kuerzungProzent}%</Badge>
                    </div>
                    {/* Info row */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mb-3">
                      <span className="flex items-center gap-1 font-semibold text-red-600 dark:text-red-400">
                        <TrendingDown className="h-3.5 w-3.5" />-{fmtEur(s.kuerzungBetrag)} &euro;/Monat
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />{fmtDate(s.startDatum)} - {fmtDate(s.endeDatum)}
                      </span>
                      {s.aktenzeichen && <span className="flex items-center gap-1 text-muted-foreground"><FileText className="h-3.5 w-3.5" />Az: {s.aktenzeichen}</span>}
                    </div>
                    {/* Countdown */}
                    {isActive && (
                      <div className="flex items-center gap-2 text-sm mb-2">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {days > 0 ? <span>Noch <span className="font-semibold text-amber-600 dark:text-amber-400">{days} Tage</span> bis zum Ende</span>
                          : days === 0 ? <span className="font-semibold text-green-600 dark:text-green-400">Endet heute!</span>
                          : <span className="font-semibold text-green-600 dark:text-green-400">Abgelaufen</span>}
                      </div>
                    )}
                    {/* Progress bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{fmtDate(s.startDatum)}</span><span>{pct}% vergangen</span><span>{fmtDate(s.endeDatum)}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${
                          s.status === 'aufgehoben' ? 'bg-green-500' : s.status === 'abgelaufen' ? 'bg-gray-400 dark:bg-gray-600'
                            : s.status === 'reduziert' ? 'bg-blue-500' : pct >= 75 ? 'bg-amber-500' : 'bg-red-500'
                        }`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    {s.notizen && <div className="rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground mb-3 whitespace-pre-wrap">{s.notizen}</div>}
                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                      <div className="relative">
                        <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => setStatusDropdownId(showDD ? null : s.id)}>
                          <ChevronDown className="h-3.5 w-3.5" />Status aendern
                        </Button>
                        {showDD && (
                          <div className="absolute left-0 top-full mt-1 z-10 rounded-lg border bg-card shadow-lg py-1 min-w-[220px]">
                            {STATUS_OPTIONS.map((st) => (
                              <button key={st} onClick={() => handleStatus(s.id, st)}
                                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors ${s.status === st ? 'font-semibold text-primary' : ''}`}>
                                {STATUS_LABELS[st]}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {!showDel ? (
                        <Button variant="outline" size="sm" className="gap-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => setDeleteConfirmId(s.id)}>
                          <Trash2 className="h-3.5 w-3.5" />Loeschen
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-600 font-medium">Wirklich loeschen?</span>
                          <Button variant="destructive" size="sm" className="text-xs h-7" onClick={() => handleDelete(s.id)}>Ja</Button>
                          <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setDeleteConfirmId(null)}>Nein</Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Keine Sanktionen erfasst</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Trage deine Sanktionen ein, um den Ueberblick zu behalten und dich gezielt zu wehren. Hoffentlich bleibt diese Liste fuer immer leer!
            </p>
            <Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="h-4 w-4" />Sanktion erfassen</Button>
          </div>
        )}

        {/* Timeline */}
        {timeline.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Clock className="h-5 w-5 text-primary" />Zeitverlauf</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6 space-y-4">
                <div className="absolute left-2.5 top-1 bottom-1 w-0.5 bg-border" />
                {timeline.map((s) => {
                  const active = s.status === 'aktiv' || s.status === 'widerspruch_eingereicht'
                  return (
                    <div key={s.id} className="relative">
                      <div className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 ${
                        active ? 'bg-red-500 border-red-300 dark:border-red-700' : s.status === 'aufgehoben' ? 'bg-green-500 border-green-300 dark:border-green-700' : 'bg-gray-400 border-gray-300 dark:border-gray-600'
                      }`} />
                      <div className="text-sm">
                        <span className="font-medium">{fmtDate(s.startDatum)}</span>
                        <span className="text-muted-foreground"> - </span>
                        <span className="font-medium">{fmtDate(s.endeDatum)}</span>
                        <span className="text-muted-foreground ml-2">|</span>
                        <span className={`ml-2 ${active ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-muted-foreground'}`}>{GRUND_LABELS[s.grund]}</span>
                        <span className="text-muted-foreground ml-1">(-{fmtEur(s.kuerzungBetrag)} &euro;)</span>
                        <span className={`ml-2 inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[s.status]}`}>{STATUS_LABELS[s.status]}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Legal Info */}
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Scale className="h-5 w-5 text-amber-600 dark:text-amber-400" />Rechtliche Hinweise zu Sanktionen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 text-sm">
                <h3 className="font-semibold flex items-center gap-1 text-amber-900 dark:text-amber-200"><Ban className="h-4 w-4" />Sanktionshoehe nach &sect; 31a SGB II</h3>
                <ul className="list-disc list-inside space-y-1 text-amber-800 dark:text-amber-300">
                  <li><strong>10% Kuerzung</strong> bei Meldeversaeumnis (Termin beim Jobcenter versaeumt) nach &sect; 32 SGB II</li>
                  <li><strong>30% Kuerzung</strong> bei Pflichtverletzung (Arbeit abgelehnt, Massnahme abgebrochen, Mitwirkung verweigert) nach &sect; 31 SGB II</li>
                  <li>Sanktionsdauer: <strong>3 Monate</strong> (seit BVerfG-Urteil 2019 maximal 30% Kuerzung)</li>
                </ul>
              </div>
              <div className="space-y-2 text-sm">
                <h3 className="font-semibold flex items-center gap-1 text-amber-900 dark:text-amber-200"><AlertTriangle className="h-4 w-4" />Haertefallregelung</h3>
                <ul className="list-disc list-inside space-y-1 text-amber-800 dark:text-amber-300">
                  <li>Bei <strong>aussergewoehnlicher Haerte</strong> kann die Sanktion reduziert oder aufgehoben werden (&sect; 31a Abs. 3 SGB II)</li>
                  <li>Kinder im Haushalt, Schwangerschaft oder Behinderung koennen als Haertefall gelten</li>
                  <li>Recht auf <strong>Sachleistungen</strong> (Lebensmittelgutscheine) bei Kuerzungen (&sect; 31a Abs. 3 SGB II)</li>
                </ul>
              </div>
            </div>
            <div className="rounded-lg bg-amber-100/70 dark:bg-amber-900/30 p-3 text-sm">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-amber-700 dark:text-amber-400 mt-0.5 shrink-0" />
                <div className="text-amber-800 dark:text-amber-300">
                  <p className="font-semibold mb-1">Widerspruchsfrist beachten!</p>
                  <p>Gegen einen Sanktionsbescheid kannst du innerhalb von <strong>einem Monat</strong> nach Zustellung Widerspruch einlegen. Der Widerspruch hat <strong>keine aufschiebende Wirkung</strong> -- die Kuerzung gilt ab sofort, aber du kannst einen Eilantrag beim Sozialgericht stellen.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Links */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Werkzeuge gegen Sanktionen</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link to="/rechner/sanktion">
                <Button variant="outline" className="w-full justify-start gap-2"><Euro className="h-4 w-4 text-red-500" />Sanktions-Rechner<ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" /></Button>
              </Link>
              <Link to="/widerspruch-vorlagen">
                <Button variant="outline" className="w-full justify-start gap-2"><FileText className="h-4 w-4 text-blue-500" />Widerspruch-Vorlagen<ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" /></Button>
              </Link>
              <Link to="/chat">
                <Button variant="outline" className="w-full justify-start gap-2"><MessageSquare className="h-4 w-4 text-green-500" />KI-Berater fragen<ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" /></Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
