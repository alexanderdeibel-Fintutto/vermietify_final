import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Scale, Info, CheckCircle, XCircle, AlertTriangle, HelpCircle, Download, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generateRechnerPdf, RechnerSection } from '@/lib/pdf-export'
import { saveRechnerErgebnis } from '@/lib/rechner-verlauf'
import { shareResult } from '@/lib/share'
import Breadcrumbs from '@/components/Breadcrumbs'

interface PkhErgebnis {
  einzusetzendesEinkommen: number
  status: 'bewilligt' | 'raten' | 'unwahrscheinlich'
  monatlicherRate: number
  maxRaten: number
  gesamtKosten: number
  freibetraege: { label: string; betrag: number }[]
  freibetraegeGesamt: number
  vermoegenOk: boolean
  vermoegenAnrechenbar: number
  vermoegenFreibetrag: number
}

const GRUNDFREIBETRAG = 552
const ERWERBSTAETIGENFREIBETRAG = 252
const PARTNER_FREIBETRAG = 552
const KINDER_FREIBETRAEGE: Record<string, number> = {
  '0-5': 403,
  '6-13': 460,
  '14-17': 567,
  '18+': 552,
}
const VERMOEGENSFREIBETRAG = 10000
const AUTO_FREIBETRAG = 7500
const MAX_RATEN = 48

function getKindFreibetrag(alter: number): { betrag: number; gruppe: string } {
  if (alter <= 5) return { betrag: KINDER_FREIBETRAEGE['0-5'], gruppe: '0-5 Jahre' }
  if (alter <= 13) return { betrag: KINDER_FREIBETRAEGE['6-13'], gruppe: '6-13 Jahre' }
  if (alter <= 17) return { betrag: KINDER_FREIBETRAEGE['14-17'], gruppe: '14-17 Jahre' }
  return { betrag: KINDER_FREIBETRAEGE['18+'], gruppe: '18+ Jahre' }
}

export default function PkhRechner() {
  const [nettoEinkommen, setNettoEinkommen] = useState(0)
  const [istErwerbstaetig, setIstErwerbstaetig] = useState(false)
  const [hatPartner, setHatPartner] = useState(false)
  const [partnerEinkommen, setPartnerEinkommen] = useState(0)
  const [kinderAnzahl, setKinderAnzahl] = useState(0)
  const [kinderAlter, setKinderAlter] = useState<number[]>([])
  const [wohnkosten, setWohnkosten] = useState(0)
  const [svBeitraege, setSvBeitraege] = useState(0)
  const [sonstigeAbzuege, setSonstigeAbzuege] = useState(0)
  const [vermoegen, setVermoegen] = useState(0)
  const [autoWert, setAutoWert] = useState(0)
  const [anwaltskosten, setAnwaltskosten] = useState(500)
  const [result, setResult] = useState<PkhErgebnis | null>(null)

  const handleKinderAnzahlChange = (anzahl: number) => {
    const clamped = Math.max(0, Math.min(6, anzahl))
    setKinderAnzahl(clamped)
    setKinderAlter((prev) => {
      if (clamped > prev.length) {
        return [...prev, ...Array(clamped - prev.length).fill(5)]
      }
      return prev.slice(0, clamped)
    })
  }

  const handleKindAlterChange = (index: number, alter: number) => {
    setKinderAlter((prev) => {
      const next = [...prev]
      next[index] = alter
      return next
    })
  }

  const handleCalculate = () => {
    const freibetraege: { label: string; betrag: number }[] = []

    // Grundfreibetrag
    freibetraege.push({ label: 'Grundfreibetrag Partei', betrag: GRUNDFREIBETRAG })

    // Erwerbstaetigen-Freibetrag
    if (istErwerbstaetig) {
      freibetraege.push({ label: 'Erwerbstaetigen-Freibetrag', betrag: ERWERBSTAETIGENFREIBETRAG })
    }

    // Partner
    if (hatPartner) {
      freibetraege.push({ label: 'Unterhalt Ehepartner/Partner', betrag: PARTNER_FREIBETRAG })
    }

    // Kinder
    for (let i = 0; i < kinderAnzahl; i++) {
      const alter = kinderAlter[i] ?? 5
      const { betrag, gruppe } = getKindFreibetrag(alter)
      freibetraege.push({ label: `Kind ${i + 1} (${gruppe})`, betrag })
    }

    // Wohnkosten
    if (wohnkosten > 0) {
      freibetraege.push({ label: 'Wohnkosten (Miete/Nebenkosten)', betrag: wohnkosten })
    }

    // SV-Beitraege
    if (svBeitraege > 0) {
      freibetraege.push({ label: 'Sozialversicherungsbeitraege', betrag: svBeitraege })
    }

    // Sonstige Abzuege
    if (sonstigeAbzuege > 0) {
      freibetraege.push({ label: 'Sonstige Abzuege', betrag: sonstigeAbzuege })
    }

    const freibetraegeGesamt = freibetraege.reduce((sum, f) => sum + f.betrag, 0)

    // Gesamteinkommen: eigenes + Partner
    const gesamtEinkommen = nettoEinkommen + (hatPartner ? partnerEinkommen : 0)
    const einzusetzendesEinkommen = gesamtEinkommen - freibetraegeGesamt

    // Vermoegenspruefung
    const autoAnrechenbar = Math.max(0, autoWert - AUTO_FREIBETRAG)
    const vermoegenAnrechenbar = Math.max(0, vermoegen + autoAnrechenbar - VERMOEGENSFREIBETRAG)
    const vermoegenOk = vermoegenAnrechenbar <= 0

    // PKH-Status
    let status: PkhErgebnis['status']
    let monatlicherRate = 0

    if (einzusetzendesEinkommen <= 0) {
      status = 'bewilligt'
    } else if (einzusetzendesEinkommen < 600) {
      status = 'raten'
      monatlicherRate = Math.ceil(einzusetzendesEinkommen / 2)
    } else {
      status = 'unwahrscheinlich'
      monatlicherRate = Math.ceil(einzusetzendesEinkommen / 2)
    }

    const gesamtKosten = monatlicherRate * MAX_RATEN

    const pkhResult = {
      einzusetzendesEinkommen,
      status: vermoegenOk ? status : 'unwahrscheinlich',
      monatlicherRate,
      maxRaten: MAX_RATEN,
      gesamtKosten,
      freibetraege,
      freibetraegeGesamt,
      vermoegenOk,
      vermoegenAnrechenbar,
      vermoegenFreibetrag: VERMOEGENSFREIBETRAG,
    }
    setResult(pkhResult)
    saveRechnerErgebnis('PKH-Rechner', 'pkh', {
      status: pkhResult.status,
      einzusetzendesEinkommen,
      monatlicherRate,
      vermoegenOk: vermoegenOk ? 'Ja' : 'Nein',
    })
  }

  const formatEuro = (betrag: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(betrag)

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Breadcrumbs items={[{ label: 'Rechner', href: '/rechner' }, { label: 'PKH-Rechner' }]} className="mb-4 [&_a]:text-white/90 [&_a:hover]:text-white [&_span]:text-white [&_svg]:text-white/70" />
          <div className="flex items-start gap-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <Scale className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Prozesskostenhilfe-Rechner</h1>
              <p className="text-blue-100 text-lg">Pruefe, ob du Anspruch auf PKH hast (SS 114 ZPO)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-6">
        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Was ist Prozesskostenhilfe?</p>
              <p>PKH hilft Menschen, die sich die Kosten eines Gerichtsverfahrens nicht leisten koennen. Beim Sozialgericht gibt es keine Gerichtskosten - PKH deckt dort die Anwaltskosten.</p>
            </div>
          </div>
        </div>

        {/* Einkommen */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Einkommen und Abzuege</h2>
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Monatliches Nettoeinkommen (EUR)</label>
                <input
                  type="number"
                  value={nettoEinkommen || ''}
                  onChange={(e) => setNettoEinkommen(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="50"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Wohnkosten / Miete (EUR)</label>
                <input
                  type="number"
                  value={wohnkosten || ''}
                  onChange={(e) => setWohnkosten(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="50"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Erwerbstaetig Toggle */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">Bist du erwerbstaetig?</label>
                <button
                  onClick={() => setIstErwerbstaetig(!istErwerbstaetig)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${istErwerbstaetig ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${istErwerbstaetig ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>

            {/* Partner Toggle */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">Ehepartner/Partner vorhanden?</label>
                <button
                  onClick={() => setHatPartner(!hatPartner)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hatPartner ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hatPartner ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {hatPartner && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nettoeinkommen Partner (EUR)</label>
                  <input
                    type="number"
                    value={partnerEinkommen || ''}
                    onChange={(e) => setPartnerEinkommen(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="50"
                    placeholder="0"
                  />
                </div>
              )}
            </div>

            {/* Kinder */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Anzahl unterhaltsberechtigter Kinder</label>
              <select
                value={kinderAnzahl}
                onChange={(e) => handleKinderAnzahlChange(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>{n} {n === 1 ? 'Kind' : 'Kinder'}</option>
                ))}
              </select>
              {kinderAnzahl > 0 && (
                <div className="mt-4 space-y-3">
                  {kinderAlter.map((alter, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-20">Kind {i + 1}:</span>
                      <select
                        value={alter}
                        onChange={(e) => handleKindAlterChange(i, Number(e.target.value))}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={3}>0-5 Jahre (Freibetrag: {KINDER_FREIBETRAEGE['0-5']} EUR)</option>
                        <option value={8}>6-13 Jahre (Freibetrag: {KINDER_FREIBETRAEGE['6-13']} EUR)</option>
                        <option value={15}>14-17 Jahre (Freibetrag: {KINDER_FREIBETRAEGE['14-17']} EUR)</option>
                        <option value={20}>18+ Jahre (Freibetrag: {KINDER_FREIBETRAEGE['18+']} EUR)</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Weitere Abzuege */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-gray-400" />
                Weitere Abzuege
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">SV-Beitraege (falls nicht schon abgezogen)</label>
                  <input
                    type="number"
                    value={svBeitraege || ''}
                    onChange={(e) => setSvBeitraege(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="10"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Sonstige Abzuege (EUR)</label>
                  <input
                    type="number"
                    value={sonstigeAbzuege || ''}
                    onChange={(e) => setSonstigeAbzuege(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="10"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vermoegen */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Vermoegen</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gesamtvermoegen (Konten, Sparbuch, Bargeld) (EUR)</label>
              <input
                type="number"
                value={vermoegen || ''}
                onChange={(e) => setVermoegen(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
                step="500"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">Freibetrag: {formatEuro(VERMOEGENSFREIBETRAG)} - Riester-Rente ist geschuetzt</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">KFZ-Wert (EUR)</label>
              <input
                type="number"
                value={autoWert || ''}
                onChange={(e) => setAutoWert(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
                step="500"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">Auto bis {formatEuro(AUTO_FREIBETRAG)} geschuetzt</p>
            </div>
          </div>
        </div>

        {/* Anwaltskosten */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Geschaetzte Anwaltskosten</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Anwaltskosten (EUR, optional)</label>
            <input
              type="number"
              value={anwaltskosten || ''}
              onChange={(e) => setAnwaltskosten(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="0"
              step="50"
              placeholder="500"
            />
            <p className="text-xs text-gray-500 mt-1">Richtwert Sozialgericht 1. Instanz: ca. 500 EUR</p>
          </div>
        </div>

        {/* Calculate Button */}
        <Button
          onClick={handleCalculate}
          className="w-full mb-6 bg-blue-700 hover:bg-blue-800 text-white py-3"
        >
          <Scale className="w-5 h-5 mr-2" />PKH-Anspruch pruefen
        </Button>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Main Result Card */}
            <div className={`rounded-lg shadow-sm border-2 p-6 ${
              result.status === 'bewilligt'
                ? 'bg-green-50 border-green-300'
                : result.status === 'raten'
                  ? 'bg-amber-50 border-amber-300'
                  : 'bg-red-50 border-red-300'
            }`}>
              <div className="flex items-start gap-4">
                {result.status === 'bewilligt' && <CheckCircle className="w-12 h-12 text-green-600 flex-shrink-0" />}
                {result.status === 'raten' && <AlertTriangle className="w-12 h-12 text-amber-600 flex-shrink-0" />}
                {result.status === 'unwahrscheinlich' && <XCircle className="w-12 h-12 text-red-600 flex-shrink-0" />}
                <div>
                  <h3 className={`text-2xl font-bold mb-2 ${
                    result.status === 'bewilligt'
                      ? 'text-green-900'
                      : result.status === 'raten'
                        ? 'text-amber-900'
                        : 'text-red-900'
                  }`}>
                    {result.status === 'bewilligt' && 'PKH bewilligt - ohne Ratenzahlung'}
                    {result.status === 'raten' && 'PKH mit Ratenzahlung moeglich'}
                    {result.status === 'unwahrscheinlich' && 'PKH unwahrscheinlich'}
                  </h3>
                  <p className={
                    result.status === 'bewilligt'
                      ? 'text-green-800'
                      : result.status === 'raten'
                        ? 'text-amber-800'
                        : 'text-red-800'
                  }>
                    {result.status === 'bewilligt' && 'Du hast voraussichtlich Anspruch auf volle Prozesskostenhilfe. Die Anwaltskosten werden vollstaendig uebernommen.'}
                    {result.status === 'raten' && `Du hast voraussichtlich Anspruch auf PKH, musst aber monatliche Raten zahlen: ${formatEuro(result.monatlicherRate)} / Monat.`}
                    {result.status === 'unwahrscheinlich' && 'Nach dieser Berechnung ist PKH voraussichtlich nicht moeglich. Eine individuelle Pruefung kann aber zu einem anderen Ergebnis fuehren.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Raten-Details */}
            {result.status === 'raten' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-semibold text-amber-900 mb-3">Ratenzahlung im Detail</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-3 border border-amber-200">
                    <div className="text-sm text-amber-700">Monatliche Rate</div>
                    <div className="text-2xl font-bold text-amber-800">{formatEuro(result.monatlicherRate)}</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-amber-200">
                    <div className="text-sm text-amber-700">Maximum Raten</div>
                    <div className="text-2xl font-bold text-amber-800">{result.maxRaten} Monate</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-amber-200">
                    <div className="text-sm text-amber-700">Max. Gesamtkosten</div>
                    <div className="text-2xl font-bold text-amber-800">{formatEuro(result.gesamtKosten)}</div>
                  </div>
                </div>
                <p className="text-sm text-amber-800 mt-3">
                  Aber: Du zahlst maximal die tatsaechlichen Anwaltskosten ({formatEuro(anwaltskosten)}). Die Ratenzahlung endet, wenn dieser Betrag erreicht ist.
                </p>
              </div>
            )}

            {/* Detailed Breakdown */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold mb-4">Berechnung im Detail</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Position</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Betrag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">Nettoeinkommen</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">{formatEuro(nettoEinkommen)}</td>
                    </tr>
                    {hatPartner && (
                      <tr>
                        <td className="px-4 py-3 text-sm text-gray-900">+ Partnereinkommen</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">{formatEuro(partnerEinkommen)}</td>
                      </tr>
                    )}
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">Gesamteinkommen</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{formatEuro(nettoEinkommen + (hatPartner ? partnerEinkommen : 0))}</td>
                    </tr>
                    {result.freibetraege.map((f, i) => (
                      <tr key={i} className="bg-green-50">
                        <td className="px-4 py-3 text-sm text-gray-700">- {f.label}</td>
                        <td className="px-4 py-3 text-sm text-green-600 text-right font-medium">- {formatEuro(f.betrag)}</td>
                      </tr>
                    ))}
                    <tr className="bg-green-50 font-semibold">
                      <td className="px-4 py-3 text-sm text-gray-900">Freibetraege gesamt</td>
                      <td className="px-4 py-3 text-sm text-green-600 text-right">{formatEuro(result.freibetraegeGesamt)}</td>
                    </tr>
                    <tr className={`font-semibold ${result.einzusetzendesEinkommen <= 0 ? 'bg-green-100' : result.einzusetzendesEinkommen < 600 ? 'bg-amber-100' : 'bg-red-100'}`}>
                      <td className="px-4 py-3 text-sm text-gray-900">Einzusetzendes Einkommen</td>
                      <td className="px-4 py-3 text-sm text-right font-bold">
                        {result.einzusetzendesEinkommen <= 0
                          ? formatEuro(0) + ' (negativ)'
                          : formatEuro(result.einzusetzendesEinkommen)
                        }
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Vermoegenspruefung */}
            <div className={`rounded-lg border-2 p-4 ${result.vermoegenOk ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
              <div className="flex items-start gap-3">
                {result.vermoegenOk
                  ? <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  : <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                }
                <div>
                  <h4 className={`font-semibold mb-1 ${result.vermoegenOk ? 'text-green-900' : 'text-red-900'}`}>
                    Vermoegenspruefung: {result.vermoegenOk ? 'Bestanden' : 'Nicht bestanden'}
                  </h4>
                  <p className={`text-sm ${result.vermoegenOk ? 'text-green-800' : 'text-red-800'}`}>
                    {result.vermoegenOk
                      ? `Dein anrechenbares Vermoegen liegt innerhalb des Freibetrags von ${formatEuro(result.vermoegenFreibetrag)}.`
                      : `Dein Vermoegen uebersteigt den Freibetrag um ${formatEuro(result.vermoegenAnrechenbar)}. Du musst vorrangig dein Vermoegen einsetzen.`
                    }
                  </p>
                  <div className="mt-2 text-xs text-gray-600 space-y-1">
                    <p>Vermoegensfreibetrag: {formatEuro(VERMOEGENSFREIBETRAG)}</p>
                    <p>KFZ-Freibetrag: {formatEuro(AUTO_FREIBETRAG)}</p>
                    <p>Riester-Rente: vollstaendig geschuetzt</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Wichtige Hinweise
              </h4>
              <ul className="text-sm text-blue-800 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="font-bold mt-0.5">1.</span>
                  <span>Beim Sozialgericht gibt es KEINE Gerichtskosten (SS 183 SGG) - PKH deckt die Anwaltskosten.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold mt-0.5">2.</span>
                  <span>Der PKH-Antrag kann zusammen mit der Klage eingereicht werden.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold mt-0.5">3.</span>
                  <span>Achtung: PKH deckt nur die eigenen Anwaltskosten, nicht die der Gegenseite.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold mt-0.5">4.</span>
                  <span>Beratungshilfe (beim Amtsgericht) gibt es fuer die aussergerichtliche Phase.</span>
                </li>
              </ul>
            </div>

            {/* CTAs */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                onClick={() => {
                  const sections: RechnerSection[] = [
                    ...result.freibetraege.map(f => ({ label: f.label, value: formatEuro(f.betrag) })),
                    { label: 'Einzusetzendes Einkommen', value: formatEuro(Math.max(0, result.einzusetzendesEinkommen)), highlight: true },
                    { label: 'Ergebnis', value: result.status === 'bewilligt' ? 'PKH bewilligt' : result.status === 'raten' ? 'PKH mit Raten' : 'PKH unwahrscheinlich', highlight: true },
                  ]
                  generateRechnerPdf('Prozesskostenhilfe-Berechnung (§ 114 ZPO)', sections,
                    result.status === 'raten' ? { label: 'Monatliche Rate', value: formatEuro(result.monatlicherRate) } : undefined,
                  )
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />Als PDF
              </Button>
              <Button
                onClick={() => shareResult({
                  title: 'PKH-Berechnung',
                  text: `PKH-Rechner: ${result.status === 'bewilligt' ? 'PKH bewilligt' : result.status === 'raten' ? `PKH mit Raten (${formatEuro(result.monatlicherRate)}/Monat)` : 'PKH unwahrscheinlich'}`,
                  url: window.location.href,
                })}
                variant="outline"
                className="w-full"
              >
                <Share2 className="w-4 h-4 mr-2" />Teilen
              </Button>
              <Link to="/generator/klage">
                <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white">Klage erstellen</Button>
              </Link>
              <Link to="/chat">
                <Button variant="outline" className="w-full">KI-Berater fragen</Button>
              </Link>
              <Link to="/rechner">
                <Button variant="outline" className="w-full">Alle Rechner</Button>
              </Link>
            </div>
          </div>
        )}

        {/* Legal Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
          <h3 className="text-xl font-bold mb-4">Rechtliche Grundlagen</h3>
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Voraussetzungen fuer PKH (SS 114 ZPO)</h4>
              <ul className="text-sm text-gray-700 space-y-1 ml-4">
                <li>1. Die Partei kann die Prozesskosten nicht aus Einkommen/Vermoegen aufbringen</li>
                <li>2. Die Rechtsverfolgung hat hinreichende Aussicht auf Erfolg</li>
                <li>3. Die Rechtsverfolgung ist nicht mutwillig</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Freibetraege 2025</h4>
              <ul className="text-sm text-gray-700 space-y-1 ml-4">
                <li>Grundfreibetrag Partei: {formatEuro(GRUNDFREIBETRAG)}</li>
                <li>Erwerbstaetigen-Freibetrag: {formatEuro(ERWERBSTAETIGENFREIBETRAG)}</li>
                <li>Ehepartner: {formatEuro(PARTNER_FREIBETRAG)}</li>
                <li>Kinder 0-5: {formatEuro(KINDER_FREIBETRAEGE['0-5'])}</li>
                <li>Kinder 6-13: {formatEuro(KINDER_FREIBETRAEGE['6-13'])}</li>
                <li>Kinder 14-17: {formatEuro(KINDER_FREIBETRAEGE['14-17'])}</li>
                <li>Kinder 18+: {formatEuro(KINDER_FREIBETRAEGE['18+'])}</li>
              </ul>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600">Rechtsgrundlagen: SS 114-127 ZPO, SS 73a SGG</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
