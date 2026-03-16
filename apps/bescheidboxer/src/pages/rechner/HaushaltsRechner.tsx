import { useState, useEffect, useCallback } from 'react'
import {
  Wallet, Plus, Trash2, Download, Share2, Info,
  TrendingDown, TrendingUp, PiggyBank, AlertTriangle,
  Euro, ShoppingCart, Home, Zap, Phone, Heart, Bus,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { generateRechnerPdf } from '@/lib/pdf-export'
import { saveRechnerErgebnis } from '@/lib/rechner-verlauf'
import { shareResult } from '@/lib/share'
import Breadcrumbs from '@/components/Breadcrumbs'
import useDocumentTitle from '@/hooks/useDocumentTitle'

// === TYPES ===

interface EinnahmePosten {
  id: string
  label: string
  betrag: number
  icon: string
}

interface AusgabePosten {
  id: string
  label: string
  betrag: number
  icon: string
  isCustom?: boolean
}

interface HaushaltData {
  einnahmen: EinnahmePosten[]
  ausgaben: AusgabePosten[]
}

// === CONSTANTS ===

const STORAGE_KEY = 'bescheidboxer_haushalt'

const DEFAULT_EINNAHMEN: EinnahmePosten[] = [
  { id: 'regelsatz', label: 'Regelsatz (Alleinstehend)', betrag: 563, icon: 'euro' },
  { id: 'kdu', label: 'KdU (Kosten der Unterkunft)', betrag: 0, icon: 'home' },
  { id: 'kindergeld', label: 'Kindergeld', betrag: 0, icon: 'heart' },
  { id: 'erwerbseinkommen', label: 'Erwerbseinkommen (nach Anrechnung)', betrag: 0, icon: 'wallet' },
  { id: 'sonstige_einnahmen', label: 'Sonstige Einnahmen', betrag: 0, icon: 'plus' },
]

const DEFAULT_AUSGABEN: AusgabePosten[] = [
  { id: 'miete', label: 'Miete (inkl. Nebenkosten)', betrag: 0, icon: 'home' },
  { id: 'strom', label: 'Strom / Energie', betrag: 0, icon: 'zap' },
  { id: 'lebensmittel', label: 'Lebensmittel', betrag: 0, icon: 'cart' },
  { id: 'hygiene', label: 'Hygiene / Koerperpflege', betrag: 0, icon: 'heart' },
  { id: 'kleidung', label: 'Kleidung', betrag: 0, icon: 'cart' },
  { id: 'telefon', label: 'Telefon / Internet', betrag: 0, icon: 'phone' },
  { id: 'versicherungen', label: 'Versicherungen', betrag: 0, icon: 'shield' },
  { id: 'mobilitaet', label: 'Mobilitaet / OEPNV', betrag: 0, icon: 'bus' },
  { id: 'gesundheit', label: 'Medikamente / Gesundheit', betrag: 0, icon: 'heart' },
  { id: 'haushaltsbedarf', label: 'Haushaltsbedarf', betrag: 0, icon: 'home' },
  { id: 'freizeit', label: 'Freizeit / Bildung', betrag: 0, icon: 'piggy' },
  { id: 'sonstiges', label: 'Sonstiges', betrag: 0, icon: 'plus' },
]

const SPARTIPPS = [
  {
    titel: 'Lebensmittel',
    icon: 'cart' as const,
    tipps: [
      'Die Tafel bietet Lebensmittel fuer sehr kleine Betraege oder kostenlos an.',
      'Angebote vergleichen und Wochenplaene fuer Mahlzeiten erstellen.',
      'Saison-Gemuese und -Obst kaufen, das ist meist guenstiger.',
      'Apps wie "Too Good To Go" bieten guenstige Lebensmittel-Restposten.',
    ],
  },
  {
    titel: 'Kleidung & Haushalt',
    icon: 'cart' as const,
    tipps: [
      'Sozialkaufhaeuser und Kleiderkammern bieten guenstige Second-Hand-Ware.',
      'Online-Flohmaerkte (eBay Kleinanzeigen, Vinted) fuer guenstige Angebote nutzen.',
      'In vielen Staedten gibt es "Umsonstlaeden" fuer kostenlose Gegenstaende.',
    ],
  },
  {
    titel: 'Mobilitaet',
    icon: 'bus' as const,
    tipps: [
      'Sozialticket / Deutschlandticket-Ermaessigung beim Jobcenter beantragen.',
      'Viele Kommunen bieten ermaessigte Monatstickets fuer Buergergeld-Empfaenger.',
      'Fahrrad als Alternative: Manche Projekte verschenken reparierte Fahrraeder.',
    ],
  },
  {
    titel: 'Strom & Energie',
    icon: 'zap' as const,
    tipps: [
      'Stromanbieter vergleichen und jaehrlich wechseln (Vergleichsportale nutzen).',
      'LED-Lampen und Steckerleisten mit Schalter verwenden.',
      'Energieberatung der Verbraucherzentrale ist oft kostenlos fuer Buergergeld-Empfaenger.',
      'Bei Stromnachzahlungen: Darlehen beim Jobcenter nach § 24 Abs. 1 SGB II beantragen.',
    ],
  },
  {
    titel: 'Telefon & Internet',
    icon: 'phone' as const,
    tipps: [
      'Sozialtarife der Telekom und anderer Anbieter pruefen.',
      'Prepaid-Tarife sind oft guenstiger als Vertraege.',
      'WLAN-Sharing oder Bibliotheks-Internet fuer Zusatzbedarf nutzen.',
    ],
  },
  {
    titel: 'Gesundheit',
    icon: 'heart' as const,
    tipps: [
      'Befreiung von Zuzahlungen bei der Krankenkasse beantragen (Belastungsgrenze 2% des Regelbedarfs).',
      'Mehrbedarf fuer kostenaufwaendige Ernaehrung nach § 21 Abs. 5 SGB II pruefen.',
      'Generika statt Markenmedikamente erfragen.',
    ],
  },
  {
    titel: 'Freizeit & Bildung',
    icon: 'piggy' as const,
    tipps: [
      'Viele Museen und Kultureinrichtungen bieten freien Eintritt mit Sozialausweis.',
      'Bildung und Teilhabe (BuT) fuer Kinder beantragen (§ 28 SGB II).',
      'Stadtbibliotheken bieten kostenlos Buecher, Filme und Internet-Zugang.',
      'Volkshochschulen bieten ermaessigte Kurse fuer Buergergeld-Empfaenger.',
    ],
  },
]

// === ICON HELPER ===

function getIcon(iconName: string, className: string) {
  switch (iconName) {
    case 'euro': return <Euro className={className} />
    case 'home': return <Home className={className} />
    case 'heart': return <Heart className={className} />
    case 'wallet': return <Wallet className={className} />
    case 'plus': return <Plus className={className} />
    case 'cart': return <ShoppingCart className={className} />
    case 'zap': return <Zap className={className} />
    case 'phone': return <Phone className={className} />
    case 'shield': return <ShieldCheck className={className} />
    case 'bus': return <Bus className={className} />
    case 'piggy': return <PiggyBank className={className} />
    default: return <Euro className={className} />
  }
}

// === HELPER FUNCTIONS ===

function loadFromStorage(): HaushaltData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as HaushaltData
  } catch {
    return null
  }
}

function saveToStorage(data: HaushaltData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function formatEuro(betrag: number): string {
  return betrag.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// === COMPONENT ===

export default function HaushaltsRechner() {
  useDocumentTitle('Haushaltsplan - BescheidBoxer')

  const [einnahmen, setEinnahmen] = useState<EinnahmePosten[]>(DEFAULT_EINNAHMEN)
  const [ausgaben, setAusgaben] = useState<AusgabePosten[]>(DEFAULT_AUSGABEN)
  const [customLabel, setCustomLabel] = useState('')
  const [showSpartipps, setShowSpartipps] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadFromStorage()
    if (saved) {
      setEinnahmen(saved.einnahmen)
      setAusgaben(saved.ausgaben)
    }
  }, [])

  // Auto-save to localStorage on changes
  const persistData = useCallback(() => {
    saveToStorage({ einnahmen, ausgaben })
  }, [einnahmen, ausgaben])

  useEffect(() => {
    persistData()
  }, [persistData])

  // === CALCULATIONS ===

  const totalEinnahmen = einnahmen.reduce((sum, p) => sum + p.betrag, 0)
  const totalAusgaben = ausgaben.reduce((sum, p) => sum + p.betrag, 0)
  const differenz = totalEinnahmen - totalAusgaben
  const isDefizit = differenz < 0
  const isSurplus = differenz > 0

  // Bar chart: max value for scaling
  const maxBarValue = Math.max(
    ...ausgaben.map(a => a.betrag),
    ...einnahmen.map(e => e.betrag),
    1
  )

  // === HANDLERS ===

  function updateEinnahme(id: string, betrag: number) {
    setEinnahmen(prev => prev.map(p => p.id === id ? { ...p, betrag } : p))
  }

  function updateAusgabe(id: string, betrag: number) {
    setAusgaben(prev => prev.map(p => p.id === id ? { ...p, betrag } : p))
  }

  function addCustomAusgabe() {
    if (!customLabel.trim()) return
    const newId = 'custom_' + Date.now().toString(36)
    setAusgaben(prev => [...prev, {
      id: newId,
      label: customLabel.trim(),
      betrag: 0,
      icon: 'plus',
      isCustom: true,
    }])
    setCustomLabel('')
  }

  function removeCustomAusgabe(id: string) {
    setAusgaben(prev => prev.filter(p => p.id !== id))
  }

  function handlePdfExport() {
    const sections = [
      ...einnahmen.filter(e => e.betrag > 0).map(e => ({
        label: e.label,
        value: `${formatEuro(e.betrag)} EUR`,
      })),
      { label: 'Einnahmen gesamt', value: `${formatEuro(totalEinnahmen)} EUR`, highlight: true },
      ...ausgaben.filter(a => a.betrag > 0).map(a => ({
        label: a.label,
        value: `${formatEuro(a.betrag)} EUR`,
      })),
      { label: 'Ausgaben gesamt', value: `${formatEuro(totalAusgaben)} EUR`, highlight: true },
    ]

    generateRechnerPdf(
      'Monatlicher Haushaltsplan - Buergergeld',
      sections,
      {
        label: differenz >= 0 ? 'Ueberschuss' : 'Defizit',
        value: `${differenz >= 0 ? '+' : ''}${formatEuro(differenz)} EUR`,
      },
    )

    saveRechnerErgebnis('Haushaltsplan-Rechner', 'haushalt', {
      einnahmenGesamt: totalEinnahmen,
      ausgabenGesamt: totalAusgaben,
      differenz,
    })
  }

  function handleShare() {
    const statusText = differenz >= 0
      ? `Ueberschuss: +${formatEuro(differenz)} EUR`
      : `Defizit: ${formatEuro(differenz)} EUR`

    shareResult({
      title: 'Mein Haushaltsplan - BescheidBoxer',
      text: `Monatlicher Haushaltsplan:\nEinnahmen: ${formatEuro(totalEinnahmen)} EUR\nAusgaben: ${formatEuro(totalAusgaben)} EUR\n${statusText}`,
      url: window.location.href,
    })
  }

  function handleSave() {
    saveToStorage({ einnahmen, ausgaben })
    saveRechnerErgebnis('Haushaltsplan-Rechner', 'haushalt', {
      einnahmenGesamt: totalEinnahmen,
      ausgabenGesamt: totalAusgaben,
      differenz,
    })
  }

  // === RENDER ===

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: 'Rechner', href: '/rechner' }, { label: 'Haushaltsplan' }]} className="mb-4" />
          <div className="flex items-start gap-4">
            <div className="bg-emerald-50 p-3 rounded-xl">
              <Wallet className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Haushaltsplan-Rechner</h1>
              <p className="text-gray-600 mt-1">
                Plane dein monatliches Budget als Buergergeld-Empfaenger
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm text-gray-700">
                <p className="font-medium text-gray-900">
                  Warum ein Haushaltsplan wichtig ist
                </p>
                <p>
                  Mit Buergergeld muss jeder Euro sitzen. Ein Haushaltsplan hilft dir,
                  den Ueberblick ueber deine Einnahmen und Ausgaben zu behalten und
                  moegliche Einsparungen zu erkennen. Trage deine monatlichen Betraege
                  ein, um zu sehen, ob dein Budget aufgeht.
                </p>
                <p className="text-xs text-gray-600">
                  Deine Daten werden nur lokal auf deinem Geraet gespeichert und
                  nicht an Server uebermittelt.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* === EINNAHMEN === */}
        <Card className="shadow-sm rounded-xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-gray-900">Einnahmen</h2>
              <Badge variant="sgb2" className="ml-auto text-xs">
                {formatEuro(totalEinnahmen)} EUR
              </Badge>
            </div>
            <div className="space-y-3">
              {einnahmen.map((posten) => (
                <div key={posten.id} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    {getIcon(posten.icon, 'h-4 w-4 text-emerald-600')}
                  </div>
                  <label htmlFor={`ein-${posten.id}`} className="flex-1 text-sm text-gray-700 min-w-0 truncate">
                    {posten.label}
                  </label>
                  <div className="flex items-center gap-1 w-32 flex-shrink-0">
                    <Input
                      id={`ein-${posten.id}`}
                      type="number"
                      min={0}
                      step={0.01}
                      value={posten.betrag || ''}
                      onChange={(e) => updateEinnahme(posten.id, parseFloat(e.target.value) || 0)}
                      placeholder="0,00"
                      className="text-right text-sm h-9"
                    />
                    <span className="text-xs text-gray-500 w-6 text-center">EUR</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* === AUSGABEN === */}
        <Card className="shadow-sm rounded-xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <h2 className="text-lg font-semibold text-gray-900">Ausgaben</h2>
              <Badge variant="destructive" className="ml-auto text-xs">
                {formatEuro(totalAusgaben)} EUR
              </Badge>
            </div>
            <div className="space-y-3">
              {ausgaben.map((posten) => (
                <div key={posten.id} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                    {getIcon(posten.icon, 'h-4 w-4 text-red-500')}
                  </div>
                  <label htmlFor={`aus-${posten.id}`} className="flex-1 text-sm text-gray-700 min-w-0 truncate">
                    {posten.label}
                  </label>
                  <div className="flex items-center gap-1 w-32 flex-shrink-0">
                    <Input
                      id={`aus-${posten.id}`}
                      type="number"
                      min={0}
                      step={0.01}
                      value={posten.betrag || ''}
                      onChange={(e) => updateAusgabe(posten.id, parseFloat(e.target.value) || 0)}
                      placeholder="0,00"
                      className="text-right text-sm h-9"
                    />
                    <span className="text-xs text-gray-500 w-6 text-center">EUR</span>
                  </div>
                  {posten.isCustom && (
                    <button
                      onClick={() => removeCustomAusgabe(posten.id)}
                      className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
                      aria-label={`${posten.label} entfernen`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add custom entry */}
            <div className="mt-4 pt-4 border-t flex gap-2">
              <Input
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="Eigene Ausgabe hinzufuegen..."
                className="text-sm h-9"
                onKeyDown={(e) => { if (e.key === 'Enter') addCustomAusgabe() }}
              />
              <Button
                onClick={addCustomAusgabe}
                variant="outline"
                size="sm"
                className="flex-shrink-0 h-9"
                disabled={!customLabel.trim()}
              >
                <Plus className="h-4 w-4 mr-1" />
                Hinzufuegen
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* === UEBERSICHT === */}
        <Card className={`shadow-lg rounded-xl border-2 ${
          isDefizit
            ? 'border-red-200 bg-gradient-to-br from-red-50 to-orange-50'
            : 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50'
        }`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              {isDefizit
                ? <AlertTriangle className="h-5 w-5 text-red-600" />
                : <TrendingUp className="h-5 w-5 text-emerald-600" />
              }
              <h2 className="text-lg font-semibold text-gray-900">Uebersicht</h2>
            </div>

            {/* Summary boxes */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                <div className="text-xs text-gray-600 mb-1">Einnahmen</div>
                <div className="text-lg font-bold text-emerald-600">{formatEuro(totalEinnahmen)} EUR</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                <div className="text-xs text-gray-600 mb-1">Ausgaben</div>
                <div className="text-lg font-bold text-red-500">{formatEuro(totalAusgaben)} EUR</div>
              </div>
              <div className={`bg-white rounded-lg p-3 text-center shadow-sm border-2 ${
                isDefizit ? 'border-red-300' : isSurplus ? 'border-emerald-300' : 'border-gray-200'
              }`}>
                <div className="text-xs text-gray-600 mb-1">
                  {isDefizit ? 'Defizit' : 'Ueberschuss'}
                </div>
                <div className={`text-lg font-bold ${
                  isDefizit ? 'text-red-600' : isSurplus ? 'text-emerald-600' : 'text-gray-600'
                }`}>
                  {differenz >= 0 ? '+' : ''}{formatEuro(differenz)} EUR
                </div>
              </div>
            </div>

            {/* Visual bar chart */}
            {(totalEinnahmen > 0 || totalAusgaben > 0) && (
              <div className="space-y-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-700">Ausgaben nach Kategorie</h3>
                <div className="space-y-2">
                  {ausgaben.filter(a => a.betrag > 0).sort((a, b) => b.betrag - a.betrag).map((posten) => {
                    const percent = maxBarValue > 0 ? (posten.betrag / maxBarValue) * 100 : 0
                    return (
                      <div key={posten.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 truncate mr-2">{posten.label}</span>
                          <span className="font-medium text-gray-900 whitespace-nowrap">{formatEuro(posten.betrag)} EUR</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-red-400 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(percent, 100)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Income comparison bar */}
                <div className="pt-2 border-t space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 font-medium">Einnahmen gesamt</span>
                    <span className="font-medium text-emerald-600 whitespace-nowrap">{formatEuro(totalEinnahmen)} EUR</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-emerald-400 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(maxBarValue > 0 ? (totalEinnahmen / (maxBarValue * ausgaben.filter(a => a.betrag > 0).length || 1)) * 100 : 0, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Warning for deficit */}
            {isDefizit && (
              <div className="bg-white/80 rounded-lg p-4 border border-red-200 mb-4">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm space-y-2">
                    <p className="font-medium text-red-800">
                      Deine Ausgaben uebersteigen deine Einnahmen um {formatEuro(Math.abs(differenz))} EUR.
                    </p>
                    <p className="text-gray-700">
                      Pruefe, ob du Anspruch auf zusaetzliche Leistungen hast:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 ml-1">
                      <li>
                        <strong>Mehrbedarf</strong> nach § 21 SGB II (z.B. fuer Alleinerziehende,
                        Schwangere, kostenaufwaendige Ernaehrung)
                      </li>
                      <li>
                        <strong>Sonderbedarf</strong> nach § 21 Abs. 6 SGB II fuer laufende
                        besondere Bedarfe
                      </li>
                      <li>
                        <strong>Einmalige Leistungen</strong> nach § 24 Abs. 3 SGB II
                        (Erstausstattung, Schwangerschaftsbekleidung)
                      </li>
                      <li>
                        <strong>Darlehen</strong> nach § 24 Abs. 1 SGB II bei unabweisbarem Bedarf
                        (z.B. Stromnachzahlung, Reparaturen)
                      </li>
                    </ul>
                    <p className="text-xs text-gray-600 mt-2">
                      Nutze den BescheidBoxer-Chat, um individuelle Beratung zu deiner Situation zu erhalten.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Surplus note */}
            {isSurplus && (
              <div className="bg-white/80 rounded-lg p-4 border border-emerald-200 mb-4">
                <div className="flex gap-3">
                  <PiggyBank className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm space-y-1">
                    <p className="font-medium text-emerald-800">
                      Dir bleiben monatlich {formatEuro(differenz)} EUR uebrig.
                    </p>
                    <p className="text-gray-700">
                      Beachte: Buergergeld-Empfaenger duerfen Vermoegen bis zur
                      Karenzzeit-Grenze (40.000 EUR fuer die erste Person, 15.000 EUR je
                      weitere Person im ersten Jahr) behalten. Danach gelten niedrigere
                      Schonvermoegengrenzen. Informiere dich ueber die aktuellen Freibetraege.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={handlePdfExport}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Als PDF
              </Button>
              <Button
                onClick={handleShare}
                variant="outline"
                className="flex-1"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Teilen
              </Button>
              <Button
                onClick={handleSave}
                variant="outline"
                className="flex-1"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Speichern
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* === SPARTIPPS === */}
        <Card className="shadow-sm rounded-xl">
          <CardContent className="pt-6">
            <button
              onClick={() => setShowSpartipps(!showSpartipps)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-amber-600" />
                <h2 className="text-lg font-semibold text-gray-900">Spartipps fuer Buergergeld-Empfaenger</h2>
              </div>
              <span className="text-sm text-gray-500">
                {showSpartipps ? 'Ausblenden' : 'Anzeigen'}
              </span>
            </button>

            {showSpartipps && (
              <div className="mt-4 space-y-4">
                {SPARTIPPS.map((kategorie) => (
                  <div key={kategorie.titel} className="bg-amber-50/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {getIcon(kategorie.icon, 'h-4 w-4 text-amber-600')}
                      <h3 className="text-sm font-semibold text-gray-900">{kategorie.titel}</h3>
                    </div>
                    <ul className="space-y-1.5">
                      {kategorie.tipps.map((tipp, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex gap-2">
                          <span className="text-amber-500 mt-1 flex-shrink-0">&#8226;</span>
                          <span>{tipp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-700 space-y-1">
                      <p className="font-medium text-gray-900">Weitere Hilfsangebote</p>
                      <ul className="space-y-1">
                        <li>&#8226; <strong>Schuldnerberatung</strong>: Kostenlose Beratung bei Schulden ueber Wohlfahrtsverbaende</li>
                        <li>&#8226; <strong>Sozialberatung</strong>: Hilfe beim Ausfuellen von Antraegen und bei Problemen mit dem Jobcenter</li>
                        <li>&#8226; <strong>GEZ-Befreiung</strong>: Rundfunkbeitragsbefreiung mit Buergergeld-Bescheid beantragen</li>
                        <li>&#8226; <strong>Sozialpass / Ehrenamtskarte</strong>: Viele Kommunen bieten Ermaessigungen fuer diverse Angebote</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
