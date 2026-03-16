import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Clock,
  ChevronDown,
  ChevronUp,
  Search,
  Scale,
  Shield,
  Lightbulb,
  FileText,
  Heart,
  Home,
  Euro,
  AlertTriangle,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import useDocumentTitle from '@/hooks/useDocumentTitle'

type Category = 'Alle' | 'Grundlagen' | 'Widerspruch' | 'Rechte' | 'Tipps'

interface Article {
  id: string
  title: string
  description: string
  category: Exclude<Category, 'Alle'>
  readingTime: number
  icon: React.ElementType
  content: string
  links: { label: string; to: string }[]
}

const CATEGORY_COLORS: Record<Exclude<Category, 'Alle'>, string> = {
  Grundlagen: 'bg-blue-100 text-blue-800',
  Widerspruch: 'bg-red-100 text-red-800',
  Rechte: 'bg-emerald-100 text-emerald-800',
  Tipps: 'bg-amber-100 text-amber-800',
}

const articles: Article[] = [
  {
    id: 'was-ist-buergergeld',
    title: 'Was ist Buergergeld?',
    description:
      'Die Grundsicherung nach SGB II einfach erklaert: Wer hat Anspruch, wie hoch sind die Regelsaetze 2025 und wie stellt man einen Antrag?',
    category: 'Grundlagen',
    readingTime: 8,
    icon: BookOpen,
    content: `Das Buergergeld ist seit dem 1. Januar 2023 die Grundsicherung fuer erwerbsfaehige Leistungsberechtigte in Deutschland. Es hat das fruehere Arbeitslosengeld II ("Hartz IV") abgeloest und ist im Zweiten Buch Sozialgesetzbuch (SGB II) geregelt.

Wer hat Anspruch?

Anspruch auf Buergergeld haben Personen, die:
- zwischen 15 und dem Rentenalter sind (ss 7 Abs. 1 SGB II),
- erwerbsfaehig sind (mindestens 3 Stunden taeglich arbeiten koennen),
- hilfebeduerft ig sind (den Lebensunterhalt nicht aus eigenem Einkommen oder Vermoegen decken koennen),
- ihren gewoehnlichen Aufenthalt in Deutschland haben.

Auch Angehoerige der Bedarfsgemeinschaft (Partner, Kinder) erhalten Leistungen, selbst wenn sie nicht erwerbsfaehig sind (ss 7 Abs. 2 und 3 SGB II).

Regelsaetze 2025 (ss 20 SGB II):

- Regelbedarfsstufe 1 (Alleinstehende): 563 EUR
- Regelbedarfsstufe 2 (Paare, je Person): 506 EUR
- Regelbedarfsstufe 3 (erwachsene Mitglieder der BG): 451 EUR
- Regelbedarfsstufe 4 (Jugendliche 14-17 Jahre): 471 EUR
- Regelbedarfsstufe 5 (Kinder 6-13 Jahre): 390 EUR
- Regelbedarfsstufe 6 (Kinder 0-5 Jahre): 357 EUR

Der Regelbedarf deckt Ernaehrung, Kleidung, Koerperpflege, Hausrat, Strom und die Teilnahme am gesellschaftlichen Leben ab.

Antragstellung:

Der Antrag wird beim oertlich zustaendigen Jobcenter gestellt (ss 36 SGB II). Es genuegt ein formloser Antrag, auch muendlich oder per E-Mail. Das Jobcenter muss dann die offiziellen Formulare bereitstellen. Der Antrag wirkt auf den Ersten des Monats der Antragstellung zurueck (ss 37 Abs. 2 SGB II). Beispiel: Antrag am 15. Maerz - Leistungen ab 1. Maerz.

Wichtig: Stellen Sie den Antrag so frueh wie moeglich, auch wenn noch nicht alle Unterlagen vorliegen. Fehlende Unterlagen koennen nachgereicht werden.`,
    links: [
      { label: 'Zum Buergergeld-Rechner', to: '/rechner/buergergeld' },
      { label: 'Zum KI-Berater', to: '/chat' },
    ],
  },
  {
    id: 'bescheid-fehler',
    title: 'Bescheid pruefen: Die 5 haeufigsten Fehler',
    description:
      'Jobcenter machen haeufig Fehler bei Bescheiden. Hier erfahren Sie, welche Fehler am oeftesten vorkommen und wie Sie diese erkennen.',
    category: 'Widerspruch',
    readingTime: 10,
    icon: AlertTriangle,
    content: `Studien zeigen, dass etwa 40-50% aller Widersprueche und Klagen gegen Jobcenter-Bescheide erfolgreich sind. Die haeufigsten Fehler:

1. Falsche Berechnung der Kosten der Unterkunft (KdU)

Das Jobcenter kuerzt haeufig die Mietkosten mit der Begruendung, sie seien "unangemessen". Pruefen Sie:
- Wurde die korrekte Mietobergrenze fuer Ihre Stadt angewandt?
- Wurde die Karenzzeit von 12 Monaten bei Erstantrag beruecksichtigt (ss 22 Abs. 1 Satz 2 SGB II)?
- Wurden Heizkosten korrekt berechnet (Richtwert: kommunaler Heizspiegel)?
- Wurde eine Kostensenkungsaufforderung mit angemessener Frist erteilt?

2. Fehlende oder falsch berechnete Mehrbedarfe

Viele Leistungsberechtigte wissen nicht, dass ihnen ein Mehrbedarf zusteht. Haeufig vergessen:
- Mehrbedarf fuer Alleinerziehende (ss 21 Abs. 3 SGB II): 12-60% je nach Anzahl und Alter der Kinder
- Mehrbedarf fuer werdende Muetter ab der 13. Schwangerschaftswoche (ss 21 Abs. 2 SGB II): 17% des Regelsatzes
- Mehrbedarf bei kostenaufwaendiger Ernaehrung (ss 21 Abs. 5 SGB II), z.B. bei Diabetes, Zoeliakie
- Mehrbedarf fuer dezentrale Warmwassererzeugung (ss 21 Abs. 7 SGB II)

3. Falsche Einkommensanrechnung

- Wurde der Grundfreibetrag von 100 EUR korrekt abgesetzt (ss 11b Abs. 2 SGB II)?
- Wurden Werbungskosten, Versicherungspauschale (30 EUR) und Fahrtkosten abgezogen?
- Wurde einmaliges Einkommen (z.B. Steuererstattung) korrekt auf 6 Monate verteilt?
- Wurde Kindergeld korrekt zugeordnet (dem Kind, nicht den Eltern)?

4. Fehlerhafte Vermoegensanrechnung

- Wurde das Schonvermoegen korrekt berechnet (seit 2023: 40.000 EUR fuer die erste Person, 15.000 EUR fuer jede weitere, ss 12 Abs. 1 SGB II)?
- Wurde die Karenzzeit von 12 Monaten beruecksichtigt, in der Vermoegen gar nicht geprueft wird (ss 12 Abs. 3 SGB II)?
- Wurde ein angemessenes Kfz als geschuetzt anerkannt (je Mitglied der BG ein Kfz)?
- Wurde die selbst bewohnte Immobilie als geschuetzt anerkannt (bis 140 qm Haus / 130 qm Wohnung)?

5. Formelle Fehler

- Fehlt eine korrekte Rechtsbehelfsbelehrung? Dann gilt eine Widerspruchsfrist von 1 Jahr statt 1 Monat (ss 66 SGG).
- Ist der Bescheid nicht ausreichend begruendet (ss 35 SGB X)?
- Wurde eine Anhoerung vor belastenden Entscheidungen durchgefuehrt (ss 24 SGB X)?

Tipp: Laden Sie Ihren Bescheid in unseren BescheidScan hoch - die KI findet diese Fehler automatisch.`,
    links: [
      { label: 'Zum BescheidScan', to: '/scan' },
      { label: 'Zum Widerspruchs-Generator', to: '/musterschreiben' },
    ],
  },
  {
    id: 'widerspruch-schritt-fuer-schritt',
    title: 'Widerspruch einlegen Schritt fuer Schritt',
    description:
      'Eine vollstaendige Anleitung, wie Sie gegen einen fehlerhaften Bescheid Widerspruch einlegen - von der Frist bis zum Sozialgericht.',
    category: 'Widerspruch',
    readingTime: 12,
    icon: Scale,
    content: `Wenn Sie der Meinung sind, dass Ihr Bescheid fehlerhaft ist, haben Sie das Recht auf Widerspruch (ss 83 SGG). So gehen Sie vor:

Schritt 1: Frist pruefen

Die Widerspruchsfrist betraegt 1 Monat ab Zugang des Bescheids (ss 84 Abs. 1 SGG). Bei postalischer Zustellung gilt die Zugangsfiktion: Der Bescheid gilt am 3. Tag nach Aufgabe zur Post als zugegangen (ss 37 Abs. 2 SGB X). Die Frist beginnt am Tag nach dem Zugang.

Beispiel: Bescheid abgeschickt am 10. Januar -> Zugang am 13. Januar -> Frist laeuft bis 13. Februar.

Achtung: Fehlt die Rechtsbehelfsbelehrung oder ist sie fehlerhaft, verlaengert sich die Frist auf 1 Jahr (ss 66 Abs. 2 SGG).

Schritt 2: Widerspruch formulieren

Der Widerspruch muss enthalten:
- Ihren Namen, Adresse, Geburtsdatum
- Das Aktenzeichen und Datum des Bescheids
- Die klare Erklaerung "Hiermit lege ich Widerspruch ein"
- Die Begruendung (welche Fehler Sie gefunden haben)

Tipp: Die Begruendung kann auch nachgereicht werden. Um die Frist zu wahren, reicht ein kurzer Widerspruch ohne Begruendung, mit dem Hinweis "Begruendung folgt".

Schritt 3: Widerspruch einreichen

Senden Sie den Widerspruch an das Jobcenter, das den Bescheid erlassen hat. Moeglichkeiten:
- Per Post (Einschreiben empfohlen fuer Nachweis)
- Persoenlich abgeben (Eingangsstempel auf Kopie geben lassen!)
- Per Fax (Sendebericht aufbewahren)

Schritt 4: Warten und nachfassen

Das Jobcenter hat 3 Monate Zeit zur Bearbeitung (ss 88 Abs. 2 SGG). Passiert danach nichts, koennen Sie eine Untaetigkeitsklage beim Sozialgericht erheben. Haeufig erhalten Sie zuerst einen Abhaengebescheid ("Wir bearbeiten Ihren Widerspruch").

Schritt 5: Widerspruchsbescheid pruefen

Wenn der Widerspruch (ganz oder teilweise) abgelehnt wird, erhalten Sie einen Widerspruchsbescheid. Dagegen koennen Sie innerhalb von 1 Monat Klage beim Sozialgericht einreichen. Klagen im Sozialrecht sind fuer Leistungsempfaenger kostenfrei - es fallen keine Gerichtsgebuehren an (ss 183 SGG).

Wichtig: Der Widerspruch hat keine aufschiebende Wirkung (ss 86a Abs. 2 Nr. 4 SGG). Die Kuerzung bleibt also zunaechst bestehen. Bei existenzbedrohenden Kuerzungen koennen Sie beim Sozialgericht einen Eilantrag (einstweilige Anordnung nach ss 86b Abs. 2 SGG) stellen.`,
    links: [
      { label: 'Widerspruch generieren', to: '/musterschreiben' },
      { label: 'Zum Fristen-Rechner', to: '/rechner/fristen' },
      { label: 'Zum Widerspruch-Tracker', to: '/tracker' },
    ],
  },
  {
    id: 'kosten-der-unterkunft',
    title: 'Kosten der Unterkunft: Was wird gezahlt?',
    description:
      'Alles zu Miete und Heizung im Buergergeld: Wann das Jobcenter die vollen Kosten zahlt, was "angemessen" bedeutet und was bei zu hoher Miete passiert.',
    category: 'Grundlagen',
    readingTime: 9,
    icon: Home,
    content: `Nach ss 22 Abs. 1 SGB II werden die tatsaechlichen Aufwendungen fuer Unterkunft und Heizung uebernommen, soweit sie angemessen sind.

Was zaehlt zu den KdU?

- Kaltmiete (Grundmiete)
- Kalte Betriebskosten (Wasser, Muellabfuhr, Hausmeister, etc.)
- Heizkosten (inkl. Warmwasser, wenn zentral)
- Bei Eigentum: Schuldzinsen (nicht Tilgung!), Grundsteuer, Wohngeld, Versicherung

Angemessenheit der Unterkunftskosten

Das Jobcenter erstellt ein "schluessiges Konzept" fuer die Mietobergrenze. Dieses muss sich an den oertlichen Verhaeltnissen orientieren. Orientierung bieten:
- Mietspiegel der Gemeinde
- Wohngeldtabelle (ss 12 WoGG) + 10% Sicherheitszuschlag (BSG-Rechtsprechung)
- Eigene Erhebungen des Jobcenters

Angemessene Wohnungsgroesse (Richtwerte):
- 1 Person: 45-50 qm
- 2 Personen: 60 qm
- 3 Personen: 75 qm
- 4 Personen: 85-90 qm
- jede weitere Person: +10-15 qm

Karenzzeit (ss 22 Abs. 1 Satz 2 und 3 SGB II)

In den ersten 12 Monaten des Leistungsbezugs werden die tatsaechlichen Kosten der Unterkunft uebernommen, auch wenn sie unangemessen hoch sind. Nur die Heizkosten muessen von Anfang an angemessen sein.

Was passiert bei unangemessenen Kosten?

Nach Ablauf der Karenzzeit:
1. Das Jobcenter muss Sie schriftlich zur Kostensenkung auffordern.
2. Sie erhalten eine Frist von in der Regel 6 Monaten.
3. Erst danach darf das Jobcenter die Leistung auf die angemessene Hoehe kuerzen.

Wichtig: Es muss tatsaechlich angemessener Wohnraum verfuegbar sein! Wenn Sie trotz Bemuehungen keine guenstigere Wohnung finden, muessen die hoeheren Kosten weiter uebernommen werden. Dokumentieren Sie Ihre Wohnungssuche (Bewerbungen, Absagen).

Umzug

Vor einem Umzug sollten Sie die Zusicherung des Jobcenters einholen (ss 22 Abs. 6 SGB II). Dann werden auch Umzugskosten, Mietkaution (als Darlehen) und Maklergebuehren uebernommen.`,
    links: [
      { label: 'Zum KdU-Rechner', to: '/rechner/kdu' },
      { label: 'Zum Buergergeld-Rechner', to: '/rechner/buergergeld' },
    ],
  },
  {
    id: 'mehrbedarf',
    title: 'Mehrbedarf: Wann steht dir mehr zu?',
    description:
      'Neben dem Regelsatz gibt es Mehrbedarfe fuer besondere Lebenslagen. Erfahren Sie, welche Mehrbedarfe es gibt und wie Sie diese beantragen.',
    category: 'Rechte',
    readingTime: 8,
    icon: Heart,
    content: `Mehrbedarfe nach ss 21 SGB II sind zusaetzliche Leistungen zum Regelbedarf fuer Personen in besonderen Lebenslagen. Sie muessen nicht gesondert beantragt werden, wenn dem Jobcenter die Umstaende bekannt sind - in der Praxis sollten Sie aber sicherheitshalber immer einen schriftlichen Antrag stellen.

Mehrbedarf fuer Schwangere (ss 21 Abs. 2 SGB II)

Ab der 13. Schwangerschaftswoche: 17% des Regelbedarfs.
Bei Regelbedarfsstufe 1 (563 EUR): 95,71 EUR zusaetzlich pro Monat.
Nachweis: Mutterpass vorlegen.

Mehrbedarf fuer Alleinerziehende (ss 21 Abs. 3 SGB II)

Abhaengig von Anzahl und Alter der Kinder:
- 1 Kind unter 7 Jahre: 36% des Regelsatzes (202,68 EUR)
- 1 Kind ueber 7 Jahre: 12% des Regelsatzes (67,56 EUR)
- 2 Kinder unter 16 Jahre: 36% (202,68 EUR)
- 2 Kinder, davon eins ueber 16: 24% (135,12 EUR)
- 3 Kinder: 36% (202,68 EUR)
- 4 Kinder: 48% (270,24 EUR)
- 5 oder mehr Kinder: 60% (337,80 EUR)
Maximum: 60% des Regelsatzes.

Mehrbedarf fuer Menschen mit Behinderung (ss 21 Abs. 4 SGB II)

35% des Regelsatzes (197,05 EUR) fuer Personen, die Leistungen zur Teilhabe am Arbeitsleben erhalten (z.B. in einer Werkstatt fuer behinderte Menschen oder bei einem anderen Leistungsanbieter) oder die einen Schwerbehindertenausweis mit Merkzeichen G oder aG besitzen.

Mehrbedarf fuer kostenaufwaendige Ernaehrung (ss 21 Abs. 5 SGB II)

Bei medizinisch notwendiger besonderer Ernaehrung, z.B.:
- Zoeliakie: ca. 86,40 EUR/Monat (Empfehlung DV)
- Niereninsuffizienz (Dialyse): ca. 86,40 EUR/Monat
- Mukoviszidose: ca. 129,60 EUR/Monat
- Krebs/HIV mit Untergewicht: ca. 86,40 EUR/Monat
Nachweis: Aerztliches Attest erforderlich.

Mehrbedarf fuer dezentrale Warmwassererzeugung (ss 21 Abs. 7 SGB II)

Wenn Warmwasser nicht zentral, sondern ueber einen Durchlauferhitzer oder Boiler erzeugt wird:
- Regelbedarfsstufe 1: 2,3% = 12,95 EUR
- Regelbedarfsstufe 2: 2,3% = 11,64 EUR

Mehrbedarf bei unabweisbarem Bedarf (ss 21 Abs. 6 SGB II)

Haertefallregelung fuer besondere, nicht vom Regelsatz abgedeckte Bedarfe, z.B.:
- Putz- und Hygieneartikel bei bestimmten Krankheiten
- Nicht verschreibungspflichtige Medikamente bei chronischer Erkrankung
- Kosten fuer Umgangsrecht mit Kindern (Fahrtkosten)`,
    links: [
      { label: 'Zum Mehrbedarf-Rechner', to: '/rechner/mehrbedarf' },
      { label: 'Zum KI-Berater', to: '/chat' },
    ],
  },
  {
    id: 'sanktionen',
    title: 'Sanktionen: Deine Rechte kennen',
    description:
      'Was darf das Jobcenter kuerzen, welche Grenzen hat das Bundesverfassungsgericht gesetzt und wie wehren Sie sich gegen unrechtmaessige Sanktionen?',
    category: 'Rechte',
    readingTime: 10,
    icon: Shield,
    content: `Sanktionen (offiziell "Leistungsminderungen" nach ss 31 ff. SGB II) sind Kuerzungen des Buergergeldes bei Pflichtverletzungen. Seit der Buergergeld-Reform und dem Urteil des Bundesverfassungsgerichts (BVerfG, 05.11.2019, Az. 1 BvL 7/16) gelten strengere Regeln fuer das Jobcenter.

Wann drohen Sanktionen?

Nach ss 31 Abs. 1 SGB II bei:
- Weigerung, eine zumutbare Arbeit oder Massnahme anzunehmen oder fortzufuehren
- Nichterscheinen zu einem Meldetermin ohne wichtigen Grund (ss 32 SGB II)
- Verstoss gegen Pflichten aus dem Kooperationsplan (frueher: Eingliederungsvereinbarung)
- Weigerung, eine zumutbare Massnahme zur Eingliederung anzutreten

Hoehe der Sanktionen (seit 01.01.2023):

- Erste Pflichtverletzung: 10% des Regelsatzes fuer 1 Monat
- Zweite Pflichtverletzung: 20% des Regelsatzes fuer 2 Monate
- Dritte und weitere: 30% des Regelsatzes fuer 3 Monate

Maximum: 30% des Regelsatzes. Hoehrere Kuerzungen sind seit dem BVerfG-Urteil verfassungswidrig.

Bei Meldeversaeumnissen (ss 32 SGB II): 10% des Regelsatzes fuer 1 Monat.

Wichtig - das Existenzminimum ist geschuetzt:

Das BVerfG hat klargestellt: Das menschenwuerdige Existenzminimum darf nicht unterschritten werden. Kuerzungen ueber 30% hinaus sind unzulaessig. Bei Haertefaellen kann die Sanktion ganz entfallen.

Ihre Rechte bei einer Sanktion:

1. Anhoerung (ss 24 SGB X): Vor jeder Sanktion muss das Jobcenter Sie anhoeren und Ihnen die Moeglichkeit geben, einen "wichtigen Grund" vorzutragen.

2. Wichtige Gruende koennen sein:
   - Krankheit (Arbeitsunfaehigkeitsbescheinigung)
   - Fehlende Kinderbetreuung
   - Pflege von Angehoerigen
   - Unzumutbarkeit der Arbeit (z.B. gesundheitliche Einschraenkungen)
   - Drohende Obdachlosigkeit
   - Brief nicht erhalten (Zugangsnachweis fehlt)

3. Widerspruch einlegen: Innerhalb von 1 Monat nach Zugang des Sanktionsbescheids.

4. Eilantrag beim Sozialgericht: Bei existenzbedrohenden Kuerzungen koennen Sie einen Eilantrag (einstweilige Anordnung, ss 86b Abs. 2 SGG) stellen.

5. Kuerzung von KdU ist verboten: Kosten der Unterkunft duerfen durch Sanktionen nicht gekuerzt werden - es droht sonst Obdachlosigkeit.

Tipp: Seit der Buergergeld-Reform ist das Sanktionssystem deutlich milder geworden. Viele Sanktionen sind angreifbar. Legen Sie immer Widerspruch ein!`,
    links: [
      { label: 'Zum Sanktions-Rechner', to: '/rechner/sanktion' },
      { label: 'Widerspruch gegen Sanktion', to: '/musterschreiben' },
    ],
  },
  {
    id: 'freibetraege',
    title: 'Freibetraege bei Erwerbstaetigkeit',
    description:
      'Wie viel duerfen Sie verdienen, ohne dass das Buergergeld gekuerzt wird? Alle Freibetraege und Absetzbetraege im Ueberblick.',
    category: 'Grundlagen',
    readingTime: 7,
    icon: Euro,
    content: `Wenn Sie neben dem Buergergeld arbeiten, wird nicht das gesamte Einkommen angerechnet. Es gibt Freibetraege nach ss 11b SGB II, die Ihnen erhalten bleiben.

Grundfreibetrag (ss 11b Abs. 2 SGB II):

Die ersten 100 EUR brutto bleiben komplett anrechnungsfrei. Dieser Betrag deckt pauschal ab:
- Werbungskosten (Fahrtkosten, Arbeitskleidung etc.)
- Versicherungspauschale (30 EUR)
- Beitraege zur Riester-Rente
Bei geringeren tatsaechlichen Kosten: mindestens 100 EUR Freibetrag.

Erwerbstaetigen-Freibetrag (ss 11b Abs. 3 SGB II):

Vom Bruttoeinkommen ueber 100 EUR bleiben zusaetzlich frei:
- 20% des Einkommens zwischen 100 EUR und 520 EUR
- 10% des Einkommens zwischen 520 EUR und 1.000 EUR
- Bei mindestens einem minderjaehrigen Kind in der BG: 10% des Einkommens zwischen 1.000 EUR und 1.500 EUR

Rechenbeispiel - Bruttoeinkommen 1.000 EUR:

1. Grundfreibetrag: 100 EUR
2. 20% von 420 EUR (100-520 EUR): 84 EUR
3. 10% von 480 EUR (520-1.000 EUR): 48 EUR
Gesamter Freibetrag: 232 EUR
Angerechnetes Einkommen: 768 EUR (abzgl. Sozialversicherung und Steuern)

Hinweis: Die Berechnung erfolgt vom Bruttoeinkommen. Die tatsaechlichen Abzuege fuer Sozialversicherung und Steuern werden zusaetzlich abgesetzt (ss 11b Abs. 1 Nr. 1 und 2 SGB II). Der tatsaechlich angerechnete Betrag ist daher niedriger als das Brutto minus Freibetrag.

Besonderheit: Ehrenamtspauschale und Aufwandsentschaedigungen

Aufwandsentschaedigungen aus einem Ehrenamt (z.B. Uebungsleiterpauschale) sind bis 250 EUR monatlich anrechnungsfrei (ss 11a Abs. 1 Nr. 5 SGB II).

Besonderheit: Schueler, Studenten, Auszubildende

Fuer Einkommen aus Schuelerjobs, Praktika und Ausbildung gelten teilweise guenstigere Regelungen. Einkommen aus Ferienjobs bei Schuelern unter 25 Jahren ist bis zu einer bestimmten Grenze vollstaendig anrechnungsfrei.

Wichtig: Jedes Einkommen muss dem Jobcenter gemeldet werden, auch wenn es unter dem Freibetrag liegt!`,
    links: [
      { label: 'Zum Freibetrags-Rechner', to: '/rechner/freibetrag' },
      { label: 'Zum Buergergeld-Rechner', to: '/rechner/buergergeld' },
    ],
  },
  {
    id: 'schonvermoegen',
    title: 'Schonvermoegen: Was darfst du behalten?',
    description:
      'Seit der Buergergeld-Reform gibt es deutlich hoehere Schonvermoegen. Erfahren Sie, welches Vermoegen geschuetzt ist und was angerechnet wird.',
    category: 'Rechte',
    readingTime: 7,
    icon: Shield,
    content: `Beim Buergergeld wird Vermoegen nur noch eingeschraenkt beruecksichtigt. Die Regeln wurden mit der Buergergeld-Reform ab 2023 deutlich verbessert.

Karenzzeit (ss 12 Abs. 3 SGB II):

In den ersten 12 Monaten des Leistungsbezugs wird Vermoegen nicht beruecksichtigt, es sei denn, es ist "erheblich". Als erheblich gilt Vermoegen ueber:
- 40.000 EUR fuer die erste Person der Bedarfsgemeinschaft
- 15.000 EUR fuer jede weitere Person

In der Karenzzeit duerfen Sie also bis zu diesen Grenzen Vermoegen behalten, ohne dass es angerechnet wird.

Nach der Karenzzeit (ss 12 Abs. 1 SGB II):

Geschuetztes Vermoegen (Schonvermoegen):
- 15.000 EUR pro Person in der Bedarfsgemeinschaft
- Angemessene selbst bewohnte Immobilie (bis 140 qm Haus oder 130 qm Eigentumswohnung, ss 12 Abs. 1 Nr. 5 SGB II)
- Ein angemessenes Kraftfahrzeug pro erwerbsfaehigem Mitglied der BG (Wert bis ca. 15.000 EUR, Einzelfallentscheidung)
- Altersvorsorge: Riester-Rente ist vollstaendig geschuetzt; andere Altersvorsorge, wenn vertraglich bis zur Rente festgelegt

Nicht als Vermoegen angerechnet (ss 12 Abs. 1 SGB II):

- Angemessener Hausrat
- Gegenueber Pfaendung geschuetzte Vermoegen
- Sachen und Rechte, deren Verwertung offensichtlich unwirtschaftlich waere
- Gegenueber dem Vermoegen, das zur baldigen Beschaffung oder Erhalt eines angemessenen Hausgrundstücks bestimmt ist

Praxis-Tipps:

- Dokumentieren Sie Ihr Vermoegen bei Antragstellung genau.
- Ein Girokonto-Guthaben zum Monatsende ist nicht automatisch Vermoegen - es kann sich um Einkommen des laufenden Monats handeln.
- Rueckzahlungen und Steuererstattungen gelten als Einkommen im Zuflussmonat, nicht als Vermoegen.
- Bei Ueberschreitung der Grenze um wenige Euro: Verbrauchen Sie das ueberschuessige Vermoegen fuer angemessene Anschaffungen vor Antragstellung.`,
    links: [
      { label: 'Zum Schonvermoegen-Rechner', to: '/rechner/schonvermoegen' },
      { label: 'Zum KI-Berater', to: '/chat' },
    ],
  },
  {
    id: 'eingliederungsvereinbarung',
    title: 'Eingliederungsvereinbarung: Tipps',
    description:
      'Seit dem Buergergeld heisst sie "Kooperationsplan". Was Sie unterschreiben muessen, was nicht, und wie Sie Ihre Rechte wahren.',
    category: 'Tipps',
    readingTime: 8,
    icon: FileText,
    content: `Die fruehere Eingliederungsvereinbarung (EGV) wurde mit dem Buergergeld durch den Kooperationsplan (ss 15 SGB II) ersetzt. Dieser soll gemeinsam und auf Augenhoehe erstellt werden.

Was ist der Kooperationsplan?

Der Kooperationsplan ersetzt die alte Eingliederungsvereinbarung und soll die Eingliederungsstrategie dokumentieren. Er wird zwischen Ihnen und Ihrem Ansprechpartner im Jobcenter vereinbart und enthaelt:
- Ihre beruflichen Ziele
- Konkrete Schritte zur Eingliederung
- Angebote und Massnahmen des Jobcenters
- Ihre eigenen Bemuehungen

Wichtige Aenderungen gegenueber der alten EGV:

1. Kein Verwaltungsakt mehr: Der Kooperationsplan kann nicht mehr als Verwaltungsakt erlassen werden. Er wird gemeinsam erstellt.
2. Potenzialanalyse zuerst: Vor Abschluss des Kooperationsplans muss das Jobcenter eine Potenzialanalyse (Staerken, Qualifikationen, Hemmnisse) durchfuehren (ss 15 Abs. 1 SGB II).
3. Vertrauenszeit: In den ersten 6 Monaten soll der Fokus auf Vertrauensaufbau liegen. Sanktionen wegen des Kooperationsplans sind in dieser Zeit ausgeschlossen.
4. Schlichtungsverfahren: Bei Meinungsverschiedenheiten gibt es ein Schlichtungsverfahren (ss 15a SGB II) bevor Sanktionen drohen.

Ihre Rechte:

- Sie muessen nichts unterschreiben, was Sie fuer unzumutbar halten.
- Fordern Sie Bedenkzeit - unterschreiben Sie nichts unter Druck.
- Lassen Sie sich eine Kopie geben.
- Unzumutbare Massnahmen muessen Sie nicht akzeptieren (z.B. Arbeit deutlich unter Qualifikation in den ersten 6 Monaten).
- Sie koennen jederzeit eine Ueberarbeitung des Kooperationsplans verlangen.

Tipps fuer das Gespraech:

- Bringen Sie eigene Vorschlaege ein (z.B. gewuenschte Weiterbildung).
- Notieren Sie, was muendlich besprochen wird.
- Nehmen Sie eine Vertrauensperson mit (Sie haben das Recht auf einen Beistand nach ss 13 Abs. 4 SGB X).
- Bitten Sie um schriftliche Bestaetigung von Zusagen.`,
    links: [
      { label: 'Zum KI-Berater', to: '/chat' },
      { label: 'Zum Forum', to: '/forum' },
    ],
  },
  {
    id: 'erstausstattung',
    title: 'Erstausstattung beantragen',
    description:
      'Bei Einzug in die erste Wohnung, Schwangerschaft oder nach besonderen Umstaenden haben Sie Anspruch auf Erstausstattung. So beantragen Sie diese.',
    category: 'Tipps',
    readingTime: 6,
    icon: Home,
    content: `Nach ss 24 Abs. 3 SGB II koennen Sie Leistungen fuer Erstausstattungen als einmalige Bedarfe beantragen. Diese sind nicht im Regelsatz enthalten und werden zusaetzlich gewaehrt.

Arten der Erstausstattung:

1. Erstausstattung fuer die Wohnung (ss 24 Abs. 3 Nr. 1 SGB II):
   - Bei Bezug der ersten eigenen Wohnung
   - Nach Obdachlosigkeit, Brand, Wasserschaden
   - Nach Trennung vom Partner (wenn Hausrat beim Partner verbleibt)
   - Nach Haftentlassung
   Umfasst: Moebel, Kuechengeraete, Geschirr, Bettwaesche, Gardinen, etc.

2. Erstausstattung fuer Bekleidung (ss 24 Abs. 3 Nr. 2 SGB II):
   - Nach erheblicher Gewichtsveraenderung (z.B. durch Krankheit)
   - Nach Obdachlosigkeit oder Wohnungsbrand
   - Saisonale Bekleidung bei Erstbezug

3. Erstausstattung bei Schwangerschaft und Geburt (ss 24 Abs. 3 Nr. 2 SGB II):
   - Schwangerschaftsbekleidung (ab ca. 13. Woche)
   - Babykleidung
   - Kinderwagen, Kinderbett, Wickelkommode
   - Babybadewanne, Flaeschchen etc.
   Richtwerte variieren je nach Kommune, liegen aber meist bei 800-1.500 EUR insgesamt.

Wie beantragen?

1. Schriftlichen Antrag beim Jobcenter stellen (formlos moeglich).
2. Begruendung angeben (z.B. "Erstbezug eigener Wohnung" oder "Schwangerschaft").
3. Bei Schwangerschaft: Mutterpass oder aerztliche Bescheinigung beilegen.
4. Liste der benoetigten Gegenstaende beifuegen.

Pauschale oder Sachleistung?

Die meisten Jobcenter zahlen Pauschalen aus. Die Hoehe variiert je nach Kommune. Manche Jobcenter bieten auch Gutscheine oder verweisen auf Moebelkammern. Sie haben grundsaetzlich das Recht, die Pauschale als Geldleistung zu erhalten.

Wichtig: Erstausstattung ist keine Ersatzbeschaffung! Wenn Ihre Waschmaschine kaputt geht, ist das keine Erstausstattung, sondern muss grundsaetzlich aus dem Regelsatz (Ansparrate) finanziert werden. In Haertefaellen koennen Sie ein Darlehen nach ss 24 Abs. 1 SGB II beantragen.

Tipp: Stellen Sie den Antrag fruehzeitig, besonders bei Schwangerschaft. Die Bearbeitung kann mehrere Wochen dauern.`,
    links: [
      { label: 'Zum Musterschreiben-Generator', to: '/musterschreiben' },
      { label: 'Zum KI-Berater', to: '/chat' },
    ],
  },
  {
    id: 'prozesskostenhilfe',
    title: 'Prozesskostenhilfe beantragen',
    description:
      'Wer kein Geld fuer einen Anwalt hat, kann Prozesskostenhilfe beantragen. So funktioniert PKH beim Sozialgericht.',
    category: 'Tipps',
    readingTime: 7,
    icon: Scale,
    content: `Prozesskostenhilfe (PKH) nach ss 73a SGG i.V.m. ss 114 ff. ZPO ermoeglicht es Ihnen, einen Rechtsanwalt zu beauftragen, ohne die Kosten selbst tragen zu muessen. Als Buergergeld-Empfaenger haben Sie in der Regel Anspruch auf PKH.

Voraussetzungen:

1. Beduerfigkeit: Sie koennen die Kosten nicht selbst tragen. Als Buergergeld-Empfaenger ist diese Voraussetzung praktisch immer erfuellt.
2. Erfolgsaussicht: Die beabsichtigte Klage muss hinreichende Aussicht auf Erfolg haben. Das Gericht prueft dies summarisch.
3. Keine Mutwilligkeit: Die Rechtsverfolgung darf nicht mutwillig sein.

Besonderheit im Sozialrecht:

Klagen beim Sozialgericht sind fuer Leistungsempfaenger immer gerichtkostenfrei (ss 183 SGG). PKH brauchen Sie also nur, wenn Sie einen Anwalt beauftragen moechten. Grundsaetzlich koennen Sie auch ohne Anwalt klagen - das Sozialgericht hat eine Amtsermittlungspflicht.

Antragstellung:

1. Der PKH-Antrag wird beim Sozialgericht gestellt, bei dem die Klage erhoben werden soll.
2. Verwenden Sie das amtliche Formular "Erklaerung ueber die persoenlichen und wirtschaftlichen Verhaeltnisse" (erhaeltlich beim Gericht oder online).
3. Fuegen Sie bei: aktueller Buergergeld-Bescheid, Kontoauszuege der letzten 3 Monate, Mietvertrag.
4. Der PKH-Antrag kann zusammen mit der Klage eingereicht werden.

Was wird bezahlt?

- Anwaltsgebuehren nach dem Rechtsanwaltverguetungsgesetz (RVG)
- Fahrtkosten zum Gericht
- Dolmetscherkosten bei Bedarf
- Sachverstaendigenkosten

Wichtig: PKH kann auch nachtraeglich bewilligt werden, wenn sie vor Abschluss des Verfahrens beantragt wurde.

Rueckzahlung: Bei PKH ohne Ratenzahlung (was als Buergergeld-Empfaenger der Regelfall ist) muessen Sie nichts zurueckzahlen, auch wenn Sie den Prozess verlieren.

Alternative: Beratungshilfe

Fuer die aussergerichtliche Beratung (z.B. Widerspruchsverfahren) gibt es die Beratungshilfe nach dem Beratungshilfegesetz. Beantragen Sie einen Beratungshilfeschein beim Amtsgericht (Gebuehr: 15 EUR, die auch erlassen werden kann).`,
    links: [
      { label: 'Zum PKH-Rechner', to: '/rechner/pkh' },
      { label: 'Zum KI-Berater', to: '/chat' },
    ],
  },
  {
    id: 'mitwirkungspflichten',
    title: 'Mitwirkungspflichten: Was muss ich tun?',
    description:
      'Das Jobcenter verlangt vieles - aber nicht alles muessen Sie sich gefallen lassen. Ueberblick ueber Pflichten und deren Grenzen.',
    category: 'Rechte',
    readingTime: 9,
    icon: Users,
    content: `Als Buergergeld-Empfaenger haben Sie Mitwirkungspflichten (ss 60 ff. SGB I und ss 31 ff. SGB II). Diese sind aber nicht grenzenlos.

Ihre Pflichten:

1. Meldepflicht (ss 59 SGB II i.V.m. ss 309 SGB III):
   - Erscheinen zu Meldeterminen beim Jobcenter
   - Ladung muss mindestens 3 Tage vorher zugehen
   - Maximal 1x pro Woche (bei Unter-25-Jaehrigen bis zu 2x)

2. Mitwirkung bei der Vermittlung (ss 2 SGB II):
   - Aktive Eigenbemuehungen bei der Arbeitssuche
   - Annahme zumutbarer Arbeit
   - Teilnahme an Massnahmen der Eingliederung

3. Auskunfts- und Mitteilungspflichten (ss 60 SGB I):
   - Aenderungen der persoenlichen Verhaeltnisse mitteilen (Umzug, neues Einkommen, Zusammenzug)
   - Belege und Nachweise vorlegen (Lohnabrechnungen, Kontoauszuege)
   - Antragsformulare wahrheitsgemass ausfuellen

4. Eingliederungsbemuehungen:
   - Pflichten aus dem Kooperationsplan einhalten
   - Bewerbungen nachweisen
   - An vereinbarten Massnahmen teilnehmen

Grenzen der Mitwirkungspflichten:

Sie muessen NICHT:
- Einen Job annehmen, der gegen Arbeitsschutzgesetze verstoesst
- Arbeit annehmen, die gesundheitlich unzumutbar ist (aerztliches Attest!)
- Bei Krankheit zu Terminen erscheinen (Arbeitsunfaehigkeitsbescheinigung vorlegen)
- Arbeit annehmen, wenn die Kinderbetreuung nicht gesichert ist (bei Kindern unter 3 Jahren generell nicht, ss 10 Abs. 1 Nr. 3 SGB II)
- Sittenwidrige oder strafbare Arbeit annehmen
- Unverhaeltnismaessig weit pendeln (Faustregel: bis 2,5 Stunden taeglich bei Vollzeit)
- Ihre Wohnung aufgeben fuer einen Job in einer anderen Stadt (in den ersten 6 Monaten)

Zumutbarkeit von Arbeit (ss 10 SGB II):

Grundsaetzlich ist jede Arbeit zumutbar, auch wenn sie:
- nicht der Ausbildung oder frueheren Taetigkeit entspricht
- schlechter bezahlt ist als fruehere Jobs
- befristet ist oder Zeitarbeit

ABER: In den ersten 6 Monaten des Leistungsbezugs soll die Qualifikation geschuetzt werden - Sie muessen keine Arbeit annehmen, die deutlich unter Ihrer Qualifikation liegt.

Was tun bei unangemessenen Forderungen?

1. Dokumentieren Sie alles schriftlich.
2. Widersprechen Sie schriftlich, wenn eine Forderung unzumutbar ist.
3. Legen Sie Widerspruch gegen Sanktionsbescheide ein.
4. Nehmen Sie eine Vertrauensperson als Beistand mit zu Terminen (ss 13 Abs. 4 SGB X).
5. Im Zweifelsfall: Holen Sie sich Beratung (Sozialverband, Anwalt, oder hier im Chat).`,
    links: [
      { label: 'Zum KI-Berater', to: '/chat' },
      { label: 'Zum Forum', to: '/forum' },
      { label: 'Widerspruch generieren', to: '/musterschreiben' },
    ],
  },
]

const CATEGORIES: Category[] = ['Alle', 'Grundlagen', 'Widerspruch', 'Rechte', 'Tipps']

export default function WissenPage() {
  useDocumentTitle('Wissen & Ratgeber')

  const [activeCategory, setActiveCategory] = useState<Category>('Alle')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null)

  const toggleArticle = (id: string) => {
    setExpandedArticle(expandedArticle === id ? null : id)
  }

  const filteredArticles = articles.filter((article) => {
    const matchesCategory =
      activeCategory === 'Alle' || article.category === activeCategory
    const matchesSearch =
      searchQuery === '' ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-boxer rounded-full mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Wissen & Ratgeber
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Verstehen Sie Ihre Rechte. Fundiertes Wissen zu Buergergeld, SGB II
            und Sozialrecht - verstaendlich erklaert, mit konkreten Tipps und
            Paragraphen-Verweisen.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8 max-w-xl mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Artikel durchsuchen (z.B. Mehrbedarf, Sanktion, KdU...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === category
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-red-300 hover:text-red-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <p className="text-sm text-gray-500 mb-6">
          {filteredArticles.length}{' '}
          {filteredArticles.length === 1 ? 'Artikel' : 'Artikel'} gefunden
          {searchQuery && (
            <span>
              {' '}
              fuer{' '}
              <span className="font-medium text-gray-700">
                &quot;{searchQuery}&quot;
              </span>
            </span>
          )}
        </p>

        {/* Article Cards */}
        <div className="space-y-4">
          {filteredArticles.map((article) => {
            const Icon = article.icon
            const isExpanded = expandedArticle === article.id

            return (
              <Card
                key={article.id}
                className="transition-all hover:shadow-md overflow-hidden"
              >
                <CardContent className="p-0">
                  {/* Card Header - Always Visible */}
                  <button
                    onClick={() => toggleArticle(article.id)}
                    className="w-full text-left p-5 sm:p-6 flex items-start gap-4"
                  >
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                        article.category === 'Grundlagen'
                          ? 'bg-blue-50 text-blue-600'
                          : article.category === 'Widerspruch'
                            ? 'bg-red-50 text-red-600'
                            : article.category === 'Rechte'
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-amber-50 text-amber-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge
                          className={`${CATEGORY_COLORS[article.category]} text-xs`}
                        >
                          {article.category}
                        </Badge>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {article.readingTime} Min. Lesezeit
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {article.title}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {article.description}
                      </p>
                    </div>

                    <div className="flex-shrink-0 mt-1">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      <div className="p-5 sm:p-6 pt-4 sm:pt-5">
                        <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                          {article.content.split('\n\n').map((paragraph, i) => {
                            const trimmed = paragraph.trim()
                            if (!trimmed) return null

                            // Headings (lines ending without period, short)
                            if (
                              !trimmed.includes('\n') &&
                              trimmed.length < 80 &&
                              !trimmed.endsWith('.') &&
                              !trimmed.endsWith(':') &&
                              !trimmed.startsWith('-') &&
                              !trimmed.startsWith('*') &&
                              !trimmed.match(/^\d+\./)
                            ) {
                              return (
                                <h4
                                  key={i}
                                  className="text-base font-semibold text-gray-900 mt-5 mb-2"
                                >
                                  {trimmed}
                                </h4>
                              )
                            }

                            // Headings with colon
                            if (
                              trimmed.endsWith(':') &&
                              !trimmed.includes('\n') &&
                              trimmed.length < 100
                            ) {
                              return (
                                <h4
                                  key={i}
                                  className="text-base font-semibold text-gray-900 mt-5 mb-2"
                                >
                                  {trimmed}
                                </h4>
                              )
                            }

                            // Lists (lines starting with -)
                            if (trimmed.includes('\n-') || trimmed.startsWith('-')) {
                              const lines = trimmed.split('\n')
                              const heading = !lines[0].startsWith('-')
                                ? lines[0]
                                : null
                              const items = lines.filter((l) =>
                                l.trim().startsWith('-')
                              )
                              return (
                                <div key={i} className="my-3">
                                  {heading && (
                                    <h4 className="text-base font-semibold text-gray-900 mt-5 mb-2">
                                      {heading}
                                    </h4>
                                  )}
                                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                                    {items.map((item, j) => (
                                      <li key={j}>{item.replace(/^-\s*/, '')}</li>
                                    ))}
                                  </ul>
                                </div>
                              )
                            }

                            // Numbered lists
                            if (trimmed.match(/^\d+\./)) {
                              const lines = trimmed.split('\n')
                              return (
                                <ol
                                  key={i}
                                  className="list-decimal list-inside space-y-1 my-3 text-gray-700"
                                >
                                  {lines
                                    .filter((l) => l.trim())
                                    .map((item, j) => (
                                      <li key={j}>
                                        {item.replace(/^\d+\.\s*/, '')}
                                      </li>
                                    ))}
                                </ol>
                              )
                            }

                            // Paragraphs with embedded heading (line ending with : followed by content)
                            if (trimmed.includes(':\n')) {
                              const parts = trimmed.split(':\n')
                              const headingText = parts[0] + ':'
                              const rest = parts.slice(1).join(':\n')
                              const listItems = rest
                                .split('\n')
                                .filter((l) => l.trim().startsWith('-'))
                              const regularLines = rest
                                .split('\n')
                                .filter((l) => l.trim() && !l.trim().startsWith('-'))

                              return (
                                <div key={i} className="my-3">
                                  <h4 className="text-base font-semibold text-gray-900 mt-5 mb-2">
                                    {headingText}
                                  </h4>
                                  {regularLines.length > 0 && (
                                    <p className="mb-2">
                                      {regularLines.join(' ')}
                                    </p>
                                  )}
                                  {listItems.length > 0 && (
                                    <ul className="list-disc list-inside space-y-1">
                                      {listItems.map((item, j) => (
                                        <li key={j}>
                                          {item.replace(/^-\s*/, '')}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              )
                            }

                            // Regular paragraph
                            return (
                              <p key={i} className="my-3">
                                {trimmed}
                              </p>
                            )
                          })}
                        </div>

                        {/* Article Links */}
                        {article.links.length > 0 && (
                          <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap gap-3">
                            {article.links.map((link) => (
                              <Link
                                key={link.to}
                                to={link.to}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                              >
                                <Lightbulb className="w-4 h-4" />
                                {link.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredArticles.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Keine Artikel gefunden
            </h3>
            <p className="text-gray-600 mb-4">
              Versuchen Sie einen anderen Suchbegriff oder waehlen Sie eine
              andere Kategorie.
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setActiveCategory('Alle')
              }}
              className="text-red-600 font-medium hover:underline"
            >
              Filter zuruecksetzen
            </button>
          </div>
        )}

        {/* CTA Section */}
        <Card className="bg-gradient-boxer text-white mt-12">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-3">
              Noch Fragen? Unser KI-Berater hilft weiter.
            </h3>
            <p className="text-white/90 mb-6 max-w-xl mx-auto">
              Stellen Sie Ihre individuelle Frage zu Buergergeld, Bescheiden
              oder Widerspruechen - rund um die Uhr, kostenlos im Basis-Tarif.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/chat"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-red-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Lightbulb className="w-5 h-5" />
                Zum KI-Berater
              </Link>
              <Link
                to="/scan"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 text-white font-semibold rounded-lg hover:bg-white/30 transition-colors"
              >
                <FileText className="w-5 h-5" />
                Bescheid pruefen lassen
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <p className="text-xs text-gray-400 text-center mt-8 max-w-2xl mx-auto leading-relaxed">
          Hinweis: Die Inhalte dieser Seite dienen der allgemeinen Information
          und ersetzen keine individuelle Rechtsberatung. Fuer eine
          verbindliche Auskunft wenden Sie sich bitte an einen Anwalt fuer
          Sozialrecht, Ihren oertlichen Sozialverband (VdK, SoVD) oder eine
          Beratungsstelle (Caritas, Diakonie, AWO). Stand der Informationen:
          2025. Alle Angaben ohne Gewaehr.
        </p>
      </div>
    </div>
  )
}
