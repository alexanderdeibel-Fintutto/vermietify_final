import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PiggyBank, Info, CheckCircle, AlertTriangle, Home as HomeIcon, Car, Download, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { berechneSchonvermoegen, SchonvermoegensErgebnis } from '@/lib/rechner-logik'
import { generateRechnerPdf, RechnerSection } from '@/lib/pdf-export'
import { saveRechnerErgebnis } from '@/lib/rechner-verlauf'
import { shareResult } from '@/lib/share'
import Breadcrumbs from '@/components/Breadcrumbs'

export default function SchonvermoegensRechner() {
  const [alter, setAlter] = useState(30)
  const [bgGroesse, setBgGroesse] = useState(1)
  const [vermoegen, setVermoegen] = useState(0)
  const [hatAuto, setHatAuto] = useState(false)
  const [autoWert, setAutoWert] = useState(0)
  const [hatImmobilie, setHatImmobilie] = useState(false)
  const [immobilieQm, setImmobilieQm] = useState(0)
  const [hatAltersvorsorge, setHatAltersvorsorge] = useState(false)
  const [altersvorsorge, setAltersvorsorge] = useState(0)
  const [result, setResult] = useState<SchonvermoegensErgebnis | null>(null)

  const handleCalculate = () => {
    const r = berechneSchonvermoegen({
      alter,
      bgGroesse,
      vermoegen,
      autoWert: hatAuto ? autoWert : undefined,
      immobilieEigentum: hatImmobilie,
      immobilieQm: hatImmobilie ? immobilieQm : undefined,
      altersvorsorgeGeschuetzt: hatAltersvorsorge ? altersvorsorge : undefined,
    })
    setResult(r)
    saveRechnerErgebnis('Schonvermoegens-Rechner', 'schonvermoegen', {
      anspruch: r.anspruch ? 'Ja' : 'Nein',
      freibetragGesamt: r.freibetragGesamt,
      vermoegenAnrechenbar: r.vermoegenAnrechenbar,
      vermoegen,
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Breadcrumbs items={[{ label: 'Rechner', href: '/rechner' }, { label: 'Schonvermoegens-Rechner' }]} className="mb-4 [&_a]:text-white/90 [&_a:hover]:text-white [&_span]:text-white [&_svg]:text-white/70" />
          <div className="flex items-start gap-4">
            <div className="bg-white/20 p-3 rounded-lg"><PiggyBank className="w-8 h-8" /></div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Schonvermoegens-Rechner</h1>
              <p className="text-green-100 text-lg">Pruefe, ob dein Vermoegen geschuetzt ist</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Keine Angst!</p>
              <p>Du musst nicht alles verkaufen. Es gibt Freibetraege und Schutzregeln.</p>
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Deine Angaben</h2>
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dein Alter</label>
                <input type="number" value={alter} onChange={(e) => setAlter(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg" min="18" max="100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">BG-Groesse</label>
                <select value={bgGroesse} onChange={(e) => setBgGroesse(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Person{n > 1 ? 'en' : ''}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Barvermögen / Kontoguthaben (EUR)</label>
              <p className="text-sm text-gray-500 mb-2">Guthaben auf allen Konten, Sparbuch, Bargeld</p>
              <input type="number" value={vermoegen || ''} onChange={(e) => setVermoegen(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg" min="0" step="100" />
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2"><Car className="w-4 h-4" />Auto vorhanden?</label>
                <button onClick={() => setHatAuto(!hatAuto)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hatAuto ? 'bg-green-600' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hatAuto ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {hatAuto && (
                <div><label className="block text-sm font-medium text-gray-700 mb-2">KFZ-Wert (EUR)</label>
                <input type="number" value={autoWert || ''} onChange={(e) => setAutoWert(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg" min="0" step="500" /></div>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2"><HomeIcon className="w-4 h-4" />Selbstgenutzte Immobilie?</label>
                <button onClick={() => setHatImmobilie(!hatImmobilie)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hatImmobilie ? 'bg-green-600' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hatImmobilie ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {hatImmobilie && (
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Wohnflaeche (qm)</label>
                <input type="number" value={immobilieQm || ''} onChange={(e) => setImmobilieQm(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg" min="0" /></div>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">Altersvorsorge (Riester/Ruerup)?</label>
                <button onClick={() => setHatAltersvorsorge(!hatAltersvorsorge)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hatAltersvorsorge ? 'bg-green-600' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hatAltersvorsorge ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {hatAltersvorsorge && (
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Rueckkaufswert (EUR)</label>
                <input type="number" value={altersvorsorge || ''} onChange={(e) => setAltersvorsorge(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg" min="0" step="1000" /></div>
              )}
            </div>
          </div>
          <Button onClick={handleCalculate} className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white py-3"><PiggyBank className="w-5 h-5 mr-2" />Vermoegensschutz berechnen</Button>
        </div>

        {/* Result */}
        {result && (
          <div className="space-y-6">
            <div className={`rounded-lg shadow-sm border-2 p-6 ${result.anspruch ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
              <div className="flex items-start gap-4">
                {result.anspruch ? <CheckCircle className="w-12 h-12 text-green-600 flex-shrink-0" /> : <AlertTriangle className="w-12 h-12 text-red-600 flex-shrink-0" />}
                <div>
                  <h3 className={`text-2xl font-bold mb-2 ${result.anspruch ? 'text-green-900' : 'text-red-900'}`}>
                    {result.anspruch ? 'Dein Vermoegen ist geschuetzt!' : 'Vermoegen ueber dem Freibetrag'}
                  </h3>
                  <p className={result.anspruch ? 'text-green-800' : 'text-red-800'}>
                    {result.anspruch
                      ? 'Du hast Anspruch auf Buergergeld. Dein Vermoegen liegt innerhalb der Schutzgrenzen.'
                      : `Dein Vermoegen liegt ${result.vermoegenAnrechenbar.toLocaleString('de-DE')} EUR ueber dem Freibetrag.`}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold mb-4">Aufschluesselung</h3>
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Grundfreibetrag genutzt</span>
                  <span className="font-bold">{Math.min(vermoegen, result.freibetragGesamt).toLocaleString('de-DE')} / {result.freibetragGesamt.toLocaleString('de-DE')} EUR</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div className={`h-full transition-all ${vermoegen > result.freibetragGesamt ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(100, (vermoegen / result.freibetragGesamt) * 100)}%` }} />
                </div>
              </div>

              <div className="space-y-3 border-t pt-4">
                {result.details.map((d, i) => (
                  <div key={i}>
                    <div className="flex justify-between"><span className="text-gray-700">{d.label}</span><span className="font-semibold">{d.betrag.toLocaleString('de-DE')} EUR</span></div>
                    <p className="text-sm text-gray-500">{d.erklaerung}</p>
                  </div>
                ))}

                {hatAuto && (
                  <div className={`p-3 rounded-lg ${autoWert <= result.autoFreibetrag ? 'bg-green-50' : 'bg-orange-50'}`}>
                    <div className="flex items-center gap-2">
                      <Car className={`w-4 h-4 ${autoWert <= result.autoFreibetrag ? 'text-green-600' : 'text-orange-600'}`} />
                      <span className="text-sm font-medium">Auto ({autoWert.toLocaleString('de-DE')} EUR): {autoWert <= result.autoFreibetrag ? 'Geschuetzt' : 'Ueber Freibetrag'}</span>
                    </div>
                  </div>
                )}

                {hatImmobilie && result.immobilieHinweis && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <HomeIcon className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-900">Immobilie ({immobilieQm} qm)</p>
                        <p className="text-blue-800">{result.immobilieHinweis}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Karenzzeit-Regelung</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Erste 12 Monate: erhoehter Vermoegens-Schutz</li>
                <li>• KFZ bis 15.000 EUR geschuetzt</li>
                <li>• Danach: 15.000 EUR pro Person weiterhin geschuetzt</li>
              </ul>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                onClick={() => {
                  const sections: RechnerSection[] = [
                    ...result.details.map(d => ({ label: d.label, value: `${d.betrag.toLocaleString('de-DE')} EUR` })),
                    { label: 'Barvermögen', value: `${vermoegen.toLocaleString('de-DE')} EUR` },
                    { label: 'Ergebnis', value: result.anspruch ? 'Geschuetzt' : 'Ueber Freibetrag', highlight: true },
                  ]
                  generateRechnerPdf('Schonvermoegens-Pruefung (§ 12 SGB II)', sections,
                    { label: 'Freibetrag gesamt', value: `${result.freibetragGesamt.toLocaleString('de-DE')} EUR` },
                  )
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />Als PDF
              </Button>
              <Button
                onClick={() => shareResult({
                  title: 'Schonvermoegens-Pruefung',
                  text: `Schonvermoegens-Pruefung: Freibetrag ${result.freibetragGesamt.toLocaleString('de-DE')} EUR - ${result.anspruch ? 'Vermoegen geschuetzt' : 'Ueber Freibetrag'}`,
                  url: window.location.href,
                })}
                variant="outline"
                className="w-full"
              >
                <Share2 className="w-4 h-4 mr-2" />Teilen
              </Button>
              <Link to="/rechner/buergergeld"><Button variant="outline" className="w-full">Buergergeld berechnen</Button></Link>
              <Link to="/chat"><Button variant="outline" className="w-full">KI-Berater fragen</Button></Link>
              <Link to="/rechner"><Button variant="outline" className="w-full">Alle Rechner</Button></Link>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
          <h3 className="text-xl font-bold mb-4">Wichtige Informationen</h3>
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Was zaehlt als Vermoegen?</h4>
              <ul className="text-sm text-gray-700 space-y-1 ml-4">
                <li>• Bargeld, Kontoguthaben, Sparbuecher</li>
                <li>• Wertpapiere, Aktien, Fonds</li>
                <li>• Lebensversicherungen (Rueckkaufswert)</li>
                <li>• Kraftfahrzeuge</li>
                <li>• Immobilien und Grundstuecke</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Was ist geschuetzt?</h4>
              <ul className="text-sm text-gray-700 space-y-1 ml-4">
                <li>• Angemessener Hausrat</li>
                <li>• Selbstgenutzte Immobilie (angemessene Groesse)</li>
                <li>• Riester/Ruerup-Rente</li>
                <li>• Ein angemessenes KFZ (Karenzzeit: bis 15.000 EUR)</li>
              </ul>
            </div>
            <div className="pt-4 border-t"><p className="text-sm text-gray-600">Rechtsgrundlage: § 12 SGB II</p></div>
          </div>
        </div>
      </div>
    </div>
  )
}
