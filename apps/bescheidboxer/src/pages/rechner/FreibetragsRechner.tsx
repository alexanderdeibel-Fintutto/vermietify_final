import { useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, Info, Download, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { berechneFreibetrag, FreibetragsErgebnis } from '@/lib/rechner-logik'
import { generateRechnerPdf } from '@/lib/pdf-export'
import { saveRechnerErgebnis } from '@/lib/rechner-verlauf'
import { shareResult } from '@/lib/share'
import Breadcrumbs from '@/components/Breadcrumbs'

export default function FreibetragsRechner() {
  const [bruttoEinkommen, setBruttoEinkommen] = useState<string>('800')
  const [hatKinder, setHatKinder] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [svBeitraege, setSvBeitraege] = useState<string>('')
  const [werbungskosten, setWerbungskosten] = useState<string>('15.33')
  const [versicherungspauschale, setVersicherungspauschale] = useState<string>('30')
  const [ergebnis, setErgebnis] = useState<FreibetragsErgebnis | null>(null)

  const handleBerechnen = () => {
    const result = berechneFreibetrag({
      bruttoEinkommen: parseFloat(bruttoEinkommen) || 0,
      hatKind: hatKinder,
      svBeitraege: svBeitraege ? parseFloat(svBeitraege) : undefined,
      werbungskosten: parseFloat(werbungskosten) || 0,
      versicherungsPauschale: parseFloat(versicherungspauschale) || 0,
    })
    setErgebnis(result)
    saveRechnerErgebnis('Freibetrags-Rechner', 'freibetrag', {
      freibetragGesamt: result.freibetragGesamt,
      anrechenbaresEinkommen: result.anrechenbaresEinkommen,
      bruttoEinkommen: parseFloat(bruttoEinkommen) || 0,
    })
  }

  const formatEuro = (betrag: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(betrag)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Breadcrumbs items={[{ label: 'Rechner', href: '/rechner' }, { label: 'Freibetrags-Rechner' }]} className="mb-4" />
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-100 p-3 rounded-full"><TrendingUp className="w-6 h-6 text-blue-600" /></div>
              <h1 className="text-3xl font-bold text-gray-900">Freibetrags-Rechner</h1>
            </div>
            <p className="text-gray-600 mt-2">Berechne, wie viel von deinem Einkommen du behalten darfst. Grundlage: § 11b SGB II</p>
          </div>
        </div>

        {/* Input */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Deine Angaben</h2>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Brutto-Erwerbseinkommen pro Monat</label>
            <div className="flex items-center gap-3 mb-3">
              <div className="relative flex-1">
                <input type="number" value={bruttoEinkommen} onChange={(e) => setBruttoEinkommen(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="0" min="0" step="10" />
              </div>
              <span className="text-gray-600 font-medium">EUR</span>
            </div>
            <input type="range" min="0" max="2500" step="10" value={bruttoEinkommen} onChange={(e) => setBruttoEinkommen(e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
            <div className="flex justify-between text-xs text-gray-500 mt-1"><span>0 EUR</span><span>2.500 EUR</span></div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Hast du Kinder?</label>
            <div className="flex gap-3">
              <button onClick={() => setHatKinder(true)} className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${hatKinder ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Ja</button>
              <button onClick={() => setHatKinder(false)} className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${!hatKinder ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Nein</button>
            </div>
          </div>

          <div className="border-t pt-4">
            <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800">
              <Info className="w-4 h-4" />{showAdvanced ? 'Erweiterte Optionen ausblenden' : 'Erweiterte Optionen anzeigen'}
            </button>
            {showAdvanced && (
              <div className="mt-4 space-y-4 bg-gray-50 p-4 rounded-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SV-Beitraege (EUR)</label>
                  <input type="number" value={svBeitraege} onChange={(e) => setSvBeitraege(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md" placeholder="Wird pauschal berechnet" min="0" step="0.01" />
                  <p className="text-xs text-gray-500 mt-1">Leer lassen fuer pauschale Berechnung</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Werbungskosten (EUR)</label>
                  <input type="number" value={werbungskosten} onChange={(e) => setWerbungskosten(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md" placeholder="15.33" min="0" step="0.01" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Versicherungspauschale (EUR)</label>
                  <input type="number" value={versicherungspauschale} onChange={(e) => setVersicherungspauschale(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md" placeholder="30" min="0" step="0.01" />
                </div>
              </div>
            )}
          </div>
          <Button onClick={handleBerechnen} className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold">Berechnen</Button>
        </div>

        {/* Staffelung-Grafik */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">So funktioniert die Staffelung</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-28 text-sm font-medium text-gray-700">0 - 100 EUR</div>
              <div className="flex-1 bg-green-500 h-8 rounded flex items-center justify-center text-white text-sm font-medium">100% frei (Grundfreibetrag)</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-28 text-sm font-medium text-gray-700">100 - 520 EUR</div>
              <div className="flex-1 bg-green-400 h-8 rounded flex items-center justify-center text-white text-sm font-medium">20% frei (Stufe 1)</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-28 text-sm font-medium text-gray-700">520 - {hatKinder ? '1.500' : '1.000'} EUR</div>
              <div className="flex-1 bg-green-300 h-8 rounded flex items-center justify-center text-gray-800 text-sm font-medium">30% frei (Stufe 2)</div>
            </div>
            {!hatKinder && (
              <div className="flex items-center gap-3">
                <div className="w-28 text-sm font-medium text-gray-700">1.000 - 1.200 EUR</div>
                <div className="flex-1 bg-green-200 h-8 rounded flex items-center justify-center text-gray-800 text-sm font-medium">10% frei (Stufe 3)</div>
              </div>
            )}
          </div>
          {hatKinder && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-3 flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800"><strong>Mit Kind:</strong> Stufe 2 geht bis 1.500 EUR statt 1.000 EUR!</p>
            </div>
          )}
        </div>

        {/* Results */}
        {ergebnis && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Dein Ergebnis</h2>

            {/* Visual Bar */}
            <div className="mb-6">
              <div className="h-16 w-full rounded-lg overflow-hidden flex">
                {ergebnis.brutto > 0 && (
                  <>
                    <div className="bg-green-500 flex items-center justify-center text-white font-semibold" style={{ width: `${(ergebnis.freibetragGesamt / ergebnis.brutto) * 100}%` }}>
                      {ergebnis.freibetragGesamt > 50 && <span className="text-sm">Du behältst</span>}
                    </div>
                    <div className="bg-red-400 flex items-center justify-center text-white font-semibold" style={{ width: `${(ergebnis.anrechenbaresEinkommen / ergebnis.brutto) * 100}%` }}>
                      {ergebnis.anrechenbaresEinkommen > 50 && <span className="text-sm">Angerechnet</span>}
                    </div>
                  </>
                )}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500"><span>0 EUR</span><span>{formatEuro(ergebnis.brutto)}</span></div>
            </div>

            {/* Big Numbers */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-sm text-green-700 mb-1">Du behaeltst</div>
                <div className="text-3xl font-bold text-green-600">{formatEuro(ergebnis.freibetragGesamt)}</div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Angerechnet</div>
                <div className="text-3xl font-bold text-gray-700">{formatEuro(ergebnis.anrechenbaresEinkommen)}</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-700 mb-1">Effektiv-Quote</div>
                <div className="text-3xl font-bold text-blue-600">{ergebnis.effektiverSteuersatz}%</div>
                <div className="text-xs text-blue-600 mt-1">wird abgezogen</div>
              </div>
            </div>

            {/* Breakdown Table */}
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
                    <td className="px-4 py-3 text-sm text-gray-900">Brutto-Erwerbseinkommen</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">{formatEuro(ergebnis.brutto)}</td>
                  </tr>
                  <tr className="bg-green-50">
                    <td className="px-4 py-3 text-sm text-gray-700">Grundfreibetrag (100 EUR)</td>
                    <td className="px-4 py-3 text-sm text-green-600 text-right font-medium">+ {formatEuro(ergebnis.grundfreibetrag)}</td>
                  </tr>
                  {ergebnis.freibetragStufe1 > 0 && (
                    <tr className="bg-green-50">
                      <td className="px-4 py-3 text-sm text-gray-700">Stufe 1: 20% von 100-520 EUR</td>
                      <td className="px-4 py-3 text-sm text-green-600 text-right font-medium">+ {formatEuro(ergebnis.freibetragStufe1)}</td>
                    </tr>
                  )}
                  {ergebnis.freibetragStufe2 > 0 && (
                    <tr className="bg-green-50">
                      <td className="px-4 py-3 text-sm text-gray-700">Stufe 2: 30% von 520-{hatKinder ? '1.500' : '1.000'} EUR</td>
                      <td className="px-4 py-3 text-sm text-green-600 text-right font-medium">+ {formatEuro(ergebnis.freibetragStufe2)}</td>
                    </tr>
                  )}
                  {ergebnis.freibetragStufe3 > 0 && (
                    <tr className="bg-green-50">
                      <td className="px-4 py-3 text-sm text-gray-700">Stufe 3: 10%</td>
                      <td className="px-4 py-3 text-sm text-green-600 text-right font-medium">+ {formatEuro(ergebnis.freibetragStufe3)}</td>
                    </tr>
                  )}
                  <tr className="bg-green-50">
                    <td className="px-4 py-3 text-sm text-gray-700">SV-Beitraege</td>
                    <td className="px-4 py-3 text-sm text-green-600 text-right font-medium">- {formatEuro(ergebnis.svAbzug)}</td>
                  </tr>
                  <tr className="bg-green-50">
                    <td className="px-4 py-3 text-sm text-gray-700">Werbungskosten</td>
                    <td className="px-4 py-3 text-sm text-green-600 text-right font-medium">- {formatEuro(ergebnis.werbungskostenAbzug)}</td>
                  </tr>
                  <tr className="bg-green-50">
                    <td className="px-4 py-3 text-sm text-gray-700">Versicherungspauschale</td>
                    <td className="px-4 py-3 text-sm text-green-600 text-right font-medium">- {formatEuro(ergebnis.versicherungsAbzug)}</td>
                  </tr>
                  <tr className="bg-gray-50 font-semibold">
                    <td className="px-4 py-3 text-sm text-gray-900">Gesamt Freibetraege</td>
                    <td className="px-4 py-3 text-sm text-green-600 text-right">{formatEuro(ergebnis.freibetragGesamt)}</td>
                  </tr>
                  <tr className="bg-red-50 font-semibold">
                    <td className="px-4 py-3 text-sm text-gray-900">Wird auf Buergergeld angerechnet</td>
                    <td className="px-4 py-3 text-sm text-red-600 text-right">- {formatEuro(ergebnis.anrechenbaresEinkommen)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <Button
                onClick={() => {
                  generateRechnerPdf('Freibetrags-Berechnung (§ 11b SGB II)', [
                    { label: 'Bruttoeinkommen', value: `${ergebnis.brutto} EUR` },
                    { label: 'Grundfreibetrag (100 EUR)', value: `${formatEuro(ergebnis.grundfreibetrag)}` },
                    { label: 'Stufe 1 (20%)', value: `${formatEuro(ergebnis.freibetragStufe1)}` },
                    { label: 'Stufe 2 (30%)', value: `${formatEuro(ergebnis.freibetragStufe2)}` },
                    ...(ergebnis.freibetragStufe3 > 0 ? [{ label: 'Stufe 3 (10%)', value: `${formatEuro(ergebnis.freibetragStufe3)}` }] : []),
                    { label: 'Freibetrag gesamt', value: `${formatEuro(ergebnis.freibetragGesamt)}`, highlight: true },
                    { label: 'Anrechenbares Einkommen', value: `${formatEuro(ergebnis.anrechenbaresEinkommen)}`, highlight: true },
                  ], { label: 'Du darfst behalten', value: `${formatEuro(ergebnis.freibetragGesamt)}` })
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />Als PDF
              </Button>
              <Button
                onClick={() => shareResult({
                  title: 'Freibetrags-Berechnung',
                  text: `Freibetrags-Rechner: ${formatEuro(ergebnis.freibetragGesamt)} darfst du behalten, ${formatEuro(ergebnis.anrechenbaresEinkommen)} wird angerechnet`,
                  url: window.location.href,
                })}
                variant="outline"
              >
                <Share2 className="w-4 h-4 mr-2" />Teilen
              </Button>
            </div>
          </div>
        )}

        {/* CTAs */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Weitere Rechner</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link to="/rechner/buergergeld"><Button variant="outline" className="w-full justify-start">Buergergeld berechnen</Button></Link>
            <Link to="/rechner"><Button variant="outline" className="w-full justify-start">Alle Rechner anzeigen</Button></Link>
          </div>
        </div>
      </div>
    </div>
  )
}
