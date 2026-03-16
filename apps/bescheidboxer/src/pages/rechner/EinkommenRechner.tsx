import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Wallet, Plus, Trash2, Download, Share2, Info,
  TrendingUp, Euro, Briefcase, Baby, Home, Heart,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { generateRechnerPdf } from '@/lib/pdf-export'
import { saveRechnerErgebnis } from '@/lib/rechner-verlauf'
import { shareResult } from '@/lib/share'
import Breadcrumbs from '@/components/Breadcrumbs'
import useDocumentTitle from '@/hooks/useDocumentTitle'

// === TYPES ===

interface Einnahme {
  id: string
  bezeichnung: string
  betrag: number
  art: 'erwerbseinkommen' | 'minijob' | 'selbststaendig' | 'kindergeld' | 'unterhalt' | 'wohngeld' | 'rente' | 'sonstiges'
  regelmaessig: boolean
}

interface MonatsDaten {
  monat: string // YYYY-MM
  einnahmen: Einnahme[]
}

interface AnrechnungsErgebnis {
  bruttoGesamt: number
  erwerbseinkommenGesamt: number
  sonstigesEinkommenGesamt: number
  kindergeldGesamt: number
  grundfreibetrag: number
  freibetragStufe1: number
  freibetragStufe2: number
  freibetragGesamt: number
  anrechenbaresBrutto: number
  anrechnebaresEinkommen: number
  behaltenGesamt: number
}

// === CONSTANTS ===

const STORAGE_KEY = 'bescheidboxer_einkommen'

const EINNAHME_ARTEN: { value: Einnahme['art']; label: string }[] = [
  { value: 'erwerbseinkommen', label: 'Erwerbseinkommen (abhaengig)' },
  { value: 'minijob', label: 'Minijob (bis 520 EUR)' },
  { value: 'selbststaendig', label: 'Selbststaendige Taetigkeit' },
  { value: 'kindergeld', label: 'Kindergeld' },
  { value: 'unterhalt', label: 'Unterhalt' },
  { value: 'wohngeld', label: 'Wohngeld' },
  { value: 'rente', label: 'Rente/Pension' },
  { value: 'sonstiges', label: 'Sonstige Einnahmen' },
]

const ART_ICONS: Record<Einnahme['art'], typeof Wallet> = {
  erwerbseinkommen: Briefcase,
  minijob: Euro,
  selbststaendig: TrendingUp,
  kindergeld: Baby,
  unterhalt: Heart,
  wohngeld: Home,
  rente: Wallet,
  sonstiges: Euro,
}

const ERWERBSEINKOMMEN_ARTEN: Einnahme['art'][] = ['erwerbseinkommen', 'minijob', 'selbststaendig']

// === HELPERS ===

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function formatEuro(betrag: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(betrag)
}

function getCurrentMonat(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function getPreviousMonat(monat: string): string {
  const [year, month] = monat.split('-').map(Number)
  const prevMonth = month - 1
  if (prevMonth < 1) return `${year - 1}-12`
  return `${year}-${String(prevMonth).padStart(2, '0')}`
}

function formatMonatLabel(monat: string): string {
  const [year, month] = monat.split('-')
  const monate = [
    'Januar', 'Februar', 'Maerz', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
  ]
  return `${monate[parseInt(month) - 1]} ${year}`
}

function createEmptyEinnahme(): Einnahme {
  return {
    id: generateId(),
    bezeichnung: '',
    betrag: 0,
    art: 'erwerbseinkommen',
    regelmaessig: true,
  }
}

// === FREIBETRAG LOGIC (§ 11b SGB II) ===

function berechneAnrechnung(einnahmen: Einnahme[], hatKinder: boolean): AnrechnungsErgebnis {
  // Sum up income by category
  let erwerbseinkommenGesamt = 0
  let sonstigesEinkommenGesamt = 0
  let kindergeldGesamt = 0

  for (const e of einnahmen) {
    if (e.betrag <= 0) continue
    if (ERWERBSEINKOMMEN_ARTEN.includes(e.art)) {
      erwerbseinkommenGesamt += e.betrag
    } else if (e.art === 'kindergeld') {
      kindergeldGesamt += e.betrag
    } else {
      sonstigesEinkommenGesamt += e.betrag
    }
  }

  const bruttoGesamt = erwerbseinkommenGesamt + sonstigesEinkommenGesamt + kindergeldGesamt

  // Freibetraege apply only to Erwerbseinkommen (§ 11b Abs. 2 + 3 SGB II)
  // Grundfreibetrag: first 100 EUR are always free
  const grundfreibetrag = Math.min(erwerbseinkommenGesamt, 100)

  // Stufe 1: 20% on the portion from 100.01 to 520 EUR
  const stufe1Basis = Math.min(Math.max(erwerbseinkommenGesamt - 100, 0), 420)
  const freibetragStufe1 = Math.round(stufe1Basis * 0.2 * 100) / 100

  // Stufe 2: 30% on the portion from 520.01 to 1000 EUR (or 1500 EUR with children)
  const stufe2Obergrenze = hatKinder ? 1500 : 1000
  const stufe2Basis = Math.min(Math.max(erwerbseinkommenGesamt - 520, 0), stufe2Obergrenze - 520)
  const freibetragStufe2 = Math.round(stufe2Basis * 0.3 * 100) / 100

  const freibetragGesamt = grundfreibetrag + freibetragStufe1 + freibetragStufe2

  // Kindergeld is NOT counted as income for the recipient parent,
  // it reduces the child's Bedarf instead
  // Sonstiges Einkommen (Unterhalt, Wohngeld, Rente, etc.) is fully counted
  const anrechenbaresBrutto = erwerbseinkommenGesamt + sonstigesEinkommenGesamt
  const anrechnebaresEinkommen = Math.max(anrechenbaresBrutto - freibetragGesamt, 0)
  const behaltenGesamt = bruttoGesamt - anrechnebaresEinkommen

  return {
    bruttoGesamt,
    erwerbseinkommenGesamt,
    sonstigesEinkommenGesamt,
    kindergeldGesamt,
    grundfreibetrag,
    freibetragStufe1,
    freibetragStufe2,
    freibetragGesamt,
    anrechenbaresBrutto,
    anrechnebaresEinkommen,
    behaltenGesamt,
  }
}

// === STORAGE ===

function loadFromStorage(): MonatsDaten[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as MonatsDaten[]
  } catch {
    return []
  }
}

function saveToStorage(daten: MonatsDaten[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(daten))
}

// === COMPONENT ===

export default function EinkommenRechner() {
  useDocumentTitle('Einkommens-Uebersicht - BescheidBoxer')

  const [alleDaten, setAlleDaten] = useState<MonatsDaten[]>([])
  const [aktuellerMonat, setAktuellerMonat] = useState(getCurrentMonat())
  const [hatKinder, setHatKinder] = useState(false)
  const [showTipps, setShowTipps] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const loaded = loadFromStorage()
    if (loaded.length > 0) {
      setAlleDaten(loaded)
    }
  }, [])

  // Current month's data
  const monatsDaten = alleDaten.find(d => d.monat === aktuellerMonat)
  const einnahmen = monatsDaten?.einnahmen ?? []

  // Persist helper
  const updateEinnahmen = useCallback((monat: string, neueEinnahmen: Einnahme[]) => {
    setAlleDaten(prev => {
      const existing = prev.find(d => d.monat === monat)
      let updated: MonatsDaten[]
      if (existing) {
        updated = prev.map(d => d.monat === monat ? { ...d, einnahmen: neueEinnahmen } : d)
      } else {
        updated = [...prev, { monat, einnahmen: neueEinnahmen }]
      }
      saveToStorage(updated)
      return updated
    })
  }, [])

  // CRUD operations
  const addEinnahme = () => {
    updateEinnahmen(aktuellerMonat, [...einnahmen, createEmptyEinnahme()])
  }

  const removeEinnahme = (id: string) => {
    updateEinnahmen(aktuellerMonat, einnahmen.filter(e => e.id !== id))
  }

  const updateEinnahmeField = (id: string, field: keyof Einnahme, value: string | number | boolean) => {
    updateEinnahmen(
      aktuellerMonat,
      einnahmen.map(e => e.id === id ? { ...e, [field]: value } : e),
    )
  }

  // Calculation
  const ergebnis = berechneAnrechnung(einnahmen, hatKinder)

  // Previous month comparison
  const prevMonat = getPreviousMonat(aktuellerMonat)
  const prevDaten = alleDaten.find(d => d.monat === prevMonat)
  const prevErgebnis = prevDaten ? berechneAnrechnung(prevDaten.einnahmen, hatKinder) : null

  // Available months for dropdown
  const verfuegbareMonate = (() => {
    const monate = new Set<string>()
    monate.add(getCurrentMonat())
    monate.add(getPreviousMonat(getCurrentMonat()))
    for (const d of alleDaten) {
      monate.add(d.monat)
    }
    return Array.from(monate).sort().reverse()
  })()

  const handleExportPdf = () => {
    const sections = [
      { label: 'Erwerbseinkommen gesamt', value: formatEuro(ergebnis.erwerbseinkommenGesamt) },
      { label: 'Sonstiges Einkommen', value: formatEuro(ergebnis.sonstigesEinkommenGesamt) },
      { label: 'Kindergeld (privilegiert)', value: formatEuro(ergebnis.kindergeldGesamt) },
      { label: 'Brutto gesamt', value: formatEuro(ergebnis.bruttoGesamt), highlight: true },
      { label: 'Grundfreibetrag (100 EUR)', value: `- ${formatEuro(ergebnis.grundfreibetrag)}` },
      { label: 'Stufe 1: 20% (100-520 EUR)', value: `- ${formatEuro(ergebnis.freibetragStufe1)}` },
      { label: `Stufe 2: 30% (520-${hatKinder ? '1.500' : '1.000'} EUR)`, value: `- ${formatEuro(ergebnis.freibetragStufe2)}` },
      { label: 'Freibetraege gesamt', value: formatEuro(ergebnis.freibetragGesamt), highlight: true },
      { label: 'Anrechenbares Einkommen', value: formatEuro(ergebnis.anrechnebaresEinkommen), highlight: true },
    ]
    generateRechnerPdf(
      `Einkommens-Uebersicht ${formatMonatLabel(aktuellerMonat)} (§ 11b SGB II)`,
      sections,
      { label: 'Du behaltst', value: formatEuro(ergebnis.behaltenGesamt) },
    )
    saveRechnerErgebnis('Einkommens-Uebersicht', 'einkommen', {
      monat: aktuellerMonat,
      bruttoGesamt: ergebnis.bruttoGesamt,
      anrechnebaresEinkommen: ergebnis.anrechnebaresEinkommen,
      behaltenGesamt: ergebnis.behaltenGesamt,
    })
  }

  const handleShare = () => {
    shareResult({
      title: 'Einkommens-Uebersicht - BescheidBoxer',
      text: `Einkommens-Uebersicht ${formatMonatLabel(aktuellerMonat)}: ${formatEuro(ergebnis.bruttoGesamt)} Brutto, ${formatEuro(ergebnis.anrechnebaresEinkommen)} angerechnet, ${formatEuro(ergebnis.behaltenGesamt)} behalten.`,
      url: window.location.href,
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Breadcrumbs
            items={[{ label: 'Rechner', href: '/rechner' }, { label: 'Einkommens-Uebersicht' }]}
            className="mb-4"
          />
          <div className="flex items-start gap-4">
            <div className="bg-emerald-50 p-3 rounded-xl">
              <Wallet className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Einkommens-Uebersicht</h1>
              <p className="text-gray-600 mt-1">
                Erfasse deine monatlichen Einnahmen und sieh, wie viel auf dein Buergergeld angerechnet wird (§ 11b SGB II).
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Month Selector + Kinder Toggle */}
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Monat auswaehlen</label>
                <select
                  value={aktuellerMonat}
                  onChange={(e) => setAktuellerMonat(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                >
                  {verfuegbareMonate.map(m => (
                    <option key={m} value={m}>{formatMonatLabel(m)}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Kinder im Haushalt?</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setHatKinder(true)}
                    className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${hatKinder ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    Ja
                  </button>
                  <button
                    onClick={() => setHatKinder(false)}
                    className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${!hatKinder ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    Nein
                  </button>
                </div>
                {hatKinder && (
                  <p className="text-xs text-emerald-700 mt-1">Hoehere Freibetraege: Stufe 2 bis 1.500 EUR statt 1.000 EUR</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Einnahmen List */}
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Euro className="h-5 w-5 text-emerald-600" />
                Einnahmen - {formatMonatLabel(aktuellerMonat)}
              </h2>
              <Button onClick={addEinnahme} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-1" />Hinzufuegen
              </Button>
            </div>

            {einnahmen.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <Wallet className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">Noch keine Einnahmen erfasst</p>
                <p className="text-sm mt-1">Klicke auf &quot;Hinzufuegen&quot;, um deine erste Einnahme einzutragen.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {einnahmen.map((einnahme) => {
                  const Icon = ART_ICONS[einnahme.art]
                  return (
                    <div key={einnahme.id} className="border border-gray-200 rounded-lg p-4 hover:border-emerald-300 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="bg-gray-100 p-2 rounded-lg mt-1">
                          <Icon className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Bezeichnung</label>
                              <input
                                type="text"
                                value={einnahme.bezeichnung}
                                onChange={(e) => updateEinnahmeField(einnahme.id, 'bezeichnung', e.target.value)}
                                placeholder="z.B. Gehalt Teilzeit"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Betrag (EUR/Monat)</label>
                              <input
                                type="number"
                                value={einnahme.betrag || ''}
                                onChange={(e) => updateEinnahmeField(einnahme.id, 'betrag', parseFloat(e.target.value) || 0)}
                                placeholder="0"
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Art der Einnahme</label>
                              <select
                                value={einnahme.art}
                                onChange={(e) => updateEinnahmeField(einnahme.id, 'art', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                              >
                                {EINNAHME_ARTEN.map(a => (
                                  <option key={a.value} value={a.value}>{a.label}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-end">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={einnahme.regelmaessig}
                                  onChange={(e) => updateEinnahmeField(einnahme.id, 'regelmaessig', e.target.checked)}
                                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="text-sm text-gray-700">Regelmaessig (monatlich)</span>
                              </label>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeEinnahme(einnahme.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          title="Einnahme entfernen"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {einnahmen.length > 0 && (
              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <span className="text-sm text-gray-600">{einnahmen.length} Einnahme{einnahmen.length !== 1 ? 'n' : ''} erfasst</span>
                <Button onClick={addEinnahme} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />Weitere Einnahme
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Anrechnungs-Vorschau */}
        {einnahmen.length > 0 && ergebnis.bruttoGesamt > 0 && (
          <Card className="shadow-lg border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                Anrechnungs-Vorschau - {formatMonatLabel(aktuellerMonat)}
              </h2>

              {/* Visual Bar */}
              <div className="mb-6">
                <div className="h-14 w-full rounded-lg overflow-hidden flex">
                  {ergebnis.bruttoGesamt > 0 && (
                    <>
                      {ergebnis.behaltenGesamt > 0 && (
                        <div
                          className="bg-emerald-500 flex items-center justify-center text-white font-semibold text-sm transition-all"
                          style={{ width: `${(ergebnis.behaltenGesamt / ergebnis.bruttoGesamt) * 100}%` }}
                        >
                          {ergebnis.behaltenGesamt / ergebnis.bruttoGesamt > 0.15 && 'Behaltst du'}
                        </div>
                      )}
                      {ergebnis.anrechnebaresEinkommen > 0 && (
                        <div
                          className="bg-red-400 flex items-center justify-center text-white font-semibold text-sm transition-all"
                          style={{ width: `${(ergebnis.anrechnebaresEinkommen / ergebnis.bruttoGesamt) * 100}%` }}
                        >
                          {ergebnis.anrechnebaresEinkommen / ergebnis.bruttoGesamt > 0.15 && 'Angerechnet'}
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>0 EUR</span>
                  <span>{formatEuro(ergebnis.bruttoGesamt)}</span>
                </div>
              </div>

              {/* Big Numbers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 text-center border border-emerald-200">
                  <div className="text-xs text-emerald-700 mb-1">Du behaltst</div>
                  <div className="text-2xl font-bold text-emerald-600">{formatEuro(ergebnis.behaltenGesamt)}</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center border border-red-200">
                  <div className="text-xs text-red-600 mb-1">Angerechnet</div>
                  <div className="text-2xl font-bold text-red-500">{formatEuro(ergebnis.anrechnebaresEinkommen)}</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
                  <div className="text-xs text-gray-600 mb-1">Brutto gesamt</div>
                  <div className="text-2xl font-bold text-gray-700">{formatEuro(ergebnis.bruttoGesamt)}</div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="border rounded-lg overflow-hidden bg-white">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Position</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Betrag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {/* Income Summary */}
                    {ergebnis.erwerbseinkommenGesamt > 0 && (
                      <tr>
                        <td className="px-4 py-3 text-sm text-gray-900 flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-gray-400" />
                          Erwerbseinkommen gesamt
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                          {formatEuro(ergebnis.erwerbseinkommenGesamt)}
                        </td>
                      </tr>
                    )}
                    {ergebnis.sonstigesEinkommenGesamt > 0 && (
                      <tr>
                        <td className="px-4 py-3 text-sm text-gray-900 flex items-center gap-2">
                          <Euro className="h-4 w-4 text-gray-400" />
                          Sonstiges Einkommen (voll anrechenbar)
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                          {formatEuro(ergebnis.sonstigesEinkommenGesamt)}
                        </td>
                      </tr>
                    )}
                    {ergebnis.kindergeldGesamt > 0 && (
                      <tr className="bg-blue-50">
                        <td className="px-4 py-3 text-sm text-blue-800 flex items-center gap-2">
                          <Baby className="h-4 w-4 text-blue-500" />
                          Kindergeld (privilegiert - nicht angerechnet)
                        </td>
                        <td className="px-4 py-3 text-sm text-blue-700 text-right font-medium">
                          {formatEuro(ergebnis.kindergeldGesamt)}
                        </td>
                      </tr>
                    )}

                    {/* Freibetraege */}
                    {ergebnis.grundfreibetrag > 0 && (
                      <tr className="bg-green-50">
                        <td className="px-4 py-3 text-sm text-gray-700">
                          Grundfreibetrag (100 EUR)
                        </td>
                        <td className="px-4 py-3 text-sm text-green-600 text-right font-medium">
                          - {formatEuro(ergebnis.grundfreibetrag)}
                        </td>
                      </tr>
                    )}
                    {ergebnis.freibetragStufe1 > 0 && (
                      <tr className="bg-green-50">
                        <td className="px-4 py-3 text-sm text-gray-700">
                          Stufe 1: 20% von 100,01 - 520 EUR
                        </td>
                        <td className="px-4 py-3 text-sm text-green-600 text-right font-medium">
                          - {formatEuro(ergebnis.freibetragStufe1)}
                        </td>
                      </tr>
                    )}
                    {ergebnis.freibetragStufe2 > 0 && (
                      <tr className="bg-green-50">
                        <td className="px-4 py-3 text-sm text-gray-700">
                          Stufe 2: 30% von 520,01 - {hatKinder ? '1.500' : '1.000'} EUR
                        </td>
                        <td className="px-4 py-3 text-sm text-green-600 text-right font-medium">
                          - {formatEuro(ergebnis.freibetragStufe2)}
                        </td>
                      </tr>
                    )}

                    {/* Totals */}
                    <tr className="bg-gray-50 font-semibold">
                      <td className="px-4 py-3 text-sm text-gray-900">Freibetraege gesamt</td>
                      <td className="px-4 py-3 text-sm text-green-600 text-right">
                        {formatEuro(ergebnis.freibetragGesamt)}
                      </td>
                    </tr>
                    <tr className="bg-red-50 font-semibold">
                      <td className="px-4 py-3 text-sm text-gray-900">Wird auf Buergergeld angerechnet</td>
                      <td className="px-4 py-3 text-sm text-red-600 text-right">
                        - {formatEuro(ergebnis.anrechnebaresEinkommen)}
                      </td>
                    </tr>
                    <tr className="bg-emerald-50 font-semibold">
                      <td className="px-4 py-3 text-sm text-gray-900">Du behaltst insgesamt</td>
                      <td className="px-4 py-3 text-sm text-emerald-600 text-right">
                        {formatEuro(ergebnis.behaltenGesamt)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Monthly Comparison */}
              {prevErgebnis && prevErgebnis.bruttoGesamt > 0 && (
                <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Vergleich mit {formatMonatLabel(prevMonat)}
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Brutto</div>
                      <div className="text-sm font-medium text-gray-700">{formatEuro(prevErgebnis.bruttoGesamt)}</div>
                      <DiffBadge current={ergebnis.bruttoGesamt} previous={prevErgebnis.bruttoGesamt} />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Angerechnet</div>
                      <div className="text-sm font-medium text-gray-700">{formatEuro(prevErgebnis.anrechnebaresEinkommen)}</div>
                      <DiffBadge current={ergebnis.anrechnebaresEinkommen} previous={prevErgebnis.anrechnebaresEinkommen} invertColor />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Behalten</div>
                      <div className="text-sm font-medium text-gray-700">{formatEuro(prevErgebnis.behaltenGesamt)}</div>
                      <DiffBadge current={ergebnis.behaltenGesamt} previous={prevErgebnis.behaltenGesamt} />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Button onClick={handleExportPdf} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white">
                  <Download className="h-4 w-4 mr-2" />Als PDF
                </Button>
                <Button onClick={handleShare} variant="outline" className="flex-1">
                  <Share2 className="h-4 w-4 mr-2" />Teilen
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tipp-Box */}
        <Card className="border-blue-200 bg-blue-50/50 shadow-sm">
          <CardContent className="pt-6">
            <button
              onClick={() => setShowTipps(!showTipps)}
              className="flex items-center gap-2 w-full text-left"
            >
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <span className="font-semibold text-gray-900 flex-1">
                Tipps zur Einkommensanrechnung
              </span>
              <span className="text-blue-600 text-sm">
                {showTipps ? 'Ausblenden' : 'Anzeigen'}
              </span>
            </button>

            {showTipps && (
              <div className="mt-4 space-y-4 text-sm text-gray-700">
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Euro className="h-4 w-4 text-blue-600" />
                    100-EUR-Grundfreibetrag
                  </h3>
                  <p>
                    Wer arbeitet, darf immer mindestens 100 EUR behalten. Dieser Grundfreibetrag
                    deckt Fahrtkosten, Versicherungen und Werbungskosten pauschal ab. Sind deine
                    tatsaechlichen Kosten hoeher als 100 EUR, kannst du diese einzeln nachweisen.
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    Erwerbstaetigen-Freibetraege (Staffelung)
                  </h3>
                  <ul className="space-y-2 ml-6 list-disc">
                    <li><strong>100,01 - 520 EUR:</strong> 20% darfst du behalten (max. 84 EUR)</li>
                    <li><strong>520,01 - {hatKinder ? '1.500' : '1.000'} EUR:</strong> 30% darfst du behalten (max. {hatKinder ? '294' : '144'} EUR)</li>
                  </ul>
                  <p className="mt-2">
                    Maximaler Freibetrag bei Erwerbseinkommen: <strong>{hatKinder ? '478' : '328'} EUR</strong> (mit{!hatKinder && 'out'} Kind{hatKinder ? 'ern' : 'er'})
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Baby className="h-4 w-4 text-pink-500" />
                    Privilegiertes Einkommen
                  </h3>
                  <p>
                    <strong>Kindergeld</strong> wird nicht als Einkommen der Eltern gewertet.
                    Es mindert stattdessen den Bedarf des Kindes. In der Praxis bedeutet das:
                    Kindergeld wird separat verrechnet und reduziert nicht direkt dein Buergergeld.
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    Sonstiges Einkommen
                  </h3>
                  <p>
                    Einkommen wie Unterhalt, Wohngeld, Rente oder sonstige Einnahmen werden
                    <strong> voll auf das Buergergeld angerechnet</strong> - es gibt hier keine
                    Erwerbstaetigen-Freibetraege. Nur die Versicherungspauschale (30 EUR) kann
                    ggf. abgezogen werden.
                  </p>
                </div>

                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <p className="text-amber-800 text-xs">
                    <strong>Hinweis:</strong> Diese Berechnung ist eine vereinfachte Vorschau.
                    Die tatsaechliche Anrechnung kann abweichen, z.B. durch individuelle SV-Beitraege,
                    Werbungskosten oder besondere Lebenssituationen. Nutze unseren{' '}
                    <Link to="/rechner/freibetrag" className="underline font-medium">Freibetrags-Rechner</Link>{' '}
                    fuer eine detailliertere Berechnung.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Further Links */}
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Weitere Rechner</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link to="/rechner/freibetrag">
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="h-4 w-4 mr-2" />Freibetrags-Rechner
                </Button>
              </Link>
              <Link to="/rechner/buergergeld">
                <Button variant="outline" className="w-full justify-start">
                  <Euro className="h-4 w-4 mr-2" />Buergergeld-Rechner
                </Button>
              </Link>
              <Link to="/rechner">
                <Button variant="outline" className="w-full justify-start">
                  <Wallet className="h-4 w-4 mr-2" />Alle Rechner anzeigen
                </Button>
              </Link>
              <Link to="/chat">
                <Button variant="outline" className="w-full justify-start">
                  <Info className="h-4 w-4 mr-2" />Im Chat besprechen
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// === SUB-COMPONENTS ===

function DiffBadge({ current, previous, invertColor = false }: { current: number; previous: number; invertColor?: boolean }) {
  const diff = current - previous
  if (Math.abs(diff) < 0.01) return null

  const isPositive = diff > 0
  // For "Angerechnet", positive is bad (invertColor=true)
  const isGood = invertColor ? !isPositive : isPositive
  const color = isGood ? 'text-emerald-600' : 'text-red-500'
  const prefix = isPositive ? '+' : ''

  return (
    <span className={`text-xs font-medium ${color}`}>
      {prefix}{formatEuro(diff)}
    </span>
  )
}
