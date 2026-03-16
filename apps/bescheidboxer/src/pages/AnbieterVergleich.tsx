import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Scale,
  Users,
  Building,
  ExternalLink,
  Search,
  Filter,
  Check,
  X,
  Info,
  Shield,
  Star,
  Euro,
  Globe,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import Breadcrumbs from '@/components/Breadcrumbs'

interface Anbieter {
  name: string
  typ: 'verband' | 'verein' | 'gewerkschaft' | 'beratung'
  beschreibung: string
  leistungen: string[]
  kosten: string
  website: string
  bundesweit: boolean
  vertretungVorGericht: boolean
  mitgliedsbeitrag: string
  tipp: string
}

const typLabels: Record<Anbieter['typ'], string> = {
  verband: 'Sozialverband',
  verein: 'Verein',
  gewerkschaft: 'Gewerkschaft',
  beratung: 'Beratungsstelle',
}

const typColors: Record<Anbieter['typ'], string> = {
  verband: 'bg-blue-100 text-blue-800 border-blue-200',
  verein: 'bg-green-100 text-green-800 border-green-200',
  gewerkschaft: 'bg-purple-100 text-purple-800 border-purple-200',
  beratung: 'bg-orange-100 text-orange-800 border-orange-200',
}

const typIcons: Record<Anbieter['typ'], typeof Shield> = {
  verband: Shield,
  verein: Users,
  gewerkschaft: Building,
  beratung: Scale,
}

const anbieterListe: Anbieter[] = [
  {
    name: 'Sozialverband VdK',
    typ: 'verband',
    beschreibung:
      'Deutschlands groesster Sozialverband mit ueber 2,2 Millionen Mitgliedern. Der VdK vertritt Ihre Interessen im Sozialrecht und bietet umfassende Rechtsberatung und -vertretung bei Problemen mit dem Jobcenter, Rentenversicherung und anderen Sozialleistungstraegern.',
    leistungen: [
      'Rechtsberatung im Sozialrecht',
      'Vertretung vor Sozialgerichten',
      'Widerspruchsverfahren gegen Bescheide',
      'Begleitung zu Terminen beim Jobcenter',
      'Pruefung von Buergergeld-Bescheiden',
      'Hilfe bei Antraegen und Formularen',
    ],
    kosten: 'Mitgliedsbeitrag ab ca. 6 EUR/Monat (je nach Landesverband)',
    website: 'https://www.vdk.de',
    bundesweit: true,
    vertretungVorGericht: true,
    mitgliedsbeitrag: 'Ab ca. 6 EUR/Monat',
    tipp: 'Der VdK bietet eine umfassende Rechtsvertretung im gesamten Sozialrecht. Besonders empfehlenswert, wenn Sie regelmaessig Probleme mit Bescheiden haben oder eine Klage vor dem Sozialgericht erwaegen. Die Mitgliedschaft lohnt sich oft schon beim ersten gewonnenen Widerspruch.',
  },
  {
    name: 'Sozialverband SoVD',
    typ: 'verband',
    beschreibung:
      'Der Sozialverband Deutschland (SoVD) ist einer der aeltesten und groessten Sozialverbaende und vertritt die Interessen von Rentnern, Arbeitnehmern und sozial benachteiligten Menschen. Er bietet professionelle Rechtsberatung und Vertretung im Sozialrecht.',
    leistungen: [
      'Rechtsberatung und -vertretung im SGB II',
      'Vertretung vor Sozialgerichten',
      'Pruefung und Widerspruch bei fehlerhaften Bescheiden',
      'Beratung zu Rente und Schwerbehinderung',
      'Hilfe bei Antraegen auf Buergergeld',
      'Unterstuetzung bei Sanktionen und Kuerzungen',
    ],
    kosten: 'Mitgliedsbeitrag variiert je nach Landesverband (ca. 4-8 EUR/Monat)',
    website: 'https://www.sovd.de',
    bundesweit: true,
    vertretungVorGericht: true,
    mitgliedsbeitrag: 'Ca. 4-8 EUR/Monat (je nach Landesverband)',
    tipp: 'Der SoVD bietet aehnliche Leistungen wie der VdK. Vergleichen Sie die Beitraege Ihrer regionalen Landesverbaende - in manchen Bundeslaendern ist der SoVD guenstiger. Beide Verbaende haben eine hohe Erfolgsquote bei Widerspruechen und Klagen.',
  },
  {
    name: 'Tacheles e.V.',
    typ: 'verein',
    beschreibung:
      'Tacheles e.V. ist ein gemeinnuetziger Verein, der sich fuer die Rechte von Erwerbslosen und Sozialhilfeempfaengern einsetzt. Bekannt fuer seine umfangreiche Online-Wissensdatenbank und das Beratungsforum, in dem Experten kostenlos Fragen beantworten.',
    leistungen: [
      'Kostenloses Online-Beratungsforum',
      'Umfangreiche Wissensdatenbank zum SGB II',
      'Mustervorlagen fuer Widersprueche',
      'Aktuelle Informationen zu Rechtsaenderungen',
      'Tipps zur Durchsetzung von Anspruechen',
      'Vernetzung mit anderen Betroffenen',
    ],
    kosten: 'Kostenlos (Online-Beratung)',
    website: 'https://www.tacheles-sozialhilfe.de',
    bundesweit: true,
    vertretungVorGericht: false,
    mitgliedsbeitrag: 'Keine Mitgliedschaft noetig',
    tipp: 'Tacheles ist die erste Anlaufstelle fuer schnelle, kostenlose Online-Hilfe. Nutzen Sie das Forum, um Ihre Fragen zu stellen - erfahrene Berater antworten oft innerhalb weniger Stunden. Die Wissensdatenbank ist ideal, um sich selbst ueber Ihre Rechte zu informieren.',
  },
  {
    name: 'Erwerbslosenvereine (lokal)',
    typ: 'verein',
    beschreibung:
      'In vielen Staedten gibt es lokale Erwerbslosenvereine und -initiativen, die praktische Hilfe im Alltag bieten. Sie kennen die oertlichen Gegebenheiten und begleiten Sie bei Behoerdengaengen. Die Beratung ist in der Regel kostenlos und niedrigschwellig.',
    leistungen: [
      'Persoenliche Begleitung zum Jobcenter',
      'Hilfe beim Ausfuellen von Antraegen',
      'Gemeinsames Pruefen von Bescheiden',
      'Erfahrungsaustausch mit anderen Betroffenen',
      'Weiterleitung an spezialisierte Beratungsstellen',
      'Soziale Kontakte und Unterstuetzungsnetzwerk',
    ],
    kosten: 'In der Regel kostenlos',
    website: 'https://www.erwerbslos.de',
    bundesweit: false,
    vertretungVorGericht: false,
    mitgliedsbeitrag: 'Meist kostenlos oder freiwilliger Beitrag',
    tipp: 'Lokale Erwerbslosenvereine sind besonders wertvoll fuer die persoenliche Begleitung zum Jobcenter. Wenn Sie sich bei Terminen unsicher fuehlen oder Angst vor dem Amt haben, kann ein Beistand einen grossen Unterschied machen. Sie duerfen zu jedem Termin eine Person Ihres Vertrauens mitnehmen (\u00a7 13 SGB X).',
  },
  {
    name: 'Caritas / Diakonie',
    typ: 'beratung',
    beschreibung:
      'Die kirchlichen Wohlfahrtsverbaende Caritas (katholisch) und Diakonie (evangelisch) bieten bundesweit kostenlose Sozialberatung an. Sie helfen bei allen Fragen rund um Buergergeld, Wohnen, Schulden und persoenlichen Krisen - unabhaengig von der Religionszugehoerigkeit.',
    leistungen: [
      'Allgemeine Sozialberatung',
      'Hilfe bei Antraegen und Formularen',
      'Schuldnerberatung',
      'Migrationsberatung',
      'Suchtberatung und psychosoziale Hilfe',
      'Vermittlung an spezialisierte Stellen',
    ],
    kosten: 'Kostenlos',
    website: 'https://www.caritas.de/hilfeundberatung',
    bundesweit: true,
    vertretungVorGericht: false,
    mitgliedsbeitrag: 'Keine Mitgliedschaft noetig',
    tipp: 'Caritas und Diakonie sind ideal als erste Anlaufstelle, wenn Sie nicht genau wissen, wo Sie Hilfe bekommen. Die Berater kennen das gesamte Hilfesystem und koennen Sie an die richtige Stelle weiterleiten. Besonders hilfreich bei mehreren Problemen gleichzeitig (z.B. Schulden + Buergergeld).',
  },
  {
    name: 'AWO Beratungsstellen',
    typ: 'beratung',
    beschreibung:
      'Die Arbeiterwohlfahrt (AWO) betreibt in vielen Regionen Beratungsstellen fuer Menschen in sozialen Notlagen. Die Beratung ist kostenlos und umfasst Hilfe bei Buergergeld-Problemen, Wohnungssuche, Schuldenregulierung und Integration.',
    leistungen: [
      'Sozialberatung fuer Buergergeld-Empfaenger',
      'Hilfe bei Problemen mit dem Jobcenter',
      'Schuldnerberatung',
      'Wohnungsnotfallhilfe',
      'Beratung fuer Familien und Alleinerziehende',
      'Integrationsberatung',
    ],
    kosten: 'Kostenlos',
    website: 'https://www.awo.org',
    bundesweit: false,
    vertretungVorGericht: false,
    mitgliedsbeitrag: 'Keine Mitgliedschaft noetig',
    tipp: 'Die AWO ist besonders stark in der Beratung fuer Familien und Alleinerziehende. Wenn Sie Kinder haben und Probleme mit dem Jobcenter, finden Sie hier oft spezialisierte Berater, die Ihre besondere Situation verstehen und passende Hilfsangebote kennen.',
  },
  {
    name: 'Gewerkschaften (DGB)',
    typ: 'gewerkschaft',
    beschreibung:
      'Die Gewerkschaften des Deutschen Gewerkschaftsbundes (DGB) bieten ihren Mitgliedern umfassenden Rechtsschutz, auch im Sozialrecht. Wenn Sie vor Ihrer Erwerbslosigkeit Gewerkschaftsmitglied waren, koennen Sie den Rechtsschutz oft weiter nutzen.',
    leistungen: [
      'Rechtsschutz im Sozialrecht fuer Mitglieder',
      'Vertretung vor Arbeits- und Sozialgerichten',
      'Beratung bei Kuendigung und Arbeitslosigkeit',
      'Pruefung von Sperrzeiten und Sanktionen',
      'Hilfe beim Uebergang ALG I zu Buergergeld',
      'Unterstuetzung bei Weiterbildung und Umschulung',
    ],
    kosten: 'Fuer Gewerkschaftsmitglieder im Beitrag enthalten',
    website: 'https://www.dgb.de',
    bundesweit: true,
    vertretungVorGericht: true,
    mitgliedsbeitrag: 'Ca. 1% des Bruttoeinkommens (reduziert bei Erwerbslosigkeit)',
    tipp: 'Wenn Sie bereits Gewerkschaftsmitglied sind, nutzen Sie unbedingt den enthaltenen Rechtsschutz! Auch bei Erwerbslosigkeit besteht der Rechtsschutz fort, oft zu einem reduzierten Beitrag. Der gewerkschaftliche Rechtsschutz ist qualitativ gleichwertig mit einem Anwalt und fuer Mitglieder kostenlos.',
  },
  {
    name: 'Anwaltliche Erstberatung',
    typ: 'beratung',
    beschreibung:
      'Mit einem Beratungshilfeschein vom Amtsgericht koennen Sie sich kostenlos von einem Rechtsanwalt beraten lassen. Dieser Weg ist besonders empfehlenswert bei komplexen Faellen, die eine individuelle rechtliche Einschaetzung erfordern.',
    leistungen: [
      'Individuelle Rechtspruefung Ihres Falles',
      'Einschaetzung der Erfolgsaussichten',
      'Formulierung von Widerspruechen und Klagen',
      'Vertretung vor dem Sozialgericht (mit PKH)',
      'Beratung zu allen Bereichen des Sozialrechts',
      'Durchsetzung von Nachzahlungsanspruechen',
    ],
    kosten: 'Mit Beratungshilfeschein kostenlos (sonst 15 EUR Eigenanteil)',
    website: 'https://www.anwaltauskunft.de',
    bundesweit: true,
    vertretungVorGericht: true,
    mitgliedsbeitrag: 'Keine Mitgliedschaft - Beratungshilfeschein beim Amtsgericht beantragen',
    tipp: 'Den Beratungshilfeschein erhalten Sie beim Amtsgericht Ihres Wohnortes. Als Buergergeld-Empfaenger haben Sie in der Regel Anspruch darauf. Bringen Sie Ihren aktuellen Leistungsbescheid und den strittigen Bescheid mit. Viele Anwaelte akzeptieren auch eine nachtraegliche Beantragung.',
  },
]

type ViewMode = 'cards' | 'table'

export default function AnbieterVergleich() {
  useDocumentTitle('Beratungsstellen-Vergleich - BescheidBoxer')

  const [searchQuery, setSearchQuery] = useState('')
  const [filterTyp, setFilterTyp] = useState<Anbieter['typ'] | 'alle'>('alle')
  const [filterKostenlos, setFilterKostenlos] = useState(false)
  const [filterVertretung, setFilterVertretung] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [expandedTipp, setExpandedTipp] = useState<string | null>(null)

  const filteredAnbieter = useMemo(() => {
    return anbieterListe.filter((a) => {
      if (filterTyp !== 'alle' && a.typ !== filterTyp) return false
      if (filterKostenlos && !a.kosten.toLowerCase().includes('kostenlos')) return false
      if (filterVertretung && !a.vertretungVorGericht) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          a.name.toLowerCase().includes(q) ||
          a.beschreibung.toLowerCase().includes(q) ||
          a.leistungen.some((l) => l.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [searchQuery, filterTyp, filterKostenlos, filterVertretung])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: 'Startseite', href: '/' },
            { label: 'Beratungsstellen-Vergleich' },
          ]}
          className="mb-4"
        />

        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-boxer rounded-full mb-4">
            <Scale className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Beratungsstellen-Vergleich
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Finden Sie die passende Beratungsstelle fuer Ihr Anliegen. Ob
            Sozialverband, Erwerbslosenverein oder Anwalt mit
            Beratungshilfeschein - hier finden Sie kostenlose und guenstige Hilfe
            bei Problemen mit dem Jobcenter.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {anbieterListe.length} Beratungsstellen im Vergleich
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 mb-8 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <h2 className="text-base font-semibold text-gray-900">
              Filter & Suche
            </h2>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Beratungsstelle suchen (z.B. VdK, Caritas, Rechtsschutz...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Type Filter */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterTyp('alle')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                  filterTyp === 'alle'
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                Alle
              </button>
              {(Object.keys(typLabels) as Anbieter['typ'][]).map((typ) => {
                const Icon = typIcons[typ]
                return (
                  <button
                    key={typ}
                    onClick={() => setFilterTyp(filterTyp === typ ? 'alle' : typ)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                      filterTyp === typ
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {typLabels[typ]}
                  </button>
                )
              })}
            </div>

            <div className="h-6 w-px bg-gray-200 hidden sm:block" />

            {/* Boolean Filters */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterKostenlos(!filterKostenlos)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                  filterKostenlos
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                <Euro className="w-3.5 h-3.5" />
                Nur kostenlos
              </button>
              <button
                onClick={() => setFilterVertretung(!filterVertretung)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                  filterVertretung
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                Vertretung vor Gericht
              </button>
            </div>

            <div className="h-6 w-px bg-gray-200 hidden sm:block" />

            {/* View Toggle */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'cards'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Karten
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Tabelle
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        {(searchQuery || filterTyp !== 'alle' || filterKostenlos || filterVertretung) && (
          <p className="text-sm text-gray-500 mb-4">
            {filteredAnbieter.length}{' '}
            {filteredAnbieter.length === 1 ? 'Beratungsstelle' : 'Beratungsstellen'}{' '}
            gefunden
            {searchQuery && (
              <>
                {' '}fuer <span className="font-medium text-gray-700">&quot;{searchQuery}&quot;</span>
              </>
            )}
          </p>
        )}

        {/* Card View */}
        {viewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {filteredAnbieter.map((anbieter) => {
              const Icon = typIcons[anbieter.typ]
              const isExpanded = expandedTipp === anbieter.name
              return (
                <Card key={anbieter.name} className="flex flex-col h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{anbieter.name}</CardTitle>
                          <Badge
                            className={`mt-1 text-xs border ${typColors[anbieter.typ]}`}
                          >
                            {typLabels[anbieter.typ]}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {anbieter.bundesweit && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 text-xs font-medium border border-sky-100">
                            <Globe className="w-3 h-3" />
                            Bundesweit
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col gap-4">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {anbieter.beschreibung}
                    </p>

                    {/* Leistungen */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-yellow-500" />
                        Leistungen
                      </h4>
                      <ul className="space-y-1">
                        {anbieter.leistungen.slice(0, 4).map((l) => (
                          <li key={l} className="flex items-start gap-2 text-sm text-gray-600">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            {l}
                          </li>
                        ))}
                        {anbieter.leistungen.length > 4 && (
                          <li className="text-xs text-gray-400 ml-6">
                            + {anbieter.leistungen.length - 4} weitere Leistungen
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* Cost and Court */}
                    <div className="space-y-2 border-t border-gray-100 pt-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Euro className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-700 font-medium">{anbieter.kosten}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Scale className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-700">
                          Vertretung vor Gericht:{' '}
                          {anbieter.vertretungVorGericht ? (
                            <span className="inline-flex items-center gap-1 text-green-700 font-medium">
                              <Check className="w-3.5 h-3.5" /> Ja
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-gray-400 font-medium">
                              <X className="w-3.5 h-3.5" /> Nein
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-600">{anbieter.mitgliedsbeitrag}</span>
                      </div>
                    </div>

                    {/* Tipp */}
                    <div className="mt-auto">
                      <button
                        onClick={() =>
                          setExpandedTipp(isExpanded ? null : anbieter.name)
                        }
                        className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Info className="w-4 h-4" />
                        {isExpanded ? 'Tipp ausblenden' : 'Tipp anzeigen'}
                      </button>
                      {isExpanded && (
                        <div className="mt-2 bg-red-50 border border-red-100 rounded-lg p-3">
                          <p className="text-sm text-red-800 leading-relaxed">
                            {anbieter.tipp}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Website Link */}
                    <a
                      href={anbieter.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Website besuchen
                    </a>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <div className="overflow-x-auto mb-10">
            <table className="w-full bg-white border border-gray-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">
                    Beratungsstelle
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">
                    Typ
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">
                    Kosten
                  </th>
                  <th className="text-center px-4 py-3 text-sm font-semibold text-gray-900">
                    Bundesweit
                  </th>
                  <th className="text-center px-4 py-3 text-sm font-semibold text-gray-900">
                    Gerichtsvertretung
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">
                    Mitgliedsbeitrag
                  </th>
                  <th className="text-center px-4 py-3 text-sm font-semibold text-gray-900">
                    Website
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAnbieter.map((anbieter, index) => (
                  <tr
                    key={anbieter.name}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-gray-900">
                        {anbieter.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={`text-xs border ${typColors[anbieter.typ]}`}
                      >
                        {typLabels[anbieter.typ]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">
                        {anbieter.kosten}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {anbieter.bundesweit ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {anbieter.vertretungVorGericht ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {anbieter.mitgliedsbeitrag}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <a
                        href={anbieter.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center text-blue-600 hover:text-blue-700"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {filteredAnbieter.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Keine Beratungsstelle gefunden
            </h3>
            <p className="text-gray-600 mb-4">
              Versuchen Sie andere Filtereinstellungen oder einen anderen
              Suchbegriff.
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setFilterTyp('alle')
                setFilterKostenlos(false)
                setFilterVertretung(false)
              }}
              className="text-red-600 font-medium hover:underline"
            >
              Alle Filter zuruecksetzen
            </button>
          </div>
        )}

        {/* Beratungshilfeschein Info Box */}
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-6 sm:p-8 mb-10">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Info className="w-6 h-6 text-amber-700" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Tipp: Beratungshilfeschein (&sect; 1 BerHG)
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Als Buergergeld-Empfaenger haben Sie Anspruch auf einen{' '}
                <strong>Beratungshilfeschein</strong>. Damit koennen Sie sich{' '}
                <strong>kostenlos</strong> von einem Rechtsanwalt in Sozialrechtsfragen
                beraten lassen. Den Schein erhalten Sie beim Amtsgericht Ihres
                Wohnortes.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="bg-white/70 rounded-lg p-4 border border-amber-100">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    So beantragen Sie den Schein:
                  </h4>
                  <ol className="space-y-1.5 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-amber-700 flex-shrink-0">1.</span>
                      Gehen Sie zum Amtsgericht Ihres Wohnortes
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-amber-700 flex-shrink-0">2.</span>
                      Bringen Sie Ihren Buergergeld-Bescheid und Personalausweis mit
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-amber-700 flex-shrink-0">3.</span>
                      Schildern Sie Ihr Anliegen kurz (z.B. &quot;Widerspruch gegen
                      Bescheid&quot;)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-amber-700 flex-shrink-0">4.</span>
                      Suchen Sie sich einen Anwalt fuer Sozialrecht und legen Sie den
                      Schein vor
                    </li>
                  </ol>
                </div>

                <div className="bg-white/70 rounded-lg p-4 border border-amber-100">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    Wichtige Hinweise:
                  </h4>
                  <ul className="space-y-1.5 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      Die Eigengebuehr betraegt max. 15 EUR (kann erlassen werden)
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      Pro Angelegenheit wird ein Schein ausgestellt
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      Gilt fuer aussergericht&shy;liche Beratung und einfache Schreiben
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      Fuer Klagen gibt es zusaetzlich Prozesskostenhilfe (PKH)
                    </li>
                  </ul>
                </div>
              </div>

              <Link to="/rechner/pkh">
                <Button variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100">
                  <Scale className="w-4 h-4 mr-2" />
                  Zum PKH-Rechner
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Recommendation Section */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 mb-10">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Welche Beratungsstelle passt zu Ihnen?
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <h4 className="font-semibold text-blue-900 mb-2 text-sm">
                Sie brauchen Rechtsvertretung vor Gericht?
              </h4>
              <p className="text-sm text-blue-700 mb-2">
                Sozialverband VdK oder SoVD beitreten. Oder einen Anwalt mit
                Beratungshilfeschein + PKH beauftragen.
              </p>
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <Shield className="w-3.5 h-3.5" />
                VdK, SoVD, Anwalt
              </div>
            </div>

            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <h4 className="font-semibold text-green-900 mb-2 text-sm">
                Sie suchen schnelle, kostenlose Hilfe?
              </h4>
              <p className="text-sm text-green-700 mb-2">
                Tacheles e.V. Online-Forum fuer sofortige Antworten. Caritas
                oder Diakonie fuer persoenliche Beratung vor Ort.
              </p>
              <div className="flex items-center gap-1 text-xs text-green-600">
                <Euro className="w-3.5 h-3.5" />
                Tacheles, Caritas, Diakonie
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
              <h4 className="font-semibold text-purple-900 mb-2 text-sm">
                Sie waren vorher berufstaetig?
              </h4>
              <p className="text-sm text-purple-700 mb-2">
                Pruefen Sie, ob Ihre Gewerkschaftsmitgliedschaft noch besteht.
                DGB-Rechtsschutz ist fuer Mitglieder kostenlos.
              </p>
              <div className="flex items-center gap-1 text-xs text-purple-600">
                <Building className="w-3.5 h-3.5" />
                DGB-Gewerkschaften
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-boxer rounded-2xl text-white p-8 text-center">
          <h3 className="text-2xl font-bold mb-3">
            Bescheid schon geprueft?
          </h3>
          <p className="text-white/90 mb-6 max-w-xl mx-auto">
            Bevor Sie eine Beratungsstelle aufsuchen, pruefen Sie Ihren Bescheid
            mit unserem KI-Bescheid-Scanner. So koennen Sie vorab einschaetzen,
            ob sich ein Widerspruch lohnt.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/scan">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-red-600 hover:bg-gray-100"
              >
                <Shield className="w-5 h-5 mr-2" />
                Bescheid pruefen
              </Button>
            </Link>
            <Link to="/chat">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white/20 text-white border border-white/30 hover:bg-white/30"
              >
                <Scale className="w-5 h-5 mr-2" />
                KI-Berater fragen
              </Button>
            </Link>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-gray-400 text-center mt-8 max-w-2xl mx-auto leading-relaxed">
          Hinweis: Alle Angaben ohne Gewaehr. Die Informationen auf dieser Seite
          dienen der allgemeinen Orientierung und ersetzen keine individuelle
          Rechtsberatung. Beitraege und Leistungsumfang koennen je nach
          Landesverband oder oertlicher Stelle variieren. Bitte informieren Sie
          sich direkt bei der jeweiligen Organisation ueber aktuelle Konditionen.
          Stand: 2025.
        </p>
      </div>
    </div>
  )
}
