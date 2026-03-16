import { useState, useRef, useCallback } from 'react'
import {
  FileText,
  Copy,
  Printer,
  Check,
  AlertTriangle,
  Info,
  Search,
  Filter,
  ArrowRight,
  Scale,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import Breadcrumbs from '@/components/Breadcrumbs'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TemplateField {
  key: string
  label: string
  placeholder: string
  type?: 'text' | 'date'
}

interface WiderspruchTemplate {
  id: string
  category: TemplateCategory
  title: string
  description: string
  legalBasis: string[]
  fields: TemplateField[]
  generateLetter: (values: Record<string, string>) => string
}

type TemplateCategory =
  | 'regelbedarf'
  | 'kdu'
  | 'mehrbedarf'
  | 'sanktion'
  | 'erstausstattung'
  | 'aufhebung'
  | 'rueckforderung'
  | 'allgemein'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES: { id: TemplateCategory | 'alle'; label: string }[] = [
  { id: 'alle', label: 'Alle Vorlagen' },
  { id: 'regelbedarf', label: 'Regelbedarf' },
  { id: 'kdu', label: 'KdU (Miete)' },
  { id: 'mehrbedarf', label: 'Mehrbedarf' },
  { id: 'sanktion', label: 'Sanktion' },
  { id: 'erstausstattung', label: 'Erstausstattung' },
  { id: 'aufhebung', label: 'Aufhebung' },
  { id: 'rueckforderung', label: 'Rueckforderung' },
  { id: 'allgemein', label: 'Allgemein' },
]

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  regelbedarf: 'Regelbedarf',
  kdu: 'KdU (Miete)',
  mehrbedarf: 'Mehrbedarf',
  sanktion: 'Sanktion',
  erstausstattung: 'Erstausstattung',
  aufhebung: 'Aufhebung',
  rueckforderung: 'Rueckforderung',
  allgemein: 'Allgemein',
}

const CATEGORY_COLORS: Record<TemplateCategory, string> = {
  regelbedarf: 'bg-emerald-100 text-emerald-800',
  kdu: 'bg-orange-100 text-orange-800',
  mehrbedarf: 'bg-blue-100 text-blue-800',
  sanktion: 'bg-red-100 text-red-800',
  erstausstattung: 'bg-purple-100 text-purple-800',
  aufhebung: 'bg-amber-100 text-amber-800',
  rueckforderung: 'bg-rose-100 text-rose-800',
  allgemein: 'bg-gray-100 text-gray-800',
}

const COMMON_FIELDS: TemplateField[] = [
  { key: 'name', label: 'Ihr vollstaendiger Name', placeholder: 'Max Mustermann', type: 'text' },
  { key: 'adresse', label: 'Ihre Adresse', placeholder: 'Musterstrasse 1, 12345 Berlin', type: 'text' },
  { key: 'aktenzeichen', label: 'Aktenzeichen / BG-Nummer', placeholder: 'z.B. 12345-BG-0001', type: 'text' },
  { key: 'bescheiddatum', label: 'Datum des Bescheids', placeholder: '', type: 'date' },
  { key: 'behoerde', label: 'Zustaendige Behoerde', placeholder: 'Jobcenter Berlin Mitte', type: 'text' },
]

// ---------------------------------------------------------------------------
// Helper: format date for letter
// ---------------------------------------------------------------------------

function formatDateDE(dateStr: string): string {
  if (!dateStr) return '[DATUM]'
  const d = new Date(dateStr)
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function todayFormatted(): string {
  return new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

const TEMPLATES: WiderspruchTemplate[] = [
  // ---- 1. Regelbedarf ----
  {
    id: 'regelbedarf-falsch',
    category: 'regelbedarf',
    title: 'Widerspruch gegen falsche Regelbedarfsberechnung',
    description:
      'Verwenden Sie diese Vorlage, wenn der Regelbedarf in Ihrem Bewilligungsbescheid falsch berechnet wurde, z.B. falsche Regelbedarfsstufe, fehlende Erhoehung oder falscher Berechnungszeitraum.',
    legalBasis: ['§ 20 SGB II', '§ 20 Abs. 2-4 SGB II', '§ 84 SGG'],
    fields: [
      ...COMMON_FIELDS,
      { key: 'regelbedarfSoll', label: 'Korrekter Regelbedarf (EUR)', placeholder: 'z.B. 563', type: 'text' },
      { key: 'regelbedarfIst', label: 'Bewilligter Regelbedarf (EUR)', placeholder: 'z.B. 502', type: 'text' },
      { key: 'begruendung', label: 'Zusaetzliche Begruendung', placeholder: 'z.B. Regelbedarfsstufe 1 statt 2 angesetzt', type: 'text' },
    ],
    generateLetter: (v) => {
      const name = v.name || '[NAME]'
      const adresse = v.adresse || '[ADRESSE]'
      const behoerde = v.behoerde || '[BEHOERDE]'
      const az = v.aktenzeichen || '[AKTENZEICHEN]'
      const datum = formatDateDE(v.bescheiddatum)
      const soll = v.regelbedarfSoll || '[BETRAG]'
      const ist = v.regelbedarfIst || '[BETRAG]'
      const grund = v.begruendung || '[BEGRUENDUNG]'

      return `${name}
${adresse}

An
${behoerde}

${todayFormatted()}

Aktenzeichen: ${az}

Betreff: Widerspruch gegen den Bewilligungsbescheid vom ${datum}

Sehr geehrte Damen und Herren,

hiermit lege ich fristgerecht Widerspruch gegen Ihren Bewilligungsbescheid vom ${datum}, Aktenzeichen ${az}, ein.

Begruendung:

Die Berechnung des Regelbedarfs in dem genannten Bescheid ist fehlerhaft. Mir wurde ein Regelbedarf in Hoehe von ${ist} EUR monatlich bewilligt. Nach § 20 SGB II steht mir jedoch ein Regelbedarf in Hoehe von ${soll} EUR monatlich zu.

${grund ? `Im Einzelnen: ${grund}` : ''}

Gemaess § 20 Abs. 2 SGB II betraegt der Regelbedarf fuer alleinstehende und alleinerziehende Leistungsberechtigte monatlich den in der Anlage zu § 28 SGB XII festgesetzten Betrag. Die in meinem Bescheid zugrunde gelegte Berechnung entspricht nicht den gesetzlichen Vorgaben.

Ich fordere Sie auf, den Bescheid zu ueberpruefen und meinen Regelbedarf entsprechend den gesetzlichen Bestimmungen korrekt zu berechnen und nachzuzahlen.

Sollte meinem Widerspruch nicht innerhalb der gesetzlichen Frist abgeholfen werden, behalte ich mir die Erhebung einer Klage vor dem Sozialgericht vor.

Ich bitte um eine schriftliche Eingangsbestaetigung dieses Widerspruchs.

Mit freundlichen Gruessen

${name}`
    },
  },

  // ---- 2. KdU ----
  {
    id: 'kdu-mietkosten',
    category: 'kdu',
    title: 'Widerspruch gegen Ablehnung der Mietkosten (KdU)',
    description:
      'Verwenden Sie diese Vorlage, wenn das Jobcenter Ihre tatsaechlichen Kosten der Unterkunft und Heizung (KdU) nicht vollstaendig uebernimmt oder eine Mietsenkungsaufforderung ausspricht.',
    legalBasis: ['§ 22 Abs. 1 SGB II', '§ 22 Abs. 1 S. 3 SGB II', '§ 35 SGB XII', '§ 84 SGG'],
    fields: [
      ...COMMON_FIELDS,
      { key: 'tatsaechlicheMiete', label: 'Tatsaechliche Miete (warm, EUR)', placeholder: 'z.B. 650', type: 'text' },
      { key: 'bewilligteMiete', label: 'Vom Jobcenter bewilligte Miete (EUR)', placeholder: 'z.B. 520', type: 'text' },
      { key: 'wohnungsgroesse', label: 'Wohnungsgroesse (qm)', placeholder: 'z.B. 50', type: 'text' },
      { key: 'personenAnzahl', label: 'Anzahl der Personen im Haushalt', placeholder: 'z.B. 1', type: 'text' },
    ],
    generateLetter: (v) => {
      const name = v.name || '[NAME]'
      const adresse = v.adresse || '[ADRESSE]'
      const behoerde = v.behoerde || '[BEHOERDE]'
      const az = v.aktenzeichen || '[AKTENZEICHEN]'
      const datum = formatDateDE(v.bescheiddatum)
      const mieteReal = v.tatsaechlicheMiete || '[BETRAG]'
      const mieteBewilligt = v.bewilligteMiete || '[BETRAG]'
      const groesse = v.wohnungsgroesse || '[QM]'
      const personen = v.personenAnzahl || '[ANZAHL]'

      return `${name}
${adresse}

An
${behoerde}

${todayFormatted()}

Aktenzeichen: ${az}

Betreff: Widerspruch gegen den Bescheid vom ${datum} - Kosten der Unterkunft und Heizung

Sehr geehrte Damen und Herren,

hiermit lege ich fristgerecht Widerspruch gegen Ihren Bescheid vom ${datum}, Aktenzeichen ${az}, ein, soweit darin die Kosten der Unterkunft und Heizung nicht in tatsaechlicher Hoehe uebernommen werden.

Begruendung:

Meine tatsaechlichen Kosten der Unterkunft und Heizung betragen ${mieteReal} EUR monatlich. In dem angefochtenen Bescheid wurden jedoch lediglich ${mieteBewilligt} EUR monatlich beruecksichtigt. Die Differenz von ${Number(mieteReal) && Number(mieteBewilligt) ? (Number(mieteReal) - Number(mieteBewilligt)).toFixed(2) : '[DIFFERENZ]'} EUR monatlich wird mir ohne rechtmaessige Grundlage verweigert.

Gemaess § 22 Abs. 1 S. 1 SGB II werden Bedarfe fuer Unterkunft und Heizung in Hoehe der tatsaechlichen Aufwendungen anerkannt, soweit diese angemessen sind. Meine Wohnung hat eine Groesse von ${groesse} qm und wird von ${personen} Person(en) bewohnt. Die Kosten sind nach dem oertlichen Mietspiegel bzw. den Richtwerten als angemessen anzusehen.

Selbst wenn die Kosten als unangemessen angesehen werden sollten, sind diese gemaess § 22 Abs. 1 S. 3 SGB II fuer einen Zeitraum von in der Regel sechs Monaten in tatsaechlicher Hoehe zu uebernehmen. Eine ordnungsgemaesse Kostensenkungsaufforderung mit konkreten Senkungsmoeglichkeiten ist mir nicht zugegangen bzw. die genannte Frist ist noch nicht abgelaufen.

Ich fordere Sie daher auf, meinen Bescheid abzuaendern und die tatsaechlichen Kosten der Unterkunft und Heizung in voller Hoehe zu uebernehmen.

Sollte meinem Widerspruch nicht abgeholfen werden, behalte ich mir weitere Rechtsmittel vor.

Ich bitte um eine schriftliche Eingangsbestaetigung.

Mit freundlichen Gruessen

${name}`
    },
  },

  // ---- 3. Sanktion ----
  {
    id: 'sanktion-widerspruch',
    category: 'sanktion',
    title: 'Widerspruch gegen Sanktionsbescheid',
    description:
      'Verwenden Sie diese Vorlage, wenn Ihnen eine Leistungskuerzung (Sanktion) auferlegt wurde, z.B. wegen angeblicher Pflichtverletzung, versaeumtem Termin oder abgelehntem Stellenangebot.',
    legalBasis: ['§ 31 SGB II', '§ 31a SGB II', '§ 31b SGB II', '§ 84 SGG'],
    fields: [
      ...COMMON_FIELDS,
      { key: 'sanktionsgrund', label: 'Genannter Sanktionsgrund', placeholder: 'z.B. Nichterscheinen zum Termin am 15.01.2026', type: 'text' },
      { key: 'kuerzungsBetrag', label: 'Hoehe der Kuerzung (EUR/Prozent)', placeholder: 'z.B. 10% des Regelbedarfs', type: 'text' },
      { key: 'wichtigerGrund', label: 'Ihr wichtiger Grund (warum unverschuldet)', placeholder: 'z.B. Erkrankung, Einladung nicht erhalten', type: 'text' },
    ],
    generateLetter: (v) => {
      const name = v.name || '[NAME]'
      const adresse = v.adresse || '[ADRESSE]'
      const behoerde = v.behoerde || '[BEHOERDE]'
      const az = v.aktenzeichen || '[AKTENZEICHEN]'
      const datum = formatDateDE(v.bescheiddatum)
      const grund = v.sanktionsgrund || '[SANKTIONSGRUND]'
      const kuerzung = v.kuerzungsBetrag || '[BETRAG/PROZENT]'
      const wichtig = v.wichtigerGrund || '[WICHTIGER GRUND]'

      return `${name}
${adresse}

An
${behoerde}

${todayFormatted()}

Aktenzeichen: ${az}

Betreff: Widerspruch gegen den Sanktionsbescheid vom ${datum}

Sehr geehrte Damen und Herren,

hiermit lege ich fristgerecht Widerspruch gegen Ihren Sanktionsbescheid vom ${datum}, Aktenzeichen ${az}, ein.

In dem genannten Bescheid wird mir eine Leistungsminderung in Hoehe von ${kuerzung} auferlegt. Als Begruendung wird angefuehrt: ${grund}.

Begruendung meines Widerspruchs:

1. Wichtiger Grund gemaess § 31 Abs. 1 S. 2 SGB II
Fuer die mir vorgeworfene Pflichtverletzung lag ein wichtiger Grund vor: ${wichtig}.

Gemaess § 31 Abs. 1 S. 2 SGB II tritt eine Pflichtverletzung nicht ein, wenn der erwerbsfaehige Leistungsberechtigte fuer sein Verhalten einen wichtigen Grund nachweist. Diesen wichtigen Grund mache ich hiermit geltend.

2. Verhaeltnismaessigkeit
Die verhaengte Sanktion ist in meinem Fall unverhaeltnismaessig. Das Bundesverfassungsgericht hat mit Urteil vom 05.11.2019 (Az. 1 BvL 7/16) klargestellt, dass Sanktionen verhaeltnismaessig sein muessen und das Existenzminimum nicht unterschritten werden darf.

3. Formelle Fehler
Ich ruege vorsorglich auch formelle Fehler des Sanktionsbescheids. Eine ordnungsgemaesse Rechtsfolgenbelehrung ist Voraussetzung fuer die Wirksamkeit einer Sanktion (§ 31 Abs. 1 SGB II). Sofern diese fehlerhaft oder unzureichend war, ist der Sanktionsbescheid rechtswidrig.

Ich fordere Sie auf, den Sanktionsbescheid aufzuheben und die volle Leistung wiederherzustellen.

Sollte meinem Widerspruch nicht abgeholfen werden, behalte ich mir die Erhebung einer Klage vor dem Sozialgericht vor.

Ich bitte um eine schriftliche Eingangsbestaetigung.

Mit freundlichen Gruessen

${name}`
    },
  },

  // ---- 4. Mehrbedarf ----
  {
    id: 'mehrbedarf-ablehnung',
    category: 'mehrbedarf',
    title: 'Widerspruch gegen Ablehnung von Mehrbedarf',
    description:
      'Verwenden Sie diese Vorlage, wenn ein beantragter Mehrbedarf (z.B. fuer Alleinerziehende, Schwangere, kostenaufwaendige Ernaehrung oder dezentrale Warmwassererzeugung) abgelehnt wurde.',
    legalBasis: ['§ 21 SGB II', '§ 21 Abs. 2-7 SGB II', '§ 84 SGG'],
    fields: [
      ...COMMON_FIELDS,
      { key: 'mehrbedarfArt', label: 'Art des Mehrbedarfs', placeholder: 'z.B. Alleinerziehend, Schwangerschaft, kostenaufwaendige Ernaehrung', type: 'text' },
      { key: 'mehrbedarfBetrag', label: 'Beantragter Mehrbedarf (EUR)', placeholder: 'z.B. 67,32', type: 'text' },
      { key: 'nachweis', label: 'Vorhandene Nachweise', placeholder: 'z.B. aerztliches Attest vom ..., Geburtsurkunde des Kindes', type: 'text' },
    ],
    generateLetter: (v) => {
      const name = v.name || '[NAME]'
      const adresse = v.adresse || '[ADRESSE]'
      const behoerde = v.behoerde || '[BEHOERDE]'
      const az = v.aktenzeichen || '[AKTENZEICHEN]'
      const datum = formatDateDE(v.bescheiddatum)
      const art = v.mehrbedarfArt || '[ART DES MEHRBEDARFS]'
      const betrag = v.mehrbedarfBetrag || '[BETRAG]'
      const nachweis = v.nachweis || '[NACHWEISE]'

      return `${name}
${adresse}

An
${behoerde}

${todayFormatted()}

Aktenzeichen: ${az}

Betreff: Widerspruch gegen die Ablehnung des Mehrbedarfs vom ${datum}

Sehr geehrte Damen und Herren,

hiermit lege ich fristgerecht Widerspruch gegen Ihren Bescheid vom ${datum}, Aktenzeichen ${az}, ein, soweit darin mein Antrag auf Gewaehrung eines Mehrbedarfs abgelehnt wird.

Begruendung:

Ich habe einen Mehrbedarf wegen ${art} beantragt. Dieser wurde in dem angefochtenen Bescheid ohne ausreichende Begruendung abgelehnt.

Gemaess § 21 SGB II werden bei Vorliegen der gesetzlichen Voraussetzungen Mehrbedarfe neben dem Regelbedarf anerkannt. In meinem Fall liegt ein Anspruch auf einen Mehrbedarf in Hoehe von ${betrag} EUR monatlich vor.

Folgende Nachweise habe ich bereits vorgelegt bzw. lege ich diesem Widerspruch bei: ${nachweis}.

Die Ablehnung meines Mehrbedarfsantrags ist rechtswidrig, da die gesetzlichen Voraussetzungen gemaess § 21 SGB II in meinem Fall erfuellt sind. Ich verweise insbesondere darauf, dass der Mehrbedarf zur Sicherung des verfassungsrechtlich garantierten Existenzminimums (Art. 1 Abs. 1 i.V.m. Art. 20 Abs. 1 GG) erforderlich ist.

Ich fordere Sie auf, den Bescheid abzuaendern und den beantragten Mehrbedarf zu gewaehren.

Sollte meinem Widerspruch nicht innerhalb der gesetzlichen Frist abgeholfen werden, behalte ich mir die Erhebung einer Klage vor dem Sozialgericht vor.

Ich bitte um eine schriftliche Eingangsbestaetigung.

Mit freundlichen Gruessen

${name}`
    },
  },

  // ---- 5. Erstausstattung ----
  {
    id: 'erstausstattung-ablehnung',
    category: 'erstausstattung',
    title: 'Widerspruch gegen Ablehnung der Erstausstattung',
    description:
      'Verwenden Sie diese Vorlage, wenn Ihr Antrag auf Erstausstattung fuer die Wohnung, Bekleidung oder bei Schwangerschaft und Geburt abgelehnt wurde.',
    legalBasis: ['§ 24 Abs. 3 SGB II', '§ 31 SGB XII', '§ 84 SGG'],
    fields: [
      ...COMMON_FIELDS,
      { key: 'erstausstattungArt', label: 'Art der Erstausstattung', placeholder: 'z.B. Wohnungserstausstattung, Bekleidung, Schwangerschaft', type: 'text' },
      { key: 'anlass', label: 'Anlass / Begruendung', placeholder: 'z.B. Erstbezug einer eigenen Wohnung, Trennung, Brand', type: 'text' },
      { key: 'beantragteBeitraege', label: 'Beantragte Gegenstaende/Betraege', placeholder: 'z.B. Bett, Schrank, Kuechenausstattung - ca. 1.200 EUR', type: 'text' },
    ],
    generateLetter: (v) => {
      const name = v.name || '[NAME]'
      const adresse = v.adresse || '[ADRESSE]'
      const behoerde = v.behoerde || '[BEHOERDE]'
      const az = v.aktenzeichen || '[AKTENZEICHEN]'
      const datum = formatDateDE(v.bescheiddatum)
      const art = v.erstausstattungArt || '[ART DER ERSTAUSSTATTUNG]'
      const anlass = v.anlass || '[ANLASS]'
      const gegenstaende = v.beantragteBeitraege || '[GEGENSTAENDE/BETRAEGE]'

      return `${name}
${adresse}

An
${behoerde}

${todayFormatted()}

Aktenzeichen: ${az}

Betreff: Widerspruch gegen die Ablehnung der Erstausstattung vom ${datum}

Sehr geehrte Damen und Herren,

hiermit lege ich fristgerecht Widerspruch gegen Ihren Bescheid vom ${datum}, Aktenzeichen ${az}, ein, mit dem mein Antrag auf Gewaehrung einer Erstausstattung (${art}) abgelehnt wurde.

Begruendung:

Gemaess § 24 Abs. 3 Nr. 1 und 2 SGB II werden Leistungen fuer Erstausstattungen fuer die Wohnung einschliesslich Haushaltsgeraeten sowie fuer Bekleidung gesondert erbracht. Der Anlass fuer meinen Antrag ist: ${anlass}.

Es handelt sich bei den beantragten Gegenstaenden um eine Erstausstattung und nicht um eine Ersatzbeschaffung. Die beantragten Leistungen umfassen: ${gegenstaende}.

Ich verfuege ueber keine anderweitigen Mittel, um die benoetigten Gegenstaende zu beschaffen. Die Ablehnung meines Antrags ist daher rechtswidrig und verletzt mein Recht auf Sicherung des Existenzminimums.

Das Bundessozialgericht hat in staendiger Rechtsprechung klargestellt, dass ein Anspruch auf Erstausstattung auch dann besteht, wenn ein Bedarf erstmals oder nach laengerer Zeit erneut auftritt (vgl. BSG, Urteil vom 19.09.2008, B 14 AS 64/07 R).

Ich fordere Sie auf, den Bescheid aufzuheben und die beantragte Erstausstattung zu gewaehren.

Sollte meinem Widerspruch nicht innerhalb der gesetzlichen Frist abgeholfen werden, behalte ich mir die Erhebung einer Klage vor dem Sozialgericht vor.

Ich bitte um eine schriftliche Eingangsbestaetigung.

Mit freundlichen Gruessen

${name}`
    },
  },

  // ---- 6. Aufhebungsbescheid ----
  {
    id: 'aufhebung-widerspruch',
    category: 'aufhebung',
    title: 'Widerspruch gegen Aufhebungs- und Erstattungsbescheid',
    description:
      'Verwenden Sie diese Vorlage, wenn Ihre Leistungen fuer die Vergangenheit aufgehoben und eine Erstattung verlangt wird, z.B. wegen angeblicher Einkommenserhoehung oder Aenderung der Verhaeltnisse.',
    legalBasis: ['§ 45 SGB X', '§ 48 SGB X', '§ 50 SGB X', '§ 84 SGG'],
    fields: [
      ...COMMON_FIELDS,
      { key: 'aufhebungsZeitraum', label: 'Betroffener Zeitraum', placeholder: 'z.B. 01.01.2026 bis 30.06.2026', type: 'text' },
      { key: 'erstattungsBetrag', label: 'Geforderter Erstattungsbetrag (EUR)', placeholder: 'z.B. 2.340,00', type: 'text' },
      { key: 'aufhebungsGrund', label: 'Genannter Aufhebungsgrund', placeholder: 'z.B. angebliche Einkommenserhoehung', type: 'text' },
    ],
    generateLetter: (v) => {
      const name = v.name || '[NAME]'
      const adresse = v.adresse || '[ADRESSE]'
      const behoerde = v.behoerde || '[BEHOERDE]'
      const az = v.aktenzeichen || '[AKTENZEICHEN]'
      const datum = formatDateDE(v.bescheiddatum)
      const zeitraum = v.aufhebungsZeitraum || '[ZEITRAUM]'
      const betrag = v.erstattungsBetrag || '[BETRAG]'
      const grund = v.aufhebungsGrund || '[AUFHEBUNGSGRUND]'

      return `${name}
${adresse}

An
${behoerde}

${todayFormatted()}

Aktenzeichen: ${az}

Betreff: Widerspruch gegen den Aufhebungs- und Erstattungsbescheid vom ${datum}

Sehr geehrte Damen und Herren,

hiermit lege ich fristgerecht Widerspruch gegen Ihren Aufhebungs- und Erstattungsbescheid vom ${datum}, Aktenzeichen ${az}, ein.

In dem genannten Bescheid heben Sie die Leistungsbewilligung fuer den Zeitraum ${zeitraum} auf und fordern einen Betrag in Hoehe von ${betrag} EUR zurueck. Als Begruendung fuehren Sie an: ${grund}.

Begruendung meines Widerspruchs:

1. Formelle Rechtswidrigkeit
Die Aufhebung ist formell rechtswidrig. Gemaess § 24 SGB X haette mir vor Erlass des belastenden Verwaltungsaktes Gelegenheit zur Anhoerung gegeben werden muessen. Eine ordnungsgemaesse Anhoerung ist nicht erfolgt (bzw. war unzureichend).

2. Materielle Rechtswidrigkeit
Die Voraussetzungen fuer eine Aufhebung nach § 45 SGB X (rechtswidriger beguenstigender Verwaltungsakt) bzw. § 48 SGB X (Aenderung der Verhaeltnisse) liegen nicht vor.

Gemaess § 45 Abs. 2 SGB X darf ein rechtswidriger beguenstigender Verwaltungsakt nur unter den dort genannten engen Voraussetzungen zurueckgenommen werden. Insbesondere muss geprueft werden, ob ich auf den Bestand des Verwaltungsaktes vertraut habe und mein Vertrauen schutzwuerdig ist.

Gemaess § 48 SGB X ist eine Aufhebung wegen Aenderung der Verhaeltnisse nur zulaessig, wenn sich die tatsaechlichen oder rechtlichen Verhaeltnisse, die beim Erlass des Verwaltungsaktes vorgelegen haben, wesentlich geaendert haben. Dies ist in meinem Fall nicht der Fall.

3. Erstattungsforderung
Die Erstattungsforderung nach § 50 SGB X ist ebenfalls rechtswidrig, da die zugrundeliegende Aufhebung rechtswidrig ist. Zudem ist die Hoehe des Erstattungsbetrags nicht nachvollziehbar berechnet.

Ich fordere Sie auf, den Aufhebungs- und Erstattungsbescheid vollstaendig aufzuheben.

Sollte meinem Widerspruch nicht abgeholfen werden, behalte ich mir die Erhebung einer Klage vor.

Ich bitte um eine schriftliche Eingangsbestaetigung.

Mit freundlichen Gruessen

${name}`
    },
  },

  // ---- 7. Rueckforderung ----
  {
    id: 'rueckforderung-widerspruch',
    category: 'rueckforderung',
    title: 'Widerspruch gegen Rueckforderungsbescheid',
    description:
      'Verwenden Sie diese Vorlage, wenn das Jobcenter eine Rueckzahlung von angeblich zu viel erhaltenen Leistungen fordert, ohne dass die rechtlichen Voraussetzungen dafuer vorliegen.',
    legalBasis: ['§ 50 SGB X', '§ 45 SGB X', '§ 48 SGB X', '§ 84 SGG'],
    fields: [
      ...COMMON_FIELDS,
      { key: 'rueckforderungsBetrag', label: 'Geforderter Betrag (EUR)', placeholder: 'z.B. 1.680,00', type: 'text' },
      { key: 'rueckforderungsGrund', label: 'Genannter Grund der Rueckforderung', placeholder: 'z.B. Anrechnung von Nebeneinkommen', type: 'text' },
    ],
    generateLetter: (v) => {
      const name = v.name || '[NAME]'
      const adresse = v.adresse || '[ADRESSE]'
      const behoerde = v.behoerde || '[BEHOERDE]'
      const az = v.aktenzeichen || '[AKTENZEICHEN]'
      const datum = formatDateDE(v.bescheiddatum)
      const betrag = v.rueckforderungsBetrag || '[BETRAG]'
      const grund = v.rueckforderungsGrund || '[GRUND]'

      return `${name}
${adresse}

An
${behoerde}

${todayFormatted()}

Aktenzeichen: ${az}

Betreff: Widerspruch gegen den Erstattungsbescheid vom ${datum}

Sehr geehrte Damen und Herren,

hiermit lege ich fristgerecht Widerspruch gegen Ihren Erstattungsbescheid vom ${datum}, Aktenzeichen ${az}, ein, mit dem Sie eine Rueckforderung in Hoehe von ${betrag} EUR geltend machen.

Als Begruendung wird angefuehrt: ${grund}.

Begruendung meines Widerspruchs:

1. Die Erstattungsforderung nach § 50 SGB X setzt voraus, dass der zugrundeliegende Bewilligungsbescheid rechtmaessig aufgehoben oder zurueckgenommen wurde. Die Voraussetzungen hierfuer liegen nach meiner Auffassung nicht vor.

2. Selbst wenn eine Aufhebung dem Grunde nach moeglich waere, ist die Hoehe der Erstattungsforderung nicht nachvollziehbar. Ich bitte um eine detaillierte Berechnung, aus der sich ergibt, wie der geforderte Betrag von ${betrag} EUR zustande kommt.

3. Gemaess § 45 Abs. 2 S. 3 SGB X kann sich der Betroffene auf Vertrauensschutz berufen, wenn er die Leistungen verbraucht hat und die Ruecknahme des Verwaltungsaktes zu einer unbilligen Haerte fuehren wuerde. Dies ist in meinem Fall gegeben, da ich die Leistungen fuer meinen Lebensunterhalt verbraucht habe und ueber keinerlei Vermoegen verfuege.

4. Vorsorglich beantrage ich die Niederschlagung der Forderung nach § 44 SGB II bzw. die Gewaehrung einer Ratenzahlung, sollte die Erstattungsforderung wider Erwarten rechtmaessig sein.

Ich fordere Sie auf, den Erstattungsbescheid aufzuheben.

Ich bitte um eine schriftliche Eingangsbestaetigung.

Mit freundlichen Gruessen

${name}`
    },
  },

  // ---- 8. Allgemein ----
  {
    id: 'allgemein-widerspruch',
    category: 'allgemein',
    title: 'Allgemeiner Widerspruch (Universalvorlage)',
    description:
      'Verwenden Sie diese universelle Vorlage fuer jeden Widerspruch gegen einen Bescheid des Jobcenters, der Agentur fuer Arbeit oder des Sozialamts. Sie koennen den Text individuell anpassen.',
    legalBasis: ['§ 83 SGG', '§ 84 SGG', '§ 78 SGG'],
    fields: [
      ...COMMON_FIELDS,
      { key: 'bescheidArt', label: 'Art des Bescheids', placeholder: 'z.B. Bewilligungsbescheid, Ablehnungsbescheid', type: 'text' },
      { key: 'eigenBegruendung', label: 'Ihre Begruendung (Stichpunkte genuegen)', placeholder: 'z.B. Falsche Berechnung, fehlende Beruecksichtigung von ...', type: 'text' },
    ],
    generateLetter: (v) => {
      const name = v.name || '[NAME]'
      const adresse = v.adresse || '[ADRESSE]'
      const behoerde = v.behoerde || '[BEHOERDE]'
      const az = v.aktenzeichen || '[AKTENZEICHEN]'
      const datum = formatDateDE(v.bescheiddatum)
      const art = v.bescheidArt || '[ART DES BESCHEIDS]'
      const grund = v.eigenBegruendung || '[BEGRUENDUNG]'

      return `${name}
${adresse}

An
${behoerde}

${todayFormatted()}

Aktenzeichen: ${az}

Betreff: Widerspruch gegen den ${art} vom ${datum}

Sehr geehrte Damen und Herren,

hiermit lege ich fristgerecht gemaess § 83 SGG Widerspruch gegen Ihren ${art} vom ${datum}, Aktenzeichen ${az}, ein.

Ich halte den genannten Bescheid fuer rechtswidrig und begruende meinen Widerspruch wie folgt:

${grund}

Ich bitte um eine vollstaendige Ueberpruefung des Bescheids in tatsaechlicher und rechtlicher Hinsicht und fordere Sie auf, den Bescheid abzuaendern bzw. aufzuheben.

Eine ausfuehrliche Begruendung behalte ich mir nach Akteneinsicht gemaess § 25 SGB X vor. Ich beantrage hiermit gleichzeitig Einsicht in meine vollstaendige Verwaltungsakte.

Vorsorglich weise ich darauf hin, dass der Widerspruch gemaess § 86a Abs. 1 SGG aufschiebende Wirkung hat.

Sollte meinem Widerspruch nicht innerhalb der gesetzlichen Frist von drei Monaten (§ 88 SGG) abgeholfen werden, behalte ich mir die Erhebung einer Untaetigkeitsklage vor.

Ich bitte um eine schriftliche Eingangsbestaetigung dieses Widerspruchs.

Mit freundlichen Gruessen

${name}`
    },
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WiderspruchVorlagen() {
  useDocumentTitle('Widerspruch-Vorlagen - BescheidBoxer')

  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'alle'>('alle')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<WiderspruchTemplate | null>(null)
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const previewRef = useRef<HTMLDivElement>(null)

  // Filter templates
  const filteredTemplates = TEMPLATES.filter((t) => {
    if (activeCategory !== 'alle' && t.category !== activeCategory) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.legalBasis.some((l) => l.toLowerCase().includes(q))
      )
    }
    return true
  })

  // Handle field change
  const handleFieldChange = useCallback((key: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }))
  }, [])

  // Generate current letter text
  const letterText = selectedTemplate ? selectedTemplate.generateLetter(fieldValues) : ''

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    if (!letterText) return
    try {
      await navigator.clipboard.writeText(letterText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = letterText
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }, [letterText])

  // Print
  const handlePrint = useCallback(() => {
    if (!letterText) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <title>Widerspruch - Druckansicht</title>
  <style>
    body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; padding: 2cm; max-width: 21cm; margin: 0 auto; color: #000; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body><pre style="white-space: pre-wrap; font-family: inherit; font-size: inherit; line-height: inherit;">${letterText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></body>
</html>`)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 300)
  }, [letterText])

  // Select template
  const handleSelectTemplate = useCallback((template: WiderspruchTemplate) => {
    setSelectedTemplate(template)
    setFieldValues({})
    setCopied(false)
    // Scroll to form on mobile
    setTimeout(() => {
      previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }, [])

  // Back to list
  const handleBack = useCallback(() => {
    setSelectedTemplate(null)
    setFieldValues({})
    setCopied(false)
  }, [])

  return (
    <div className="container py-8">
      <Breadcrumbs
        items={[
          { label: 'Dokumenten-Werkstatt', href: '/musterschreiben' },
          { label: 'Widerspruch-Vorlagen' },
        ]}
        className="mb-4"
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Scale className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Widerspruch-Vorlagen</h1>
            <p className="text-muted-foreground">
              {TEMPLATES.length} fertige Vorlagen zum Ausfuellen, Kopieren und Drucken
            </p>
          </div>
        </div>
      </div>

      {/* Legal Notices */}
      <div className="grid gap-3 md:grid-cols-3 mb-8">
        <div className="flex items-start gap-3 p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-red-800 dark:text-red-300">Frist beachten</p>
            <p className="text-xs text-red-700 dark:text-red-400">
              1 Monat ab Zugang des Bescheids (§ 84 SGG). Nach Ablauf der Frist ist ein Widerspruch in der Regel nicht mehr moeglich.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
          <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-amber-800 dark:text-amber-300">Versand per Einschreiben</p>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Per Einschreiben senden oder persoenlich mit Empfangsbestaetigung abgeben, um den Zugang nachweisen zu koennen.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-blue-800 dark:text-blue-300">Kein Rechtsberatungsersatz</p>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Diese Vorlagen ersetzen keine Rechtsberatung. Bei komplexen Faellen empfehlen wir anwaltliche Beratung.
            </p>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* Template selected -- show form + preview                           */}
      {/* ================================================================== */}
      {selectedTemplate ? (
        <div ref={previewRef}>
          {/* Back button */}
          <Button variant="outline" size="sm" onClick={handleBack} className="mb-6 gap-2">
            <ArrowRight className="h-4 w-4 rotate-180" />
            Zurueck zur Uebersicht
          </Button>

          {/* Template title card */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-start gap-3 mb-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[selectedTemplate.category]}`}>
                  {CATEGORY_LABELS[selectedTemplate.category]}
                </span>
                {selectedTemplate.legalBasis.map((basis) => (
                  <Badge key={basis} variant="outline" className="text-xs">
                    {basis}
                  </Badge>
                ))}
              </div>
              <h2 className="text-xl font-bold mb-2">{selectedTemplate.title}</h2>
              <p className="text-muted-foreground text-sm">{selectedTemplate.description}</p>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* ---- Left: Fill-in form ---- */}
            <div>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Ihre Daten eintragen
                  </h3>
                  <div className="space-y-4">
                    {selectedTemplate.fields.map((field) => (
                      <div key={field.key}>
                        <Label htmlFor={field.key} className="mb-1.5 block">
                          {field.label}
                        </Label>
                        <Input
                          id={field.key}
                          type={field.type || 'text'}
                          placeholder={field.placeholder}
                          value={fieldValues[field.key] || ''}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t">
                    <Button onClick={handleCopy} className="gap-2">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? 'Kopiert!' : 'Kopieren'}
                    </Button>
                    <Button variant="outline" onClick={handlePrint} className="gap-2">
                      <Printer className="h-4 w-4" />
                      Drucken
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ---- Right: Live preview ---- */}
            <div>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Vorschau
                  </h3>
                  <div className="rounded-lg border bg-white dark:bg-gray-950 p-6 min-h-[400px]">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans text-foreground">
                      {letterText}
                    </pre>
                  </div>

                  {/* Mobile action buttons */}
                  <div className="flex flex-wrap gap-3 mt-4 lg:hidden">
                    <Button onClick={handleCopy} size="sm" className="gap-2">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? 'Kopiert!' : 'Kopieren'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
                      <Printer className="h-4 w-4" />
                      Drucken
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom reminder */}
          <div className="mt-6 p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800 dark:text-amber-300 mb-1">
                Vor dem Absenden pruefen
              </p>
              <ul className="text-amber-700 dark:text-amber-400 space-y-1 list-disc list-inside">
                <li>Alle Felder mit Ihren korrekten Daten ausgefuellt?</li>
                <li>Widerspruchsfrist noch nicht abgelaufen? (1 Monat ab Zugang, § 84 SGG)</li>
                <li>Per Einschreiben versenden oder persoenlich mit Empfangsbestaetigung abgeben</li>
                <li>Kopie fuer Ihre Unterlagen aufbewahren</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* ================================================================== */
        /* Template list view                                                 */
        /* ================================================================== */
        <>
          {/* Search and filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Vorlage suchen (z.B. Miete, Sanktion, § 22 SGB II)..."
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              className="gap-2 md:hidden"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              Kategorien {showFilters ? 'ausblenden' : 'anzeigen'}
            </Button>
          </div>

          {/* Category filter tabs */}
          <div className={`flex gap-2 overflow-x-auto pb-2 mb-6 ${showFilters ? '' : 'hidden md:flex'}`}>
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory(cat.id)}
                className="whitespace-nowrap"
              >
                {cat.label}
              </Button>
            ))}
          </div>

          {/* Results count */}
          <p className="text-sm text-muted-foreground mb-4">
            {filteredTemplates.length} {filteredTemplates.length === 1 ? 'Vorlage' : 'Vorlagen'} gefunden
          </p>

          {/* Template cards grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <Card
                key={template.id}
                className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
                onClick={() => handleSelectTemplate(template)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${CATEGORY_COLORS[template.category]}`}>
                      {CATEGORY_LABELS[template.category]}
                    </span>
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>

                  <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors leading-snug">
                    {template.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {template.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {template.legalBasis.map((basis) => (
                      <span
                        key={basis}
                        className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded"
                      >
                        {basis}
                      </span>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {template.fields.length} Felder zum Ausfuellen
                    </span>
                    <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty state */}
          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Keine Vorlagen gefunden</h3>
              <p className="text-muted-foreground mb-4">
                Versuchen Sie einen anderen Suchbegriff oder waehlen Sie eine andere Kategorie.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('')
                  setActiveCategory('alle')
                }}
              >
                Filter zuruecksetzen
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
