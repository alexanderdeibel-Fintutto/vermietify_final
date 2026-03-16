import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HelpCircle, ChevronDown, MessageCircle, ScanSearch, Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import useDocumentTitle from '@/hooks/useDocumentTitle'

interface FaqItem {
  id: string
  question: string
  answer: string
}

const buergergeldFaqs: FaqItem[] = [
  {
    id: 'was-ist-buergergeld',
    question: 'Was ist Buergergeld?',
    answer: 'Seit dem 01.01.2023 ist das Buergergeld der Nachfolger von Hartz IV. Es ist im SGB II (Sozialgesetzbuch Zweites Buch) geregelt und bietet eine Grundsicherung fuer Arbeitssuchende. Das Buergergeld soll die Existenz sichern und Menschen dabei unterstuetzen, wieder in Arbeit zu kommen.'
  },
  {
    id: 'regelsatz-2025',
    question: 'Wie hoch ist der Regelsatz 2025?',
    answer: 'Die Regelsaetze 2025 betragen: Alleinstehend 563 EUR, Paare je 506 EUR, Kinder 14-17 Jahre: 471 EUR, Kinder 6-13 Jahre: 390 EUR, Kinder 0-5 Jahre: 357 EUR. Diese Betraege werden jaehrlich angepasst.'
  },
  {
    id: 'kosten-der-unterkunft',
    question: 'Was sind Kosten der Unterkunft (KdU)?',
    answer: 'Nach §22 SGB II werden die tatsaechlichen Mietkosten plus Heizung uebernommen, sofern diese angemessen sind. Es gilt eine 12-monatige Karenzzeit bei Umzug oder zu hohen Kosten. In dieser Zeit werden auch unangemessene Kosten voll uebernommen.'
  },
  {
    id: 'einkommensanrechnung',
    question: 'Wie funktioniert die Einkommensanrechnung?',
    answer: 'Nach §11 SGB II werden Freibetraege bei Erwerbseinkommen gewaehrt: 100 EUR Grundfreibetrag, plus 20% des Einkommens zwischen 100-520 EUR, plus 10% des Einkommens zwischen 520-1000 EUR. Einkommen darueber wird voll angerechnet.'
  },
  {
    id: 'mehrbedarfe',
    question: 'Was sind Mehrbedarfe?',
    answer: 'Nach §21 SGB II gibt es Mehrbedarfe fuer besondere Lebenslagen: Schwangerschaft (ab 13. Woche), Alleinerziehende (je nach Anzahl und Alter der Kinder), Menschen mit Behinderung und Personen mit kostenaufwaendiger Ernaehrung (z.B. aus medizinischen Gruenden).'
  },
  {
    id: 'widerspruch-frist',
    question: 'Wie lange habe ich Zeit fuer einen Widerspruch?',
    answer: 'Sie haben 1 Monat Zeit nach Zugang des Bescheids, um Widerspruch einzulegen (§84 SGG). Bei postalischer Zusendung gilt die Zugangsfiktion: Der Bescheid gilt am 3. Tag nach Absendung als zugegangen. Die Frist beginnt am Tag danach.'
  }
]

const platformFaqs: FaqItem[] = [
  {
    id: 'kosten',
    question: 'Was kostet BescheidBoxer?',
    answer: 'BescheidBoxer bietet 4 Tarife: Schnupperer (0 EUR - kostenlos), Starter (2,99 EUR/Monat), Kaempfer (4,99 EUR/Monat) und Vollschutz (7,99 EUR/Monat). Jeder Tarif bietet unterschiedliche Kontingente fuer Chat, BescheidScan und Briefgenerator.'
  },
  {
    id: 'bescheidscan',
    question: 'Wie funktioniert der BescheidScan?',
    answer: 'Laden Sie Ihren Bescheid als PDF oder Foto hoch. Unsere KI analysiert den Bescheid automatisch auf haeufige Fehler wie falsche Bedarfsberechnung, fehlende Mehrbedarfe oder nicht beruecksichtigte Freibetraege. Sie erhalten eine Uebersicht der gefundenen Fehler und eine Schaetzung der moeglichen Nachzahlung.'
  },
  {
    id: 'datensicherheit',
    question: 'Sind meine Daten sicher?',
    answer: 'Ja, BescheidBoxer ist DSGVO-konform. Alle Daten werden verschluesselt auf Servern in der EU gespeichert (Supabase). Wir geben Ihre Daten nicht an Dritte weiter. Sie koennen jederzeit Ihre Daten exportieren oder Ihr Konto loeschen.'
  },
  {
    id: 'rechtsberatung',
    question: 'Ersetzt BescheidBoxer einen Anwalt?',
    answer: 'Nein, BescheidBoxer bietet eine KI-gestuetzte Ersteinschaetzung, aber keine Rechtsberatung. Fuer individuelle rechtliche Beratung empfehlen wir Sozialverbaende wie VdK, SoVD oder Beratungsstellen der Caritas. Diese bieten oft kostenlose oder guenstige Beratung fuer Leistungsempfaenger.'
  },
  {
    id: 'kostenlos-nutzen',
    question: 'Kann ich BescheidBoxer kostenlos nutzen?',
    answer: 'Ja, der Schnupperer-Tarif ist dauerhaft kostenlos und bietet 3 Chat-Nachrichten pro Tag, 1 BescheidScan pro Monat und 1 Brief pro Monat. So koennen Sie die Plattform in Ruhe testen, bevor Sie sich fuer einen kostenpflichtigen Tarif entscheiden.'
  }
]

const widerspruchFaqs: FaqItem[] = [
  {
    id: 'nach-widerspruch',
    question: 'Was passiert nach meinem Widerspruch?',
    answer: 'Nach Einreichung Ihres Widerspruchs hat das Jobcenter 3 Monate Zeit zur Bearbeitung. Haeufig erhalten Sie zuerst einen Abhaengebescheid, dann einen Widerspruchsbescheid. Wenn Ihr Widerspruch abgelehnt wird, koennen Sie innerhalb eines Monats Klage beim Sozialgericht einreichen.'
  },
  {
    id: 'klage-kosten',
    question: 'Was kostet eine Klage beim Sozialgericht?',
    answer: 'Klagen beim Sozialgericht sind fuer Leistungsempfaenger grundsaetzlich kostenlos. Es fallen keine Gerichtskosten an. Bei Bedarf koennen Sie Prozesskostenhilfe (PKH) fuer einen Anwalt beantragen. Auch bei Verlust des Verfahrens entstehen Ihnen keine Kosten.'
  },
  {
    id: 'alte-bescheide',
    question: 'Kann ich alte Bescheide noch pruefen lassen?',
    answer: 'Ja, Sie koennen einen Ueberpruefungsantrag nach §44 SGB X stellen. Fehler koennen bis zu 4 Jahre zurueck korrigiert werden, und Sie erhalten dann auch Nachzahlungen fuer die Vergangenheit. Laden Sie einfach Ihre alten Bescheide in BescheidBoxer hoch.'
  },
  {
    id: 'sanktion',
    question: 'Was mache ich bei einer Sanktion?',
    answer: 'Seit 2023 sind Sanktionen auf maximal 30% des Regelsatzes begrenzt. Legen Sie umgehend Widerspruch ein und machen Sie wichtige Gruende geltend (z.B. Krankheit, fehlende Kinderbetreuung). Bei drohender Obdachlosigkeit oder Existenzbedrohung koennen Sie einen Eilantrag beim Sozialgericht stellen.'
  }
]

const technischesFaqs: FaqItem[] = [
  {
    id: 'mobile',
    question: 'Funktioniert BescheidBoxer auf dem Handy?',
    answer: 'Ja, BescheidBoxer ist vollstaendig responsive und fuer mobile Nutzung optimiert. Sie koennen alle Funktionen - Chat, BescheidScan, Rechner und Briefgenerator - bequem auf Ihrem Smartphone oder Tablet nutzen.'
  },
  {
    id: 'daten-export',
    question: 'Kann ich meine Daten exportieren?',
    answer: 'Ja, unter Profil > Daten & Datenschutz finden Sie die Moeglichkeit zum Datenexport. Sie erhalten alle Ihre Daten im JSON-Format zum Download. Dies umfasst Chat-Verlaeufe, Scan-Ergebnisse und generierte Briefe.'
  },
  {
    id: 'konto-loeschen',
    question: 'Wie loesche ich mein Konto?',
    answer: 'Gehen Sie zu Profil > Konto loeschen und folgen Sie den Anweisungen. Alle Ihre Daten werden innerhalb von 30 Tagen vollstaendig und unwiderruflich geloescht. Sie erhalten eine Bestaetigung per E-Mail.'
  }
]

export default function FaqPage() {
  useDocumentTitle('Haeufige Fragen')
  const [openQuestion, setOpenQuestion] = useState<string | null>(null)

  const toggleQuestion = (id: string) => {
    setOpenQuestion(openQuestion === id ? null : id)
  }

  const renderFaqItem = (item: FaqItem) => (
    <Card
      key={item.id}
      className="cursor-pointer transition-all hover:shadow-md"
      onClick={() => toggleQuestion(item.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900 flex-1">
            {item.question}
          </h3>
          <ChevronDown
            className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 mt-1 ${
              openQuestion === item.id ? 'rotate-180' : ''
            }`}
          />
        </div>
        {openQuestion === item.id && (
          <div className="mt-3 text-gray-700 leading-relaxed">
            {item.answer}
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-boxer rounded-full mb-4">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Haeufige Fragen
          </h1>
          <p className="text-lg text-gray-600">
            Antworten auf die wichtigsten Fragen zu Buergergeld und BescheidBoxer
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Tipp: Nutzen Sie Strg+F (Windows) oder Cmd+F (Mac) um nach Stichworten zu suchen
          </p>
        </div>

        {/* Buergergeld & Rechte */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="gradient-text-boxer">Buergergeld & Rechte</span>
          </h2>
          <div className="space-y-3">
            {buergergeldFaqs.map(renderFaqItem)}
          </div>
        </section>

        {/* BescheidBoxer nutzen */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="gradient-text-boxer">BescheidBoxer nutzen</span>
          </h2>
          <div className="space-y-3">
            {platformFaqs.map(renderFaqItem)}
          </div>
        </section>

        {/* Widerspruch & Klage */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="gradient-text-boxer">Widerspruch & Klage</span>
          </h2>
          <div className="space-y-3">
            {widerspruchFaqs.map(renderFaqItem)}
          </div>
        </section>

        {/* Technisches */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="gradient-text-boxer">Technisches</span>
          </h2>
          <div className="space-y-3">
            {technischesFaqs.map(renderFaqItem)}
          </div>
        </section>

        {/* CTA Section */}
        <Card className="bg-gradient-boxer text-white mb-12">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-3">Frage nicht dabei?</h3>
            <p className="text-white/90 mb-6">
              Stellen Sie Ihre Frage direkt unserem KI-Assistenten im Chat
            </p>
            <Link to="/chat">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-red-600 hover:bg-gray-100"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Zum Chat
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-4">
          <Link to="/scan">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-6 text-center">
                <ScanSearch className="w-8 h-8 text-red-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">BescheidScan</h4>
                <p className="text-sm text-gray-600">
                  Bescheid pruefen lassen
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/rechner">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-6 text-center">
                <Calculator className="w-8 h-8 text-red-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">Rechner</h4>
                <p className="text-sm text-gray-600">
                  Anspruch berechnen
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/preise">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-6 text-center">
                <HelpCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">Preise</h4>
                <p className="text-sm text-gray-600">
                  Tarife vergleichen
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
