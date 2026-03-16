import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Truck, ArrowRight, Info, CheckCircle2, Euro, AlertTriangle, Download, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { generateRechnerPdf } from '@/lib/pdf-export'
import { saveRechnerErgebnis } from '@/lib/rechner-verlauf'
import { shareResult } from '@/lib/share'
import Breadcrumbs from '@/components/Breadcrumbs'

const UMZUGSKOSTEN_ITEMS = [
  { name: 'Umzugswagen (Transport)', betragMin: 80, betragMax: 300 },
  { name: 'Umzugskartons (30 Stk)', betragMin: 30, betragMax: 60 },
  { name: 'Verpackungsmaterial', betragMin: 15, betragMax: 40 },
  { name: 'Umzugshelfer (2 Personen, 6h)', betragMin: 150, betragMax: 400 },
  { name: 'Renovierung alte Wohnung', betragMin: 100, betragMax: 500 },
  { name: 'Renovierung neue Wohnung', betragMin: 100, betragMax: 500 },
  { name: 'Nachsendeauftrag Post', betragMin: 28.90, betragMax: 28.90 },
  { name: 'Ummeldung / Personalausweis', betragMin: 0, betragMax: 37 },
  { name: 'Maklerprovision (wenn genehmigt)', betragMin: 0, betragMax: 1500 },
]

export default function UmzugskostenRechner() {
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({})
  const [doppelmiete, setDoppelmiete] = useState<string>('')
  const [kaution, setKaution] = useState<string>('')

  const toggleItem = (itemKey: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemKey]: !prev[itemKey]
    }))
  }

  const calculateTotals = () => {
    let minTotal = 0
    let maxTotal = 0
    let count = 0

    UMZUGSKOSTEN_ITEMS.forEach((item) => {
      if (selectedItems[item.name]) {
        minTotal += item.betragMin
        maxTotal += item.betragMax
        count++
      }
    })

    const doppelmieteValue = parseFloat(doppelmiete) || 0
    const kautionValue = parseFloat(kaution) || 0

    if (doppelmieteValue > 0) {
      minTotal += doppelmieteValue
      maxTotal += doppelmieteValue
    }

    return {
      minTotal,
      maxTotal,
      avgTotal: Math.round((minTotal + maxTotal) / 2),
      count,
      kaution: kautionValue,
      gesamtZurueckforderbar: Math.round((minTotal + maxTotal) / 2) + kautionValue
    }
  }

  const totals = calculateTotals()

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: 'Rechner', href: '/rechner' }, { label: 'Umzugskosten' }]} className="mb-2" />
          <div className="flex items-start gap-4">
            <div className="bg-amber-50 p-3 rounded-xl">
              <Truck className="h-8 w-8 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Umzugskostenrechner</h1>
              <p className="text-gray-600 mt-1">
                Berechne deinen Anspruch auf Umzugskosten nach § 22 Abs. 6 SGB II
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
                  Wann werden Umzugskosten uebernommen?
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Das Jobcenter hat den Umzug vorher genehmigt (Zusicherung)</li>
                  <li>Oder der Umzug ist "notwendig" (z.B. zu teure Wohnung, Job in anderer Stadt)</li>
                  <li>Gesundheitliche Gruende (z.B. Barrierefreiheit)</li>
                  <li>Haeusliche Gewalt oder unzumutbare Wohnsituation</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warning Card */}
        <Card className="border-amber-300 bg-amber-50/70 border-2">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm text-gray-700">
                <p className="font-semibold text-amber-900">
                  WICHTIG: Zusicherung VOR dem Umzug einholen!
                </p>
                <p>
                  Das Jobcenter muss den Umzug VORHER genehmigen. Ohne Zusicherung werden die Kosten
                  normalerweise NICHT erstattet. Stelle den Antrag mindestens 4 Wochen vor dem geplanten Umzug.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Standard Items Checklist */}
        <Card className="shadow-sm rounded-xl">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              Standard-Umzugskosten
              <Badge variant="secondary" className="text-xs">
                {Object.values(selectedItems).filter(Boolean).length} / {UMZUGSKOSTEN_ITEMS.length}
              </Badge>
            </h2>
            <div className="space-y-3">
              {UMZUGSKOSTEN_ITEMS.map((item) => {
                const isSelected = selectedItems[item.name]
                const isFixed = item.betragMin === item.betragMax

                return (
                  <div key={item.name} className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id={item.name}
                      checked={isSelected || false}
                      onChange={() => toggleItem(item.name)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <label htmlFor={item.name} className="flex-1 cursor-pointer">
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-sm ${isSelected ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                          {item.name}
                        </span>
                        {isSelected && (
                          <span className="text-sm font-medium text-amber-600 whitespace-nowrap">
                            {isFixed ? `${item.betragMin.toFixed(2)} €` : `${item.betragMin} - ${item.betragMax} €`}
                          </span>
                        )}
                      </div>
                    </label>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Custom Inputs */}
        <Card className="shadow-sm rounded-xl">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Individuelle Kosten
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="doppelmiete" className="block text-sm font-medium text-gray-700 mb-2">
                  Doppelmiete (max. 1 Monat)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="doppelmiete"
                    min="0"
                    max="2000"
                    step="0.01"
                    value={doppelmiete}
                    onChange={(e) => setDoppelmiete(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="0.00"
                  />
                  <span className="absolute right-3 top-2.5 text-gray-500 text-sm">€</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Falls alte und neue Wohnung zeitgleich bezahlt werden muessen (max. 1 Monat)
                </p>
              </div>

              <div>
                <label htmlFor="kaution" className="block text-sm font-medium text-gray-700 mb-2">
                  Kaution neue Wohnung (als Darlehen)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="kaution"
                    min="0"
                    max="3000"
                    step="0.01"
                    value={kaution}
                    onChange={(e) => setKaution(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="0.00"
                  />
                  <span className="absolute right-3 top-2.5 text-gray-500 text-sm">€</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Wird als zinsloses Darlehen gewaehrt und muss zurueckgezahlt werden
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Result Section */}
        <Card className="shadow-lg rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-5 w-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-gray-900">Deine Umzugskosten</h2>
            </div>

            {totals.count === 0 && !doppelmiete && !kaution ? (
              <p className="text-sm text-gray-600">
                Waehle Kostenposten aus und gib individuelle Betraege ein, um deinen Anspruch zu berechnen.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-600 mb-1">Mindestens</div>
                    <div className="text-xl font-bold text-gray-900">{totals.minTotal.toFixed(0)} €</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border-2 border-amber-300">
                    <div className="text-xs text-gray-600 mb-1">Durchschnitt</div>
                    <div className="text-xl font-bold text-amber-600">{totals.avgTotal} €</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-600 mb-1">Maximal</div>
                    <div className="text-xl font-bold text-gray-900">{totals.maxTotal.toFixed(0)} €</div>
                  </div>
                </div>

                {totals.kaution > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-900">Kaution (als Darlehen)</span>
                      <span className="text-lg font-bold text-blue-700">{totals.kaution.toFixed(2)} €</span>
                    </div>
                    <p className="text-xs text-blue-700 mt-1">
                      Wird zurueckgezahlt durch monatliche Raten (meist 10% des Regelbedarfs)
                    </p>
                  </div>
                )}

                <div className="bg-white/60 rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700">Gesamtkosten (inkl. Kaution):</span>
                    <span className="font-bold text-gray-900">{totals.gesamtZurueckforderbar} €</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Die tatsaechlichen Betraege haengen von der Bewilligung durch das Jobcenter ab.
                    Bewahre alle Belege und Rechnungen auf!
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    onClick={() => {
                      const sections = UMZUGSKOSTEN_ITEMS.filter(item => selectedItems[item.name]).map(item => ({
                        label: item.name,
                        value: item.betragMin === item.betragMax ? `${item.betragMin.toFixed(2)} EUR` : `${item.betragMin}-${item.betragMax} EUR`,
                      }))
                      if (parseFloat(doppelmiete) > 0) sections.push({ label: 'Doppelmiete', value: `${parseFloat(doppelmiete).toFixed(2)} EUR` })
                      if (totals.kaution > 0) sections.push({ label: 'Kaution (Darlehen)', value: `${totals.kaution.toFixed(2)} EUR` })
                      generateRechnerPdf('Umzugskosten (§ 22 Abs. 6 SGB II)', sections,
                        { label: 'Geschaetzte Gesamtkosten', value: `${totals.gesamtZurueckforderbar} EUR` },
                      )
                      saveRechnerErgebnis('Umzugskosten-Rechner', 'umzugskosten', {
                        durchschnitt: totals.avgTotal,
                        kaution: totals.kaution,
                        gesamt: totals.gesamtZurueckforderbar,
                        anzahlPosten: totals.count,
                      })
                    }}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />Als PDF
                  </Button>
                  <Button
                    onClick={() => shareResult({
                      title: 'Umzugskosten-Berechnung',
                      text: `Umzugskosten-Rechner: ca. ${totals.gesamtZurueckforderbar} EUR Gesamtkosten (${totals.count} Posten)`,
                      url: window.location.href,
                    })}
                    variant="outline"
                    className="flex-1"
                  >
                    <Share2 className="h-4 w-4 mr-2" />Teilen
                  </Button>
                  <Button asChild className="flex-1 bg-green-600 hover:bg-green-700">
                    <Link to="/generator/antrag_umzug" className="flex items-center justify-center gap-2">
                      <Euro className="h-4 w-4" />
                      Antrag erstellen
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <Link to="/chat" className="flex items-center justify-center gap-2">
                      Im Chat besprechen
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
