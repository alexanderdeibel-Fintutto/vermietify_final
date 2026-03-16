import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Home,
  FileText,
  Shield,
  AlertTriangle,
  Heart,
  Euro,
  GraduationCap,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Clock,
  CheckCircle2,
  Circle,
  Lightbulb,
  Filter,
  Trophy,
  Gavel,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Breadcrumbs from '@/components/Breadcrumbs'
import useDocumentTitle from '@/hooks/useDocumentTitle'

type Difficulty = 'einsteiger' | 'fortgeschritten' | 'experte'
type DifficultyFilter = Difficulty | 'alle'

interface ModuleSection {
  title: string
  content: string
  tip?: string
}

interface RelatedTool {
  label: string
  to: string
}

interface LernModul {
  id: string
  title: string
  description: string
  icon: React.ElementType
  difficulty: Difficulty
  estimatedMinutes: number
  sections: ModuleSection[]
  relatedTools: RelatedTool[]
  paragraphs: string[]
}

const STORAGE_KEY = 'bescheidboxer_lernfortschritt'

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; color: string; bg: string }> = {
  einsteiger: { label: 'Einsteiger', color: 'text-green-700 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/40' },
  fortgeschritten: { label: 'Fortgeschritten', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/40' },
  experte: { label: 'Experte', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/40' },
}

const MODULE_DATA: LernModul[] = [
  {
    id: 'buergergeld-grundlagen',
    title: 'Buergergeld-Grundlagen',
    description: 'Was ist Buergergeld, wer hat Anspruch und wie hoch sind die Regelsaetze 2025? Der perfekte Einstieg in das Thema Grundsicherung.',
    icon: BookOpen,
    difficulty: 'einsteiger',
    estimatedMinutes: 15,
    paragraphs: ['§ 7 SGB II', '§ 19 SGB II', '§ 20 SGB II', '§ 37 SGB II'],
    relatedTools: [
      { label: 'Buergergeld-Rechner', to: '/rechner/buergergeld' },
      { label: 'KI-Berater', to: '/chat' },
    ],
    sections: [
      {
        title: 'Was ist Buergergeld?',
        content: `Das Buergergeld ist seit dem 1. Januar 2023 die Grundsicherung fuer erwerbsfaehige Leistungsberechtigte in Deutschland. Es loeste das fruehere Arbeitslosengeld II (umgangssprachlich "Hartz IV") ab und ist im Zweiten Buch Sozialgesetzbuch (SGB II) geregelt. Im Kern sichert das Buergergeld das Existenzminimum: Es soll sicherstellen, dass jeder Mensch in Deutschland ein menschenwuerdiges Leben fuehren kann, auch wenn das eigene Einkommen oder Vermoegen dafuer nicht ausreicht.

Im Unterschied zum frueheren System setzt das Buergergeld staerker auf Vertrauen und Kooperation. Die sogenannte Karenzzeit von 12 Monaten schuetzt Neuantragsteller davor, sofort ihre Wohnung aufgeben oder ihr Erspartes aufbrauchen zu muessen. Das Buergergeld ist keine Almose, sondern ein Rechtsanspruch. Jeder, der die Voraussetzungen erfuellt, hat ein gesetzliches Recht auf diese Leistung.

Zustaendig fuer die Bewilligung und Auszahlung sind die oertlichen Jobcenter. Diese sind gemeinsame Einrichtungen der Bundesagentur fuer Arbeit und der Kommunen. Bei Fragen oder Problemen ist das Jobcenter Ihr erster Ansprechpartner - aber nicht der einzige. Sozialverbaende wie der VdK, der SoVD oder Beratungsstellen der Caritas und Diakonie bieten ebenfalls Unterstuetzung.`,
        tip: 'Auch wenn Sie nur teilweise hilfebeduerft ig sind (z.B. Ihr Einkommen reicht fast, aber nicht ganz), koennen Sie "aufstockend" Buergergeld erhalten. Pruefen Sie Ihren Anspruch mit unserem Buergergeld-Rechner.',
      },
      {
        title: 'Wer hat Anspruch auf Buergergeld?',
        content: `Die Voraussetzungen fuer den Anspruch auf Buergergeld sind in § 7 Abs. 1 SGB II geregelt. Vier Bedingungen muessen gleichzeitig erfuellt sein:

1. Alter: Sie muessen mindestens 15 Jahre alt sein und duerfen die Altersgrenze fuer die Regelaltersrente noch nicht erreicht haben. Diese liegt derzeit bei 67 Jahren (fuer juengere Jahrgaenge).

2. Erwerbsfaehigkeit: Sie muessen in der Lage sein, mindestens drei Stunden taeglich unter den ueblichen Bedingungen des Arbeitsmarktes zu arbeiten (§ 8 SGB II). Es kommt nicht darauf an, ob Sie tatsaechlich arbeiten, sondern ob Sie grundsaetzlich dazu in der Lage waeren. Auch bei gesundheitlichen Einschraenkungen gelten Sie als erwerbsfaehig, solange die Drei-Stunden-Grenze nicht unterschritten wird.

3. Hilfebeduerftigkeit: Sie koennen Ihren Lebensunterhalt nicht oder nicht ausreichend aus eigenem Einkommen oder Vermoegen sichern (§ 9 SGB II). Dabei wird das Einkommen und Vermoegen aller Mitglieder Ihrer Bedarfsgemeinschaft beruecksichtigt.

4. Gewoehnlicher Aufenthalt: Sie muessen Ihren gewoehnlichen Aufenthalt in Deutschland haben. Fuer EU-Buerger und Nicht-EU-Buerger gelten besondere Regelungen bezueglich des Aufenthaltsrechts.

Wichtig: Auch Mitglieder Ihrer Bedarfsgemeinschaft (Partner, Kinder unter 25 im Haushalt) erhalten Leistungen, selbst wenn sie selbst nicht alle Voraussetzungen erfuellen.`,
        tip: 'Falls Sie nicht erwerbsfaehig sind (z.B. wegen schwerer Krankheit), kommt statt Buergergeld die Grundsicherung im Alter und bei Erwerbsminderung nach SGB XII in Betracht. Lassen Sie sich hierzu beraten.',
      },
      {
        title: 'Regelsaetze 2025',
        content: `Die Regelsaetze werden jaehrlich zum 1. Januar angepasst. Sie basieren auf der Einkommens- und Verbrauchsstichprobe (EVS), die alle fuenf Jahre erhoben wird, sowie auf der Preisentwicklung. Die Regelbedarfsstufen 2025 nach § 20 SGB II betragen:

- Regelbedarfsstufe 1 (Alleinstehende / Alleinerziehende): 563 EUR
- Regelbedarfsstufe 2 (Paare, je Person): 506 EUR
- Regelbedarfsstufe 3 (erwachsene Mitglieder der Bedarfsgemeinschaft, z.B. ueber-25-jaehrige Kinder): 451 EUR
- Regelbedarfsstufe 4 (Jugendliche 14-17 Jahre): 471 EUR
- Regelbedarfsstufe 5 (Kinder 6-13 Jahre): 390 EUR
- Regelbedarfsstufe 6 (Kinder 0-5 Jahre): 357 EUR

Der Regelbedarf deckt folgende Bereiche ab: Ernaehrung, Kleidung, Koerperpflege, Hausrat, Strom (nicht Heizung!), persoenliche Beduerfnisse des taeglichen Lebens sowie in vertretbarem Umfang die Teilnahme am gesellschaftlichen und kulturellen Leben. Nicht vom Regelsatz gedeckt sind die Kosten fuer Unterkunft und Heizung - diese werden gesondert uebernommen.`,
      },
      {
        title: 'Antragstellung',
        content: `Den Antrag auf Buergergeld stellen Sie beim oertlich zustaendigen Jobcenter (§ 36 SGB II). Die Zustaendigkeit richtet sich nach Ihrem Wohnort. Sie finden Ihr Jobcenter ueber die Webseite der Bundesagentur fuer Arbeit oder durch eine einfache Internetsuche.

Der Antrag kann formlos gestellt werden - muendlich, per Telefon, per E-Mail oder schriftlich. Es genuegt, wenn Sie Ihren Bedarf an Leistungen zum Ausdruck bringen. Das Jobcenter muss Ihnen dann die offiziellen Antragsformulare aushae ndigen. Nutzen Sie dennoch nach Moeglichkeit den offiziellen Hauptantrag (Formular), da dieser den Prozess beschleunigt.

Besonders wichtig: Der Antrag wirkt auf den Ersten des Monats zurueck, in dem er gestellt wird (§ 37 Abs. 2 SGB II). Wenn Sie am 20. Maerz den Antrag stellen, erhalten Sie Leistungen ab dem 1. Maerz. Deshalb gilt: Stellen Sie den Antrag so frueh wie moeglich, auch wenn noch nicht alle Unterlagen vorliegen. Fehlende Unterlagen koennen nachgereicht werden.

Fuer den Antrag benoetigen Sie typischerweise: Personalausweis, Mietvertrag, Kontoauszuege der letzten drei Monate, Nachweise ueber Einkommen und Vermoegen, sowie gegebenenfalls Nachweise ueber besondere Bedarfe (z.B. Schwangerschaft, Behinderung).`,
        tip: 'Lassen Sie sich bei der Abgabe des Antrags den Eingang schriftlich bestaetigen (Eingangsstempel auf einer Kopie). So haben Sie im Streitfall einen Nachweis ueber den Zeitpunkt der Antragstellung.',
      },
    ],
  },
  {
    id: 'kosten-der-unterkunft',
    title: 'Kosten der Unterkunft (KdU)',
    description: 'Wie werden Mietkosten berechnet? Was gilt als angemessen? Was tun bei einer Kostensenkungsaufforderung?',
    icon: Home,
    difficulty: 'einsteiger',
    estimatedMinutes: 20,
    paragraphs: ['§ 22 SGB II', '§ 22 Abs. 1 SGB II', '§ 35 SGB XII'],
    relatedTools: [
      { label: 'KdU-Rechner', to: '/rechner/kdu' },
      { label: 'BescheidScan', to: '/scan' },
    ],
    sections: [
      {
        title: 'Was sind Kosten der Unterkunft?',
        content: `Neben dem Regelbedarf haben Sie Anspruch auf Uebernahme der Kosten fuer Unterkunft und Heizung (KdU) nach § 22 SGB II. Diese umfassen Ihre tatsaechlichen Aufwendungen fuer Miete (Kaltmiete plus kalte Nebenkosten) und Heizung, soweit diese angemessen sind.

Zu den Unterkunftskosten zaehlen: die Grundmiete (Nettokaltmiete), die kalten Betriebskosten (Wasser, Abwasser, Muellabfuhr, Hausmeister, Treppenhausreinigung etc.) und die Heizkosten (einschliesslich Warmwasserkosten, sofern diese zentral erzeugt werden). Strom ist hingegen nicht Teil der KdU, sondern muss aus dem Regelsatz bezahlt werden.

Bei selbst genutztem Wohneigentum werden anstelle der Miete die angemessenen Aufwendungen uebernommen: Schuldzinsen (nicht Tilgung!), Grundsteuer, Wohngebaeudeversicherung, Nebenkosten und Heizkosten. Die Tilgung des Darlehens wird nur in Ausnahmefaellen uebernommen, etwa wenn die Immobilie ansonsten verloren ginge und die Gesamtbelastung unter der Mietobergrenze liegt.`,
        tip: 'Auch wenn Sie Eigentuemer sind, koennen Sie KdU erhalten. Lassen Sie sich nicht abwimmeln - das Jobcenter muss Ihre Aufwendungen pruefen und im Rahmen der Angemessenheit uebernehmen.',
      },
      {
        title: 'Angemessenheit der Mietkosten',
        content: `Das Jobcenter uebernimmt Ihre Mietkosten nur, wenn sie "angemessen" sind. Was angemessen ist, haengt von zwei Faktoren ab: der Wohnungsgroesse und dem oertlichen Mietniveau.

Die als angemessen geltende Wohnflaeche richtet sich nach der Anzahl der Personen im Haushalt. Die Richtwerte der meisten Bundeslaender sind: 1 Person: 45-50 qm, 2 Personen: 60 qm, 3 Personen: 75 qm, 4 Personen: 85-90 qm, jede weitere Person: +15 qm. Diese Werte variieren je nach Bundesland leicht.

Fuer die Bestimmung des angemessenen Mietpreises muss das Jobcenter ein sogenanntes "schluessiges Konzept" erstellen. Dieses muss den oertlichen Wohnungsmarkt realistisch abbilden und darf nicht nur auf den untersten Bereich abstellen. Viele Jobcenter verwenden Mietspiegel, qualifizierte Mietspiegel oder eigene Auswertungen. Das Bundessozialgericht hat hohe Anforderungen an diese Konzepte gestellt - viele Jobcenter erfuellen diese nicht, was haeufig zu fehlerhaften Bescheiden fuehrt.

Wenn das Jobcenter kein schluessiges Konzept hat, muss es auf die Tabellenwerte nach § 12 Wohngeldgesetz (WoGG) plus einen Zuschlag von 10% zurueckgreifen. In der Praxis fuehrt dies oft zu hoeheren Mietobergrenzen als die vom Jobcenter angesetzten Werte.`,
        tip: 'Fragen Sie Ihr Jobcenter schriftlich nach dem "schluessigen Konzept" zur Bestimmung der Mietobergrenze. Kann das Jobcenter keines vorlegen, muessen die WoGG-Tabellenwerte + 10% angewandt werden, was oft guenstiger fuer Sie ist.',
      },
      {
        title: 'Die Karenzzeit und Kostensenkungsaufforderung',
        content: `Seit der Einfuehrung des Buergergeldes gilt eine Karenzzeit von 12 Monaten ab Erstantrag (§ 22 Abs. 1 Satz 2 SGB II). In dieser Zeit werden Ihre tatsaechlichen Unterkunftskosten vollstaendig uebernommen, auch wenn sie ueber der Angemessenheitsgrenze liegen. Nur wenn die Kosten offensichtlich unangemessen hoch sind, kann eine Kuerzung erfolgen - das ist aber ein sehr hoher Massstab.

Nach Ablauf der Karenzzeit, wenn Ihre Kosten als unangemessen gelten, muss das Jobcenter Sie zunaechst zur Kostensenkung auffordern. Diese Kostensenkungsaufforderung muss konkret sein: Das Jobcenter muss Ihnen mitteilen, welche Kosten angemessen waeren und Ihnen eine angemessene Frist einraeumen, in der Regel 6 Monate. Erst nach Ablauf dieser Frist darf das Jobcenter die KdU auf das angemessene Mass kuerzen.

Sie sind nicht verpflichtet, sofort umzuziehen. Als Kostensenkungsmassnahmen kommen auch in Betracht: Untervermietung eines Zimmers, Neuverhandlung der Miete mit dem Vermieter, oder der Nachweis, dass keine guenstigere Wohnung verfuegbar ist. Dokumentieren Sie Ihre Bemuehungen (z.B. Suchanfragen auf Immobilienportalen, Absagen von Vermietern).`,
        tip: 'Bewahren Sie alle Nachweise ueber Ihre Wohnungssuche auf: Screenshots von Suchanfragen, Absagen, Bewerbungen. Wenn trotz nachweislicher Bemuehungen keine guenstigere Wohnung zu finden ist, muss das Jobcenter weiterhin die hoeheren Kosten tragen.',
      },
      {
        title: 'Heizkosten und Nachzahlungen',
        content: `Die Heizkosten werden grundsaetzlich in tatsaechlicher Hoehe uebernommen, sofern sie nicht unangemessen hoch sind. Als Orientierung dient der bundesweite oder kommunale Heizspiegel. Liegen Ihre Heizkosten deutlich ueber dem Durchschnitt, kann das Jobcenter eine Absenkung verlangen - muss dabei aber die konkreten Umstaende beruecksichtigen (z.B. schlechte Isolation, Altbau, Dachgeschoss).

Besonders wichtig sind Nebenkostennachzahlungen: Nach § 22 Abs. 1 SGB II werden auch Nachzahlungen aus der jaehrlichen Betriebskostenabrechnung als tatsaechliche Kosten der Unterkunft uebernommen - sofern die Gesamtkosten angemessen sind. Legen Sie die Nebenkostenabrechnung daher immer dem Jobcenter vor und beantragen Sie die Uebernahme der Nachzahlung.

Erhalten Sie hingegen ein Guthaben aus der Betriebskostenabrechnung, wird dieses als Einkommen angerechnet und von den KdU des Folgemonats abgezogen (§ 22 Abs. 3 SGB II). Ein Guthaben aus der Heizkostenabrechnung mindert also Ihren KdU-Anspruch im Monat des Zuflusses.`,
      },
    ],
  },
  {
    id: 'bescheid-verstehen',
    title: 'Deinen Bescheid verstehen',
    description: 'Wie ist ein Bewilligungsbescheid aufgebaut? Welche Bestandteile muessen vorhanden sein und wie erkennt man typische Fehler?',
    icon: FileText,
    difficulty: 'einsteiger',
    estimatedMinutes: 20,
    paragraphs: ['§ 31 SGB X', '§ 35 SGB X', '§ 36 SGB X', '§ 37 SGB X'],
    relatedTools: [
      { label: 'BescheidScan', to: '/scan' },
      { label: 'KI-Berater', to: '/chat' },
    ],
    sections: [
      {
        title: 'Aufbau eines Bewilligungsbescheids',
        content: `Ein Bewilligungsbescheid ueber Buergergeld ist ein Verwaltungsakt nach § 31 SGB X. Er besteht aus mehreren Bestandteilen, die Sie kennen sollten, um Fehler erkennen zu koennen:

1. Kopf/Adressfeld: Ihr Name, Adresse und Ihr Aktenzeichen (BG-Nummer). Pruefen Sie, ob die Bedarfsgemeinschaft korrekt erfasst ist - fehlen Personen, fehlt auch deren Bedarf.

2. Tenor/Verfuegungssatz: Die eigentliche Entscheidung, z.B. "Ihnen wird Buergergeld in Hoehe von XXX EUR monatlich fuer den Zeitraum XX.XX.XXXX bis XX.XX.XXXX bewilligt." Hier steht der Bewilligungszeitraum (in der Regel 6 oder 12 Monate) und die monatliche Gesamtleistung.

3. Berechnungsbogen: Die detaillierte Berechnung Ihres Anspruchs, aufgeschluesselt nach Monaten. Hier finden Sie den Regelbedarf, eventuelle Mehrbedarfe, die KdU, das angerechnete Einkommen und den sich daraus ergebenden Zahlbetrag.

4. Begruendung: Warum das Jobcenter so entschieden hat (§ 35 SGB X). Bei Ablehnungen oder Kuerzungen muss die Begruendung nachvollziehbar und auf Ihren konkreten Fall bezogen sein.

5. Rechtsbehelfsbelehrung: Der Hinweis, dass Sie innerhalb eines Monats Widerspruch einlegen koennen (§ 36 SGB X). Fehlt diese oder ist sie fehlerhaft, verlaengert sich die Frist auf ein Jahr.`,
        tip: 'Laden Sie Ihren Bescheid in unseren BescheidScan hoch. Die KI prueft automatisch, ob alle Bestandteile vorhanden und korrekt sind.',
      },
      {
        title: 'Typische Fehler in Bescheiden',
        content: `Studien zeigen, dass rund 40-50% aller Widersprueche und Klagen gegen Jobcenter-Bescheide ganz oder teilweise erfolgreich sind. Die haeufigsten Fehlerquellen sind:

Falsche Regelbedarfsstufe: Pruefen Sie, ob die richtige Regelbedarfsstufe zugeordnet wurde. Haeufig werden Alleinerziehende faelschlicherweise in Stufe 2 statt Stufe 1 eingruppiert, oder erwachsene Kinder ueber 25 im Haushalt nicht als eigene Bedarfsgemeinschaft behandelt.

Fehlende Mehrbedarfe: Viele Leistungsberechtigte wissen nicht, dass ihnen Mehrbedarfe zustehen. Schwangere ab der 13. Woche, Alleinerziehende, Menschen mit Behinderung oder Personen mit kostenaufwaendiger Ernaehrung haben Anspruch auf zusaetzliche Leistungen. Pruefen Sie den Berechnungsbogen darauf, ob alle Ihre Mehrbedarfe beruecksichtigt wurden.

Falsche Einkommensanrechnung: Werden die Freibetraege korrekt berechnet? Wurde Kindergeld dem richtigen Mitglied der Bedarfsgemeinschaft zugeordnet? Wurden Werbungskosten und Versicherungspauschale abgesetzt?

Fehlerhafte KdU-Berechnung: Wurde die volle Miete uebernommen oder wurden Kosten gekuerzt? Falls ja - liegt ein schluessiges Konzept vor? Wurde die Karenzzeit beachtet?`,
        tip: 'Pruefen Sie JEDEN Bescheid, den Sie erhalten - auch Folgebewilligungen. Fehler setzen sich oft fort, wenn sie nicht beanstandet werden.',
      },
      {
        title: 'Wichtige Fristen und Formalien',
        content: `Sobald Sie einen Bescheid erhalten, beginnen wichtige Fristen zu laufen:

Widerspruchsfrist: 1 Monat ab Bekanntgabe (§ 84 SGG). Bei postalischer Zustellung gilt der Bescheid am dritten Tag nach Aufgabe zur Post als bekanntgegeben (§ 37 Abs. 2 SGB X). Faellt das Fristende auf einen Samstag, Sonntag oder Feiertag, endet die Frist am naechsten Werktag.

Ueberpruefungsantrag: Auch nach Ablauf der Widerspruchsfrist koennen Sie einen Ueberpruefungsantrag nach § 44 SGB X stellen. Damit koennen bestandskraeftige Bescheide bis zu 4 Jahre rueckwirkend korrigiert werden, wenn sie rechtswidrig waren. Nachzahlungen werden allerdings auf maximal 1 Jahr begrenzt (§ 44 Abs. 4 SGB X).

Bekanntgabe: Ein Bescheid wird wirksam, sobald er Ihnen bekanntgegeben wird. Erst mit der Bekanntgabe beginnt die Widerspruchsfrist. Wenn Sie einen Bescheid erst spaeter tatsaechlich erhalten als den dritten Tag nach Absendung, muessen Sie dies geltend machen - die Beweislast fuer den Zugang liegt beim Jobcenter.`,
        tip: 'Notieren Sie das Datum, an dem Sie jeden Bescheid tatsaechlich erhalten haben (z.B. handschriftlich auf dem Umschlag). So koennen Sie im Streitfall den tatsaechlichen Zugang nachweisen.',
      },
    ],
  },
  {
    id: 'widerspruch-einlegen',
    title: 'Widerspruch einlegen',
    description: 'Schritt-fuer-Schritt-Anleitung zum Widerspruch: Fristen, Formvorschriften und praktische Tipps fuer einen erfolgreichen Widerspruch.',
    icon: Shield,
    difficulty: 'fortgeschritten',
    estimatedMinutes: 25,
    paragraphs: ['§ 83 SGG', '§ 84 SGG', '§ 85 SGG', '§ 88 SGG'],
    relatedTools: [
      { label: 'Widerspruchs-Generator', to: '/musterschreiben' },
      { label: 'Widerspruchs-Tracker', to: '/widerspruch-tracker' },
      { label: 'BescheidScan', to: '/scan' },
    ],
    sections: [
      {
        title: 'Wann lohnt sich ein Widerspruch?',
        content: `Ein Widerspruch lohnt sich immer dann, wenn Sie der Meinung sind, dass Ihr Bescheid fehlerhaft ist. Angesichts der hohen Erfolgsquote von 40-50% bei Widerspruechen und Klagen im Sozialrecht ist die Hemmschwelle niedrig. Ein Widerspruch ist kostenlos, es entstehen keine Gebuehren.

Typische Gruende fuer einen Widerspruch sind: zu geringer Bewilligungsbetrag, unberechtigte Sanktionen, falsche Einkommensanrechnung, fehlerhafte KdU-Berechnung, fehlende Mehrbedarfe, Ablehnung von Sonderleistungen (z.B. Erstausstattung), oder eine Aufhebung und Erstattung (Rueckforderung).

Wichtig zu wissen: Der Widerspruch hat grundsaetzlich aufschiebende Wirkung (§ 86a SGG). Das bedeutet, dass eine belastende Entscheidung (z.B. eine Aufhebung) nicht vollstreckt werden darf, solange der Widerspruch laeuft. Eine Ausnahme gilt allerdings bei Erstattungsforderungen nach § 50 SGB X und bei der Anordnung der sofortigen Vollziehung.

Im Zweifelsfall gilt: Lieber einen Widerspruch zu viel als einen zu wenig einlegen. Sie koennen den Widerspruch jederzeit zuruecknehmen, wenn sich herausstellt, dass der Bescheid doch korrekt war.`,
        tip: 'Wenn Sie unsicher sind, ob sich ein Widerspruch lohnt, nutzen Sie unseren BescheidScan. Die KI analysiert Ihren Bescheid und zeigt moegliche Fehler auf.',
      },
      {
        title: 'Form und Frist des Widerspruchs',
        content: `Die Widerspruchsfrist betraegt einen Monat ab Bekanntgabe des Bescheids (§ 84 Abs. 1 SGG). Bei postalischer Zustellung gilt der dritte Tag nach Aufgabe zur Post als Bekanntgabetag (§ 37 Abs. 2 SGB X). Faellt das Fristende auf einen Samstag, Sonntag oder Feiertag, verlaengert sich die Frist bis zum naechsten Werktag.

Der Widerspruch muss schriftlich oder zur Niederschrift eingelegt werden. Er muss enthalten: Ihren Namen und Ihre Anschrift, das Aktenzeichen und das Datum des angefochtenen Bescheids, sowie die klare Erklaerung, dass Sie Widerspruch einlegen.

Die Begruendung des Widerspruchs ist zunaechst nicht zwingend erforderlich. Um die Frist zu wahren, genuegt ein kurzer "fristwahrende r Widerspruch" mit dem Hinweis "Begruendung folgt". Sie koennen die Begruendung dann in Ruhe nachreichen. Beachten Sie dabei, dass Sie das Jobcenter um eine angemessene Frist zur Nachreichung der Begruendung bitten sollten.

Der Widerspruch muss an die Behoerde gerichtet werden, die den Bescheid erlassen hat - also in der Regel an Ihr Jobcenter. Senden Sie ihn per Einschreiben, geben Sie ihn persoenlich ab und lassen Sie sich den Eingang bestaetigen, oder senden Sie ihn per Fax (Sendebericht aufheben!).`,
        tip: 'Nutzen Sie unseren Widerspruchs-Generator, um schnell einen rechtssicheren Widerspruch zu erstellen. Die Vorlage beruecksichtigt alle formalen Anforderungen.',
      },
      {
        title: 'Das Widerspruchsverfahren',
        content: `Nach Eingang Ihres Widerspruchs prueft das Jobcenter den Bescheid erneut. Es gibt zwei moegliche Ergebnisse:

Abhilfe: Das Jobcenter erkennt den Fehler und aendert den Bescheid zu Ihren Gunsten. Sie erhalten einen Abhilfebescheid und gegebenenfalls eine Nachzahlung. Dies geschieht durch die Ausgangsstelle selbst.

Widerspruchsbescheid: Wenn das Jobcenter Ihrem Widerspruch nicht oder nur teilweise stattgibt, erlaesst die Widerspruchsstelle einen Widerspruchsbescheid. Dieser muss begruendet sein und eine Rechtsbehelfsbelehrung enthalten, die Sie auf die Moeglichkeit der Klage vor dem Sozialgericht hinweist.

Das Jobcenter hat grundsaetzlich 3 Monate Zeit zur Bearbeitung (§ 88 Abs. 2 SGG). Nach Ablauf dieser Frist, ohne dass ein Widerspruchsbescheid ergangen ist, koennen Sie eine Untaetigkeitsklage beim Sozialgericht erheben. Dies ist haeufig ein wirksames Mittel, um den Widerspruch zu beschleunigen.

Waehrend des Widerspruchsverfahrens erhalten Sie weiterhin Ihre bisherigen Leistungen. Wurde Ihr Antrag abgelehnt und Sie erhalten noch gar keine Leistungen, koennen Sie parallel zum Widerspruch einen Antrag auf einstweiligen Rechtsschutz (Eilantrag) beim Sozialgericht stellen, um vorlaeufig Leistungen zu erhalten.`,
      },
      {
        title: 'Praktische Tipps fuer den Widerspruch',
        content: `Dokumentation ist alles: Fertigen Sie von jedem Schreiben eine Kopie an. Notieren Sie Datum und Uhrzeit jedes Telefonats mit dem Jobcenter, den Namen des Sachbearbeiters und den Inhalt des Gespraechs. Fordern Sie muendliche Zusagen immer schriftlich an.

Akteneinsicht: Sie haben das Recht auf vollstaendige Einsicht in Ihre Leistungsakte (§ 25 SGB X). Beantragen Sie Akteneinsicht, bevor Sie die Begruendung Ihres Widerspruchs formulieren. So sehen Sie, auf welcher Grundlage das Jobcenter entschieden hat.

Beratungshilfe: Wenn Sie anwaltliche Unterstuetzung benoetigen, koennen Sie beim Amtsgericht einen Beratungshilfeschein beantragen. Damit uebernimmt die Staatskasse die Anwaltskosten fuer die aussergerichtliche Beratung (Eigenanteil: 15 EUR). Viele Sozialverbaende (VdK, SoVD) bieten ihren Mitgliedern auch kostenlose Rechtsberatung.

Kein Nachteil durch Widerspruch: Durch einen Widerspruch darf sich Ihre Situation niemals verschlechtern - das sogenannte "Verbot der reformatio in peius" (Verschlechterungsverbot) gilt auch im Sozialrecht. Das Jobcenter darf den Bescheid also nicht zu Ihrem Nachteil aendern, nur weil Sie Widerspruch eingelegt haben.`,
        tip: 'Beantragen Sie immer Akteneinsicht! Oft finden sich in der Akte Hinweise auf Berechnungsfehler oder fehlende Unterlagen, die Sie fuer Ihren Widerspruch nutzen koennen.',
      },
    ],
  },
  {
    id: 'sanktionen-abwehren',
    title: 'Sanktionen abwehren',
    description: 'Welche Mitwirkungspflichten gibt es? Wann drohen Sanktionen und wie koennen Sie sich dagegen wehren?',
    icon: AlertTriangle,
    difficulty: 'fortgeschritten',
    estimatedMinutes: 20,
    paragraphs: ['§ 31 SGB II', '§ 31a SGB II', '§ 31b SGB II', '§ 32 SGB II'],
    relatedTools: [
      { label: 'Widerspruchs-Generator', to: '/musterschreiben' },
      { label: 'KI-Berater', to: '/chat' },
    ],
    sections: [
      {
        title: 'Was sind Sanktionen?',
        content: `Sanktionen (offiziell: Leistungsminderungen) sind Kuerzungen des Buergergeldes, die das Jobcenter verhaengen kann, wenn Leistungsberechtigte gegen bestimmte Pflichten verstossen. Die rechtliche Grundlage findet sich in §§ 31 bis 32 SGB II.

Seit der Reform des Sanktionsrechts durch das Buergergeld-Gesetz und insbesondere nach dem Urteil des Bundesverfassungsgerichts vom 5. November 2019 (1 BvL 7/16) gelten deutlich mildere Regeln als frueher. Die maximale Kuerzung betraegt nun 30% des Regelsatzes. Eine vollstaendige Streichung der Leistungen ist nicht mehr zulaessig. Auch die Kosten der Unterkunft duerfen nicht gekuerzt werden - das Dach ueber dem Kopf bleibt immer gesichert.

Die Karenzzeit von 6 Monaten nach Antragstellung schuetzt Sie zusaetzlich: In den ersten 6 Monaten des Leistungsbezugs sollen Sanktionen nur bei besonders schwerwiegenden Pflichtverletzungen verhaengt werden. Die Kooperationszeit und der Kooperationsplan ersetzen die fruehere starre Eingliederungsvereinbarung und setzen auf gemeinsame Vereinbarungen statt einseitige Vorgaben.`,
        tip: 'Seit dem BVerfG-Urteil von 2019 und der Buergergeld-Reform sind Sanktionen deutlich eingeschraenkt. Mehr als 30% des Regelsatzes duerfen nie gekuerzt werden, und die KdU bleiben immer unangetastet.',
      },
      {
        title: 'Mitwirkungspflichten',
        content: `Als Buergergeld-Empfaenger haben Sie bestimmte Pflichten, deren Verletzung zu Sanktionen fuehren kann:

Bewerbungspflichten: Sie muessen sich um Arbeit bemuehen und zumutbare Arbeitsangebote annehmen oder sich darauf bewerben. Was "zumutbar" ist, hat der Gesetzgeber in § 10 SGB II definiert. Nicht zumutbar ist eine Arbeit, wenn Sie koerperlich, geistig oder seelisch dazu nicht in der Lage sind, die Ausuebung der Arbeit die kuenftige Ausuebung Ihrer bisherigen Taetigkeit wesentlich erschweren wuerde, oder die Arbeit mit der Erziehung Ihres Kindes nicht vereinbar ist.

Meldepflichten: Sie muessen Einladungen des Jobcenters zu Terminen folgen (§ 59 SGB II i.V.m. § 309 SGB III). Die Einladung muss schriftlich erfolgen und den Zweck des Termins benennen. Eine Ladung per E-Mail oder muendlich genuegt nicht fuer eine Sanktion.

Massnahmepflichten: Sie muessen an zugewiesenen Eingliederungsmassnahmen teilnehmen. Allerdings muessen diese Massnahmen sinnvoll und auf Ihre individuelle Situation zugeschnitten sein. "Sinnlose" Massnahmen muessen Sie nicht hinnehmen - hier lohnt sich ein Widerspruch.

Meldepflicht bei Veraenderungen: Sie muessen Veraenderungen Ihrer Verhaeltnisse (Einkommen, Umzug, Zusammenzug etc.) dem Jobcenter unverzueglich mitteilen.`,
        tip: 'Bei Krankheit koennen Sie den Termin nicht wahrnehmen? Melden Sie sich VOR dem Termin beim Jobcenter ab und reichen Sie ein aerztliches Attest nach. So vermeiden Sie eine Sanktion wegen Meldepflichtversaeumnis.',
      },
      {
        title: 'Wie Sie sich gegen Sanktionen wehren',
        content: `Wenn das Jobcenter eine Sanktion verhaengt, erhalten Sie zunaechst ein Anhoerungsschreiben (§ 24 SGB X). In diesem Schreiben wird Ihnen der Vorwurf mitgeteilt und Sie haben die Gelegenheit, sich zu aeussern, bevor die Sanktion ausgesprochen wird. Nehmen Sie diese Anhoerung ernst und antworten Sie schriftlich!

Haeufige Verteidigungsgruende sind: Sie hatten einen wichtigen Grund fuer die Pflichtverletzung (§ 31 Abs. 1 Satz 2 SGB II), z.B. Krankheit, Kinderbetreuungsprobleme, Pflege von Angehoerigen, unzumutbares Arbeitsangebot, fehlende oder mangelhafte Rechtsfolgenbelehrung in der Einladung, oder die Einladung wurde nicht ordnungsgemaess zugestellt.

Besonders wichtig: Die Rechtsfolgenbelehrung. Bevor eine Sanktion verhaengt werden kann, muss das Jobcenter Sie vorher ueber die moeglichen Rechtsfolgen einer Pflichtverletzung belehrt haben. Diese Belehrung muss konkret, verstaendlich und auf Ihren Fall bezogen sein. Eine pauschale Belehrung im Eingliederungsvertrag genuegt nach der Rechtsprechung des Bundessozialgerichts oft nicht.

Gegen den Sanktionsbescheid koennen und sollten Sie Widerspruch einlegen. Parallel koennen Sie beim Sozialgericht einen Eilantrag stellen, um die Sanktion vorlaeufig auszusetzen, insbesondere wenn die Kuerzung Ihre Existenz gefaehrdet.`,
        tip: 'Pruefen Sie bei jedem Sanktionsbescheid, ob die Rechtsfolgenbelehrung korrekt und individuell war. Fehlt sie oder ist sie fehlerhaft, ist die Sanktion rechtswidrig.',
      },
    ],
  },
  {
    id: 'mehrbedarf-sonderleistungen',
    title: 'Mehrbedarf & Sonderleistungen',
    description: 'Zusaetzliche Leistungen bei Schwangerschaft, Alleinerziehung, Behinderung und fuer Erstausstattungen - Ihre Ansprueche im Detail.',
    icon: Heart,
    difficulty: 'fortgeschritten',
    estimatedMinutes: 20,
    paragraphs: ['§ 21 SGB II', '§ 23 SGB II', '§ 24 SGB II'],
    relatedTools: [
      { label: 'Erstausstattungs-Rechner', to: '/rechner/erstausstattung' },
      { label: 'Buergergeld-Rechner', to: '/rechner/buergergeld' },
      { label: 'BescheidScan', to: '/scan' },
    ],
    sections: [
      {
        title: 'Mehrbedarfe nach § 21 SGB II',
        content: `Neben dem Regelbedarf und den KdU koennen Sie Anspruch auf Mehrbedarfe haben. Diese werden zusaetzlich zum Regelsatz gezahlt und sollen besondere Lebensumstaende abdecken, die hoehere Kosten verursachen.

Mehrbedarf fuer Schwangere (§ 21 Abs. 2 SGB II): Ab der 13. Schwangerschaftswoche erhalten Sie einen Mehrbedarf von 17% des fuer Sie massgebenden Regelsatzes. Bei Regelbedarfsstufe 1 (563 EUR) sind das rund 95,71 EUR monatlich. Der Mehrbedarf wird bis zum Ende des Monats der Entbindung gezahlt. Sie benoetigen lediglich eine aerztliche Bescheinigung ueber die Schwangerschaft mit dem voraussichtlichen Entbindungstermin.

Mehrbedarf fuer Alleinerziehende (§ 21 Abs. 3 SGB II): Der Mehrbedarf haengt von der Anzahl und dem Alter der Kinder ab. Bei einem Kind unter 7 Jahren oder zwei Kindern unter 16 Jahren betraegt er 36% des Regelsatzes. Der Mehrbedarf kann zwischen 12% und maximal 60% des Regelsatzes liegen. Alleinerziehend sind Sie, wenn Sie mit mindestens einem minderjaehrigen Kind zusammenleben und allein fuer die Pflege und Erziehung sorgen. Ein regelmaessiger Wechsel des Kindes zwischen beiden Elternteilen (Wechselmodell) kann dazu fuehren, dass beide Elternteile anteilig einen Mehrbedarf erhalten.

Mehrbedarf fuer Menschen mit Behinderung (§ 21 Abs. 4 SGB II): Wer Leistungen zur Teilhabe am Arbeitsleben erhaelt (z.B. berufliche Rehabilitation), bekommt einen Mehrbedarf von 35% des Regelsatzes.`,
        tip: 'Mehrbedarfe muessen beantragt werden! Pruefen Sie, ob alle Ihnen zustehenden Mehrbedarfe in Ihrem Bescheid beruecksichtigt sind. Besonders der Mehrbedarf fuer Alleinerziehende wird haeufig vergessen.',
      },
      {
        title: 'Weitere Mehrbedarfe',
        content: `Mehrbedarf fuer kostenaufwaendige Ernaehrung (§ 21 Abs. 5 SGB II): Wenn Sie aus medizinischen Gruenden eine besondere Ernaehrung benoetigen, koennen Sie einen Mehrbedarf geltend machen. Anerkannte Krankheitsbilder sind unter anderem: Zoeliakie (glutenfreie Ernaehrung), Niereninsuffizienz, Morbus Crohn, Colitis ulcerosa, Mukoviszidose und schwere Lebererkrankungen. Die Hoehe richtet sich nach den Empfehlungen des Deutschen Vereins fuer oeffentliche und private Fuersorge. Eine blosse Laktoseintoleranz oder Diabetes mellitus Typ 2 genuegen nach aktueller Rechtsprechung in der Regel nicht, da eine vollwertige Ernaehrung im Rahmen des Regelsatzes moeglich ist.

Mehrbedarf fuer dezentrale Warmwassererzeugung (§ 21 Abs. 7 SGB II): Wenn das Warmwasser in Ihrer Wohnung nicht zentral, sondern durch einen Durchlauferhitzer oder Boiler erzeugt wird, erhalten Sie einen Mehrbedarf. Dieser betraegt je nach Regelbedarfsstufe zwischen 0,8% und 2,3% des Regelsatzes. Der Grund: Die Kosten fuer die Warmwassererzeugung sind in diesem Fall nicht in den Heizkosten enthalten und werden daher gesondert uebernommen.

Haertefallmehrbedarf (§ 21 Abs. 6 SGB II): In besonderen Faellen kann ein laufender Mehrbedarf anerkannt werden, der nicht von den uebrigen Mehrbedarfsregelungen erfasst wird. Beispiele: Kosten fuer Hygieneartikel bei Stoma, Kosten fuer nicht verschreibungspflichtige Medikamente bei chronischen Erkrankungen, Fahrtkosten fuer regelmaessige Therapiebesuche.`,
      },
      {
        title: 'Einmalige Sonderleistungen nach § 24 SGB II',
        content: `Neben den laufenden Mehrbedarfen gibt es einmalige Leistungen nach § 24 Abs. 3 SGB II, die gesondert beantragt werden muessen:

Erstausstattung fuer die Wohnung: Wenn Sie erstmals eine Wohnung beziehen (z.B. nach Obdachlosigkeit, Trennung, Haft oder erstmaligem Auszug aus dem Elternhaus), haben Sie Anspruch auf eine Erstausstattung. Diese umfasst Moebel, Haushaltsgeraete und Hausrat. Die Leistung kann als Geld- oder Sachleistung erbracht werden. Die Pauschalbetraege variieren je nach Kommune erheblich.

Erstausstattung fuer Bekleidung: In besonderen Faellen (z.B. nach Brand, Diebstahl, starker Gewichtsveraenderung) haben Sie Anspruch auf eine Erstausstattung fuer Bekleidung.

Erstausstattung bei Schwangerschaft und Geburt: Werdende Muetter haben Anspruch auf eine Erstausstattung fuer Schwangerschaftsbekleidung und fuer das Baby (Babybett, Kinderwagen, Babykleidung etc.). Beantragen Sie dies moeglichst frueh, idealerweise ab der 13. Schwangerschaftswoche.

Anschaffung und Reparatur von orthopaedischen Schuhen und therapeutischen Geraeten: Kosten, die nicht von der Krankenkasse uebernommen werden.

Wichtig: Einmalige Bedarfe muessen gesondert beantragt werden und werden nicht automatisch bewilligt. Der Antrag muss VOR der Anschaffung gestellt werden. Kaufen Sie also nicht zuerst ein und beantragen dann eine Erstattung - das Jobcenter kann die Uebernahme dann ablehnen.`,
        tip: 'Nutzen Sie unseren Erstausstattungs-Rechner, um eine Schaetzung der Ihnen zustehenden Pauschalbetraege zu erhalten. So koennen Sie pruefen, ob das Angebot des Jobcenters angemessen ist.',
      },
    ],
  },
  {
    id: 'klage-sozialgericht',
    title: 'Klage vor dem Sozialgericht',
    description: 'Wie funktioniert eine Klage? Was ist Prozesskostenhilfe? Welche Kosten entstehen und wie stehen die Erfolgsaussichten?',
    icon: Gavel,
    difficulty: 'experte',
    estimatedMinutes: 25,
    paragraphs: ['§ 51 SGG', '§ 87 SGG', '§ 183 SGG', '§ 73a SGG'],
    relatedTools: [
      { label: 'KI-Berater', to: '/chat' },
      { label: 'Widerspruchs-Tracker', to: '/widerspruch-tracker' },
    ],
    sections: [
      {
        title: 'Wann ist eine Klage sinnvoll?',
        content: `Eine Klage vor dem Sozialgericht kommt in Betracht, wenn Ihr Widerspruch durch einen Widerspruchsbescheid abgelehnt wurde oder wenn das Jobcenter innerhalb von 3 Monaten nicht ueber Ihren Widerspruch entschieden hat (Untaetigkeitsklage nach § 88 SGG).

Die gute Nachricht: Klagen im Sozialrecht sind fuer Leistungsempfaenger grundsaetzlich kostenfrei. Es fallen keine Gerichtsgebuehren an (§ 183 SGG). Auch wenn Sie verlieren, muessen Sie die Kosten der Gegenseite nicht tragen. Das Kostenrisiko ist also minimal. Lediglich eigene Anwaltskosten koennten anfallen - aber auch diese koennen durch Prozesskostenhilfe (PKH) abgedeckt werden.

Die Erfolgsaussichten sind gut: Statistisch gesehen enden etwa 40-50% der Klagen im Sozialrecht ganz oder teilweise zugunsten der Klaeger. Viele Verfahren enden durch Vergleich, bei dem das Jobcenter zumindest teilweise einlenkt. Die Sozialgerichte sind unabhaengig und pruefen den Fall vollstaendig neu - sie sind nicht an die Entscheidung des Jobcenters gebunden.

Eine Klage kann sich auch bei kleinen Betraegen lohnen, da die Entscheidung Grundsatzwirkung fuer alle zukuenftigen Bescheide haben kann. Wenn z.B. eine hoehe re KdU-Obergrenze festgestellt wird, profitieren Sie davon fuer den gesamten weiteren Leistungsbezug.`,
        tip: 'Die Klage vor dem Sozialgericht ist fuer Sie als Leistungsempfaenger kostenfrei. Selbst wenn Sie verlieren, entstehen keine Gerichtsgebuehren. Nutzen Sie dieses Recht!',
      },
      {
        title: 'Ablauf des Klageverfahrens',
        content: `Die Klagefrist betraegt einen Monat nach Zustellung des Widerspruchsbescheids (§ 87 SGG). Die Klage wird beim oertlich zustaendigen Sozialgericht eingereicht. Sie koennen die Klage schriftlich einreichen oder zur Niederschrift bei der Geschaeftsstelle des Sozialgerichts erklaeren - ein Anwalt ist nicht erforderlich.

Die Klage muss enthalten: Ihren Namen und Anschrift, den Beklagten (das Jobcenter), den angefochtenen Bescheid und Widerspruchsbescheid mit Daten und Aktenzeichen, sowie Ihr Begehren (was Sie erreichen wollen). Eine ausfuehrliche Begruendung kann nachgereicht werden.

Nach Eingang der Klage fordert das Gericht die Verwaltungsakte vom Jobcenter an und gibt beiden Seiten Gelegenheit zur Stellungnahme. Es folgt in der Regel ein Eroerrungstermin, in dem der Richter den Sachverhalt bespricht und auf einen Vergleich hinwirkt. Kommt kein Vergleich zustande, findet eine muendliche Verhandlung statt, an deren Ende ein Urteil ergeht.

Die Verfahrensdauer variiert je nach Gericht erheblich. Im Durchschnitt dauern Verfahren vor den Sozialgerichten 12-18 Monate. Eilverfahren (einstweiliger Rechtsschutz nach § 86b SGG) koennen innerhalb weniger Wochen entschieden werden und bieten vorlaeufigen Schutz.`,
      },
      {
        title: 'Prozesskostenhilfe (PKH)',
        content: `Wenn Sie sich einen Anwalt nicht leisten koennen, haben Sie Anspruch auf Prozesskostenhilfe (PKH) nach § 73a SGG i.V.m. §§ 114 ff. ZPO. Die PKH uebernimmt die Anwalts- und Gerichtskosten ganz oder teilweise. Als Buergergeld-Empfaenger erfuellen Sie in der Regel die wirtschaftlichen Voraussetzungen automatisch.

Voraussetzungen fuer PKH sind: Sie koennen die Kosten der Prozessfuehrung nicht, nur zum Teil oder nur in Raten aufbringen, und die beabsichtigte Rechtsverfolgung hat hinreichende Aussicht auf Erfolg und erscheint nicht mutwillig. Das Gericht prueft die Erfolgsaussichten summarisch - es genuegt, wenn ein Erfolg moeglich erscheint.

Den PKH-Antrag stellen Sie zusammen mit der Klage beim Sozialgericht. Dem Antrag muss die "Erklaerung ueber die persoenlichen und wirtschaftlichen Verhaeltnisse" beigefuegt werden (Formular erhaeltlich beim Gericht oder online). Fuegen Sie Nachweise ueber Ihr Einkommen und Vermoegen bei (Buergergeld-Bescheid genuegt in der Regel).

Bei Bewilligung von PKH wird Ihnen ein Rechtsanwalt beigeordnet. Sie koennen selbst einen Anwalt vorschlagen, z.B. einen Fachanwalt fuer Sozialrecht. Das Gericht muss Ihren Vorschlag in der Regel akzeptieren. Die PKH deckt alle Anwaltsgebuehren ab, Sie muessen als Buergergeld-Empfaenger in der Regel keine Ratenzahlung leisten.`,
        tip: 'Stellen Sie den PKH-Antrag immer gleichzeitig mit der Klage. So verlieren Sie keine Zeit. Waehlen Sie moeglichst einen Fachanwalt fuer Sozialrecht - dieser kennt die aktuelle Rechtsprechung und kann Ihre Erfolgsaussichten am besten einschaetzen.',
      },
    ],
  },
  {
    id: 'einkommen-vermoegen',
    title: 'Einkommen & Vermoegen',
    description: 'Freibetraege, Einkommensanrechnung und Schonvermoegen: Was duerfen Sie behalten und was wird angerechnet?',
    icon: Euro,
    difficulty: 'experte',
    estimatedMinutes: 25,
    paragraphs: ['§ 11 SGB II', '§ 11b SGB II', '§ 12 SGB II', '§ 12a SGB II'],
    relatedTools: [
      { label: 'Zuverdienst-Rechner', to: '/rechner/zuverdienst' },
      { label: 'Buergergeld-Rechner', to: '/rechner/buergergeld' },
      { label: 'BescheidScan', to: '/scan' },
    ],
    sections: [
      {
        title: 'Grundregeln der Einkommensanrechnung',
        content: `Als Buergergeld-Empfaenger duerfen Sie grundsaetzlich hinzuverdienen. Allerdings wird Einkommen auf das Buergergeld angerechnet - allerdings nicht vollstaendig. Das Gesetz sieht verschiedene Freibetraege vor, die sicherstellen, dass sich Arbeit immer lohnt.

Als Einkommen gilt nach § 11 SGB II grundsaetzlich alles, was Ihnen in Geld oder Geldeswert zuflie sst: Arbeitsentgelt, Einkuenfte aus selbstaendiger Taetigkeit, Renten, Unterhalt, Kindergeld, Elterngeld (ueber 300 EUR), Krankengeld, Steuererstattungen und aehnliches. Nicht als Einkommen zaehlen unter anderem: Grundrente nach dem Bundesversorgungsgesetz, Blindengeld, Schmerzensgeld und zweckbestimmte Leistungen anderer Traeger (z.B. Pflegegeld, das fuer den Pflegebeduerftigen bestimmt ist).

Einmaliges Einkommen (z.B. eine Steuererstattung oder Abfindung) wird auf einen Zeitraum von 6 Monaten aufgeteilt und monatlich angerechnet (§ 11 Abs. 3 SGB II). Der Zuflussmonat zaehlt als erster Monat. Bei Einnahmen aus nichtselbstaendiger Arbeit gilt das sogenannte Zuflussprinzip: Entscheidend ist der Monat, in dem das Einkommen tatsaechlich auf Ihrem Konto eingeht, nicht der Monat, fuer den es gezahlt wird.

Kindergeld wird dem Kind zugeordnet, nicht den Eltern. Ist das Kind nicht hilfebeduerft ig (z.B. weil es eigenes Einkommen hat), wird das ueberschuessige Kindergeld bei den Eltern angerechnet.`,
        tip: 'Pruefen Sie bei Ihrem Bescheid genau, ob das Einkommen dem richtigen Monat zugeordnet wurde (Zuflussprinzip). Vor allem bei Nachzahlungen oder verspaeteten Gehaltszahlungen passieren hier Fehler.',
      },
      {
        title: 'Freibetraege bei Erwerbseinkommen',
        content: `Die Freibetraege bei Erwerbseinkommen sind in § 11b SGB II geregelt und sorgen dafuer, dass Sie von Ihrem Verdienst immer mehr behalten als ohne Arbeit:

Grundfreibetrag: Die ersten 100 EUR brutto pro Monat sind vollstaendig anrechnungsfrei (§ 11b Abs. 2 SGB II). Dieser Grundfreibetrag deckt pauschal die Kosten fuer Steuern, Sozialversicherung, Versicherungen (30 EUR Pauschale) und Werbungskosten ab. Verdienen Sie weniger als 400 EUR, sinkt der Grundfreibetrag auf die tatsaechlichen Absetzbetraege.

Erwerbstaetigenfreibetrag: Vom Bruttoeinkommen zwischen 100 EUR und 520 EUR bleiben 20% anrechnungsfrei. Vom Bruttoeinkommen zwischen 520 EUR und 1.000 EUR bleiben weitere 10% anrechnungsfrei. Fuer Leistungsberechtigte mit minderjaehrigem Kind gilt die erhoehte Grenze von 1.500 EUR statt 1.000 EUR.

Rechenbeispiel: Sie verdienen 800 EUR brutto. Freibetrag: 100 EUR (Grundfreibetrag) + 84 EUR (20% von 420 EUR, also 520 minus 100) + 28 EUR (10% von 280 EUR, also 800 minus 520) = 212 EUR. Von Ihren 800 EUR brutto werden also 212 EUR nicht angerechnet. Vom Nettoeinkommen abzueglich der Freibetraege wird der Rest auf das Buergergeld angerechnet.

Freibetrag fuer ehrenamtliche Taetigkeit: Aufwandsentschaedigungen fuer ehrenamtliche Taetigkeiten sind bis 250 EUR monatlich anrechnungsfrei (§ 11b Abs. 2 Satz 3 SGB II).`,
        tip: 'Nutzen Sie unseren Zuverdienst-Rechner, um genau zu berechnen, wie viel von Ihrem Verdienst Sie behalten duerfen und wie hoch Ihr Buergergeld-Anspruch nach Anrechnung ist.',
      },
      {
        title: 'Vermoegen und Schonvermoegen',
        content: `Anders als Einkommen ist Vermoegen alles, was Sie bereits besitzen, wenn Sie Buergergeld beantragen. Die Regeln zur Vermoegensanrechnung finden sich in § 12 SGB II.

Karenzzeit: In den ersten 12 Monaten des Leistungsbezugs wird Vermoegen nur beruecksichtigt, wenn es erheblich ist. Die Grenze fuer "erhebliches Vermoegen" liegt bei 40.000 EUR fuer die erste Person der Bedarfsgemeinschaft und 15.000 EUR fuer jede weitere Person (§ 12 Abs. 1 SGB II). In dieser Zeit muessen Sie also kein Vermoegen aufbrauchen, solange es unter diesen Grenzen liegt.

Nach der Karenzzeit gelten niedrigere Freibetraege: 15.000 EUR fuer jede Person der Bedarfsgemeinschaft. Vermoegen ueber diesem Freibetrag ist "verwertbar" und muss eingesetzt werden, bevor Buergergeld bezogen werden kann.

Geschuetztes Vermoegen (unabhaengig von Freibetraegen): Eine selbst bewohnte Immobilie angemessener Groesse (bis 140 qm Haus bzw. 130 qm Wohnung fuer 4 Personen), ein angemessenes Kraftfahrzeug je erwerbsfaehiger Person in der Bedarfsgemeinschaft (Wert bis ca. 15.000 EUR nach Rechtsprechung), Altersvorsorge, die nachweislich nicht vor dem Rentenalter verfuegbar ist (z.B. Riester-Rente mit Verwertungsausschluss), sowie Hausrat und persoenliche Gegenstaende von angemessenem Wert.`,
        tip: 'Nutzen Sie die 12-monatige Karenzzeit! In dieser Zeit koennen Sie bis zu 40.000 EUR behalten, ohne dass es auf das Buergergeld angerechnet wird. Planen Sie Ihren Antrag entsprechend.',
      },
      {
        title: 'Besonderheiten und haeufige Fehler',
        content: `Bei der Einkommens- und Vermoegensanrechnung passieren besonders haeufig Fehler. Achten Sie auf folgende Punkte:

Zuordnung von Kindergeld: Das Kindergeld wird nach § 11 Abs. 1 Satz 5 SGB II dem Kind zugerechnet. Das Jobcenter darf es nicht bei den Eltern als Einkommen anrechnen, wenn das Kind zum Haushalt gehoert. Nur wenn das Kind nicht hilfebeduerft ig ist, wird das ueberschuessige Kindergeld bei den Eltern beruecksichtigt.

Einmaliges Einkommen: Steuererstattungen, Nachzahlungen, Abfindungen und aehnliche einmalige Einnahmen muessen auf 6 Monate verteilt werden. Pruefen Sie, ob die Verteilung korrekt berechnet wurde und ob der richtige Startmonat gewaehlt wurde (Zuflussmonat).

Absetzbetraege: Vom Einkommen sind neben den Freibetraegen auch folgende Betraege abzusetzen: Steuern, Sozialversicherungsbeitraege, Werbungskosten (z.B. Fahrtkosten zur Arbeit, Arbeitskleidung), die Versicherungspauschale von 30 EUR, und Beitraege zu gesetzlich vorgeschriebenen Versicherungen. Pruefen Sie, ob alle Absetzbetraege beruecksichtigt wurden.

Erbschaften und Schenkungen: Diese gelten als Einkommen im Zuflussmonat und werden auf 6 Monate verteilt. Ausnahme: Wenn es sich um verwertbares Vermoegen handelt (z.B. eine geerbte Immobilie), gelten die Vermoegensregelungen. Die Abgrenzung ist komplex - lassen Sie sich hierzu beraten.`,
      },
    ],
  },
]

function loadProgress(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    // ignore parse errors
  }
  return []
}

function saveProgress(completedIds: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(completedIds))
}

export default function LernbereichPage() {
  useDocumentTitle('Lernbereich - BescheidBoxer')

  const [completedModules, setCompletedModules] = useState<string[]>(loadProgress)
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('alle')

  useEffect(() => {
    saveProgress(completedModules)
  }, [completedModules])

  const selectedModule = selectedModuleId
    ? MODULE_DATA.find((m) => m.id === selectedModuleId) ?? null
    : null

  const filteredModules =
    difficultyFilter === 'alle'
      ? MODULE_DATA
      : MODULE_DATA.filter((m) => m.difficulty === difficultyFilter)

  const toggleSection = useCallback((sectionTitle: string) => {
    setExpandedSections((prev) => ({ ...prev, [sectionTitle]: !prev[sectionTitle] }))
  }, [])

  const toggleModuleComplete = useCallback(
    (moduleId: string) => {
      setCompletedModules((prev) =>
        prev.includes(moduleId)
          ? prev.filter((id) => id !== moduleId)
          : [...prev, moduleId],
      )
    },
    [],
  )

  const completionPercent = Math.round(
    (completedModules.length / MODULE_DATA.length) * 100,
  )

  // -- Detail view --
  if (selectedModule) {
    const Icon = selectedModule.icon
    const diffConf = DIFFICULTY_CONFIG[selectedModule.difficulty]
    const isCompleted = completedModules.includes(selectedModule.id)

    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <Breadcrumbs
            items={[
              { label: 'Lernbereich', href: '/lernbereich' },
              { label: selectedModule.title },
            ]}
          />

          <Button
            variant="ghost"
            className="mt-4 mb-6 gap-2"
            onClick={() => {
              setSelectedModuleId(null)
              setExpandedSections({})
            }}
          >
            <ChevronLeft className="w-4 h-4" />
            Zurueck zur Uebersicht
          </Button>

          {/* Module header */}
          <div className="mb-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                <Icon className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">{selectedModule.title}</h1>
                <p className="text-muted-foreground">{selectedModule.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-4">
              <Badge className={`${diffConf.bg} ${diffConf.color} border-0`}>
                {diffConf.label}
              </Badge>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                ca. {selectedModule.estimatedMinutes} Min.
              </span>
              {selectedModule.paragraphs.map((p) => (
                <Badge key={p} variant="outline" className="text-xs">
                  {p}
                </Badge>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-4 mb-8">
            {selectedModule.sections.map((section, idx) => {
              const sectionKey = `${selectedModule.id}-${idx}`
              const isExpanded = expandedSections[sectionKey] ?? idx === 0

              return (
                <Card key={sectionKey} className="overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between gap-3 p-5 text-left hover:bg-muted/50 transition-colors"
                    onClick={() => toggleSection(sectionKey)}
                  >
                    <span className="font-semibold text-lg">{section.title}</span>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <CardContent className="pt-0 pb-5 px-5">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        {section.content.split('\n\n').map((paragraph, pIdx) => (
                          <p key={pIdx} className="mb-3 leading-relaxed text-foreground/90">
                            {paragraph}
                          </p>
                        ))}
                      </div>

                      {section.tip && (
                        <div className="mt-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                          <div className="flex gap-3">
                            <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm mb-1">
                                Praxis-Tipp
                              </p>
                              <p className="text-sm text-amber-900 dark:text-amber-200/90">
                                {section.tip}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>

          {/* Related tools */}
          {selectedModule.relatedTools.length > 0 && (
            <Card className="mb-8">
              <CardContent className="p-5">
                <h3 className="font-semibold mb-3">Passende Werkzeuge</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedModule.relatedTools.map((tool) => (
                    <Link key={tool.to} to={tool.to}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <ChevronRight className="w-3.5 h-3.5" />
                        {tool.label}
                      </Button>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mark complete */}
          <div className="flex justify-center">
            <Button
              size="lg"
              variant={isCompleted ? 'outline' : 'default'}
              className="gap-2"
              onClick={() => toggleModuleComplete(selectedModule.id)}
            >
              {isCompleted ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Abgeschlossen - Erneut als offen markieren
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Als abgeschlossen markieren
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // -- Grid / overview --
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <Breadcrumbs items={[{ label: 'Lernbereich' }]} />

        {/* Hero */}
        <div className="mt-6 mb-10 text-center">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 mb-4">
            <GraduationCap className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Lernbereich</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Deine Rechte verstehen - Schritt fuer Schritt. Lerne in 8 Modulen alles
            Wichtige ueber Buergergeld, Widerspruch und deine Rechte im Sozialrecht.
          </p>
        </div>

        {/* Progress bar */}
        <Card className="mb-8">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                <span className="font-semibold">Dein Lernfortschritt</span>
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                {completedModules.length} von {MODULE_DATA.length} Modulen abgeschlossen
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            {completedModules.length === MODULE_DATA.length && (
              <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-2 text-center">
                Glueckwunsch! Du hast alle Module abgeschlossen.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Difficulty filter */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="w-4 h-4" />
            <span>Filtern:</span>
          </div>
          {(
            [
              { key: 'alle', label: 'Alle Module' },
              { key: 'einsteiger', label: 'Einsteiger' },
              { key: 'fortgeschritten', label: 'Fortgeschritten' },
              { key: 'experte', label: 'Experte' },
            ] as { key: DifficultyFilter; label: string }[]
          ).map(({ key, label }) => (
            <Button
              key={key}
              variant={difficultyFilter === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDifficultyFilter(key)}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Module grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredModules.map((mod) => {
            const Icon = mod.icon
            const diffConf = DIFFICULTY_CONFIG[mod.difficulty]
            const isCompleted = completedModules.includes(mod.id)

            return (
              <Card
                key={mod.id}
                className={`cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
                  isCompleted ? 'ring-2 ring-green-500/30' : ''
                }`}
                onClick={() => setSelectedModuleId(mod.id)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-primary/10">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                    ) : (
                      <Circle className="w-6 h-6 text-muted-foreground/30" />
                    )}
                  </div>

                  <h3 className="font-semibold text-lg mb-1">{mod.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {mod.description}
                  </p>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`${diffConf.bg} ${diffConf.color} border-0 text-xs`}>
                      {diffConf.label}
                    </Badge>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      {mod.estimatedMinutes} Min.
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {mod.sections.length} Abschnitte
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredModules.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Keine Module fuer den gewaehlten Schwierigkeitsgrad gefunden.</p>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <Card className="inline-block">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">Du hast Fragen zu einem Thema?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Unser KI-Berater hilft dir rund um die Uhr bei konkreten Fragen zu deinem Fall.
              </p>
              <Link to="/chat">
                <Button className="gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Zum KI-Berater
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
