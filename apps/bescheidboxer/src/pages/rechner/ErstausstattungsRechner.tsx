import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, ArrowRight, Info, CheckCircle2, Euro, Download, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { generateRechnerPdf } from '@/lib/pdf-export'
import { saveRechnerErgebnis } from '@/lib/rechner-verlauf'
import { shareResult } from '@/lib/share'
import Breadcrumbs from '@/components/Breadcrumbs'

const ERSTAUSSTATTUNG_KATEGORIEN = [
  {
    kategorie: 'Wohnungserstausstattung',
    items: [
      { name: 'Bett (inkl. Matratze)', betragMin: 150, betragMax: 300 },
      { name: 'Kleiderschrank', betragMin: 100, betragMax: 250 },
      { name: 'Tisch', betragMin: 50, betragMax: 150 },
      { name: 'Stuehle (2x)', betragMin: 40, betragMax: 100 },
      { name: 'Sofa / Sitzgelegenheit', betragMin: 100, betragMax: 300 },
      { name: 'Regal / Kommode', betragMin: 40, betragMax: 120 },
      { name: 'Vorhänge / Gardinen', betragMin: 30, betragMax: 80 },
      { name: 'Lampen (3x)', betragMin: 30, betragMax: 90 },
      { name: 'Bettwaesche-Set', betragMin: 30, betragMax: 60 },
    ],
  },
  {
    kategorie: 'Kuechenausstattung',
    items: [
      { name: 'Kuehlschrank', betragMin: 150, betragMax: 350 },
      { name: 'Herd / Kochfeld', betragMin: 150, betragMax: 400 },
      { name: 'Waschmaschine', betragMin: 200, betragMax: 400 },
      { name: 'Toepfe & Pfannen Set', betragMin: 30, betragMax: 80 },
      { name: 'Geschirr & Besteck Set', betragMin: 25, betragMax: 60 },
      { name: 'Wasserkocher', betragMin: 15, betragMax: 30 },
    ],
  },
  {
    kategorie: 'Bekleidungserstausstattung',
    items: [
      { name: 'Bekleidung Erwachsene', betragMin: 150, betragMax: 350 },
      { name: 'Bekleidung Kind (pro Kind)', betragMin: 100, betragMax: 250 },
      { name: 'Winterbekleidung Erwachsene', betragMin: 80, betragMax: 200 },
      { name: 'Schuhe (2 Paar)', betragMin: 50, betragMax: 120 },
    ],
  },
  {
    kategorie: 'Schwangerschaft / Baby',
    items: [
      { name: 'Schwangerschaftsbekleidung', betragMin: 100, betragMax: 250 },
      { name: 'Babybett', betragMin: 60, betragMax: 150 },
      { name: 'Kinderwagen', betragMin: 100, betragMax: 300 },
      { name: 'Babybekleidung Erstausstattung', betragMin: 100, betragMax: 250 },
      { name: 'Wickelkommode', betragMin: 50, betragMax: 150 },
    ],
  },
]

export default function ErstausstattungsRechner() {
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({})

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

    ERSTAUSSTATTUNG_KATEGORIEN.forEach((kategorie) => {
      kategorie.items.forEach((item) => {
        const key = `${kategorie.kategorie}-${item.name}`
        if (selectedItems[key]) {
          minTotal += item.betragMin
          maxTotal += item.betragMax
          count++
        }
      })
    })

    return {
      minTotal,
      maxTotal,
      avgTotal: Math.round((minTotal + maxTotal) / 2),
      count
    }
  }

  const totals = calculateTotals()

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: 'Rechner', href: '/rechner' }, { label: 'Erstausstattung' }]} className="mb-2" />
          <div className="flex items-start gap-4">
            <div className="bg-amber-50 p-3 rounded-xl">
              <ShoppingBag className="h-8 w-8 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Erstausstattungsrechner</h1>
              <p className="text-gray-600 mt-1">
                Berechne deinen Anspruch auf Erstausstattung nach § 24 Abs. 3 SGB II
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
                  Wann besteht Anspruch auf Erstausstattung?
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Erste eigene Wohnung (z.B. nach Obdachlosigkeit)</li>
                  <li>Nach Brand, Hochwasser oder anderem Totalverlust</li>
                  <li>Nach Trennung / Scheidung (neue Haushaltsgruendung)</li>
                  <li>Schwangerschaft und Geburt eines Kindes</li>
                </ul>
                <p className="text-xs text-gray-600 mt-3">
                  Waehle die Gegenstaende aus, die du benoetigst. Die angegebenen Betraege sind Richtwerte
                  und koennen je nach Kommune abweichen.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Sections */}
        {ERSTAUSSTATTUNG_KATEGORIEN.map((kategorie) => (
          <Card key={kategorie.kategorie} className="shadow-sm rounded-xl">
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                {kategorie.kategorie}
                <Badge variant="secondary" className="text-xs">
                  {kategorie.items.filter(item => selectedItems[`${kategorie.kategorie}-${item.name}`]).length} / {kategorie.items.length}
                </Badge>
              </h2>
              <div className="space-y-3">
                {kategorie.items.map((item) => {
                  const key = `${kategorie.kategorie}-${item.name}`
                  const isSelected = selectedItems[key]

                  return (
                    <div key={key} className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id={key}
                        checked={isSelected || false}
                        onChange={() => toggleItem(key)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                      />
                      <label htmlFor={key} className="flex-1 cursor-pointer">
                        <div className="flex items-start justify-between gap-2">
                          <span className={`text-sm ${isSelected ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                            {item.name}
                          </span>
                          {isSelected && (
                            <span className="text-sm font-medium text-amber-600 whitespace-nowrap">
                              {item.betragMin} - {item.betragMax} €
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
        ))}

        {/* Result Section */}
        <Card className="shadow-lg rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-5 w-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-gray-900">Deine Erstausstattung</h2>
            </div>

            {totals.count === 0 ? (
              <p className="text-sm text-gray-600">
                Waehle Gegenstaende aus, um deinen Anspruch zu berechnen.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-600 mb-1">Mindestens</div>
                    <div className="text-xl font-bold text-gray-900">{totals.minTotal} €</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border-2 border-amber-300">
                    <div className="text-xs text-gray-600 mb-1">Durchschnitt</div>
                    <div className="text-xl font-bold text-amber-600">{totals.avgTotal} €</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-600 mb-1">Maximal</div>
                    <div className="text-xl font-bold text-gray-900">{totals.maxTotal} €</div>
                  </div>
                </div>

                <div className="bg-white/60 rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700">Ausgewaehlte Gegenstaende:</span>
                    <span className="font-semibold text-gray-900">{totals.count}</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Die tatsaechlichen Betraege haengen von deiner Kommune ab. Diese Schaetzung basiert
                    auf bundesweiten Durchschnittswerten.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    onClick={() => {
                      const sections = ERSTAUSSTATTUNG_KATEGORIEN.flatMap(k =>
                        k.items.filter(item => selectedItems[`${k.kategorie}-${item.name}`]).map(item => ({
                          label: item.name,
                          value: `${item.betragMin}-${item.betragMax} EUR`,
                        }))
                      )
                      generateRechnerPdf('Erstausstattung (§ 24 Abs. 3 SGB II)', sections,
                        { label: 'Geschaetzter Gesamtbetrag', value: `${totals.avgTotal} EUR` },
                      )
                      saveRechnerErgebnis('Erstausstattungs-Rechner', 'erstausstattung', {
                        durchschnitt: totals.avgTotal,
                        minimum: totals.minTotal,
                        maximum: totals.maxTotal,
                        anzahlPosten: totals.count,
                      })
                    }}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />Als PDF
                  </Button>
                  <Button
                    onClick={() => shareResult({
                      title: 'Erstausstattungs-Berechnung',
                      text: `Erstausstattungs-Rechner: ca. ${totals.avgTotal} EUR fuer ${totals.count} Posten (${totals.minTotal}-${totals.maxTotal} EUR)`,
                      url: window.location.href,
                    })}
                    variant="outline"
                    className="flex-1"
                  >
                    <Share2 className="h-4 w-4 mr-2" />Teilen
                  </Button>
                  <Button asChild className="flex-1 bg-green-600 hover:bg-green-700">
                    <Link to="/generator/antrag_einmalige_leistung" className="flex items-center justify-center gap-2">
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
