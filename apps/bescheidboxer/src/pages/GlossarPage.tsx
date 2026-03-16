import { useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Search, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import useDocumentTitle from '@/hooks/useDocumentTitle'

interface GlossarEntry {
  id: string
  term: string
  legalRef: string
  explanation: string
  link?: { label: string; to: string }
}

const glossarEntries: GlossarEntry[] = [
  {
    id: 'anhoerung',
    term: 'Anhoerung',
    legalRef: '\u00a7 24 SGB X',
    explanation:
      'Bevor das Jobcenter einen belastenden Verwaltungsakt erlassen darf (z.B. Sanktion, Aufhebung oder Rueckforderung), muss es Sie anhoeren. Das bedeutet, Sie bekommen die Gelegenheit, sich zu den entscheidungserheblichen Tatsachen zu aeussern. Reagieren Sie immer schriftlich auf eine Anhoerung und nutzen Sie die Frist voll aus.',
    link: { label: 'Zum KI-Berater', to: '/chat' },
  },
  {
    id: 'anrechenbares-einkommen',
    term: 'Anrechenbares Einkommen',
    legalRef: '\u00a7 11 SGB II',
    explanation:
      'Alle Einnahmen in Geld, die Ihnen zufliessen, gelten grundsaetzlich als Einkommen und werden auf das Buergergeld angerechnet. Dazu zaehlen Lohn, Kindergeld, Unterhalt und Renten. Bestimmte Einnahmen sind jedoch privilegiert oder es gelten Freibetraege, sodass nicht alles vollstaendig angerechnet wird.',
    link: { label: 'Zum Freibetrags-Rechner', to: '/rechner/freibetrag' },
  },
  {
    id: 'aufhebungsbescheid',
    term: 'Aufhebungsbescheid',
    legalRef: '\u00a7\u00a7 45, 48 SGB X',
    explanation:
      'Mit einem Aufhebungsbescheid hebt das Jobcenter eine fruehere Leistungsbewilligung ganz oder teilweise auf. Das kann rueckwirkend geschehen (z.B. wenn Einkommen nicht gemeldet wurde) oder fuer die Zukunft. Gegen einen Aufhebungsbescheid koennen und sollten Sie innerhalb eines Monats Widerspruch einlegen.',
    link: { label: 'Widerspruch einlegen', to: '/musterschreiben' },
  },
  {
    id: 'bedarfsgemeinschaft',
    term: 'Bedarfsgemeinschaft',
    legalRef: '\u00a7 7 Abs. 3 SGB II',
    explanation:
      'Die Bedarfsgemeinschaft (BG) umfasst alle Personen, die zusammen leben und wirtschaften. Dazu gehoeren Sie als Antragsteller, Ihr Partner (Ehe, Lebenspartnerschaft oder eheaehnliche Gemeinschaft) und Ihre unverheirateten Kinder unter 25 Jahren. Das Einkommen und Vermoegen aller BG-Mitglieder wird bei der Berechnung beruecksichtigt.',
    link: { label: 'Zum Buergergeld-Rechner', to: '/rechner/buergergeld' },
  },
  {
    id: 'beratungshilfe',
    term: 'Beratungshilfe',
    legalRef: '\u00a7 1 BerHG',
    explanation:
      'Beratungshilfe ermoeglicht es Ihnen, sich aussergerichtlich anwaltlich beraten zu lassen, ohne die Kosten selbst tragen zu muessen. Beantragen Sie einen Beratungshilfeschein beim Amtsgericht. Die Eigengebuehr betraegt 15 EUR und kann erlassen werden. Als Buergergeld-Empfaenger haben Sie in der Regel Anspruch darauf.',
  },
  {
    id: 'bescheid',
    term: 'Bescheid',
    legalRef: '\u00a7 31 SGB X',
    explanation:
      'Ein Bescheid ist ein schriftlicher Verwaltungsakt des Jobcenters, der Ihre Leistungsansprueche regelt. Er enthaelt die Berechnung Ihrer Leistungen, den Bewilligungszeitraum und eine Rechtsbehelfsbelehrung. Pruefen Sie jeden Bescheid sorgfaeltig - etwa 40-50% aller Bescheide enthalten Fehler.',
    link: { label: 'Bescheid pruefen lassen', to: '/scan' },
  },
  {
    id: 'buergergeld',
    term: 'Buergergeld',
    legalRef: '\u00a7\u00a7 1 ff. SGB II',
    explanation:
      'Das Buergergeld ist seit dem 01.01.2023 die Grundsicherung fuer erwerbsfaehige Leistungsberechtigte und hat Hartz IV abgeloest. Es sichert das Existenzminimum und umfasst den Regelbedarf, Kosten der Unterkunft sowie eventuelle Mehrbedarfe. Der Antrag wird beim oertlichen Jobcenter gestellt.',
    link: { label: 'Zum Buergergeld-Rechner', to: '/rechner/buergergeld' },
  },
  {
    id: 'eingliederungsvereinbarung',
    term: 'Eingliederungsvereinbarung',
    legalRef: '\u00a7 15 SGB II',
    explanation:
      'Die Eingliederungsvereinbarung wurde mit dem Buergergeld durch den Kooperationsplan ersetzt. Dieser wird gemeinsam zwischen Ihnen und Ihrem Ansprechpartner im Jobcenter erstellt und legt Ihre Eingliederungsziele, Massnahmen und Eigenbemuehungen fest. Sie muessen nichts unterschreiben, was Sie fuer unzumutbar halten.',
    link: { label: 'Mehr im Ratgeber', to: '/wissen' },
  },
  {
    id: 'einstweilige-anordnung',
    term: 'Einstweilige Anordnung',
    legalRef: '\u00a7 86b Abs. 2 SGG',
    explanation:
      'Eine einstweilige Anordnung ist ein Eilverfahren beim Sozialgericht. Sie koennen diesen Antrag stellen, wenn Ihnen durch eine Entscheidung des Jobcenters ein schwerer, nicht wiedergutzumachender Nachteil droht (z.B. Obdachlosigkeit durch Leistungskuerzung). Das Gericht entscheidet in der Regel innerhalb weniger Tage.',
  },
  {
    id: 'erstausstattung',
    term: 'Erstausstattung',
    legalRef: '\u00a7 24 Abs. 3 SGB II',
    explanation:
      'Bei Erstbezug einer Wohnung, nach besonderen Umstaenden (Brand, Obdachlosigkeit) oder bei Schwangerschaft und Geburt haben Sie Anspruch auf Erstausstattung. Diese umfasst Moebel, Haushaltsgeraete, Bekleidung oder Babybedarf und wird zusaetzlich zum Regelsatz als einmaliger Bedarf gewaehrt.',
    link: { label: 'Zum Erstausstattungs-Rechner', to: '/rechner/erstausstattung' },
  },
  {
    id: 'freibetrag',
    term: 'Freibetrag',
    legalRef: '\u00a7 11b SGB II',
    explanation:
      'Freibetraege schuetzen einen Teil Ihres Erwerbseinkommens vor der Anrechnung auf das Buergergeld. Es gilt ein Grundfreibetrag von 100 EUR, dazu 20% vom Einkommen zwischen 100-520 EUR und 10% zwischen 520-1.000 EUR. So lohnt sich Arbeit neben dem Buergergeld finanziell.',
    link: { label: 'Zum Freibetrags-Rechner', to: '/rechner/freibetrag' },
  },
  {
    id: 'karenzzeit',
    term: 'Karenzzeit',
    legalRef: '\u00a7 12 Abs. 3, \u00a7 22 Abs. 1 SGB II',
    explanation:
      'In den ersten 12 Monaten des Leistungsbezugs gelten erleichterte Bedingungen. Vermoegen wird nur beruecksichtigt, wenn es erheblich ist (ueber 40.000 EUR fuer die erste Person). Ausserdem werden die tatsaechlichen Mietkosten uebernommen, auch wenn sie ueber der Angemessenheitsgrenze liegen.',
    link: { label: 'Zum Schonvermoegen-Rechner', to: '/rechner/schonvermoegen' },
  },
  {
    id: 'kooperationsplan',
    term: 'Kooperationsplan',
    legalRef: '\u00a7 15 SGB II',
    explanation:
      'Der Kooperationsplan hat die fruehere Eingliederungsvereinbarung abgeloest. Er wird gemeinsam mit Ihrem Ansprechpartner im Jobcenter erstellt und dokumentiert Ihre beruflichen Ziele und die vereinbarten Massnahmen. In den ersten 6 Monaten (Vertrauenszeit) sind keine Sanktionen wegen des Kooperationsplans moeglich.',
  },
  {
    id: 'kosten-der-unterkunft',
    term: 'Kosten der Unterkunft (KdU)',
    legalRef: '\u00a7 22 SGB II',
    explanation:
      'Neben dem Regelbedarf uebernimmt das Jobcenter die tatsaechlichen Kosten fuer Miete und Heizung, sofern diese angemessen sind. Die Angemessenheitsgrenze richtet sich nach dem oertlichen Mietspiegel und der Haushaltsgroesse. In der Karenzzeit (12 Monate) werden auch unangemessene Kosten voll uebernommen.',
    link: { label: 'Zum KdU-Rechner', to: '/rechner/kdu' },
  },
  {
    id: 'leistungszeitraum',
    term: 'Leistungszeitraum',
    legalRef: '\u00a7 41 Abs. 3 SGB II',
    explanation:
      'Der Leistungszeitraum (auch Bewilligungszeitraum) betraegt in der Regel 12 Monate. Fuer diesen Zeitraum werden Ihre Leistungen bewilligt. Vor Ablauf muessen Sie einen Weiterbewilligungsantrag stellen, damit Ihre Leistungen nahtlos weitergezahlt werden.',
    link: { label: 'Zur Checkliste', to: '/checklisten' },
  },
  {
    id: 'mehrbedarf',
    term: 'Mehrbedarf',
    legalRef: '\u00a7 21 SGB II',
    explanation:
      'Neben dem Regelsatz koennen Sie zusaetzliche Leistungen fuer besondere Lebenslagen erhalten. Mehrbedarfe gibt es z.B. fuer Schwangere (17%), Alleinerziehende (12-60%), Menschen mit Behinderung (35%) oder bei kostenaufwaendiger Ernaehrung. Der Mehrbedarf muss beim Jobcenter beantragt werden.',
    link: { label: 'Zum Mehrbedarf-Rechner', to: '/rechner/mehrbedarf' },
  },
  {
    id: 'mitwirkungspflicht',
    term: 'Mitwirkungspflicht',
    legalRef: '\u00a7\u00a7 60 ff. SGB I',
    explanation:
      'Als Buergergeld-Empfaenger sind Sie verpflichtet, an der Aufklaerung Ihres Falles mitzuwirken. Dazu gehoert das Erscheinen zu Meldeterminen, die Vorlage von Unterlagen und die Mitteilung von Aenderungen (z.B. neues Einkommen, Umzug). Bei Verstoss koennen Leistungen versagt oder gemindert werden.',
  },
  {
    id: 'ortsabwesenheit',
    term: 'Ortsabwesenheit',
    legalRef: '\u00a7 7 Abs. 4a SGB II',
    explanation:
      'Sie duerfen sich ohne vorherige Genehmigung bis zu 3 Wochen pro Kalenderjahr ausserhalb Ihres Wohnorts aufhalten (z.B. Urlaub). Laengere Abwesenheit muss vom Jobcenter genehmigt werden. Waehrend genehmigter Ortsabwesenheit werden die Leistungen weitergezahlt. Ohne Genehmigung droht eine Leistungseinstellung.',
  },
  {
    id: 'prozesskostenhilfe',
    term: 'Prozesskostenhilfe (PKH)',
    legalRef: '\u00a7 73a SGG i.V.m. \u00a7\u00a7 114 ff. ZPO',
    explanation:
      'PKH uebernimmt die Kosten fuer einen Rechtsanwalt bei Klagen vor dem Sozialgericht. Als Buergergeld-Empfaenger haben Sie in der Regel Anspruch, wenn Ihre Klage hinreichende Aussicht auf Erfolg hat. Das Verfahren vor dem Sozialgericht selbst ist fuer Leistungsempfaenger ohnehin gerichtskostenfrei.',
    link: { label: 'Zum PKH-Rechner', to: '/rechner/pkh' },
  },
  {
    id: 'regelbedarf',
    term: 'Regelbedarf',
    legalRef: '\u00a7 20 SGB II',
    explanation:
      'Der Regelbedarf ist der monatliche Pauschalbetrag zur Deckung des Lebensunterhalts. Er umfasst Ernaehrung, Kleidung, Koerperpflege, Hausrat, Strom und Teilhabe am gesellschaftlichen Leben. Die Hoehe richtet sich nach der Regelbedarfsstufe und wird jaehrlich angepasst. 2025 betraegt er fuer Alleinstehende 563 EUR.',
    link: { label: 'Zum Buergergeld-Rechner', to: '/rechner/buergergeld' },
  },
  {
    id: 'regelsatz',
    term: 'Regelsatz',
    legalRef: '\u00a7 20 SGB II',
    explanation:
      'Der Regelsatz ist der umgangssprachliche Begriff fuer den Regelbedarf. Er bezeichnet den monatlichen Geldbetrag, den Sie fuer den taeglichen Lebensunterhalt erhalten. Es gibt 6 Regelbedarfsstufen, die sich nach Alter und Stellung in der Bedarfsgemeinschaft richten.',
  },
  {
    id: 'rueckforderung',
    term: 'Rueckforderung',
    legalRef: '\u00a7 50 SGB X',
    explanation:
      'Hat das Jobcenter Ihnen zu viel Leistungen gezahlt (z.B. weil Einkommen nicht gemeldet wurde oder ein Fehler des Amtes vorlag), kann es den ueberzahlten Betrag zurueckfordern. Pruefen Sie Rueckforderungsbescheide genau - haeufig sind die Berechnungen fehlerhaft oder die Fristen nicht eingehalten.',
    link: { label: 'Bescheid pruefen lassen', to: '/scan' },
  },
  {
    id: 'sanktion',
    term: 'Sanktion',
    legalRef: '\u00a7\u00a7 31-32 SGB II',
    explanation:
      'Sanktionen (Leistungsminderungen) sind Kuerzungen des Buergergeldes bei Pflichtverletzungen, z.B. wenn Sie einen Meldetermin ohne wichtigen Grund versaeumen oder eine zumutbare Arbeit ablehnen. Seit der Buergergeld-Reform sind maximal 30% Kuerzung zulaessig. Legen Sie bei jeder Sanktion Widerspruch ein.',
    link: { label: 'Zum Sanktions-Rechner', to: '/rechner/sanktion' },
  },
  {
    id: 'schonvermoegen',
    term: 'Schonvermoegen',
    legalRef: '\u00a7 12 SGB II',
    explanation:
      'Schonvermoegen ist der Teil Ihres Vermoegens, der nicht auf das Buergergeld angerechnet wird. Nach der Karenzzeit betraegt es 15.000 EUR pro Person in der Bedarfsgemeinschaft. Auch eine angemessene Immobilie, ein Kfz pro erwerbsfaehigem BG-Mitglied und Riester-Rente sind geschuetzt.',
    link: { label: 'Zum Schonvermoegen-Rechner', to: '/rechner/schonvermoegen' },
  },
  {
    id: 'sozialgericht',
    term: 'Sozialgericht',
    legalRef: '\u00a7\u00a7 1, 51 SGG',
    explanation:
      'Das Sozialgericht ist die erste Instanz fuer Klagen gegen Entscheidungen des Jobcenters. Wenn Ihr Widerspruch abgelehnt wurde, koennen Sie innerhalb eines Monats Klage erheben. Das Verfahren ist fuer Leistungsempfaenger kostenfrei - es entstehen keine Gerichtsgebuehren, auch nicht bei Verlust des Prozesses.',
  },
  {
    id: 'uebergangsgeld',
    term: 'Uebergangsgeld',
    legalRef: '\u00a7 20 SGB VI',
    explanation:
      'Uebergangsgeld ist eine Leistung der Rentenversicherung, die waehrend einer medizinischen oder beruflichen Rehabilitation gezahlt wird. Es ersetzt das bisherige Einkommen teilweise und wird auf das Buergergeld als Einkommen angerechnet. Die Hoehe richtet sich nach dem letzten Nettoeinkommen.',
  },
  {
    id: 'ueberpruefungsantrag',
    term: 'Ueberpruefungsantrag',
    legalRef: '\u00a7 44 SGB X',
    explanation:
      'Mit einem Ueberpruefungsantrag koennen Sie bestandskraeftige (nicht mehr anfechtbare) Bescheide nachtraeglich ueberpruefen lassen. Fehler koennen bis zu 4 Jahre rueckwirkend korrigiert werden, und Sie erhalten Nachzahlungen. Besonders sinnvoll bei Bescheiden, bei denen Sie die Widerspruchsfrist versaeumt haben.',
    link: { label: 'Zum Musterschreiben-Generator', to: '/musterschreiben' },
  },
  {
    id: 'verwaltungsakt',
    term: 'Verwaltungsakt',
    legalRef: '\u00a7 31 SGB X',
    explanation:
      'Ein Verwaltungsakt ist jede verbindliche Entscheidung des Jobcenters in Ihrem Einzelfall, z.B. ein Bewilligungsbescheid, Ablehnungsbescheid oder Sanktionsbescheid. Gegen jeden Verwaltungsakt koennen Sie innerhalb der Frist Widerspruch einlegen. Ohne korrekte Rechtsbehelfsbelehrung verlaengert sich die Frist auf ein Jahr.',
  },
  {
    id: 'weiterbewilligungsantrag',
    term: 'Weiterbewilligungsantrag',
    legalRef: '\u00a7 37 SGB II',
    explanation:
      'Bevor Ihr aktueller Bewilligungszeitraum endet, muessen Sie einen Weiterbewilligungsantrag (WBA) stellen, damit Ihre Leistungen nahtlos weitergezahlt werden. Stellen Sie den Antrag rechtzeitig, am besten 2-4 Wochen vor Ablauf. Ein formloser Antrag genuegt, um die Frist zu wahren.',
    link: { label: 'Zur Checkliste', to: '/checklisten' },
  },
  {
    id: 'widerspruch',
    term: 'Widerspruch',
    legalRef: '\u00a7\u00a7 83-84 SGG',
    explanation:
      'Der Widerspruch ist das Rechtsmittel gegen einen Bescheid des Jobcenters. Die Frist betraegt einen Monat ab Zugang des Bescheids. Der Widerspruch muss schriftlich beim Jobcenter eingereicht werden. Er kann zunaechst ohne Begruendung eingelegt werden - die Begruendung kann nachgereicht werden.',
    link: { label: 'Widerspruch generieren', to: '/musterschreiben' },
  },
  {
    id: 'widerspruchsbescheid',
    term: 'Widerspruchsbescheid',
    legalRef: '\u00a7 85 SGG',
    explanation:
      'Den Widerspruchsbescheid erhalten Sie, wenn das Jobcenter Ihren Widerspruch ganz oder teilweise abgelehnt hat. Er enthaelt die Begruendung der Ablehnung und eine Rechtsbehelfsbelehrung. Gegen den Widerspruchsbescheid koennen Sie innerhalb eines Monats Klage beim Sozialgericht erheben.',
    link: { label: 'Zum KI-Berater', to: '/chat' },
  },
  {
    id: 'zugangsfiktion',
    term: 'Zugangsfiktion',
    legalRef: '\u00a7 37 Abs. 2 SGB X',
    explanation:
      'Die Zugangsfiktion besagt, dass ein per Post versandter Bescheid am dritten Tag nach Aufgabe zur Post als zugegangen gilt. Ab diesem Zeitpunkt beginnt die Widerspruchsfrist von einem Monat. Koennen Sie nachweisen, dass der Bescheid spaeter oder gar nicht ankam, gilt die Fiktion nicht.',
    link: { label: 'Zum Fristen-Rechner', to: '/rechner/fristen' },
  },
  {
    id: 'zumutbarkeit',
    term: 'Zumutbarkeit',
    legalRef: '\u00a7 10 SGB II',
    explanation:
      'Grundsaetzlich ist Ihnen jede Arbeit zumutbar, auch wenn sie nicht Ihrer Ausbildung entspricht oder schlechter bezahlt ist. Ausnahmen gelten z.B. bei gesundheitlichen Einschraenkungen, fehlender Kinderbetreuung (bei Kindern unter 3 Jahren) oder sittenwidriger Arbeit. In den ersten 6 Monaten ist Ihre Qualifikation geschuetzt.',
  },
  {
    id: 'zusicherung',
    term: 'Zusicherung',
    legalRef: '\u00a7 22 Abs. 6 SGB II',
    explanation:
      'Vor einem Umzug sollten Sie eine Zusicherung des Jobcenters einholen. Damit bestaetigt das Jobcenter, dass es die Kosten der neuen Unterkunft uebernimmt. Mit der Zusicherung werden auch Umzugskosten, Mietkaution (als Darlehen) und gegebenenfalls Maklergebuehren uebernommen.',
  },
]

function getFirstLetter(term: string): string {
  return term.charAt(0).toUpperCase()
}

function groupByLetter(entries: GlossarEntry[]): Map<string, GlossarEntry[]> {
  const groups = new Map<string, GlossarEntry[]>()
  for (const entry of entries) {
    const letter = getFirstLetter(entry.term)
    const group = groups.get(letter) || []
    group.push(entry)
    groups.set(letter, group)
  }
  return groups
}

export default function GlossarPage() {
  useDocumentTitle('Glossar - BescheidBoxer')

  const [searchQuery, setSearchQuery] = useState('')
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const toggleTerm = useCallback((id: string) => {
    setExpandedTerm((prev) => (prev === id ? null : id))
  }, [])

  const filteredEntries = glossarEntries.filter((entry) => {
    if (searchQuery === '') return true
    const q = searchQuery.toLowerCase()
    return (
      entry.term.toLowerCase().includes(q) ||
      entry.explanation.toLowerCase().includes(q) ||
      entry.legalRef.toLowerCase().includes(q)
    )
  })

  const grouped = groupByLetter(filteredEntries)
  const availableLetters = Array.from(grouped.keys()).sort()

  const allLetters = Array.from(
    new Set(glossarEntries.map((e) => getFirstLetter(e.term)))
  ).sort()

  const scrollToLetter = (letter: string) => {
    const el = sectionRefs.current[letter]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-boxer rounded-full mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Glossar Sozialrecht
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Die wichtigsten Begriffe aus dem SGB II und Sozialrecht - einfach und
            verstaendlich erklaert. Von Anhoerung bis Zusicherung.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {glossarEntries.length} Begriffe &middot; Alphabetisch sortiert
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6 max-w-xl mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Begriff suchen (z.B. Widerspruch, Sanktion, Mehrbedarf...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Alphabet Navigation */}
        <div className="flex flex-wrap justify-center gap-1.5 mb-10">
          {allLetters.map((letter) => {
            const isAvailable = availableLetters.includes(letter)
            return (
              <button
                key={letter}
                onClick={() => isAvailable && scrollToLetter(letter)}
                disabled={!isAvailable}
                className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
                  isAvailable
                    ? 'bg-white text-gray-700 border border-gray-200 hover:bg-red-50 hover:border-red-300 hover:text-red-600 cursor-pointer shadow-sm'
                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                }`}
              >
                {letter}
              </button>
            )
          })}
        </div>

        {/* Results Count when searching */}
        {searchQuery && (
          <p className="text-sm text-gray-500 mb-6">
            {filteredEntries.length}{' '}
            {filteredEntries.length === 1 ? 'Begriff' : 'Begriffe'} gefunden
            fuer{' '}
            <span className="font-medium text-gray-700">
              &quot;{searchQuery}&quot;
            </span>
          </p>
        )}

        {/* Glossary Sections by Letter */}
        <div className="space-y-8">
          {availableLetters.map((letter) => {
            const entries = grouped.get(letter) || []
            return (
              <div
                key={letter}
                ref={(el) => {
                  sectionRefs.current[letter] = el
                }}
                className="scroll-mt-6"
              >
                {/* Letter Heading */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-boxer text-white font-bold text-lg">
                    {letter}
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Term Cards */}
                <div className="space-y-3">
                  {entries.map((entry) => {
                    const isExpanded = expandedTerm === entry.id
                    return (
                      <div
                        key={entry.id}
                        className="bg-white border border-gray-200 rounded-xl overflow-hidden transition-all hover:shadow-md"
                      >
                        {/* Card Header */}
                        <button
                          onClick={() => toggleTerm(entry.id)}
                          className="w-full text-left px-5 py-4 flex items-center gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
                                {entry.term}
                              </h3>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-xs font-medium border border-red-100">
                                {entry.legalRef}
                              </span>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </button>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div className="border-t border-gray-100 px-5 py-4">
                            <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                              {entry.explanation}
                            </p>
                            {entry.link && (
                              <div className="mt-4">
                                <Link
                                  to={entry.link.to}
                                  className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  {entry.link.label}
                                </Link>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredEntries.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Kein Begriff gefunden
            </h3>
            <p className="text-gray-600 mb-4">
              Versuchen Sie einen anderen Suchbegriff oder stellen Sie Ihre Frage
              direkt im Chat.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-red-600 font-medium hover:underline"
            >
              Suche zuruecksetzen
            </button>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-12 bg-gradient-boxer rounded-2xl text-white p-8 text-center">
          <h3 className="text-2xl font-bold mb-3">
            Begriff nicht gefunden?
          </h3>
          <p className="text-white/90 mb-6 max-w-xl mx-auto">
            Stellen Sie Ihre Frage direkt unserem KI-Assistenten - er erklaert
            Ihnen jeden Fachbegriff aus dem Sozialrecht verstaendlich und mit
            Paragraphen-Verweis.
          </p>
          <Link to="/chat">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-red-600 hover:bg-gray-100"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Zum KI-Berater
            </Button>
          </Link>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-gray-400 text-center mt-8 max-w-2xl mx-auto leading-relaxed">
          Hinweis: Die Erklaerungen in diesem Glossar dienen der allgemeinen
          Orientierung und ersetzen keine individuelle Rechtsberatung. Fuer eine
          verbindliche Auskunft wenden Sie sich bitte an einen Anwalt fuer
          Sozialrecht, Ihren oertlichen Sozialverband (VdK, SoVD) oder eine
          Beratungsstelle. Stand: 2025. Alle Angaben ohne Gewaehr.
        </p>
      </div>
    </div>
  )
}
