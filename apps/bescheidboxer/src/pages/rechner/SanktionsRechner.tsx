import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Info, Shield, Scale, Download, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { berechneSanktion, SanktionsErgebnis } from '@/lib/rechner-logik'
import { generateRechnerPdf } from '@/lib/pdf-export'
import { saveRechnerErgebnis } from '@/lib/rechner-verlauf'
import { shareResult } from '@/lib/share'
import Breadcrumbs from '@/components/Breadcrumbs'

export default function SanktionsRechner() {
  const [regelsatz, setRegelsatz] = useState(563)
  const [art, setArt] = useState<'meldeversaeumnis' | 'pflichtversaeumnis' | 'arbeitsverweigerung'>('meldeversaeumnis')
  const [pflichtverletzungNr, setPflichtverletzungNr] = useState(1)
  const [unter25, setUnter25] = useState(false)
  const [ergebnis, setErgebnis] = useState<SanktionsErgebnis | null>(null)

  const handleBerechnen = () => {
    const result = berechneSanktion({ regelsatz, art, pflichtverletzungNr, unter25 })
    setErgebnis(result)
    saveRechnerErgebnis('Sanktions-Rechner', 'sanktion', {
      kuerzungProzent: result.kuerzungProzent,
      kuerzungBetrag: result.kuerzungBetrag,
      dauer: result.dauer,
      art,
    })
  }

  const widerspruchGruende = [
    'Keine Anhoerung vor Bescheid (§ 24 SGB X)',
    'Wichtiger Grund lag vor (Krankheit, Kinderbetreuung)',
    'Massnahme war unzumutbar',
    'Frist bereits abgelaufen',
    'Sanktionsbescheid fehlerhaft',
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Breadcrumbs items={[{ label: 'Rechner', href: '/rechner' }, { label: 'Sanktions-Rechner' }]} className="mb-4" />
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-red-100 rounded-lg"><AlertTriangle className="w-8 h-8 text-red-600" /></div>
            <h1 className="text-4xl font-bold text-gray-900">Sanktions-Rechner</h1>
          </div>
          <p className="text-lg text-gray-600 mt-2">Verstehe deine Rechte und berechne moegliche Sanktionen.</p>
        </div>

        {/* Input */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2"><Scale className="w-6 h-6 text-blue-600" />Deine Situation</h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Dein Regelsatz</label>
            <select value={regelsatz} onChange={(e) => setRegelsatz(Number(e.target.value))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value={563}>Regelsatz 1 - 563 EUR (Alleinstehend)</option>
              <option value={506}>Regelsatz 2 - 506 EUR (Paare je Partner)</option>
              <option value={451}>Regelsatz 3 - 451 EUR (Erwachsene unter 25)</option>
              <option value={471}>Regelsatz 4 - 471 EUR (Jugendliche 14-17)</option>
              <option value={390}>Regelsatz 5 - 390 EUR (Kinder 6-13)</option>
              <option value={357}>Regelsatz 6 - 357 EUR (Kinder 0-5)</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Art der Sanktion</label>
            <div className="space-y-3">
              {([['meldeversaeumnis', 'Meldeversaeumnis (Termin nicht wahrgenommen)'], ['pflichtversaeumnis', 'Pflichtverletzung (z.B. Massnahme nicht angetreten)'], ['arbeitsverweigerung', 'Arbeitsverweigerung (Jobangebot abgelehnt)']] as const).map(([val, label]) => (
                <label key={val} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="art" value={val} checked={art === val} onChange={() => setArt(val)} className="w-4 h-4 text-blue-600" />
                  <span className="ml-3 text-gray-900">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Welche Sanktion ist es?</label>
            <div className="flex gap-3">
              {[1, 2, 3].map(n => (
                <label key={n} className={`flex-1 flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${pflichtverletzungNr === n ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input type="radio" name="nr" value={n} checked={pflichtverletzungNr === n} onChange={() => setPflichtverletzungNr(n)} className="sr-only" />
                  <span className="font-medium">{n === 3 ? '3. oder weitere' : `${n}. Sanktion`}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="flex items-center p-4 bg-gray-50 rounded-lg cursor-pointer">
              <input type="checkbox" checked={unter25} onChange={(e) => setUnter25(e.target.checked)} className="w-5 h-5 text-blue-600 rounded" />
              <span className="ml-3 font-medium text-gray-900">Ich bin unter 25 Jahre alt</span>
            </label>
          </div>

          <Button onClick={handleBerechnen} className="w-full py-6 text-lg">Sanktion berechnen</Button>
        </div>

        {/* Result */}
        {ergebnis && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className={`w-16 h-16 rounded-full ${ergebnis.kuerzungProzent >= 10 ? 'bg-yellow-500' : 'bg-gray-200'} ${ergebnis.kuerzungProzent === 10 ? 'shadow-lg ring-4 ring-yellow-200' : 'opacity-30'}`} />
                <div className={`w-16 h-16 rounded-full ${ergebnis.kuerzungProzent >= 20 ? 'bg-orange-500' : 'bg-gray-200'} ${ergebnis.kuerzungProzent === 20 ? 'shadow-lg ring-4 ring-orange-200' : 'opacity-30'}`} />
                <div className={`w-16 h-16 rounded-full ${ergebnis.kuerzungProzent >= 30 ? 'bg-red-500' : 'bg-gray-200'} ${ergebnis.kuerzungProzent === 30 ? 'shadow-lg ring-4 ring-red-200' : 'opacity-30'}`} />
              </div>

              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-red-600 mb-2">-{ergebnis.kuerzungBetrag} EUR</div>
                <div className="text-2xl text-gray-600 mb-4">Kuerzung: {ergebnis.kuerzungProzent}% fuer {ergebnis.dauer}</div>
                <div className="text-xl text-gray-700">Neuer Regelsatz: <span className="font-semibold">{regelsatz - ergebnis.kuerzungBetrag} EUR</span></div>
              </div>

              <div className="p-6 rounded-lg bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300">
                <div className="flex items-start gap-3 mb-4">
                  <Shield className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-green-900 text-lg mb-1">Deine Miete ist geschuetzt!</h3>
                    <p className="text-green-800">KdU duerfen seit 2023 NICHT mehr gekuerzt werden. Deine Miete wird weiterhin voll uebernommen.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-blue-900 text-lg mb-1">Maximum: 30% Kuerzung</h3>
                    <p className="text-blue-800">Seit dem Buergergeld-Gesetz liegt die maximale Kuerzung bei 30% des Regelsatzes.</p>
                  </div>
                </div>
              </div>
            </div>

            {ergebnis.widerspruchTipp && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><Scale className="w-6 h-6 text-blue-600" />Dein Recht auf Widerspruch</h2>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6"><p className="text-gray-800">{ergebnis.widerspruchTipp}</p></div>
                <h3 className="font-semibold text-lg mb-3">Haeufige Gruende fuer erfolgreichen Widerspruch:</h3>
                <ul className="space-y-2 mb-6">
                  {widerspruchGruende.map((g, i) => (
                    <li key={i} className="flex items-start gap-2"><span className="text-green-600 font-bold mt-1">✓</span><span className="text-gray-700">{g}</span></li>
                  ))}
                </ul>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Button
                    onClick={() => {
                      generateRechnerPdf('Sanktions-Berechnung (§§ 31-32 SGB II)', [
                        { label: 'Regelsatz', value: `${regelsatz} EUR` },
                        { label: 'Art der Sanktion', value: art },
                        { label: 'Kuerzung', value: `${ergebnis.kuerzungProzent}%`, highlight: true },
                        { label: 'Kuerzungsbetrag', value: `${ergebnis.kuerzungBetrag} EUR`, highlight: true },
                        { label: 'Dauer', value: ergebnis.dauer },
                        { label: 'Neuer Regelsatz', value: `${regelsatz - ergebnis.kuerzungBetrag} EUR` },
                      ], { label: 'Monatliche Kuerzung', value: `-${ergebnis.kuerzungBetrag} EUR` })
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />Als PDF
                  </Button>
                  <Button
                    onClick={() => shareResult({
                      title: 'Sanktions-Berechnung',
                      text: `Sanktions-Rechner: ${ergebnis.kuerzungProzent}% Kuerzung = -${ergebnis.kuerzungBetrag} EUR / Monat (${ergebnis.dauer})`,
                      url: window.location.href,
                    })}
                    variant="outline"
                    className="w-full"
                  >
                    <Share2 className="w-4 h-4 mr-2" />Teilen
                  </Button>
                  <Link to="/musterschreiben"><Button variant="outline" className="w-full">Widerspruch erstellen</Button></Link>
                  <Link to="/chat"><Button variant="outline" className="w-full">KI-Berater fragen</Button></Link>
                  <Link to="/rechner"><Button variant="outline" className="w-full">Alle Rechner</Button></Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><Info className="w-6 h-6 text-blue-600" />Wichtige Informationen</h2>
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-semibold text-lg mb-2">Seit dem Buergergeld-Gesetz 2023</h3>
              <p>Die maximale Kuerzung betraegt 30% des Regelsatzes. Kosten der Unterkunft werden nicht mehr gekuerzt.</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">BVerfG-Urteil 2019</h3>
              <p>Das Bundesverfassungsgericht hat entschieden, dass Sanktionen ueber 30% verfassungswidrig sind.</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Rechtliche Grundlagen</h3>
              <ul className="space-y-1 text-sm">
                <li>§ 31 SGB II - Pflichtverletzungen</li>
                <li>§ 31a SGB II - Beginn und Dauer der Minderung</li>
                <li>§ 32 SGB II - Meldeversaeumnisse</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
