import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  Scale,
  Users,
  Building,
  Gavel,
  Filter,
  Check,
  Info,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Languages,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import Breadcrumbs from '@/components/Breadcrumbs'

interface AnwaltEintrag {
  name: string
  typ: 'anwalt' | 'kanzlei' | 'beratung' | 'verein'
  fachgebiet: string[]
  stadt: string
  plz: string
  telefon: string
  email: string
  website: string
  bewertung: number
  beschreibung: string
  pkh: boolean
  erstberatungKostenlos: boolean
  sprachen: string[]
}

const typLabels: Record<AnwaltEintrag['typ'], string> = {
  anwalt: 'Rechtsanwalt',
  kanzlei: 'Kanzlei',
  beratung: 'Beratungsstelle',
  verein: 'Verein',
}

const typColors: Record<AnwaltEintrag['typ'], string> = {
  anwalt: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800',
  kanzlei: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800',
  beratung: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800',
  verein: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800',
}

const typIcons: Record<AnwaltEintrag['typ'], typeof Scale> = {
  anwalt: Scale,
  kanzlei: Building,
  beratung: Gavel,
  verein: Users,
}

const alleFachgebiete = [
  'SGB II',
  'SGB III',
  'SGB XII',
  'Widerspruchsverfahren',
  'Klageverfahren',
  'Sanktionen',
  'KdU',
  'Mehrbedarf',
]

const eintraege: AnwaltEintrag[] = [
  {
    name: 'RA Thomas Bergmann',
    typ: 'anwalt',
    fachgebiet: ['SGB II', 'Widerspruchsverfahren', 'Sanktionen', 'KdU'],
    stadt: 'Berlin',
    plz: '10117',
    telefon: '030 1234567',
    email: 'bergmann@sozialrecht-berlin.de',
    website: 'https://www.sozialrecht-bergmann.de',
    bewertung: 4.8,
    beschreibung:
      'Seit ueber 15 Jahren spezialisiert auf Sozialrecht mit Schwerpunkt Buergergeld und Hartz-IV-Nachfolgeregelungen. Vertritt Mandanten vor dem Sozialgericht Berlin-Brandenburg und beraet zu allen Fragen rund um Leistungsbescheide.',
    pkh: true,
    erstberatungKostenlos: true,
    sprachen: ['Deutsch', 'Englisch'],
  },
  {
    name: 'Kanzlei Schreiber & Partner',
    typ: 'kanzlei',
    fachgebiet: ['SGB II', 'SGB III', 'Klageverfahren', 'Widerspruchsverfahren'],
    stadt: 'Hamburg',
    plz: '20095',
    telefon: '040 9876543',
    email: 'info@schreiber-sozialrecht.de',
    website: 'https://www.schreiber-sozialrecht.de',
    bewertung: 4.5,
    beschreibung:
      'Renommierte Kanzlei mit drei Fachanwaelten fuer Sozialrecht. Umfassende Betreuung von der Erstberatung ueber Widerspruchsverfahren bis hin zur Klage vor dem Sozialgericht. Besondere Expertise bei ALG-I-Sperrzeiten.',
    pkh: true,
    erstberatungKostenlos: false,
    sprachen: ['Deutsch', 'Englisch', 'Tuerkisch'],
  },
  {
    name: 'Sozialberatung Muenchen e.V.',
    typ: 'verein',
    fachgebiet: ['SGB II', 'SGB XII', 'Mehrbedarf', 'KdU'],
    stadt: 'Muenchen',
    plz: '80331',
    telefon: '089 5554321',
    email: 'beratung@sozialberatung-muenchen.de',
    website: 'https://www.sozialberatung-muenchen.de',
    bewertung: 4.7,
    beschreibung:
      'Gemeinnuetziger Verein mit ehrenamtlichen Beratern und Juristen. Bietet kostenlose Erstberatung fuer Buergergeld-Empfaenger und Hilfe bei der Pruefung von Bescheiden. Besonders engagiert im Bereich Mehrbedarf und Kosten der Unterkunft.',
    pkh: false,
    erstberatungKostenlos: true,
    sprachen: ['Deutsch', 'Englisch', 'Arabisch'],
  },
  {
    name: 'RAin Claudia Meier-Hoffmann',
    typ: 'anwalt',
    fachgebiet: ['SGB II', 'Sanktionen', 'Widerspruchsverfahren', 'Klageverfahren'],
    stadt: 'Koeln',
    plz: '50667',
    telefon: '0221 3456789',
    email: 'meier-hoffmann@sozialrecht-koeln.de',
    website: 'https://www.ra-meier-hoffmann.de',
    bewertung: 4.9,
    beschreibung:
      'Fachanwaeltin fuer Sozialrecht mit besonderem Schwerpunkt auf Sanktionsverfahren und Eingliederungsvereinbarungen. Bekannt fuer hohe Erfolgsquote bei Widerspruechen gegen Sanktionsbescheide. Engagiert sich ehrenamtlich fuer die Rechte von Erwerbslosen.',
    pkh: true,
    erstberatungKostenlos: true,
    sprachen: ['Deutsch', 'Franzoesisch'],
  },
  {
    name: 'Kanzlei Weber Sozialrecht',
    typ: 'kanzlei',
    fachgebiet: ['SGB II', 'SGB III', 'KdU', 'Klageverfahren'],
    stadt: 'Frankfurt',
    plz: '60311',
    telefon: '069 7654321',
    email: 'kanzlei@weber-sozialrecht.de',
    website: 'https://www.weber-sozialrecht.de',
    bewertung: 4.3,
    beschreibung:
      'Spezialkanzlei fuer Sozialrecht im Herzen von Frankfurt. Zwei Fachanwaelte beraten zu saemtlichen Fragen des SGB II und SGB III. Schwerpunkt auf Kosten der Unterkunft und Heizkosten sowie Klageverfahren vor dem Hessischen Landessozialgericht.',
    pkh: true,
    erstberatungKostenlos: false,
    sprachen: ['Deutsch', 'Englisch', 'Spanisch'],
  },
  {
    name: 'Erwerbslosen-Beratung Leipzig',
    typ: 'beratung',
    fachgebiet: ['SGB II', 'Widerspruchsverfahren', 'Sanktionen', 'Mehrbedarf'],
    stadt: 'Leipzig',
    plz: '04109',
    telefon: '0341 2345678',
    email: 'info@erwerbslosenberatung-leipzig.de',
    website: 'https://www.erwerbslosenberatung-leipzig.de',
    bewertung: 4.6,
    beschreibung:
      'Unabhaengige Beratungsstelle fuer Erwerbslose und Aufstocker. Hilft bei der Pruefung von Bescheiden, beim Verfassen von Widerspruechen und bei der Vorbereitung auf Termine beim Jobcenter. Offene Sprechstunde ohne Termin moeglich.',
    pkh: false,
    erstberatungKostenlos: true,
    sprachen: ['Deutsch', 'Russisch', 'Arabisch'],
  },
  {
    name: 'RA Michael Brandt',
    typ: 'anwalt',
    fachgebiet: ['SGB II', 'SGB XII', 'Klageverfahren', 'Mehrbedarf'],
    stadt: 'Dortmund',
    plz: '44135',
    telefon: '0231 8765432',
    email: 'brandt@anwalt-sozialrecht-dortmund.de',
    website: 'https://www.ra-brandt-dortmund.de',
    bewertung: 4.4,
    beschreibung:
      'Erfahrener Rechtsanwalt fuer Sozialrecht mit Kanzlei in der Dortmunder Innenstadt. Vertritt Mandanten seit 12 Jahren vor den Sozialgerichten in NRW. Besonderer Fokus auf Mehrbedarf-Ansprueche und Sozialhilfe nach SGB XII.',
    pkh: true,
    erstberatungKostenlos: false,
    sprachen: ['Deutsch', 'Polnisch'],
  },
  {
    name: 'Sozialrechtsverein Nuernberg',
    typ: 'verein',
    fachgebiet: ['SGB II', 'Widerspruchsverfahren', 'KdU', 'Sanktionen'],
    stadt: 'Nuernberg',
    plz: '90402',
    telefon: '0911 1122334',
    email: 'kontakt@sozialrecht-nuernberg.de',
    website: 'https://www.sozialrechtsverein-nuernberg.de',
    bewertung: 4.2,
    beschreibung:
      'Ehrenamtlicher Verein, der Buergergeld-Empfaenger bei Problemen mit dem Jobcenter unterstuetzt. Bietet woechentliche Sprechstunden mit juristischer Fachberatung und Hilfe beim Ausfuellen von Antraegen und Formularen.',
    pkh: false,
    erstberatungKostenlos: true,
    sprachen: ['Deutsch'],
  },
  {
    name: 'RAin Sabine Keller',
    typ: 'anwalt',
    fachgebiet: ['SGB II', 'SGB III', 'Widerspruchsverfahren', 'Sanktionen'],
    stadt: 'Dresden',
    plz: '01067',
    telefon: '0351 4455667',
    email: 'keller@sozialrecht-dresden.de',
    website: 'https://www.ra-keller-dresden.de',
    bewertung: 4.7,
    beschreibung:
      'Fachanwaeltin fuer Sozialrecht in Dresden. Spezialisiert auf Widersprueche und Klagen gegen Jobcenter-Bescheide. Umfangreiche Erfahrung mit Sperrzeiten-Problematik bei ALG I und Sanktionsverfahren im Buergergeld.',
    pkh: true,
    erstberatungKostenlos: true,
    sprachen: ['Deutsch', 'Tschechisch'],
  },
  {
    name: 'Kanzlei Hartmann & Grosse',
    typ: 'kanzlei',
    fachgebiet: ['SGB II', 'SGB XII', 'Klageverfahren', 'KdU', 'Mehrbedarf'],
    stadt: 'Stuttgart',
    plz: '70173',
    telefon: '0711 9988776',
    email: 'info@hartmann-grosse.de',
    website: 'https://www.hartmann-grosse-sozialrecht.de',
    bewertung: 4.6,
    beschreibung:
      'Ueberregional taetige Kanzlei mit Schwerpunkt Sozialrecht. Vier Anwaelte decken das gesamte Spektrum des Sozialrechts ab. Besondere Kompetenz bei Klageverfahren vor den Sozialgerichten Baden-Wuerttembergs und bei komplexen KdU-Faellen.',
    pkh: true,
    erstberatungKostenlos: false,
    sprachen: ['Deutsch', 'Englisch', 'Italienisch'],
  },
  {
    name: 'Arbeitsloseninitiative Hannover',
    typ: 'beratung',
    fachgebiet: ['SGB II', 'Widerspruchsverfahren', 'Sanktionen', 'KdU'],
    stadt: 'Hannover',
    plz: '30159',
    telefon: '0511 3344556',
    email: 'info@arbeitsloseninitiative-hannover.de',
    website: 'https://www.ali-hannover.de',
    bewertung: 4.5,
    beschreibung:
      'Seit ueber 20 Jahren bietet die Arbeitsloseninitiative Hannover kostenlose Beratung fuer Menschen im Buergergeld-Bezug. Erfahrene Berater helfen bei Widerspruechen, begleiten zu Jobcenter-Terminen und bieten regelmaessige Informationsveranstaltungen.',
    pkh: false,
    erstberatungKostenlos: true,
    sprachen: ['Deutsch', 'Englisch', 'Arabisch', 'Farsi'],
  },
  {
    name: 'RA Dr. Jan-Philipp Reuter',
    typ: 'anwalt',
    fachgebiet: ['SGB II', 'SGB III', 'SGB XII', 'Klageverfahren', 'Widerspruchsverfahren'],
    stadt: 'Bremen',
    plz: '28195',
    telefon: '0421 5566778',
    email: 'reuter@sozialrecht-bremen.de',
    website: 'https://www.dr-reuter-sozialrecht.de',
    bewertung: 4.8,
    beschreibung:
      'Promovierter Fachanwalt fuer Sozialrecht mit umfassender Expertise im gesamten Sozialgesetzbuch. Publiziert regelmaessig zu aktuellen Entwicklungen im Buergergeld-Recht. Vertritt Mandanten auch in Revisionsverfahren vor dem Bundessozialgericht.',
    pkh: true,
    erstberatungKostenlos: true,
    sprachen: ['Deutsch', 'Englisch', 'Niederlaendisch'],
  },
]

function StarRating({ bewertung }: { bewertung: number }) {
  const full = Math.floor(bewertung)
  const hasHalf = bewertung - full >= 0.3
  const empty = 5 - full - (hasHalf ? 1 : 0)

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`full-${i}`} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      ))}
      {hasHalf && (
        <div className="relative w-4 h-4">
          <Star className="absolute w-4 h-4 text-gray-300 dark:text-gray-600" />
          <div className="absolute overflow-hidden w-1/2 h-4">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          </div>
        </div>
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300 dark:text-gray-600" />
      ))}
      <span className="ml-1 text-sm font-medium text-muted-foreground">{bewertung.toFixed(1)}</span>
    </div>
  )
}

export default function AnwaltsSuche() {
  useDocumentTitle('Anwaltssuche - BescheidBoxer')

  const [suchbegriff, setSuchbegriff] = useState('')
  const [filterTyp, setFilterTyp] = useState<AnwaltEintrag['typ'] | 'alle'>('alle')
  const [filterFachgebiete, setFilterFachgebiete] = useState<string[]>([])
  const [nurErstberatungKostenlos, setNurErstberatungKostenlos] = useState(false)
  const [nurPkh, setNurPkh] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const toggleFachgebiet = (fg: string) => {
    setFilterFachgebiete((prev) =>
      prev.includes(fg) ? prev.filter((f) => f !== fg) : [...prev, fg]
    )
  }

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filterTyp !== 'alle') count++
    if (filterFachgebiete.length > 0) count++
    if (nurErstberatungKostenlos) count++
    if (nurPkh) count++
    return count
  }, [filterTyp, filterFachgebiete, nurErstberatungKostenlos, nurPkh])

  const resetFilters = () => {
    setSuchbegriff('')
    setFilterTyp('alle')
    setFilterFachgebiete([])
    setNurErstberatungKostenlos(false)
    setNurPkh(false)
  }

  const ergebnisse = useMemo(() => {
    return eintraege.filter((e) => {
      if (filterTyp !== 'alle' && e.typ !== filterTyp) return false
      if (nurErstberatungKostenlos && !e.erstberatungKostenlos) return false
      if (nurPkh && !e.pkh) return false
      if (
        filterFachgebiete.length > 0 &&
        !filterFachgebiete.some((fg) => e.fachgebiet.includes(fg))
      )
        return false
      if (suchbegriff) {
        const q = suchbegriff.toLowerCase()
        return (
          e.name.toLowerCase().includes(q) ||
          e.stadt.toLowerCase().includes(q) ||
          e.plz.includes(q) ||
          e.beschreibung.toLowerCase().includes(q) ||
          e.fachgebiet.some((fg) => fg.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [suchbegriff, filterTyp, filterFachgebiete, nurErstberatungKostenlos, nurPkh])

  const filterSection = (
    <div className="space-y-6">
      {/* Typ Filter */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-foreground">Typ</h3>
        <div className="flex flex-wrap gap-2">
          {(['alle', 'anwalt', 'kanzlei', 'beratung', 'verein'] as const).map((typ) => (
            <Button
              key={typ}
              variant={filterTyp === typ ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterTyp(typ)}
              className="text-xs"
            >
              {typ === 'alle' ? 'Alle' : typLabels[typ]}
            </Button>
          ))}
        </div>
      </div>

      {/* Fachgebiet Filter */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-foreground">Fachgebiet</h3>
        <div className="flex flex-wrap gap-2">
          {alleFachgebiete.map((fg) => {
            const isActive = filterFachgebiete.includes(fg)
            return (
              <button
                key={fg}
                onClick={() => toggleFachgebiet(fg)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                }`}
              >
                {isActive && <Check className="w-3 h-3" />}
                {fg}
              </button>
            )
          })}
        </div>
      </div>

      {/* Toggle Filters */}
      <div className="space-y-3">
        <button
          onClick={() => setNurErstberatungKostenlos(!nurErstberatungKostenlos)}
          className="flex items-center gap-3 w-full text-left group"
        >
          <div
            className={`relative w-10 h-5 rounded-full transition-colors ${
              nurErstberatungKostenlos ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                nurErstberatungKostenlos ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </div>
          <span className="text-sm text-foreground group-hover:text-primary transition-colors">
            Nur mit kostenloser Erstberatung
          </span>
        </button>

        <button
          onClick={() => setNurPkh(!nurPkh)}
          className="flex items-center gap-3 w-full text-left group"
        >
          <div
            className={`relative w-10 h-5 rounded-full transition-colors ${
              nurPkh ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                nurPkh ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </div>
          <span className="text-sm text-foreground group-hover:text-primary transition-colors">
            Nur mit Prozesskostenhilfe (PKH)
          </span>
        </button>
      </div>

      {/* Reset */}
      {activeFilterCount > 0 && (
        <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs w-full">
          Alle Filter zuruecksetzen ({activeFilterCount} aktiv)
        </Button>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: 'Startseite', href: '/' },
            { label: 'Anwaltssuche' },
          ]}
          className="mb-4"
        />

        {/* Hero Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white mb-4 shadow-lg">
            <Scale className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Anwaltssuche fuer Sozialrecht
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Finde Rechtsanwaelte, Kanzleien und Beratungsstellen in deiner Naehe, die auf
            Sozialrecht spezialisiert sind und dir bei Problemen mit dem Jobcenter helfen koennen.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Name, Stadt oder PLZ suchen..."
              value={suchbegriff}
              onChange={(e) => setSuchbegriff(e.target.value)}
              className="pl-10 py-6 text-base"
            />
          </div>
        </div>

        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-6">
          <Button
            variant="outline"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="w-full flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
            </span>
            {filtersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          {filtersOpen && (
            <Card className="mt-3">
              <CardContent className="pt-4">{filterSection}</CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <Card className="sticky top-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filter
                </CardTitle>
              </CardHeader>
              <CardContent>{filterSection}</CardContent>
            </Card>
          </aside>

          {/* Results */}
          <main className="flex-1 min-w-0">
            {/* Results Count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{ergebnisse.length}</span>{' '}
                {ergebnisse.length === 1 ? 'Ergebnis' : 'Ergebnisse'} gefunden
              </p>
            </div>

            {/* Results Grid */}
            {ergebnisse.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Keine Ergebnisse</h3>
                  <p className="text-muted-foreground mb-4">
                    Fuer deine Filterkriterien wurden keine Eintraege gefunden.
                  </p>
                  <Button variant="outline" onClick={resetFilters}>
                    Filter zuruecksetzen
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {ergebnisse.map((eintrag, index) => {
                  const TypIcon = typIcons[eintrag.typ]
                  return (
                    <Card
                      key={index}
                      className="hover:shadow-md transition-shadow border-border"
                    >
                      <CardContent className="p-5 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                          {/* Icon */}
                          <div
                            className={`hidden sm:flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0 ${typColors[eintrag.typ]}`}
                          >
                            <TypIcon className="w-6 h-6" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {/* Header Row */}
                            <div className="flex flex-wrap items-start gap-2 mb-2">
                              <Badge
                                variant="outline"
                                className={`text-xs ${typColors[eintrag.typ]}`}
                              >
                                {typLabels[eintrag.typ]}
                              </Badge>
                              {eintrag.pkh && (
                                <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800 text-xs">
                                  <Shield className="w-3 h-3 mr-1" />
                                  PKH
                                </Badge>
                              )}
                              {eintrag.erstberatungKostenlos && (
                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800 text-xs">
                                  <Check className="w-3 h-3 mr-1" />
                                  Erstberatung kostenlos
                                </Badge>
                              )}
                            </div>

                            {/* Name and Location */}
                            <h3 className="text-lg font-semibold text-foreground mb-1">
                              {eintrag.name}
                            </h3>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                              {eintrag.plz} {eintrag.stadt}
                            </div>

                            {/* Rating */}
                            <div className="mb-3">
                              <StarRating bewertung={eintrag.bewertung} />
                            </div>

                            {/* Description */}
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                              {eintrag.beschreibung}
                            </p>

                            {/* Fachgebiete */}
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {eintrag.fachgebiet.map((fg) => (
                                <Badge
                                  key={fg}
                                  variant="outline"
                                  className="text-xs bg-muted/50"
                                >
                                  {fg}
                                </Badge>
                              ))}
                            </div>

                            {/* Sprachen */}
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                              <Languages className="w-3.5 h-3.5 flex-shrink-0" />
                              {eintrag.sprachen.join(', ')}
                            </div>

                            {/* Contact Row */}
                            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border">
                              <a
                                href={`tel:${eintrag.telefon.replace(/\s/g, '')}`}
                                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                {eintrag.telefon}
                              </a>
                              <a
                                href={`mailto:${eintrag.email}`}
                                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <Mail className="w-3.5 h-3.5" />
                                {eintrag.email}
                              </a>
                              <a
                                href={eintrag.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <Globe className="w-3.5 h-3.5" />
                                Webseite
                                <ExternalLink className="w-3 h-3" />
                              </a>
                              <div className="flex-1" />
                              <a href={`mailto:${eintrag.email}`}>
                                <Button size="sm" className="gap-1.5">
                                  <Mail className="w-3.5 h-3.5" />
                                  Kontakt aufnehmen
                                </Button>
                              </a>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </main>
        </div>

        {/* Info Box: Was ist PKH? */}
        <Card className="mt-12 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30">
          <CardContent className="p-6 sm:p-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <Info className="w-5 h-5 text-blue-700 dark:text-blue-300" />
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  Was ist Prozesskostenhilfe (PKH)?
                </h2>
                <p className="text-sm text-muted-foreground mb-3">
                  Prozesskostenhilfe (PKH) uebernimmt die Kosten fuer einen Rechtsanwalt und die
                  Gerichtskosten, wenn Sie sich einen Prozess vor dem Sozialgericht nicht leisten
                  koennen. Als Buergergeld-Empfaenger haben Sie in der Regel Anspruch auf PKH, wenn
                  Ihre Klage oder Ihr Widerspruch hinreichende Aussicht auf Erfolg hat. Der Antrag
                  wird beim zustaendigen Sozialgericht gestellt - Ihr Anwalt hilft Ihnen dabei.
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  <strong>Wichtig:</strong> Auch fuer die aussergerichtliche Beratung gibt es
                  Hilfe: Mit einem <strong>Beratungshilfeschein</strong> vom Amtsgericht koennen
                  Sie sich kostenlos von einem Rechtsanwalt beraten lassen. Der Eigenanteil betraegt
                  maximal 15 Euro.
                </p>
                <Link to="/rechner/pkh">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Scale className="w-4 h-4" />
                    PKH-Rechner oeffnen
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <div className="mt-8 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Hinweis:</strong> Dies ist eine Beispiel-Datenbank. Bitte verifiziere alle
              Angaben direkt bei den Anbietern. Die Bewertungen und Kontaktdaten dienen nur zu
              Demonstrationszwecken und stellen keine Empfehlung dar.
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
