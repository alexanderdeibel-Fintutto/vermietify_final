import { Phone, AlertTriangle, Shield, Heart, Scale, MessageCircle, ExternalLink, Info, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import Breadcrumbs from '@/components/Breadcrumbs'

const HOTLINES = [
  {
    name: 'Telefonseelsorge',
    nummer: '0800 111 0 111',
    alternativ: '0800 111 0 222',
    beschreibung: 'Kostenlose, anonyme Beratung rund um die Uhr - bei seelischen Krisen und Suizidgedanken',
    zeiten: '24/7, kostenlos',
    icon: Heart,
    color: 'red',
  },
  {
    name: 'Sozialberatung (Caritas)',
    nummer: '0800 111 0 333',
    beschreibung: 'Allgemeine Sozialberatung - Hilfe bei Behoerdenproblemen, Schulden, Wohnungsnot',
    zeiten: 'Mo-Fr 8-18 Uhr, kostenlos',
    icon: Shield,
    color: 'blue',
  },
  {
    name: 'Schuldnerberatung',
    nummer: '0800 664 5 775',
    beschreibung: 'Beratung bei Ueberschuldung und finanziellen Notlagen',
    zeiten: 'Mo-Fr 9-17 Uhr, kostenlos',
    icon: Scale,
    color: 'amber',
  },
  {
    name: 'Hilfetelefon Gewalt',
    nummer: '116 016',
    beschreibung: 'Hilfe bei Gewalt gegen Frauen - mehrsprachig, anonym, vertraulich',
    zeiten: '24/7, kostenlos',
    icon: Shield,
    color: 'purple',
  },
  {
    name: 'Kinder- und Jugendtelefon',
    nummer: '116 111',
    beschreibung: 'Beratung fuer Kinder und Jugendliche bei Problemen und Sorgen',
    zeiten: 'Mo-Sa 14-20 Uhr, kostenlos',
    icon: Heart,
    color: 'green',
  },
]

const SOFORTHILFE = [
  {
    titel: 'Strom/Gas wird abgestellt',
    schritte: [
      'Sofort beim Jobcenter Antrag auf Uebernahme der Energieschulden stellen (§ 24 Abs. 1 SGB II)',
      'Energieversorger ueber den Antrag informieren und um Aufschub bitten',
      'Eilantrag beim Sozialgericht stellen wenn das Jobcenter nicht reagiert',
      'Verbraucherzentrale kontaktieren fuer Beratung zur Stromsperre',
    ],
  },
  {
    titel: 'Wohnung wird gekuendigt',
    schritte: [
      'Innerhalb von 2 Monaten nach Kuendigung Widerspruch einlegen',
      'Jobcenter ueber die Kuendigung informieren - Antrag auf Mietschuldenuebernahme (§ 22 Abs. 8 SGB II)',
      'Eilantrag beim Sozialgericht bei drohendem Wohnungsverlust',
      'Schuldnerberatung kontaktieren wenn Mietschulden bestehen',
    ],
  },
  {
    titel: 'Kein Geld fuer Essen',
    schritte: [
      'Tafel in deiner Naehe aufsuchen (www.tafel.de)',
      'Beim Jobcenter Vorschuss/Abschlagszahlung beantragen',
      'Kirchengemeinden bieten oft Soforthilfe an',
      'Eilantrag beim Sozialgericht wenn Jobcenter nicht zahlt',
    ],
  },
  {
    titel: 'Bescheid mit 100% Sanktion',
    schritte: [
      'Sofort Widerspruch einlegen (Frist: 1 Monat!)',
      'Eilantrag beim Sozialgericht auf einstweilige Anordnung',
      'Beratungsstelle oder Anwalt fuer Sozialrecht aufsuchen',
      'Prozesskostenhilfe beantragen wenn kein Geld fuer Anwalt',
    ],
  },
  {
    titel: 'Obdachlosigkeit droht',
    schritte: [
      'Ordnungsamt/Sozialamt kontaktieren - Pflicht zur Notunterbringung!',
      'Jobcenter ueber drohende Obdachlosigkeit informieren',
      'Notunterkuenfte und Waermestuben in deiner Stadt aufsuchen',
      'Diakonie oder Caritas Beratungsstelle aufsuchen',
    ],
  },
]

const BERATUNGSSTELLEN = [
  { name: 'Erwerbslosenvereine', url: 'https://www.erwerbslos.de', beschreibung: 'Bundesweite Uebersicht von Erwerbsloseninitiativen' },
  { name: 'Sozialverband VdK', url: 'https://www.vdk.de', beschreibung: 'Sozialrechtsberatung und Vertretung vor Gericht' },
  { name: 'Sozialverband SoVD', url: 'https://www.sovd.de', beschreibung: 'Beratung im Sozialrecht, Mitgliedschaft ab 6 EUR/Monat' },
  { name: 'Pro Asyl', url: 'https://www.proasyl.de', beschreibung: 'Beratung fuer Gefluechtete zu Sozialleistungen' },
  { name: 'Tacheles e.V.', url: 'https://www.tacheles-sozialhilfe.de', beschreibung: 'Online-Beratung und Wissensportal zu SGB II' },
]

export default function NotfallSeite() {
  useDocumentTitle('Notfall-Hilfe - BescheidBoxer')

  const colorMap: Record<string, string> = {
    red: 'bg-red-50 border-red-200 text-red-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    green: 'bg-green-50 border-green-200 text-green-800',
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Breadcrumbs items={[{ label: 'Startseite', href: '/' }, { label: 'Notfall-Hilfe' }]} className="mb-4" />

        {/* Header */}
        <div className="bg-red-600 text-white rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-10 w-10" />
            <h1 className="text-3xl font-bold">Notfall-Hilfe</h1>
          </div>
          <p className="text-red-100 text-lg">
            Du bist in einer Notlage? Hier findest du sofortige Hilfe, kostenlose Hotlines und konkrete Schritte fuer akute Probleme.
          </p>
          <div className="mt-4 p-4 bg-white/10 rounded-lg">
            <p className="font-semibold flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Im akuten Notfall: 112 (Rettungsdienst) oder 110 (Polizei)
            </p>
          </div>
        </div>

        {/* Hotlines */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Phone className="h-6 w-6 text-red-600" />
            Kostenlose Hotlines
          </h2>
          <div className="space-y-3">
            {HOTLINES.map((h) => (
              <div key={h.name} className={`rounded-xl border-2 p-4 ${colorMap[h.color]}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h.icon className="h-5 w-5" />
                      <h3 className="font-bold text-lg">{h.name}</h3>
                    </div>
                    <p className="text-sm opacity-90 mb-2">{h.beschreibung}</p>
                    <p className="text-xs flex items-center gap-1 opacity-70">
                      <Clock className="h-3 w-3" />
                      {h.zeiten}
                    </p>
                  </div>
                  <div className="text-right">
                    <a href={`tel:${h.nummer.replace(/\s/g, '')}`} className="inline-block">
                      <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 font-bold text-lg">
                        <Phone className="h-4 w-4 mr-2" />
                        {h.nummer}
                      </Button>
                    </a>
                    {h.alternativ && (
                      <p className="text-xs mt-1 opacity-70">oder {h.alternativ}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Soforthilfe */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
            Soforthilfe bei akuten Problemen
          </h2>
          <div className="space-y-4">
            {SOFORTHILFE.map((s) => (
              <details key={s.titel} className="bg-white rounded-xl shadow-sm border border-gray-200 group">
                <summary className="p-4 cursor-pointer font-semibold text-lg flex items-center justify-between hover:bg-gray-50 rounded-xl">
                  {s.titel}
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">&#9660;</span>
                </summary>
                <div className="px-4 pb-4">
                  <ol className="space-y-3">
                    {s.schritte.map((schritt, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-sm">
                          {i + 1}
                        </span>
                        <span className="text-gray-700 pt-0.5">{schritt}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Beratungsstellen */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-blue-600" />
            Beratungsstellen & Hilfsorganisationen
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {BERATUNGSSTELLEN.map((b) => (
              <div key={b.name} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:border-blue-300 transition-colors">
                <h3 className="font-semibold text-lg mb-1">{b.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{b.beschreibung}</p>
                <a
                  href={b.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Website besuchen
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Deine Rechte */}
        <section className="mb-10">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-3 flex items-center gap-2 text-blue-800">
              <Info className="h-6 w-6" />
              Deine Rechte in einer Notlage
            </h2>
            <ul className="space-y-2 text-sm text-blue-900">
              <li className="flex items-start gap-2">
                <Scale className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span><strong>Eilantrag beim Sozialgericht</strong> (§ 86b SGG): Wenn das Jobcenter nicht oder zu spaet handelt, kannst du einen Eilantrag stellen. Das Gericht kann innerhalb weniger Tage entscheiden.</span>
              </li>
              <li className="flex items-start gap-2">
                <Scale className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span><strong>Prozesskostenhilfe</strong> (§ 114 ZPO): Fuer gerichtliche Verfahren steht dir PKH zu, wenn du die Kosten nicht tragen kannst. Auch fuer Anwaltskosten!</span>
              </li>
              <li className="flex items-start gap-2">
                <Scale className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span><strong>Vorschuss/Abschlagszahlung</strong> (§ 42 SGB I): Das Jobcenter muss dir einen Vorschuss zahlen, wenn ueber deinen Antrag nicht rechtzeitig entschieden wird.</span>
              </li>
              <li className="flex items-start gap-2">
                <Scale className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span><strong>Notunterbringung</strong>: Die Gemeinde ist zur Unterbringung verpflichtet wenn Obdachlosigkeit droht (Polizeirecht/Ordnungsrecht).</span>
              </li>
            </ul>
          </div>
        </section>

        {/* BescheidBoxer Tools */}
        <section>
          <h2 className="text-xl font-bold mb-4">BescheidBoxer kann dir helfen</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/rechner/pkh">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:border-blue-300 transition-colors text-center">
                <Scale className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="font-semibold">PKH-Rechner</p>
                <p className="text-xs text-gray-500">Prozesskostenhilfe berechnen</p>
              </div>
            </Link>
            <Link to="/rechner/fristen">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:border-amber-300 transition-colors text-center">
                <Clock className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                <p className="font-semibold">Fristen-Rechner</p>
                <p className="text-xs text-gray-500">Widerspruchsfrist pruefen</p>
              </div>
            </Link>
            <Link to="/chat">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:border-green-300 transition-colors text-center">
                <MessageCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="font-semibold">KI-Berater</p>
                <p className="text-xs text-gray-500">Sofort Fragen stellen</p>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
