import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Home, Download, Share2, MapPin, Users, Euro,
  AlertTriangle, CheckCircle2, Info, ArrowRight, Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { generateRechnerPdf } from '@/lib/pdf-export'
import { saveRechnerErgebnis } from '@/lib/rechner-verlauf'
import { shareResult } from '@/lib/share'
import Breadcrumbs from '@/components/Breadcrumbs'
import useDocumentTitle from '@/hooks/useDocumentTitle'

// ---------------------------------------------------------------------------
// Demo-Mietspiegel: angemessene Bruttokaltmiete (KdU) nach Haushaltgroesse
// ---------------------------------------------------------------------------
interface MietspiegelEintrag {
  name: string
  bundesland: string
  angemesseneKdu: { 1: number; 2: number; 3: number; 4: number; 5: number }
}

const MIETSPIEGEL_DATEN: MietspiegelEintrag[] = [
  { name: 'Berlin', bundesland: 'Berlin', angemesseneKdu: { 1: 426, 2: 515, 3: 634, 4: 713, 5: 857 } },
  { name: 'Hamburg', bundesland: 'Hamburg', angemesseneKdu: { 1: 471, 2: 566, 3: 689, 4: 783, 5: 922 } },
  { name: 'Muenchen', bundesland: 'Bayern', angemesseneKdu: { 1: 688, 2: 835, 3: 1006, 4: 1155, 5: 1360 } },
  { name: 'Koeln', bundesland: 'Nordrhein-Westfalen', angemesseneKdu: { 1: 434, 2: 527, 3: 639, 4: 734, 5: 876 } },
  { name: 'Frankfurt', bundesland: 'Hessen', angemesseneKdu: { 1: 492, 2: 593, 3: 718, 4: 821, 5: 971 } },
  { name: 'Stuttgart', bundesland: 'Baden-Wuerttemberg', angemesseneKdu: { 1: 479, 2: 578, 3: 699, 4: 802, 5: 949 } },
  { name: 'Duesseldorf', bundesland: 'Nordrhein-Westfalen', angemesseneKdu: { 1: 427, 2: 517, 3: 627, 4: 720, 5: 856 } },
  { name: 'Dortmund', bundesland: 'Nordrhein-Westfalen', angemesseneKdu: { 1: 338, 2: 409, 3: 496, 4: 570, 5: 678 } },
  { name: 'Leipzig', bundesland: 'Sachsen', angemesseneKdu: { 1: 323, 2: 390, 3: 473, 4: 543, 5: 646 } },
  { name: 'Dresden', bundesland: 'Sachsen', angemesseneKdu: { 1: 335, 2: 405, 3: 491, 4: 564, 5: 671 } },
  { name: 'Hannover', bundesland: 'Niedersachsen', angemesseneKdu: { 1: 379, 2: 458, 3: 555, 4: 637, 5: 758 } },
  { name: 'Nuernberg', bundesland: 'Bayern', angemesseneKdu: { 1: 385, 2: 465, 3: 564, 4: 648, 5: 771 } },
  { name: 'Bremen', bundesland: 'Bremen', angemesseneKdu: { 1: 349, 2: 422, 3: 512, 4: 588, 5: 699 } },
  { name: 'Essen', bundesland: 'Nordrhein-Westfalen', angemesseneKdu: { 1: 330, 2: 399, 3: 484, 4: 556, 5: 661 } },
  { name: 'Rostock', bundesland: 'Mecklenburg-Vorpommern', angemesseneKdu: { 1: 310, 2: 375, 3: 455, 4: 522, 5: 621 } },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function MietspiegelRechner() {
  useDocumentTitle('Mietspiegel-Rechner - BescheidBoxer')

  // Form state
  const [stadtSuche, setStadtSuche] = useState('')
  const [gewaehlteStadt, setGewaehlteStadt] = useState<MietspiegelEintrag | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [haushaltsgroesse, setHaushaltsgroesse] = useState<number>(1)
  const [kaltmiete, setKaltmiete] = useState<string>('')
  const [nebenkosten, setNebenkosten] = useState<string>('')
  const [heizkosten, setHeizkosten] = useState<string>('')

  // Result state
  const [ergebnis, setErgebnis] = useState<{
    gesamtmiete: number
    bruttokaltmiete: number
    grenze: number
    differenz: number
    angemessen: boolean
    stadt: string
    bundesland: string
  } | null>(null)
  const [fehler, setFehler] = useState('')

  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Filter cities
  const gefilterteStaedte = MIETSPIEGEL_DATEN.filter((s) =>
    s.name.toLowerCase().includes(stadtSuche.toLowerCase()),
  )

  const handleStadtWaehlen = (stadt: MietspiegelEintrag) => {
    setGewaehlteStadt(stadt)
    setStadtSuche(stadt.name)
    setDropdownOpen(false)
  }

  const handleBerechnen = () => {
    setFehler('')
    setErgebnis(null)

    if (!gewaehlteStadt) {
      setFehler('Bitte waehle eine Stadt aus der Liste.')
      return
    }

    const km = parseFloat(kaltmiete) || 0
    const nk = parseFloat(nebenkosten) || 0
    const hk = parseFloat(heizkosten) || 0

    if (km <= 0) {
      setFehler('Bitte gib deine Kaltmiete ein.')
      return
    }

    const bruttokaltmiete = km + nk
    const gesamtmiete = bruttokaltmiete + hk
    const grenze = gewaehlteStadt.angemesseneKdu[haushaltsgroesse as 1 | 2 | 3 | 4 | 5]
    const differenz = Math.round((bruttokaltmiete - grenze) * 100) / 100
    const angemessen = bruttokaltmiete <= grenze

    const result = {
      gesamtmiete,
      bruttokaltmiete,
      grenze,
      differenz,
      angemessen,
      stadt: gewaehlteStadt.name,
      bundesland: gewaehlteStadt.bundesland,
    }

    setErgebnis(result)

    saveRechnerErgebnis('Mietspiegel-Rechner', 'mietspiegel', {
      stadt: gewaehlteStadt.name,
      haushaltsgroesse,
      bruttokaltmiete,
      grenze,
      angemessen: angemessen ? 'Ja' : 'Nein',
      differenz,
    })
  }

  // Visual bar helper
  const renderVergleichsBalken = (label: string, wert: number, grenze: number) => {
    const maxVal = Math.max(wert, grenze) * 1.15
    const wertPct = maxVal > 0 ? (wert / maxVal) * 100 : 0
    const grenzePct = maxVal > 0 ? (grenze / maxVal) * 100 : 0

    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{label}</span>
          <span className="font-medium">{wert.toFixed(2)} EUR</span>
        </div>
        <div className="relative h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
          <div
            className={`absolute top-0 left-0 h-full rounded-lg transition-all ${
              wert <= grenze ? 'bg-green-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(wertPct, 100)}%` }}
          />
          <div
            className="absolute top-0 h-full border-r-2 border-dashed border-gray-700 dark:border-gray-300"
            style={{ left: `${Math.min(grenzePct, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>0 EUR</span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 border-t-2 border-dashed border-gray-700 dark:border-gray-300" />
            Grenze: {grenze} EUR
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 pb-16">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[{ label: 'Rechner', href: '/rechner' }, { label: 'Mietspiegel-Rechner' }]}
          className="mb-6"
        />

        {/* Hero */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-50 dark:bg-blue-900/40 p-3 rounded-xl">
              <MapPin className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold gradient-text-boxer">
                Mietspiegel-Rechner
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg mt-1">
                Ist deine Miete angemessen? Pruefe es nach § 22 SGB II
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card className="shadow-lg mb-8">
          <CardContent className="pt-6 space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Deine Angaben
            </h2>

            {/* City search */}
            <div ref={dropdownRef} className="relative">
              <Label className="mb-2 flex items-center gap-1">
                <Search className="w-4 h-4" /> Stadt
              </Label>
              <Input
                value={stadtSuche}
                onChange={(e) => {
                  setStadtSuche(e.target.value)
                  setDropdownOpen(true)
                  if (!e.target.value) setGewaehlteStadt(null)
                }}
                onFocus={() => setDropdownOpen(true)}
                placeholder="Stadt eingeben, z.B. Berlin"
              />
              {dropdownOpen && stadtSuche.length > 0 && gefilterteStaedte.length > 0 && (
                <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {gefilterteStaedte.map((stadt) => (
                    <button
                      key={stadt.name}
                      type="button"
                      onClick={() => handleStadtWaehlen(stadt)}
                      className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-sm flex justify-between"
                    >
                      <span className="font-medium">{stadt.name}</span>
                      <span className="text-gray-400 text-xs">{stadt.bundesland}</span>
                    </button>
                  ))}
                </div>
              )}
              {dropdownOpen && stadtSuche.length > 0 && gefilterteStaedte.length === 0 && (
                <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-4 py-3 text-sm text-gray-500">
                  Keine Stadt gefunden. Derzeit sind 15 Staedte verfuegbar.
                </div>
              )}
            </div>

            {/* Household size */}
            <div>
              <Label className="mb-2 flex items-center gap-1">
                <Users className="w-4 h-4" /> Haushaltgroesse (Bedarfsgemeinschaft)
              </Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setHaushaltsgroesse(n)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      haushaltsgroesse === n
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400'
                    }`}
                  >
                    {n} {n === 1 ? 'Person' : 'Personen'}
                  </button>
                ))}
              </div>
            </div>

            {/* Rent inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="mb-2 flex items-center gap-1">
                  <Euro className="w-4 h-4" /> Kaltmiete (EUR)
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={kaltmiete}
                  onChange={(e) => setKaltmiete(e.target.value)}
                  placeholder="z.B. 350"
                />
              </div>
              <div>
                <Label className="mb-2 flex items-center gap-1">
                  <Euro className="w-4 h-4" /> Nebenkosten (EUR)
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={nebenkosten}
                  onChange={(e) => setNebenkosten(e.target.value)}
                  placeholder="z.B. 80"
                />
              </div>
              <div>
                <Label className="mb-2 flex items-center gap-1">
                  <Euro className="w-4 h-4" /> Heizkosten (EUR)
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={heizkosten}
                  onChange={(e) => setHeizkosten(e.target.value)}
                  placeholder="z.B. 60"
                />
              </div>
            </div>

            <Button
              onClick={handleBerechnen}
              className="w-full gradient-boxer text-white font-semibold py-3 rounded-lg"
            >
              <Search className="w-4 h-4 mr-2" /> Mietspiegel pruefen
            </Button>
          </CardContent>
        </Card>

        {/* Error */}
        {fehler && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <p className="font-medium text-red-900 dark:text-red-200">{fehler}</p>
          </div>
        )}

        {/* Result */}
        {ergebnis && (
          <div className="space-y-6 mb-8">
            {/* Status banner */}
            <Card
              className={`shadow-lg border-2 ${
                ergebnis.angemessen
                  ? 'border-green-500 bg-green-50/50 dark:bg-green-900/20'
                  : 'border-red-500 bg-red-50/50 dark:bg-red-900/20'
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 mb-3">
                  {ergebnis.angemessen ? (
                    <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400 flex-shrink-0" />
                  )}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {ergebnis.angemessen ? 'Angemessen' : 'Ueber der Angemessenheitsgrenze'}
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300">
                      {ergebnis.angemessen
                        ? 'Deine Bruttokaltmiete liegt innerhalb der Angemessenheitsgrenze.'
                        : `Deine Bruttokaltmiete uebersteigt die Grenze um ${Math.abs(ergebnis.differenz).toFixed(2)} EUR.`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">{ergebnis.stadt}</Badge>
                  <Badge variant="outline">{ergebnis.bundesland}</Badge>
                  <Badge variant="outline">{haushaltsgroesse} {haushaltsgroesse === 1 ? 'Person' : 'Personen'}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Bar chart comparison */}
            <Card className="shadow-sm">
              <CardContent className="pt-6 space-y-6">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                  Vergleich: Deine Miete vs. Angemessenheitsgrenze
                </h3>

                {renderVergleichsBalken('Bruttokaltmiete (Kaltmiete + Nebenkosten)', ergebnis.bruttokaltmiete, ergebnis.grenze)}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Bruttokaltmiete</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {ergebnis.bruttokaltmiete.toFixed(2)} EUR
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Angemessenheitsgrenze</div>
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {ergebnis.grenze} EUR
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Gesamtmiete (inkl. Heizung)</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {ergebnis.gesamtmiete.toFixed(2)} EUR
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Warning if over limit */}
            {!ergebnis.angemessen && (
              <Card className="border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/20 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                        Was passiert jetzt?
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 text-sm">
                        Wenn das Jobcenter deine Miete als unangemessen einstuft, erhaeltst du eine
                        <strong> Kostensenkungsaufforderung</strong>. Ab diesem Zeitpunkt hast du eine
                        <strong> 6-monatige Schonfrist</strong> (Uebernahmezeit), in der die vollen Kosten
                        weiterhin uebernommen werden.
                      </p>
                      <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2 list-disc list-inside">
                        <li>Pruefe die Kostensenkungsaufforderung genau - ist sie formal korrekt?</li>
                        <li>Dokumentiere alle Bemuehungen zur Wohnungssuche</li>
                        <li>Fehlende Verfuegbarkeit guenstigerer Wohnungen kann ein Gegenargument sein</li>
                        <li>Widerspruch ist innerhalb eines Monats moeglich</li>
                      </ul>
                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <Button asChild variant="outline" size="sm">
                          <Link to="/chat" className="flex items-center gap-1">
                            <ArrowRight className="w-4 h-4" /> Im Chat besprechen
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tips if angemessen */}
            {ergebnis.angemessen && (
              <Card className="border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-900/10 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Alles im gruenen Bereich
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 text-sm">
                        Deine Bruttokaltmiete liegt innerhalb der Angemessenheitsgrenze fuer {ergebnis.stadt}.
                        Das Jobcenter sollte deine Kosten der Unterkunft in voller Hoehe uebernehmen.
                        Heizkosten werden in der Regel zusaetzlich uebernommen, sofern sie nicht unangemessen hoch sind.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Legal reference */}
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Rechtsgrundlage: <strong>§ 22 Abs. 1 SGB II</strong> - Bedarfe fuer Unterkunft und Heizung
                werden in Hoehe der tatsaechlichen Aufwendungen anerkannt, soweit diese angemessen sind.
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => {
                  generateRechnerPdf('Mietspiegel-Pruefung (§ 22 SGB II)', [
                    { label: 'Stadt', value: ergebnis.stadt },
                    { label: 'Bundesland', value: ergebnis.bundesland },
                    { label: 'Haushaltgroesse', value: `${haushaltsgroesse} Person${haushaltsgroesse > 1 ? 'en' : ''}` },
                    { label: 'Kaltmiete', value: `${kaltmiete} EUR` },
                    { label: 'Nebenkosten', value: `${nebenkosten || '0'} EUR` },
                    { label: 'Bruttokaltmiete', value: `${ergebnis.bruttokaltmiete.toFixed(2)} EUR`, highlight: !ergebnis.angemessen },
                    { label: 'Angemessenheitsgrenze', value: `${ergebnis.grenze} EUR` },
                    { label: 'Heizkosten', value: `${heizkosten || '0'} EUR` },
                    { label: 'Gesamtmiete', value: `${ergebnis.gesamtmiete.toFixed(2)} EUR` },
                    { label: 'Ergebnis', value: ergebnis.angemessen ? 'Angemessen' : `Ueber Grenze (+${Math.abs(ergebnis.differenz).toFixed(2)} EUR)`, highlight: !ergebnis.angemessen },
                  ], {
                    label: 'Ergebnis',
                    value: ergebnis.angemessen
                      ? 'Angemessen - Bruttokaltmiete innerhalb der Grenze'
                      : `Ueber Grenze - Differenz ${Math.abs(ergebnis.differenz).toFixed(2)} EUR`,
                  })
                }}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" /> Als PDF
              </Button>
              <Button
                onClick={() =>
                  shareResult({
                    title: 'Mietspiegel-Pruefung',
                    text: `Mietspiegel-Rechner: Bruttokaltmiete ${ergebnis.bruttokaltmiete.toFixed(2)} EUR vs. Grenze ${ergebnis.grenze} EUR in ${ergebnis.stadt} - ${ergebnis.angemessen ? 'Angemessen' : 'Ueber Grenze'}`,
                    url: window.location.href,
                  })
                }
                variant="outline"
                className="flex-1"
              >
                <Share2 className="w-4 h-4 mr-2" /> Teilen
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link to="/rechner/kdu" className="flex items-center justify-center gap-2">
                  <Home className="w-4 h-4" /> Zum KdU-Rechner
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link to="/rechner" className="flex items-center justify-center gap-2">
                  Alle Rechner <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Info section */}
        <div className="space-y-6 mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Hintergrund: KdU & Angemessenheitsgrenzen
          </h2>

          <Card className="shadow-sm">
            <CardContent className="pt-6 space-y-3">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                Was ist die "Bruttokaltmiete"?
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                Die Bruttokaltmiete setzt sich zusammen aus der Kaltmiete (Grundmiete) und den
                kalten Nebenkosten (z.B. Wasser, Muellabfuhr, Hausmeister). Die Heizkosten werden
                getrennt betrachtet. Beim Buergergeld prueft das Jobcenter, ob die Bruttokaltmiete
                innerhalb der oertlichen Angemessenheitsgrenze liegt.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="pt-6 space-y-3">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                Wie werden Angemessenheitsgrenzen ermittelt?
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                Jede Kommune erstellt ein sogenanntes "schluessiges Konzept", das die oertlichen
                Mietverhaeltnisse analysiert und daraus Obergrenzen ableitet. Diese richten sich nach
                der Haushaltgroesse und dem lokalen Mietniveau. Hat eine Kommune kein schluessiges Konzept,
                werden haeufig die Werte der Wohngeldtabelle plus 10% als Richtwert herangezogen.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="pt-6 space-y-3">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                Was tun, wenn die Miete zu hoch ist?
              </h3>
              <ul className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed space-y-2 list-disc list-inside">
                <li>Pruefe, ob die Kostensenkungsaufforderung formal korrekt ist</li>
                <li>Dokumentiere aktiv deine Bemuehungen, eine guenstigere Wohnung zu finden</li>
                <li>Lege Widerspruch ein, wenn du die Berechnung fuer fehlerhaft haeltst</li>
                <li>Nutze die 6-monatige Uebernahmezeit, um Alternativen zu pruefen</li>
                <li>Lass dich durch unseren KI-Berater individuell beraten</li>
              </ul>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-xs text-gray-500 dark:text-gray-400 space-y-2">
            <p className="font-semibold">Hinweis / Haftungsausschluss</p>
            <p>
              Dieser Rechner dient ausschliesslich der unverbindlichen Orientierung. Die angezeigten
              Angemessenheitsgrenzen basieren auf oeffentlich verfuegbaren Richtwerten und koennen von den
              tatsaechlich gueltigen Werten deiner Kommune abweichen. Es handelt sich nicht um eine
              Rechtsberatung. Fuer verbindliche Auskuenfte wende dich an dein Jobcenter oder eine
              anerkannte Beratungsstelle.
            </p>
            <p>Rechtsgrundlage: § 22 Abs. 1 SGB II</p>
          </div>
        </div>
      </div>
    </div>
  )
}
