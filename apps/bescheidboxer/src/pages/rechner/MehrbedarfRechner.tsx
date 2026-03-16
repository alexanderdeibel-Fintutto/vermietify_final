import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Info, Download, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { berechneMehrbedarf, MehrbedarfErgebnis, REGELSAETZE_2025 } from '@/lib/rechner-logik'
import { generateRechnerPdf, RechnerSection } from '@/lib/pdf-export'
import { saveRechnerErgebnis } from '@/lib/rechner-verlauf'
import { shareResult } from '@/lib/share'
import Breadcrumbs from '@/components/Breadcrumbs'

export default function MehrbedarfRechner() {
  const [regelsatz, setRegelsatz] = useState<number>(REGELSAETZE_2025.RS1)
  const [schwanger, setSchwanger] = useState(false)
  const [alleinerziehend, setAlleinerziehend] = useState(false)
  const [anzahlKinder, setAnzahlKinder] = useState(1)
  const [kinderAlter, setKinderAlter] = useState<number[]>([0])
  const [behindert, setBehindert] = useState(false)
  const [kostenaufwaendigeErnaehrung, setKostenaufwaendigeErnaehrung] = useState(false)
  const [ernaehrungstyp, setErnaehrungstyp] = useState('')
  const [dezentraleWarmwasser, setDezentraleWarmwasser] = useState(false)
  const [result, setResult] = useState<MehrbedarfErgebnis | null>(null)
  const [calculated, setCalculated] = useState(false)

  const handleBerechnen = () => {
    const ergebnis = berechneMehrbedarf({
      regelsatz,
      schwanger,
      alleinerziehend,
      kinderAnzahl: alleinerziehend ? anzahlKinder : 0,
      kinderAlter: alleinerziehend ? kinderAlter : [],
      behindert,
      erwerbsgemindert: behindert,
      kostenaufwaendigeErnaehrung,
      ernaehrungArt: kostenaufwaendigeErnaehrung ? ernaehrungstyp : undefined,
      dezentraleWarmwasser,
    })
    setResult(ergebnis)
    setCalculated(true)
    if (ergebnis.gesamt > 0) {
      saveRechnerErgebnis('Mehrbedarf-Rechner', 'mehrbedarf', {
        gesamt: ergebnis.gesamt,
        regelsatz,
        positionen: ergebnis.details.length,
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Breadcrumbs items={[{ label: 'Rechner', href: '/rechner' }, { label: 'Mehrbedarf-Rechner' }]} className="mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Mehrbedarf-Rechner</h1>
          <p className="text-gray-600 mt-2">Berechne deinen Anspruch auf Mehrbedarf nach § 21 SGB II</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Deine Angaben</h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Dein Regelsatz</label>
            <select
              value={regelsatz}
              onChange={(e) => setRegelsatz(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value={563}>RS1: 563 EUR - Alleinstehend</option>
              <option value={506}>RS2: 506 EUR - Paar (je Person)</option>
              <option value={451}>RS3: 451 EUR - Erwachsene in BG</option>
              <option value={471}>RS4: 471 EUR - Jugendliche 14-17</option>
              <option value={390}>RS5: 390 EUR - Kinder 6-13</option>
              <option value={357}>RS6: 357 EUR - Kinder 0-5</option>
            </select>
          </div>

          <div className="space-y-4">
            <div className="flex items-start">
              <input type="checkbox" id="schwanger" checked={schwanger} onChange={(e) => setSchwanger(e.target.checked)} className="mt-1 mr-3 w-4 h-4 text-blue-600" />
              <label htmlFor="schwanger" className="text-sm cursor-pointer">
                <span className="font-medium text-gray-900">Schwangerschaft</span>
                <p className="text-gray-600">Ab der 13. Schwangerschaftswoche</p>
              </label>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-start">
                <input type="checkbox" id="alleinerziehend" checked={alleinerziehend} onChange={(e) => setAlleinerziehend(e.target.checked)} className="mt-1 mr-3 w-4 h-4 text-blue-600" />
                <label htmlFor="alleinerziehend" className="text-sm flex-1 cursor-pointer">
                  <span className="font-medium text-gray-900">Alleinerziehend</span>
                  <p className="text-gray-600">Du erziehst ein oder mehrere Kinder allein</p>
                </label>
              </div>
              {alleinerziehend && (
                <div className="ml-6 mt-4 space-y-3 bg-gray-50 p-4 rounded-md border border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Anzahl Kinder</label>
                    <select value={anzahlKinder} onChange={(e) => { const c = parseInt(e.target.value); setAnzahlKinder(c); setKinderAlter(Array(c).fill(0)) }} className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500">
                      {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Alter der Kinder (0-17)</label>
                    <div className="space-y-2">
                      {Array.from({ length: anzahlKinder }).map((_, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 w-16">Kind {i + 1}:</span>
                          <input type="number" min="0" max="17" value={kinderAlter[i] || 0} onChange={(e) => { const a = [...kinderAlter]; a[i] = parseInt(e.target.value) || 0; setKinderAlter(a) }} className="border border-gray-300 rounded-md px-3 py-2 w-24" />
                          <span className="text-sm text-gray-600">Jahre</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="flex items-start">
                <input type="checkbox" id="behindert" checked={behindert} onChange={(e) => setBehindert(e.target.checked)} className="mt-1 mr-3 w-4 h-4 text-blue-600" />
                <label htmlFor="behindert" className="text-sm cursor-pointer">
                  <span className="font-medium text-gray-900">Behinderung / Erwerbsminderung</span>
                  <p className="text-gray-600">GdB ab 50 oder Erwerbsminderungsrente</p>
                </label>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-start">
                <input type="checkbox" id="ernaehrung" checked={kostenaufwaendigeErnaehrung} onChange={(e) => setKostenaufwaendigeErnaehrung(e.target.checked)} className="mt-1 mr-3 w-4 h-4 text-blue-600" />
                <label htmlFor="ernaehrung" className="text-sm flex-1 cursor-pointer">
                  <span className="font-medium text-gray-900">Kostenaufwaendige Ernaehrung</span>
                  <p className="text-gray-600">Krankheitsbedingt notwendige besondere Ernaehrung</p>
                </label>
              </div>
              {kostenaufwaendigeErnaehrung && (
                <div className="ml-6 mt-3">
                  <select value={ernaehrungstyp} onChange={(e) => setErnaehrungstyp(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2">
                    <option value="">Bitte waehlen...</option>
                    <option value="niereninsuffizienz">Niereninsuffizienz</option>
                    <option value="zoeliakie">Zoeliakie</option>
                    <option value="colitis">Colitis ulcerosa / Morbus Crohn</option>
                    <option value="diabetes">Diabetes mellitus</option>
                    <option value="sonstiges">Sonstiges</option>
                  </select>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="flex items-start">
                <input type="checkbox" id="warmwasser" checked={dezentraleWarmwasser} onChange={(e) => setDezentraleWarmwasser(e.target.checked)} className="mt-1 mr-3 w-4 h-4 text-blue-600" />
                <label htmlFor="warmwasser" className="text-sm cursor-pointer">
                  <span className="font-medium text-gray-900">Dezentrale Warmwassererzeugung</span>
                  <p className="text-gray-600">Boiler/Durchlauferhitzer in der Wohnung</p>
                </label>
              </div>
            </div>
          </div>

          <Button onClick={handleBerechnen} className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3">Berechnen</Button>
        </div>

        {calculated && result && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Dein Ergebnis</h2>
            {result.gesamt > 0 ? (
              <>
                <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6">
                  <p className="text-sm text-blue-800 mb-1">Gesamter Mehrbedarf</p>
                  <p className="text-3xl font-bold text-blue-900">{result.gesamt.toFixed(2)} EUR</p>
                  <p className="text-sm text-blue-700 mt-1">pro Monat zusaetzlich zu deinem Regelsatz</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Art</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Betrag</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Rechtsgrundlage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.details.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <p className="font-medium text-gray-900">{item.label}</p>
                            <p className="text-sm text-gray-600 mt-1">{item.erklaerung}</p>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-900">{item.betrag.toFixed(2)} EUR</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{item.paragraph}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {ernaehrungstyp === 'diabetes' && (
                  <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                      <Info className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium">Hinweis zu Diabetes</p>
                        <p className="mt-1">Seit 2014 wird fuer Diabetes in der Regel kein Mehrbedarf mehr gewaehrt (BSG-Rechtsprechung).</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => {
                      const sections: RechnerSection[] = result.details.map(d => ({
                        label: `${d.label} (${d.paragraph})`,
                        value: `${d.betrag.toFixed(2)} EUR`,
                      }))
                      generateRechnerPdf('Mehrbedarf-Berechnung (§ 21 SGB II)', sections, { label: 'Gesamter Mehrbedarf', value: `${result.gesamt.toFixed(2)} EUR` })
                    }}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />Als PDF
                  </Button>
                  <Button
                    onClick={() => shareResult({
                      title: 'Mehrbedarf-Berechnung',
                      text: `Mein Mehrbedarf nach § 21 SGB II: ${result.gesamt.toFixed(2)} EUR / Monat`,
                      url: window.location.href,
                    })}
                    variant="outline"
                    className="flex-1"
                  >
                    <Share2 className="w-4 h-4 mr-2" />Teilen
                  </Button>
                  <Link to="/scan" className="flex-1"><Button variant="outline" className="w-full"><Heart className="w-4 h-4 mr-2" />Bescheid pruefen</Button></Link>
                  <Link to="/rechner" className="flex-1"><Button variant="outline" className="w-full">Alle Rechner</Button></Link>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg text-gray-600 mb-2">Kein Mehrbedarf ermittelt</p>
                <p className="text-sm text-gray-500">Basierend auf deinen Angaben besteht kein Anspruch auf Mehrbedarf.</p>
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center"><Info className="w-5 h-5 mr-2 text-blue-600" />Informationen zum Mehrbedarf</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Was ist Mehrbedarf?</h3>
              <p className="text-gray-700 text-sm leading-relaxed">Mehrbedarf ist ein Zuschlag zum Regelsatz in besonderen Lebenslagen (§ 21 SGB II). Er deckt erhoehte Kosten durch Schwangerschaft, Alleinerziehung, Behinderung, besondere Ernaehrung oder dezentrale Warmwassererzeugung ab.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Wie beantrage ich Mehrbedarf?</h3>
              <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                <li>Formlosen Antrag beim Jobcenter stellen</li>
                <li>Nachweise vorlegen (Attest, Geburtsurkunden, Schwerbehindertenausweis)</li>
                <li>Jobcenter prueft und erlaesst Bescheid</li>
                <li>Mehrbedarf wird rueckwirkend ab Antragstellung gezahlt</li>
                <li>Bescheid sorgfaeltig pruefen - nutze unseren Bescheid-Scanner</li>
              </ol>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-900"><strong>Wichtig:</strong> Mehrbedarf wird nicht automatisch gewaehrt. Du musst ihn aktiv beantragen.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
