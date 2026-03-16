import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Home, AlertTriangle, CheckCircle, Info, MapPin, Download, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { berechneKdu, KduRechnerErgebnis } from '@/lib/rechner-logik'
import { KDU_TABELLEN } from '@/lib/kdu-tabellen'
import { generateRechnerPdf } from '@/lib/pdf-export'
import { saveRechnerErgebnis } from '@/lib/rechner-verlauf'
import { shareResult } from '@/lib/share'
import Breadcrumbs from '@/components/Breadcrumbs'

export default function KduRechner() {
  const [plz, setPlz] = useState('')
  const [bgGroesse, setBgGroesse] = useState(1)
  const [kaltmiete, setKaltmiete] = useState(0)
  const [nebenkosten, setNebenkosten] = useState(0)
  const [heizkosten, setHeizkosten] = useState(0)
  const [wohnflaeche, setWohnflaeche] = useState(0)
  const [ergebnis, setErgebnis] = useState<KduRechnerErgebnis | null>(null)
  const [fehler, setFehler] = useState('')

  const staedte = KDU_TABELLEN.map(k => k.stadt)

  const handleStadtSelect = (stadt: string) => {
    const kdu = KDU_TABELLEN.find(k => k.stadt === stadt)
    if (kdu && kdu.plzRange.length > 0) {
      setPlz(kdu.plzRange[0])
    }
  }

  const handleBerechnen = () => {
    setFehler('')
    if (!plz) {
      setFehler('Bitte gib eine PLZ ein oder waehle eine Stadt.')
      return
    }
    const result = berechneKdu({ plz, bgGroesse, kaltmiete, nebenkosten, heizkosten, qm: wohnflaeche })
    if (!result) {
      setFehler('PLZ nicht in unserer Datenbank. Frag unseren KI-Berater!')
      setErgebnis(null)
    } else {
      setErgebnis(result)
      saveRechnerErgebnis('KdU-Rechner', 'kdu', {
        kaltmieteAngemessen: result.kaltmieteAngemessen ? 'Ja' : 'Nein',
        heizkostenAngemessen: result.heizkostenAngemessen ? 'Ja' : 'Nein',
        kaltmieteGrenze: result.kaltmieteGrenze,
        plz,
      })
    }
  }

  const getAmpel = () => {
    if (!ergebnis) return null
    const problems = [!ergebnis.kaltmieteAngemessen, !ergebnis.heizkostenAngemessen, !ergebnis.qmAngemessen].filter(Boolean).length
    if (problems === 0) return { color: 'green', icon: CheckCircle, text: 'Alles im gruenen Bereich!', desc: 'Deine Wohnkosten liegen innerhalb der Angemessenheitsgrenzen.' }
    if (problems >= 2) return { color: 'red', icon: AlertTriangle, text: 'Warnung: Kosten deutlich ueber Angemessenheit', desc: 'Mehrere deiner Wohnkosten uebersteigen die Grenzen.' }
    return { color: 'yellow', icon: Info, text: 'Achtung: Teilweise ueber den Grenzen', desc: 'Einige deiner Wohnkosten uebersteigen die Angemessenheitsgrenzen.' }
  }

  const renderBar = (titel: string, ist: number, grenze: number, einheit: string, ok: boolean) => {
    const pct = grenze > 0 ? Math.min((ist / grenze) * 100, 150) : 0
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-lg mb-4">{titel}</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center"><span className="text-gray-600">Dein Wert:</span><span className="font-semibold text-lg">{ist} {einheit}</span></div>
          <div className="flex justify-between items-center"><span className="text-gray-600">Grenzwert:</span><span className="font-semibold text-lg">{grenze} {einheit}</span></div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div className={`h-full transition-all ${ok ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
          <div className="flex items-center gap-2">
            {ok ? <><CheckCircle className="w-5 h-5 text-green-600" /><span className="text-green-600 font-medium">Angemessen</span></>
              : <><AlertTriangle className="w-5 h-5 text-red-600" /><span className="text-red-600 font-medium">Ueber Grenzwert</span></>}
          </div>
        </div>
      </div>
    )
  }

  const ampel = getAmpel()

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Breadcrumbs items={[{ label: 'Rechner', href: '/rechner' }, { label: 'KdU-Rechner' }]} className="mb-4" />
          <div className="flex items-center gap-3 mb-2"><Home className="w-8 h-8 text-blue-600" /><h1 className="text-4xl font-bold text-gray-900">KdU-Rechner</h1></div>
          <p className="text-gray-600 text-lg">Pruefe, ob deine Wohnkosten als angemessen gelten</p>
        </div>

        {/* Input */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Deine Angaben</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2"><MapPin className="w-4 h-4 inline mr-1" />Postleitzahl</label>
              <input type="text" value={plz} onChange={(e) => setPlz(e.target.value)} placeholder="z.B. 10115" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">oder Stadt</label>
              <select onChange={(e) => handleStadtSelect(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="">Stadt waehlen...</option>
                {staedte.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bedarfsgemeinschaft</label>
              <select value={bgGroesse} onChange={(e) => setBgGroesse(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Person' : 'Personen'}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kaltmiete (EUR)</label>
              <input type="number" value={kaltmiete || ''} onChange={(e) => setKaltmiete(Number(e.target.value))} placeholder="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nebenkosten (EUR)</label>
              <input type="number" value={nebenkosten || ''} onChange={(e) => setNebenkosten(Number(e.target.value))} placeholder="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Heizkosten (EUR)</label>
              <input type="number" value={heizkosten || ''} onChange={(e) => setHeizkosten(Number(e.target.value))} placeholder="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Wohnflaeche (qm)</label>
              <input type="number" value={wohnflaeche || ''} onChange={(e) => setWohnflaeche(Number(e.target.value))} placeholder="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
          <Button onClick={handleBerechnen} className="mt-6 w-full gradient-boxer text-white font-semibold py-3 rounded-lg">Berechnen</Button>
        </div>

        {fehler && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">{fehler}</p>
              <Link to="/chat" className="text-red-600 hover:text-red-700 underline text-sm mt-1 inline-block">Zum KI-Berater</Link>
            </div>
          </div>
        )}

        {ergebnis && ampel && (
          <div className="space-y-6">
            <div className={`rounded-xl shadow-lg p-8 ${ampel.color === 'green' ? 'bg-green-50 border-2 border-green-500' : ampel.color === 'yellow' ? 'bg-yellow-50 border-2 border-yellow-500' : 'bg-red-50 border-2 border-red-500'}`}>
              <div className="flex items-center gap-4 mb-3">
                <ampel.icon className={`w-12 h-12 ${ampel.color === 'green' ? 'text-green-600' : ampel.color === 'yellow' ? 'text-yellow-600' : 'text-red-600'}`} />
                <h2 className="text-2xl font-bold text-gray-900">{ampel.text}</h2>
              </div>
              <p className="text-gray-700 text-lg">{ampel.desc}</p>
              {ergebnis.stadt && <p className="text-sm text-gray-500 mt-2">Stadt: {ergebnis.stadt}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {renderBar('Kaltmiete', kaltmiete, ergebnis.kaltmieteGrenze, 'EUR', ergebnis.kaltmieteAngemessen)}
              {renderBar('Wohnflaeche', wohnflaeche, ergebnis.qmGrenze, 'qm', ergebnis.qmAngemessen)}
              {renderBar('Heizkosten', heizkosten, ergebnis.heizkostenGrenze, 'EUR', ergebnis.heizkostenAngemessen)}
            </div>

            {!ergebnis.schluessigesKonzept && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <Info className="w-6 h-6 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">Kein schluessiges Konzept</h3>
                    <p className="text-blue-800">In dieser Stadt gibt es kein schluessiges Konzept. Du hast bessere Chancen, auch hoehere Kosten erstattet zu bekommen!</p>
                  </div>
                </div>
              </div>
            )}

            {ergebnis.hinweise.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-3">Hinweise</h3>
                <ul className="space-y-2">
                  {ergebnis.hinweise.map((h, i) => <li key={i} className="flex items-start gap-2"><Info className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" /><span className="text-gray-700">{h}</span></li>)}
                </ul>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => {
                  generateRechnerPdf('KdU-Pruefung (§ 22 SGB II)', [
                    { label: 'PLZ / Stadt', value: ergebnis.stadt || plz },
                    { label: 'BG-Groesse', value: `${bgGroesse} Person${bgGroesse > 1 ? 'en' : ''}` },
                    { label: 'Kaltmiete', value: `${kaltmiete} EUR`, highlight: !ergebnis.kaltmieteAngemessen },
                    { label: 'Kaltmiete-Grenze', value: `${ergebnis.kaltmieteGrenze} EUR` },
                    { label: 'Heizkosten', value: `${heizkosten} EUR`, highlight: !ergebnis.heizkostenAngemessen },
                    { label: 'Heizkosten-Grenze', value: `${ergebnis.heizkostenGrenze} EUR` },
                    { label: 'Wohnflaeche', value: `${wohnflaeche} qm`, highlight: !ergebnis.qmAngemessen },
                    { label: 'Wohnflaeche-Grenze', value: `${ergebnis.qmGrenze} qm` },
                  ])
                }}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />Als PDF
              </Button>
              <Button
                onClick={() => shareResult({
                  title: 'KdU-Pruefung',
                  text: `KdU-Pruefung: Gesamt-KdU ${ergebnis.gesamtKdu} EUR, Angemessene KdU ${ergebnis.angemesseneKdu} EUR (${ergebnis.stadt})`,
                  url: window.location.href,
                })}
                variant="outline"
                className="flex-1"
              >
                <Share2 className="w-4 h-4 mr-2" />Teilen
              </Button>
              <Link to="/chat" className="flex-1"><Button className="w-full gradient-boxer text-white font-semibold py-3 rounded-lg">Widerspruch pruefen</Button></Link>
              <Link to="/rechner" className="flex-1"><Button variant="outline" className="w-full py-3">Alle Rechner</Button></Link>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-12 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-xl mb-3">Was ist KdU?</h3>
            <p className="text-gray-700 leading-relaxed">KdU steht fuer "Kosten der Unterkunft und Heizung". Bei Buergergeld uebernimmt das Jobcenter deine Wohnkosten - aber nur, wenn diese als angemessen gelten (§ 22 SGB II).</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-xl mb-3">Was passiert wenn meine Miete zu hoch ist?</h3>
            <p className="text-gray-700 leading-relaxed">Das Jobcenter fordert dich auf, die Kosten zu senken. Du hast 6 Monate Zeit - waehrenddessen werden die vollen Kosten noch uebernommen. Unser KI-Berater kann dich beraten.</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600"><Info className="w-4 h-4 inline mr-2" />Rechtsgrundlage: § 22 SGB II</div>
        </div>
      </div>
    </div>
  )
}
