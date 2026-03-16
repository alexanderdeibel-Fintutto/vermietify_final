import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Minus, Download, Info, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generateRechnerPdf, RechnerSection } from '@/lib/pdf-export'
import { saveRechnerErgebnis } from '@/lib/rechner-verlauf'
import { shareResult } from '@/lib/share'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import Breadcrumbs from '@/components/Breadcrumbs'

interface BescheidPosition {
  label: string
  altBetrag: number
  neuBetrag: number
}

const STANDARD_POSITIONEN: { label: string; beschreibung: string }[] = [
  { label: 'Regelbedarf (Person 1)', beschreibung: 'Regelsatz nach § 20 SGB II' },
  { label: 'Regelbedarf (Person 2)', beschreibung: 'Partner/weitere Person' },
  { label: 'Mehrbedarf', beschreibung: 'Schwangerschaft, Alleinerziehung etc.' },
  { label: 'Kaltmiete', beschreibung: 'Grundmiete ohne Nebenkosten' },
  { label: 'Nebenkosten', beschreibung: 'Kalte Betriebskosten' },
  { label: 'Heizkosten', beschreibung: 'Heizung und Warmwasser' },
  { label: 'Kindergeld (abgezogen)', beschreibung: 'Wird als Einkommen angerechnet' },
  { label: 'Einkommen (angerechnet)', beschreibung: 'Bereinigtes Einkommen § 11b' },
]

export default function VergleichsRechner() {
  useDocumentTitle('Bescheid-Vergleich - BescheidBoxer')

  const [positionen, setPositionen] = useState<BescheidPosition[]>(
    STANDARD_POSITIONEN.map(p => ({ label: p.label, altBetrag: 0, neuBetrag: 0 }))
  )
  const [altMonat, setAltMonat] = useState('')
  const [neuMonat, setNeuMonat] = useState('')
  const [calculated, setCalculated] = useState(false)

  const updatePosition = (index: number, field: 'altBetrag' | 'neuBetrag', value: number) => {
    setPositionen(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const altGesamt = positionen.reduce((sum, p) => sum + p.altBetrag, 0)
  const neuGesamt = positionen.reduce((sum, p) => sum + p.neuBetrag, 0)
  const differenz = neuGesamt - altGesamt

  const handleVergleichen = () => {
    setCalculated(true)
    saveRechnerErgebnis('Bescheid-Vergleich', 'vergleich', {
      altGesamt,
      neuGesamt,
      differenz,
      altMonat: altMonat || 'k.A.',
      neuMonat: neuMonat || 'k.A.',
    })
  }

  const handlePdf = () => {
    const sections: RechnerSection[] = positionen
      .filter(p => p.altBetrag > 0 || p.neuBetrag > 0)
      .map(p => ({
        label: p.label,
        value: `${p.altBetrag.toFixed(2)} → ${p.neuBetrag.toFixed(2)} EUR (${(p.neuBetrag - p.altBetrag) >= 0 ? '+' : ''}${(p.neuBetrag - p.altBetrag).toFixed(2)})`,
        highlight: Math.abs(p.neuBetrag - p.altBetrag) > 10,
      }))

    generateRechnerPdf(
      `Bescheid-Vergleich ${altMonat || 'Alt'} vs. ${neuMonat || 'Neu'}`,
      sections,
      { label: 'Differenz Gesamt', value: `${differenz >= 0 ? '+' : ''}${differenz.toFixed(2)} EUR` },
    )
  }

  const formatEuro = (v: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Rechner', href: '/rechner' }, { label: 'Bescheid-Vergleich' }]} className="mb-4" />

        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-indigo-100 rounded-lg"><ArrowRight className="w-8 h-8 text-indigo-600" /></div>
          <h1 className="text-4xl font-bold text-gray-900">Bescheid-Vergleich</h1>
        </div>
        <p className="text-lg text-gray-600 mt-2 mb-8">
          Vergleiche zwei Bescheide Seite an Seite und finde Abweichungen.
        </p>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">So funktioniert der Vergleich</p>
            <p>Trage die Betraege aus deinem alten und neuen Bescheid ein. Der Vergleich zeigt dir sofort, wo sich etwas geaendert hat und ob du weniger Geld bekommst als vorher.</p>
          </div>
        </div>

        {/* Month Labels */}
        <div className="grid grid-cols-[1fr_1fr_1fr] md:grid-cols-[2fr_1fr_1fr] gap-4 mb-4">
          <div />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alter Bescheid</label>
            <input
              type="text"
              placeholder="z.B. Jan 2026"
              value={altMonat}
              onChange={(e) => setAltMonat(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Neuer Bescheid</label>
            <input
              type="text"
              placeholder="z.B. Feb 2026"
              value={neuMonat}
              onChange={(e) => setNeuMonat(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Position Rows */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="grid grid-cols-[1fr_1fr_1fr] md:grid-cols-[2fr_1fr_1fr] gap-4 px-4 py-3 bg-gray-100 border-b text-sm font-semibold text-gray-700">
            <span>Position</span>
            <span className="text-center">Alt (EUR)</span>
            <span className="text-center">Neu (EUR)</span>
          </div>

          {positionen.map((pos, i) => (
            <div
              key={i}
              className={`grid grid-cols-[1fr_1fr_1fr] md:grid-cols-[2fr_1fr_1fr] gap-4 px-4 py-3 items-center ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-100`}
            >
              <div>
                <div className="font-medium text-gray-900 text-sm">{pos.label}</div>
                <div className="text-xs text-gray-500">{STANDARD_POSITIONEN[i]?.beschreibung}</div>
              </div>
              <input
                type="number"
                value={pos.altBetrag || ''}
                onChange={(e) => updatePosition(i, 'altBetrag', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-indigo-500"
                min="0"
                step="0.01"
                placeholder="0,00"
              />
              <input
                type="number"
                value={pos.neuBetrag || ''}
                onChange={(e) => updatePosition(i, 'neuBetrag', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-indigo-500"
                min="0"
                step="0.01"
                placeholder="0,00"
              />
            </div>
          ))}

          {/* Totals Row */}
          <div className="grid grid-cols-[1fr_1fr_1fr] md:grid-cols-[2fr_1fr_1fr] gap-4 px-4 py-4 bg-gray-100 font-semibold">
            <span className="text-gray-900">Gesamt</span>
            <span className="text-center text-gray-900">{formatEuro(altGesamt)}</span>
            <span className="text-center text-gray-900">{formatEuro(neuGesamt)}</span>
          </div>
        </div>

        <Button onClick={handleVergleichen} className="w-full py-6 text-lg mb-6">Vergleich auswerten</Button>

        {/* Results */}
        {calculated && (
          <div className="space-y-6">
            {/* Differenz Summary */}
            <div className={`rounded-xl shadow-lg p-6 border-2 ${
              differenz > 0 ? 'bg-green-50 border-green-300' : differenz < 0 ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-300'
            }`}>
              <div className="flex items-center gap-4">
                {differenz > 0 && <TrendingUp className="w-12 h-12 text-green-600" />}
                {differenz < 0 && <TrendingDown className="w-12 h-12 text-red-600" />}
                {differenz === 0 && <Minus className="w-12 h-12 text-gray-600" />}
                <div>
                  <h3 className={`text-2xl font-bold ${differenz > 0 ? 'text-green-900' : differenz < 0 ? 'text-red-900' : 'text-gray-900'}`}>
                    {differenz > 0 && `+${formatEuro(differenz)} mehr`}
                    {differenz < 0 && `${formatEuro(differenz)} weniger`}
                    {differenz === 0 && 'Kein Unterschied'}
                  </h3>
                  <p className={differenz > 0 ? 'text-green-800' : differenz < 0 ? 'text-red-800' : 'text-gray-600'}>
                    {differenz > 0 && 'Der neue Bescheid ist hoeher. Pruefe trotzdem alle Positionen auf Richtigkeit.'}
                    {differenz < 0 && 'Der neue Bescheid ist niedriger! Pruefe die Aenderungen genau und lege ggf. Widerspruch ein.'}
                    {differenz === 0 && 'Beide Bescheide ergeben den gleichen Gesamtbetrag.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Detail Changes */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4">Aenderungen im Detail</h3>
              <div className="space-y-3">
                {positionen.filter(p => p.altBetrag > 0 || p.neuBetrag > 0).map((pos, i) => {
                  const diff = pos.neuBetrag - pos.altBetrag
                  if (Math.abs(diff) < 0.01) return null
                  return (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        {diff > 0 ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertTriangle className="w-5 h-5 text-red-600" />}
                        <div>
                          <p className="font-medium text-gray-900">{pos.label}</p>
                          <p className="text-sm text-gray-500">{formatEuro(pos.altBetrag)} → {formatEuro(pos.neuBetrag)}</p>
                        </div>
                      </div>
                      <span className={`font-bold ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {diff > 0 ? '+' : ''}{formatEuro(diff)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button onClick={handlePdf} className="bg-amber-600 hover:bg-amber-700 text-white">
                <Download className="w-4 h-4 mr-2" />Als PDF
              </Button>
              <Button
                onClick={() => shareResult({
                  title: 'Bescheid-Vergleich',
                  text: `Bescheid-Vergleich: ${differenz > 0 ? '+' : ''}${formatEuro(differenz)} Differenz (${altMonat || 'Alt'} vs. ${neuMonat || 'Neu'})`,
                  url: window.location.href,
                })}
                variant="outline"
              >
                <Share2 className="w-4 h-4 mr-2" />Teilen
              </Button>
              {differenz < 0 && (
                <Link to="/musterschreiben">
                  <Button className="w-full bg-red-600 hover:bg-red-700 text-white">Widerspruch erstellen</Button>
                </Link>
              )}
              <Link to="/scan">
                <Button variant="outline" className="w-full">Bescheid scannen</Button>
              </Link>
              <Link to="/rechner">
                <Button variant="outline" className="w-full">Alle Rechner</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
