import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Calculator, Plus, Trash2, ArrowLeft, ArrowRight, Info, AlertTriangle, CheckCircle, Download, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { berechneBuergergeld, BgMitglied, BuergergeldErgebnis } from '@/lib/rechner-logik'
import { generateRechnerPdf, RechnerSection } from '@/lib/pdf-export'
import { saveRechnerErgebnis } from '@/lib/rechner-verlauf'
import { shareResult } from '@/lib/share'
import Breadcrumbs from '@/components/Breadcrumbs'

// Local wrapper with id for UI management
interface UiMitglied extends BgMitglied {
  _id: string
}

export default function BuergergeldRechner() {
  const [step, setStep] = useState(1)
  const [mitglieder, setMitglieder] = useState<UiMitglied[]>([
    {
      _id: '1',
      typ: 'antragsteller',
      alter: 35,
      schwanger: false,
      alleinerziehend: false,
      behindert: false,
      kostenaufwaendigeErnaehrung: false,
    },
  ])

  // Wohnen (Step 2)
  const [kaltmiete, setKaltmiete] = useState<number>(0)
  const [nebenkosten, setNebenkosten] = useState<number>(0)
  const [heizkosten, setHeizkosten] = useState<number>(0)
  const [plz, setPlz] = useState<string>('')

  // Ergebnis
  const [ergebnis, setErgebnis] = useState<BuergergeldErgebnis | null>(null)

  const hasPartner = () => mitglieder.some((m) => m.typ === 'partner')
  const getKinder = () => mitglieder.filter((m) => m.typ === 'kind')

  const addPartner = () => {
    if (hasPartner()) return
    setMitglieder([
      ...mitglieder,
      {
        _id: Date.now().toString(),
        typ: 'partner',
        alter: 35,
        schwanger: false,
        alleinerziehend: false,
        behindert: false,
        kostenaufwaendigeErnaehrung: false,
      },
    ])
  }

  const addKind = () => {
    setMitglieder([
      ...mitglieder,
      {
        _id: Date.now().toString(),
        typ: 'kind',
        alter: 10,
        kindergeld: 250,
        unterhalt: 0,
      },
    ])
  }

  const removeMitglied = (id: string) => {
    setMitglieder(mitglieder.filter((m) => m._id !== id))
  }

  const updateMitglied = (id: string, updates: Partial<UiMitglied>) => {
    setMitglieder(
      mitglieder.map((m) => (m._id === id ? { ...m, ...updates } : m))
    )
  }

  const canGoNext = () => {
    if (step === 1) return mitglieder.length > 0
    if (step === 2) return kaltmiete >= 0 && nebenkosten >= 0 && heizkosten >= 0
    if (step === 3) return true
    return false
  }

  const goNext = () => {
    if (!canGoNext()) return
    if (step === 3) {
      // Strip _id before passing to calculation
      const bgMitglieder: BgMitglied[] = mitglieder.map(({ _id, ...rest }) => rest)
      const result = berechneBuergergeld({
        mitglieder: bgMitglieder,
        kaltmiete,
        nebenkosten,
        heizkosten,
        plz: plz || undefined,
      })
      setErgebnis(result)
      if (result) {
        saveRechnerErgebnis('Buergergeld-Rechner', 'buergergeld', {
          anspruch: result.anspruch,
          regelbedarf: result.regelbedarfGesamt,
          kdu: result.kduGesamt,
          mehrbedarf: result.mehrbedarfGesamt,
          mitgliederAnzahl: mitglieder.length,
        })
      }
    }
    setStep(step + 1)
  }

  const goBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const reset = () => {
    setStep(1)
    setMitglieder([
      {
        _id: '1',
        typ: 'antragsteller',
        alter: 35,
        schwanger: false,
        alleinerziehend: false,
        behindert: false,
        kostenaufwaendigeErnaehrung: false,
      },
    ])
    setKaltmiete(0)
    setNebenkosten(0)
    setHeizkosten(0)
    setPlz('')
    setErgebnis(null)
  }

  const formatEuro = (amount: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <Breadcrumbs items={[{ label: 'Rechner', href: '/rechner' }, { label: 'Buergergeld-Rechner' }]} className="mb-4" />
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl"><Calculator className="w-8 h-8 text-blue-600" /></div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Buergergeld-Rechner</h1>
              <p className="text-gray-600">Berechne deinen monatlichen Anspruch nach SGB II</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {step < 5 && (
          <div className="mb-8">
            <div className="flex items-center justify-center gap-3">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${s === step ? 'bg-blue-600 text-white scale-110' : s < step ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {s < step ? <CheckCircle className="w-5 h-5" /> : s}
                  </div>
                  {s < 4 && <div className={`w-16 h-1 ${s < step ? 'bg-green-500' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-16 mt-3">
              {['Bedarfsgemeinschaft', 'Wohnen', 'Einkommen', 'Ergebnis'].map((label, i) => (
                <span key={label} className={`text-sm font-medium ${step === i + 1 ? 'text-blue-600' : 'text-gray-500'}`}>{label}</span>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Bedarfsgemeinschaft */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Wer gehoert zu deiner Bedarfsgemeinschaft?</h2>
              </div>
              <p className="text-gray-600 mb-6">Zur Bedarfsgemeinschaft gehoerst du, dein Partner und unverheiratete Kinder unter 25 Jahren im Haushalt.</p>

              <div className="space-y-4">
                {/* Antragsteller */}
                {mitglieder.filter((m) => m.typ === 'antragsteller').map((m) => (
                  <div key={m._id} className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-600 rounded-lg"><Calculator className="w-5 h-5 text-white" /></div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Du (Antragsteller/in)</h3>
                          <p className="text-sm text-gray-600">Hauptleistungsberechtigte/r</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Alter (Jahre)</label>
                        <input type="number" min="18" max="100" value={m.alter || 35} onChange={(e) => updateMitglied(m._id, { alter: parseInt(e.target.value) || 18 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      {[
                        { key: 'schwanger' as const, label: 'Schwanger (ab 13. Woche)' },
                        { key: 'alleinerziehend' as const, label: 'Alleinerziehend' },
                        { key: 'behindert' as const, label: 'Erwerbsminderung / Behinderung (GdB >= 50)' },
                        { key: 'kostenaufwaendigeErnaehrung' as const, label: 'Kostenaufwaendige Ernaehrung (aerztlich bescheinigt)' },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={!!m[key]} onChange={(e) => updateMitglied(m._id, { [key]: e.target.checked })} className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                          <span className="text-sm text-gray-700">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Partner */}
                {mitglieder.filter((m) => m.typ === 'partner').map((m) => (
                  <div key={m._id} className="bg-white border-2 border-gray-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">Partner/in</h3>
                        <p className="text-sm text-gray-600">Ehepartner oder Lebenspartner</p>
                      </div>
                      <button onClick={() => removeMitglied(m._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-5 h-5" /></button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Alter (Jahre)</label>
                        <input type="number" min="18" max="100" value={m.alter || 35} onChange={(e) => updateMitglied(m._id, { alter: parseInt(e.target.value) || 18 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      {[
                        { key: 'schwanger' as const, label: 'Schwanger (ab 13. Woche)' },
                        { key: 'behindert' as const, label: 'Erwerbsminderung / Behinderung (GdB >= 50)' },
                        { key: 'kostenaufwaendigeErnaehrung' as const, label: 'Kostenaufwaendige Ernaehrung' },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={!!m[key]} onChange={(e) => updateMitglied(m._id, { [key]: e.target.checked })} className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                          <span className="text-sm text-gray-700">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Kinder */}
                {getKinder().map((m) => (
                  <div key={m._id} className="bg-white border-2 border-gray-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">Kind</h3>
                        <p className="text-sm text-gray-600">Unverheiratet, unter 25 Jahre</p>
                      </div>
                      <button onClick={() => removeMitglied(m._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-5 h-5" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Alter (Jahre)</label>
                        <select value={m.alter || 0} onChange={(e) => updateMitglied(m._id, { alter: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                          {Array.from({ length: 25 }, (_, i) => i).map((age) => (
                            <option key={age} value={age}>{age} {age === 1 ? 'Jahr' : 'Jahre'}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex gap-3">
                  {!hasPartner() && (
                    <button onClick={addPartner} className="flex items-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border-2 border-blue-200 font-medium">
                      <Plus className="w-5 h-5" />Partner/in hinzufuegen
                    </button>
                  )}
                  <button onClick={addKind} className="flex items-center gap-2 px-4 py-3 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors border-2 border-green-200 font-medium">
                    <Plus className="w-5 h-5" />Kind hinzufuegen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Wohnen (KdU) */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Kosten der Unterkunft und Heizung (KdU)</h2>
              </div>
              <p className="text-gray-600 mb-6">Deine Miet- und Heizkosten werden nach § 22 SGB II uebernommen, soweit sie angemessen sind.</p>

              <div className="space-y-4">
                {[
                  { label: 'Kaltmiete (monatlich)', value: kaltmiete, setter: setKaltmiete, hint: '' },
                  { label: 'Nebenkosten (monatlich)', value: nebenkosten, setter: setNebenkosten, hint: 'Betriebskosten ohne Heizung' },
                  { label: 'Heizkosten (monatlich)', value: heizkosten, setter: setHeizkosten, hint: '' },
                ].map(({ label, value, setter, hint }) => (
                  <div key={label}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                    <div className="relative">
                      <input type="number" min="0" step="0.01" value={value || ''} onChange={(e) => setter(parseFloat(e.target.value) || 0)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg" placeholder="0" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">EUR</span>
                    </div>
                    {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
                  </div>
                ))}

                <div className="pt-4 border-t">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Postleitzahl (optional)</label>
                  <input type="text" maxLength={5} value={plz} onChange={(e) => setPlz(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg" placeholder="12345" />
                  <p className="text-xs text-gray-500 mt-1">Fuer regionsspezifische Angemessenheitspruefung</p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex justify-between items-center text-sm mb-2"><span className="text-gray-700">Kaltmiete:</span><span className="font-semibold">{formatEuro(kaltmiete)}</span></div>
                  <div className="flex justify-between items-center text-sm mb-2"><span className="text-gray-700">Nebenkosten:</span><span className="font-semibold">{formatEuro(nebenkosten)}</span></div>
                  <div className="flex justify-between items-center text-sm mb-2"><span className="text-gray-700">Heizkosten:</span><span className="font-semibold">{formatEuro(heizkosten)}</span></div>
                  <div className="border-t border-blue-300 mt-2 pt-2">
                    <div className="flex justify-between items-center"><span className="font-semibold text-gray-900">Gesamt (KdU):</span><span className="font-bold text-blue-600 text-lg">{formatEuro(kaltmiete + nebenkosten + heizkosten)}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Einkommen */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Einkommen und Bezuege</h2>
              </div>
              <p className="text-gray-600 mb-6">Gib hier vorhandenes Einkommen an. Erwerbseinkommen wird nach § 11b SGB II mit Freibetraegen beruecksichtigt. Du kannst diesen Schritt auch ueberspringen.</p>

              <div className="space-y-6">
                {mitglieder.map((m) => (
                  <div key={m._id} className="border-2 border-gray-200 rounded-xl p-5">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      {m.typ === 'antragsteller' && 'Du (Antragsteller/in)'}
                      {m.typ === 'partner' && 'Partner/in'}
                      {m.typ === 'kind' && `Kind (${m.alter} Jahre)`}
                    </h3>

                    <div className="space-y-4">
                      {m.typ !== 'kind' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Brutto-Erwerbseinkommen (monatlich)</label>
                          <div className="relative">
                            <input type="number" min="0" step="0.01" value={m.einkommen || ''} onChange={(e) => updateMitglied(m._id, { einkommen: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0" />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">EUR</span>
                          </div>
                        </div>
                      )}

                      {m.typ === 'kind' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Kindergeld (monatlich)</label>
                            <div className="relative">
                              <input type="number" min="0" step="0.01" value={m.kindergeld ?? 250} onChange={(e) => updateMitglied(m._id, { kindergeld: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="250" />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">EUR</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Standard: 250 EUR ab 2025</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Unterhalt (monatlich)</label>
                            <div className="relative">
                              <input type="number" min="0" step="0.01" value={m.unterhalt || ''} onChange={(e) => updateMitglied(m._id, { unterhalt: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0" />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">EUR</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-gray-700">
                  <strong>Hinweis:</strong> Bei Erwerbseinkommen werden Freibetraege nach § 11b SGB II gewaehrt (100 EUR Grundfreibetrag + gestaffelte Freibetraege bis 1.200 EUR).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Ergebnis */}
        {step === 4 && ergebnis && (
          <div className="space-y-6">
            <div className={`rounded-xl p-8 shadow-lg ${ergebnis.anspruch > 0 ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-red-500 to-red-600'}`}>
              <div className="text-center text-white">
                <div className="flex items-center justify-center gap-2 mb-3">
                  {ergebnis.anspruch > 0 ? <CheckCircle className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                  <h2 className="text-2xl font-bold">Dein monatlicher Anspruch</h2>
                </div>
                <div className="text-6xl font-bold mb-2">{formatEuro(ergebnis.anspruch)}</div>
                <p className="text-lg opacity-90">{ergebnis.anspruch > 0 ? 'Buergergeld nach SGB II' : 'Kein Leistungsanspruch'}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Detaillierte Berechnung</h3>

              {/* Regelbedarf */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full" />Regelbedarf (§ 20 SGB II)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2 font-semibold text-gray-700">Person / Stufe</th>
                        <th className="text-right px-4 py-2 font-semibold text-gray-700">Betrag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {ergebnis.regelbedarfDetails.map((detail, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 text-gray-900">{detail.label}</td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatEuro(detail.betrag)}</td>
                        </tr>
                      ))}
                      <tr className="bg-blue-50 font-semibold">
                        <td className="px-4 py-3 text-gray-900">Gesamt Regelbedarf</td>
                        <td className="px-4 py-3 text-right text-blue-600">{formatEuro(ergebnis.regelbedarfGesamt)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mehrbedarf */}
              {ergebnis.mehrbedarfGesamt > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full" />Mehrbedarf (§ 21 SGB II)
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-2 font-semibold text-gray-700">Art</th>
                          <th className="text-left px-4 py-2 font-semibold text-gray-700">Rechtsgrundlage</th>
                          <th className="text-right px-4 py-2 font-semibold text-gray-700">Betrag</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {ergebnis.mehrbedarfDetails.map((detail, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3 text-gray-900">{detail.label}</td>
                            <td className="px-4 py-3 text-gray-600">{detail.paragraph}</td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatEuro(detail.betrag)}</td>
                          </tr>
                        ))}
                        <tr className="bg-green-50 font-semibold">
                          <td className="px-4 py-3 text-gray-900" colSpan={2}>Gesamt Mehrbedarf</td>
                          <td className="px-4 py-3 text-right text-green-600">{formatEuro(ergebnis.mehrbedarfGesamt)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* KdU */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full" />Kosten der Unterkunft (§ 22 SGB II)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-200">
                      <tr><td className="px-4 py-3 text-gray-700">Kaltmiete</td><td className="px-4 py-3 text-right font-semibold">{formatEuro(ergebnis.kduDetails.kaltmiete)}</td></tr>
                      <tr><td className="px-4 py-3 text-gray-700">Nebenkosten</td><td className="px-4 py-3 text-right font-semibold">{formatEuro(ergebnis.kduDetails.nebenkosten)}</td></tr>
                      <tr><td className="px-4 py-3 text-gray-700">Heizkosten</td><td className="px-4 py-3 text-right font-semibold">{formatEuro(ergebnis.kduDetails.heizkosten)}</td></tr>
                      <tr className="bg-purple-50 font-semibold">
                        <td className="px-4 py-3 text-gray-900">Anerkannte KdU</td>
                        <td className="px-4 py-3 text-right text-purple-600">{formatEuro(ergebnis.kduGesamt)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {ergebnis.kduHinweis && (
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-900">Angemessenheitspruefung</p>
                        <p className="text-sm text-amber-800 mt-1">{ergebnis.kduHinweis}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Einkommen */}
              {ergebnis.einkommenAnrechenbar > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-600 rounded-full" />Einkommensanrechnung (§ 11 SGB II)
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-2 font-semibold text-gray-700">Quelle</th>
                          <th className="text-right px-4 py-2 font-semibold text-gray-700">Brutto</th>
                          <th className="text-right px-4 py-2 font-semibold text-gray-700">Anrechenbar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {ergebnis.einkommenDetails.map((detail, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3 text-gray-900">{detail.label}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{formatEuro(detail.brutto)}</td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatEuro(detail.anrechenbar)}</td>
                          </tr>
                        ))}
                        <tr className="bg-red-50 font-semibold">
                          <td className="px-4 py-3 text-gray-900" colSpan={2}>Gesamt angerechnet</td>
                          <td className="px-4 py-3 text-right text-red-600">- {formatEuro(ergebnis.einkommenAnrechenbar)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Final Calculation */}
              <div className="border-t-2 border-gray-300 pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-700">Regelbedarf:</span><span className="font-semibold">{formatEuro(ergebnis.regelbedarfGesamt)}</span></div>
                  {ergebnis.mehrbedarfGesamt > 0 && (
                    <div className="flex justify-between"><span className="text-gray-700">+ Mehrbedarf:</span><span className="font-semibold text-green-600">{formatEuro(ergebnis.mehrbedarfGesamt)}</span></div>
                  )}
                  <div className="flex justify-between"><span className="text-gray-700">+ KdU:</span><span className="font-semibold">{formatEuro(ergebnis.kduGesamt)}</span></div>
                  {ergebnis.einkommenAnrechenbar > 0 && (
                    <div className="flex justify-between"><span className="text-gray-700">- Einkommen:</span><span className="font-semibold text-red-600">{formatEuro(ergebnis.einkommenAnrechenbar)}</span></div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-3 border-t">
                    <span className="text-gray-900">Monatlicher Anspruch:</span>
                    <span className={ergebnis.anspruch > 0 ? 'text-green-600' : 'text-red-600'}>{formatEuro(ergebnis.anspruch)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                onClick={() => {
                  const sections: RechnerSection[] = [
                    { label: 'Regelbedarf gesamt', value: formatEuro(ergebnis.regelbedarfGesamt) },
                  ]
                  if (ergebnis.mehrbedarfGesamt > 0) {
                    sections.push({ label: 'Mehrbedarf gesamt', value: formatEuro(ergebnis.mehrbedarfGesamt) })
                  }
                  sections.push(
                    { label: 'KdU (Miete + Heizung)', value: formatEuro(ergebnis.kduGesamt), highlight: true },
                  )
                  if (ergebnis.einkommenAnrechenbar > 0) {
                    sections.push({ label: 'Anrechenbares Einkommen', value: `- ${formatEuro(ergebnis.einkommenAnrechenbar)}` })
                  }
                  generateRechnerPdf(
                    'Buergergeld-Berechnung (SGB II)',
                    sections,
                    { label: 'Monatlicher Anspruch', value: formatEuro(ergebnis.anspruch) },
                  )
                }}
                className="w-full py-4 bg-amber-600 hover:bg-amber-700"
              >
                <Download className="w-4 h-4 mr-2" />Als PDF
              </Button>
              <Button
                onClick={() => {
                  const formatEuro2 = (v: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v)
                  shareResult({
                    title: 'Buergergeld-Berechnung',
                    text: `Mein Buergergeld-Anspruch: ${formatEuro2(ergebnis.anspruch)} / Monat (Regelbedarf: ${formatEuro2(ergebnis.regelbedarfGesamt)}, KdU: ${formatEuro2(ergebnis.kduGesamt)})`,
                    url: window.location.href,
                  })
                }}
                variant="outline"
                className="w-full py-4"
              >
                <Share2 className="w-4 h-4 mr-2" />Teilen
              </Button>
              <Link to="/scan"><Button className="w-full py-4 bg-blue-600 hover:bg-blue-700">Bescheid scannen</Button></Link>
              <Link to="/chat"><Button className="w-full py-4 bg-green-600 hover:bg-green-700">KI-Berater fragen</Button></Link>
              <Button onClick={reset} variant="outline" className="w-full py-4">Nochmal berechnen</Button>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-gray-700">
                <strong>Hinweis:</strong> Diese Berechnung ist eine Schaetzung basierend auf den Regelsaetzen 2025. Der tatsaechliche Anspruch kann aufgrund individueller Umstaende abweichen.
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        {step < 4 && (
          <div className="flex justify-between mt-8">
            <Button onClick={goBack} disabled={step === 1} variant="outline" className="px-6 py-6 text-base disabled:opacity-50">
              <ArrowLeft className="w-5 h-5 mr-2" />Zurueck
            </Button>
            <Button onClick={goNext} disabled={!canGoNext()} className="px-6 py-6 text-base bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
              {step === 3 ? 'Berechnen' : 'Weiter'}<ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
