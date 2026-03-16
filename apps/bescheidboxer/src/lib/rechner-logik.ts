// AmtsRechner - Berechnungslogik fuer alle SGB-Rechner
// Stand: 2025/2026

import { findKduByPlz, checkKduAngemessenheit } from './kdu-tabellen'

// === REGELSAETZE (ab 01.01.2025) ===
export const REGELSAETZE_2025 = {
  RS1: 563,  // Alleinstehend / Alleinerziehend
  RS2: 506,  // Paare (je Person)
  RS3: 451,  // Erwachsene im Haushalt ohne eigenen HH
  RS4: 471,  // Jugendliche 14-17
  RS5: 390,  // Kinder 6-13
  RS6: 357,  // Kinder 0-5
}

// Geplante Saetze 2026 (13. Aenderungsgesetz - noch nicht final)
export const REGELSAETZE_2026 = {
  RS1: 563,  // vorlaeufig unveraendert
  RS2: 506,
  RS3: 451,
  RS4: 471,
  RS5: 390,
  RS6: 357,
}

// === BUERGERGELD-RECHNER ===

export interface BgMitglied {
  typ: 'antragsteller' | 'partner' | 'kind'
  alter?: number
  schwanger?: boolean
  alleinerziehend?: boolean
  behindert?: boolean
  kostenaufwaendigeErnaehrung?: boolean
  erwerbsminderung?: boolean
  einkommen?: number // Brutto-Erwerbseinkommen
  einkommenArt?: 'nichts' | 'minijob' | 'teilzeit' | 'vollzeit' | 'selbstaendig'
  kindergeld?: number
  unterhalt?: number
  sonstigesEinkommen?: number
}

export interface BuergergeldInput {
  mitglieder: BgMitglied[]
  kaltmiete: number
  nebenkosten: number
  heizkosten: number
  plz?: string
}

export interface BuergergeldErgebnis {
  regelbedarfGesamt: number
  regelbedarfDetails: { label: string; betrag: number }[]
  mehrbedarfGesamt: number
  mehrbedarfDetails: { label: string; betrag: number; paragraph: string }[]
  kduGesamt: number
  kduDetails: { kaltmiete: number; nebenkosten: number; heizkosten: number }
  bedarfGesamt: number
  einkommenAnrechenbar: number
  einkommenDetails: { label: string; brutto: number; anrechenbar: number }[]
  anspruch: number
  kduAngemessen: boolean
  kduHinweis?: string
}

function getRegelsatz(mitglied: BgMitglied, bgGroesse: number, hatPartner: boolean): number {
  if (mitglied.typ === 'kind' && mitglied.alter !== undefined) {
    if (mitglied.alter >= 14) return REGELSAETZE_2025.RS4
    if (mitglied.alter >= 6) return REGELSAETZE_2025.RS5
    return REGELSAETZE_2025.RS6
  }
  if (mitglied.typ === 'antragsteller') {
    if (hatPartner) return REGELSAETZE_2025.RS2
    return REGELSAETZE_2025.RS1
  }
  if (mitglied.typ === 'partner') {
    return REGELSAETZE_2025.RS2
  }
  // Erwachsene im HH (z.B. ueber 25 im Elternhaus)
  if (bgGroesse > 1) return REGELSAETZE_2025.RS3
  return REGELSAETZE_2025.RS1
}

function getRegelsatzLabel(mitglied: BgMitglied, hatPartner: boolean): string {
  if (mitglied.typ === 'kind' && mitglied.alter !== undefined) {
    if (mitglied.alter >= 14) return `Kind (${mitglied.alter} J.) - RS4`
    if (mitglied.alter >= 6) return `Kind (${mitglied.alter} J.) - RS5`
    return `Kind (${mitglied.alter} J.) - RS6`
  }
  if (mitglied.typ === 'antragsteller') {
    return hatPartner ? 'Antragsteller (Paar) - RS2' : 'Antragsteller (allein) - RS1'
  }
  return 'Partner - RS2'
}

export function berechneBuergergeld(input: BuergergeldInput): BuergergeldErgebnis {
  const hatPartner = input.mitglieder.some(m => m.typ === 'partner')
  const kinder = input.mitglieder.filter(m => m.typ === 'kind')
  const bgGroesse = input.mitglieder.length

  // 1. Regelbedarf
  const regelbedarfDetails = input.mitglieder.map(m => ({
    label: getRegelsatzLabel(m, hatPartner),
    betrag: getRegelsatz(m, bgGroesse, hatPartner),
  }))
  const regelbedarfGesamt = regelbedarfDetails.reduce((s, d) => s + d.betrag, 0)

  // 2. Mehrbedarf
  const mehrbedarfDetails: { label: string; betrag: number; paragraph: string }[] = []
  const antragsteller = input.mitglieder.find(m => m.typ === 'antragsteller')
  const asRegelsatz = antragsteller ? getRegelsatz(antragsteller, bgGroesse, hatPartner) : REGELSAETZE_2025.RS1

  if (antragsteller?.schwanger) {
    const betrag = Math.round(asRegelsatz * 0.17)
    mehrbedarfDetails.push({ label: 'Schwangerschaft (17%)', betrag, paragraph: '§ 21 Abs. 2 SGB II' })
  }

  if (antragsteller?.alleinerziehend && kinder.length > 0) {
    const prozent = berechneAlleinerziehendMehrbedarf(kinder)
    const betrag = Math.round(asRegelsatz * prozent)
    mehrbedarfDetails.push({
      label: `Alleinerziehend (${Math.round(prozent * 100)}%)`,
      betrag,
      paragraph: '§ 21 Abs. 3 SGB II',
    })
  }

  if (antragsteller?.behindert) {
    const betrag = Math.round(asRegelsatz * 0.35)
    mehrbedarfDetails.push({ label: 'Behinderung/Erwerbsminderung (35%)', betrag, paragraph: '§ 21 Abs. 4 SGB II' })
  }

  if (antragsteller?.kostenaufwaendigeErnaehrung) {
    mehrbedarfDetails.push({ label: 'Kostenaufwaendige Ernaehrung', betrag: 86, paragraph: '§ 21 Abs. 5 SGB II' })
  }

  // Warmwasser-Mehrbedarf falls nicht in HK enthalten (pauschal 2.3%)
  // Hier vereinfacht weggelassen - wird oft in HK inkludiert

  const mehrbedarfGesamt = mehrbedarfDetails.reduce((s, d) => s + d.betrag, 0)

  // 3. KdU
  const kduGesamt = input.kaltmiete + input.nebenkosten + input.heizkosten
  const kduDetails = {
    kaltmiete: input.kaltmiete,
    nebenkosten: input.nebenkosten,
    heizkosten: input.heizkosten,
  }

  // KdU-Angemessenheit pruefen
  let kduAngemessen = true
  let kduHinweis: string | undefined

  if (input.plz) {
    const kduCheck = checkKduAngemessenheit(input.plz, bgGroesse, input.kaltmiete)
    if (kduCheck && !kduCheck.angemessen) {
      kduAngemessen = false
      kduHinweis = `Deine Kaltmiete liegt ${kduCheck.differenz} EUR ueber der Angemessenheitsgrenze in ${kduCheck.stadt} (${kduCheck.grenze} EUR). Das Jobcenter koennte nach 6 Monaten die Kosten kuerzen.`
    }
  }

  // 4. Gesamtbedarf
  const bedarfGesamt = regelbedarfGesamt + mehrbedarfGesamt + kduGesamt

  // 5. Einkommensanrechnung
  const einkommenDetails: { label: string; brutto: number; anrechenbar: number }[] = []
  let einkommenAnrechenbar = 0

  for (const m of input.mitglieder) {
    const brutto = m.einkommen || 0
    if (brutto > 0) {
      const anrechenbar = berechneAnrechenbaresEinkommen(brutto)
      einkommenDetails.push({
        label: m.typ === 'antragsteller' ? 'Antragsteller' : m.typ === 'partner' ? 'Partner' : `Kind (${m.alter} J.)`,
        brutto,
        anrechenbar,
      })
      einkommenAnrechenbar += anrechenbar
    }
    // Kindergeld ist Einkommen des Kindes
    if (m.kindergeld && m.kindergeld > 0) {
      einkommenDetails.push({ label: `Kindergeld (${m.typ === 'kind' ? `Kind ${m.alter} J.` : m.typ})`, brutto: m.kindergeld, anrechenbar: m.kindergeld })
      einkommenAnrechenbar += m.kindergeld
    }
    // Unterhalt
    if (m.unterhalt && m.unterhalt > 0) {
      einkommenDetails.push({ label: `Unterhalt (${m.typ})`, brutto: m.unterhalt, anrechenbar: m.unterhalt })
      einkommenAnrechenbar += m.unterhalt
    }
    // Sonstiges
    if (m.sonstigesEinkommen && m.sonstigesEinkommen > 0) {
      einkommenDetails.push({ label: `Sonstiges Einkommen (${m.typ})`, brutto: m.sonstigesEinkommen, anrechenbar: m.sonstigesEinkommen })
      einkommenAnrechenbar += m.sonstigesEinkommen
    }
  }

  // 6. Anspruch
  const anspruch = Math.max(0, bedarfGesamt - einkommenAnrechenbar)

  return {
    regelbedarfGesamt,
    regelbedarfDetails,
    mehrbedarfGesamt,
    mehrbedarfDetails,
    kduGesamt,
    kduDetails,
    bedarfGesamt,
    einkommenAnrechenbar,
    einkommenDetails,
    anspruch,
    kduAngemessen,
    kduHinweis,
  }
}

// === ALLEINERZIEHEND MEHRBEDARF ===
function berechneAlleinerziehendMehrbedarf(kinder: BgMitglied[]): number {
  // § 21 Abs. 3 SGB II
  const unterSieben = kinder.filter(k => (k.alter || 0) < 7).length
  const unterSechzehn = kinder.filter(k => (k.alter || 0) < 16).length

  if (kinder.length === 1 && unterSieben >= 1) return 0.36
  if (kinder.length === 1) return 0.12
  if (kinder.length === 2 && unterSechzehn >= 2) return 0.36
  if (kinder.length === 2) return 0.24
  if (kinder.length === 3) return 0.36
  if (kinder.length === 4) return 0.48
  if (kinder.length >= 5) return 0.60
  return 0.12
}

// === FREIBETRAGS-RECHNER ===
// § 11b SGB II Absetzbetraege bei Erwerbseinkommen

export interface FreibetragsInput {
  bruttoEinkommen: number
  hatKind: boolean
  // Sozialversicherungsbeitraege (pauschal 21.15% oder tatsaechlich)
  svBeitraege?: number
  // Werbungskosten (Pauschale: 15.33€/Monat fuer Fahrkosten etc.)
  werbungskosten?: number
  // Private Versicherungen (z.B. KFZ-Haftpflicht, pauschal 30€)
  versicherungsPauschale?: number
}

export interface FreibetragsErgebnis {
  brutto: number
  grundfreibetrag: number
  svAbzug: number
  werbungskostenAbzug: number
  versicherungsAbzug: number
  freibetragStufe1: number  // 20% von 100.01-520€
  freibetragStufe2: number  // 30% von 520.01-1000€ (mit Kind: 1500€)
  freibetragStufe3: number  // 10% von 1000.01-1200€ (mit Kind: 1500.01-1200€)
  freibetragGesamt: number
  anrechenbaresEinkommen: number
  effektiverSteuersatz: number  // Prozent vom Brutto das angerechnet wird
}

export function berechneFreibetrag(input: FreibetragsInput): FreibetragsErgebnis {
  const brutto = input.bruttoEinkommen
  const grundfreibetrag = Math.min(brutto, 100)
  const svAbzug = input.svBeitraege || Math.round(brutto * 0.2115)
  const werbungskostenAbzug = input.werbungskosten || 15.33
  const versicherungsAbzug = input.versicherungsPauschale || 30

  // Freibetrags-Staffelung (auf Brutto, nicht Netto)
  let freibetragStufe1 = 0
  let freibetragStufe2 = 0
  let freibetragStufe3 = 0

  if (brutto > 100) {
    // Stufe 1: 20% von 100.01 - 520 EUR
    const basis1 = Math.min(brutto, 520) - 100
    freibetragStufe1 = Math.max(0, Math.round(basis1 * 0.20))
  }

  if (brutto > 520) {
    // Stufe 2: 30% von 520.01 - 1000 EUR (mit Kind: bis 1500 EUR)
    const grenze2 = input.hatKind ? 1500 : 1000
    const basis2 = Math.min(brutto, grenze2) - 520
    freibetragStufe2 = Math.max(0, Math.round(basis2 * 0.30))
  }

  if (!input.hatKind && brutto > 1000) {
    // Stufe 3: 10% von 1000.01 - 1200 EUR (nur ohne Kind)
    const basis3 = Math.min(brutto, 1200) - 1000
    freibetragStufe3 = Math.max(0, Math.round(basis3 * 0.10))
  }

  if (input.hatKind && brutto > 1500) {
    // Stufe 3 mit Kind: 10% von 1500.01 - 1500 EUR (keine extra Stufe laut Gesetz)
    // Tatsaechlich: Bei Kind endet die Staffelung bei 1500 EUR
    freibetragStufe3 = 0
  }

  const freibetragGesamt = grundfreibetrag + freibetragStufe1 + freibetragStufe2 + freibetragStufe3
  const anrechenbaresEinkommen = Math.max(0, brutto - svAbzug - werbungskostenAbzug - versicherungsAbzug - freibetragGesamt)
  const effektiverSteuersatz = brutto > 0 ? Math.round((anrechenbaresEinkommen / brutto) * 100) : 0

  return {
    brutto,
    grundfreibetrag,
    svAbzug,
    werbungskostenAbzug,
    versicherungsAbzug,
    freibetragStufe1,
    freibetragStufe2,
    freibetragStufe3,
    freibetragGesamt,
    anrechenbaresEinkommen,
    effektiverSteuersatz,
  }
}

// Vereinfachte Version fuer BuergergeldRechner
export function berechneAnrechenbaresEinkommen(brutto: number): number {
  return berechneFreibetrag({ bruttoEinkommen: brutto, hatKind: false }).anrechenbaresEinkommen
}

// === MEHRBEDARF-RECHNER ===

export interface MehrbedarfInput {
  regelsatz: number // RS1-RS6 Betrag
  schwanger: boolean
  alleinerziehend: boolean
  kinderAnzahl: number
  kinderAlter: number[] // Alter jedes Kindes
  behindert: boolean
  erwerbsgemindert: boolean
  kostenaufwaendigeErnaehrung: boolean
  ernaehrungArt?: string // z.B. Diabetes, Zöliakie
  dezentraleWarmwasser: boolean
}

export interface MehrbedarfErgebnis {
  details: { label: string; betrag: number; paragraph: string; erklaerung: string }[]
  gesamt: number
}

export function berechneMehrbedarf(input: MehrbedarfInput): MehrbedarfErgebnis {
  const details: { label: string; betrag: number; paragraph: string; erklaerung: string }[] = []

  if (input.schwanger) {
    const betrag = Math.round(input.regelsatz * 0.17)
    details.push({
      label: 'Schwangerschaft',
      betrag,
      paragraph: '§ 21 Abs. 2 SGB II',
      erklaerung: `17% des Regelsatzes (${input.regelsatz} EUR) = ${betrag} EUR. Ab der 13. Schwangerschaftswoche.`,
    })
  }

  if (input.alleinerziehend && input.kinderAnzahl > 0) {
    const kinderAsBgMitglieder = input.kinderAlter.map(alter => ({ typ: 'kind' as const, alter }))
    const prozent = berechneAlleinerziehendMehrbedarf(kinderAsBgMitglieder)
    const betrag = Math.round(input.regelsatz * prozent)
    details.push({
      label: `Alleinerziehend (${Math.round(prozent * 100)}%)`,
      betrag,
      paragraph: '§ 21 Abs. 3 SGB II',
      erklaerung: getMehrbedarfAlleinerziehendErklaerung(input.kinderAnzahl, input.kinderAlter, prozent, input.regelsatz),
    })
  }

  if (input.behindert || input.erwerbsgemindert) {
    const betrag = Math.round(input.regelsatz * 0.35)
    details.push({
      label: 'Behinderung / Erwerbsminderung',
      betrag,
      paragraph: '§ 21 Abs. 4 SGB II',
      erklaerung: `35% des Regelsatzes bei Bezug von Leistungen zur Teilhabe oder voll erwerbsgemindert.`,
    })
  }

  if (input.kostenaufwaendigeErnaehrung) {
    // Mehrbedarf variiert je nach Erkrankung (26-86 EUR laut DV-Empfehlungen)
    const betrag = input.ernaehrungArt === 'niereninsuffizienz' ? 86 :
                   input.ernaehrungArt === 'zoeliakie' ? 86 :
                   input.ernaehrungArt === 'colitis' ? 86 :
                   input.ernaehrungArt === 'diabetes' ? 0 : // Seit 2014: kein Mehrbedarf bei Diabetes!
                   57 // Durchschnitt
    if (betrag > 0) {
      details.push({
        label: 'Kostenaufwaendige Ernaehrung',
        betrag,
        paragraph: '§ 21 Abs. 5 SGB II',
        erklaerung: input.ernaehrungArt === 'diabetes'
          ? 'Hinweis: Fuer Diabetes Typ 2 wird seit 2014 kein Mehrbedarf mehr anerkannt (BSG-Rechtsprechung).'
          : `Pauschalierter Mehrbedarf nach DV-Empfehlungen fuer ${input.ernaehrungArt || 'medizinische Ernaehrung'}.`,
      })
    } else if (input.ernaehrungArt === 'diabetes') {
      details.push({
        label: 'Diabetes - KEIN Mehrbedarf',
        betrag: 0,
        paragraph: '§ 21 Abs. 5 SGB II',
        erklaerung: 'Seit BSG-Urteil 2014 wird Diabetes Typ 2 nicht mehr als Grund fuer kostenaufwaendige Ernaehrung anerkannt. Pruefe ggf. individuelle Situation.',
      })
    }
  }

  if (input.dezentraleWarmwasser) {
    const prozent = 0.023 // 2,3% des Regelsatzes
    const betrag = Math.round(input.regelsatz * prozent * 100) / 100
    details.push({
      label: 'Dezentrale Warmwassererzeugung',
      betrag: Math.round(betrag),
      paragraph: '§ 21 Abs. 7 SGB II',
      erklaerung: '2,3% des Regelsatzes, wenn Warmwasser nicht zentral (ueber Heizung) erzeugt wird.',
    })
  }

  return {
    details,
    gesamt: details.reduce((s, d) => s + d.betrag, 0),
  }
}

function getMehrbedarfAlleinerziehendErklaerung(
  anzahl: number,
  alter: number[],
  prozent: number,
  regelsatz: number
): string {
  const unterSieben = alter.filter(a => a < 7).length
  if (anzahl === 1 && unterSieben >= 1) {
    return `1 Kind unter 7: 36% von ${regelsatz} EUR = ${Math.round(regelsatz * 0.36)} EUR`
  }
  return `${anzahl} Kinder: ${Math.round(prozent * 100)}% von ${regelsatz} EUR. Max. 60%.`
}

// === SANKTIONS-RECHNER ===

export interface SanktionsInput {
  regelsatz: number
  pflichtverletzungNr: number // 1 = erste, 2 = zweite, 3 = dritte+
  art: 'meldeversaeumnis' | 'pflichtversaeumnis' | 'arbeitsverweigerung'
  unter25: boolean
}

export interface SanktionsErgebnis {
  kuerzungProzent: number
  kuerzungBetrag: number
  dauer: string
  kduGeschuetzt: boolean
  hinweis: string
  paragraph: string
  widerspruchTipp: string
}

export function berechneSanktion(input: SanktionsInput): SanktionsErgebnis {
  let kuerzungProzent = 0
  let dauer = '1 Monat'
  let hinweis = ''
  const kduGeschuetzt = true // Seit 2023 immer KdU-geschuetzt

  if (input.art === 'meldeversaeumnis') {
    // § 32 SGB II: 10% fuer 1 Monat
    kuerzungProzent = 10
    dauer = '1 Monat'
    hinweis = 'Meldeversaeumnis: Hast du einen wichtigen Grund? Arztbesuch, Krankheit, Behoerdengang - alles kann entschuldigen!'
  } else if (input.art === 'pflichtversaeumnis') {
    // § 31a SGB II
    if (input.pflichtverletzungNr === 1) {
      kuerzungProzent = 10
      dauer = '1 Monat'
    } else if (input.pflichtverletzungNr === 2) {
      kuerzungProzent = 20
      dauer = '2 Monate'
    } else {
      kuerzungProzent = 30
      dauer = '3 Monate'
    }
    hinweis = 'Pflichtversaeumnis: Maximal 30% Kuerzung. KdU (Miete) darf NICHT gekuerzt werden!'
  } else {
    // Arbeitsverweigerung
    if (input.pflichtverletzungNr === 1) {
      kuerzungProzent = 10
      dauer = '1 Monat'
    } else if (input.pflichtverletzungNr === 2) {
      kuerzungProzent = 20
      dauer = '2 Monate'
    } else {
      kuerzungProzent = 30
      dauer = '3 Monate'
    }
    hinweis = 'War die angebotene Arbeit zumutbar? Pruefe: Anfahrt, Gesundheit, Kinderbetreuung. Unzumutbare Arbeit muss nicht angenommen werden!'
  }

  // Max 30% (seit Buergergeld-Gesetz 2023)
  kuerzungProzent = Math.min(30, kuerzungProzent)

  const kuerzungBetrag = Math.round(input.regelsatz * kuerzungProzent / 100)

  return {
    kuerzungProzent,
    kuerzungBetrag,
    dauer,
    kduGeschuetzt,
    hinweis,
    paragraph: input.art === 'meldeversaeumnis' ? '§ 32 SGB II' : '§ 31a SGB II',
    widerspruchTipp: getWiderspruchTipp(input.art),
  }
}

function getWiderspruchTipp(art: string): string {
  if (art === 'meldeversaeumnis') {
    return 'Wichtiger Grund vortragen! Anhoerung (§ 24 SGB X) muss VOR dem Bescheid erfolgt sein. Frist: 1 Monat Widerspruch.'
  }
  return 'Pruefen: 1) Wurde vorher angehoert (§ 24 SGB X)? 2) Lag ein wichtiger Grund vor? 3) War die Massnahme zumutbar? Frist: 1 Monat!'
}

// === SCHONVERMOEGENS-RECHNER ===

export interface SchonvermoegensInput {
  alter: number
  bgGroesse: number
  vermoegen: number // Gesamtvermoegen (Barvermögen, Konten, Depot)
  lebensversicherungRueckkaufswert?: number
  autoWert?: number
  immobilieEigentum?: boolean
  immobilieQm?: number
  altersvorsorgeGeschuetzt?: number // Riester etc.
}

export interface SchonvermoegensErgebnis {
  freibetragProPerson: number
  freibetragGesamt: number
  autoFreibetrag: number
  altersvorsorge: number
  immobilieGeschuetzt: boolean
  immobilieHinweis: string
  vermoegenAnrechenbar: number
  anspruch: boolean
  details: { label: string; betrag: number; erklaerung: string }[]
}

export function berechneSchonvermoegen(input: SchonvermoegensInput): SchonvermoegensErgebnis {
  // § 12 SGB II: Freibetraege
  // Seit Buergergeld (2023): 15.000 EUR pro Person in BG (Karenzzeit 1 Jahr)
  // Nach Karenzzeit: 15.000 EUR pro Person weiterhin (vereinfachte Vermoegenspruefung)
  const freibetragProPerson = 15000
  const freibetragGesamt = freibetragProPerson * input.bgGroesse

  // Auto: angemessen wenn Wert < 15.000 EUR (Karenzzeit), danach 7.500 EUR
  const autoFreibetrag = 15000

  // Altersvorsorge: geschuetzt wenn Verwertung unwirtschaftlich (Riester immer)
  const altersvorsorge = input.altersvorsorgeGeschuetzt || 0

  // Immobilie: angemessen bis 130 qm (Haus) / 120 qm (Wohnung) fuer 4 Personen
  // + 20 qm pro weitere Person
  const immobilie = input.immobilieEigentum || false
  const qmGrenze = 130 + Math.max(0, input.bgGroesse - 4) * 20
  const immobilieGeschuetzt = immobilie && (input.immobilieQm || 0) <= qmGrenze
  const immobilieHinweis = immobilie
    ? (immobilieGeschuetzt
      ? `Selbstgenutztes Eigentum bis ${qmGrenze} qm ist geschuetzt.`
      : `Immobilie ueber ${qmGrenze} qm koennte als verwertbar gelten. Beratung empfohlen!`)
    : ''

  const details: { label: string; betrag: number; erklaerung: string }[] = [
    {
      label: `Grundfreibetrag (${input.bgGroesse} Person${input.bgGroesse > 1 ? 'en' : ''})`,
      betrag: freibetragGesamt,
      erklaerung: `${freibetragProPerson} EUR x ${input.bgGroesse} = ${freibetragGesamt} EUR (§ 12 SGB II)`,
    },
  ]

  if (input.autoWert && input.autoWert > 0) {
    details.push({
      label: 'KFZ-Freibetrag',
      betrag: autoFreibetrag,
      erklaerung: `Auto bis ${autoFreibetrag} EUR angemessen (waehrend Karenzzeit). Dein Auto: ${input.autoWert} EUR.`,
    })
  }

  if (altersvorsorge > 0) {
    details.push({
      label: 'Geschuetzte Altersvorsorge',
      betrag: altersvorsorge,
      erklaerung: 'Riester-Rente und zertifizierte Altersvorsorge sind vollstaendig geschuetzt.',
    })
  }

  // Vermoegen pruefen
  let relevantesVermoegen = input.vermoegen
  if (input.autoWert && input.autoWert > autoFreibetrag) {
    relevantesVermoegen += (input.autoWert - autoFreibetrag)
  }
  relevantesVermoegen -= altersvorsorge

  const vermoegenAnrechenbar = Math.max(0, relevantesVermoegen - freibetragGesamt)
  const anspruch = vermoegenAnrechenbar === 0

  return {
    freibetragProPerson,
    freibetragGesamt,
    autoFreibetrag,
    altersvorsorge,
    immobilieGeschuetzt,
    immobilieHinweis,
    vermoegenAnrechenbar,
    anspruch,
    details,
  }
}

// === KDU-RECHNER (erweitert) ===

export interface KduRechnerInput {
  plz: string
  bgGroesse: number
  kaltmiete: number
  nebenkosten: number
  heizkosten: number
  qm: number
}

export interface KduRechnerErgebnis {
  stadt: string
  kaltmieteGrenze: number
  kaltmieteAngemessen: boolean
  kaltmieteDifferenz: number
  qmGrenze: number
  qmAngemessen: boolean
  heizkostenGrenze: number
  heizkostenAngemessen: boolean
  gesamtKdu: number
  angemesseneKdu: number
  differenz: number
  hinweise: string[]
  schluessigesKonzept: boolean
}

export function berechneKdu(input: KduRechnerInput): KduRechnerErgebnis | null {
  const kdu = findKduByPlz(input.plz)
  if (!kdu) return null

  const size = Math.min(input.bgGroesse, 5) as 1 | 2 | 3 | 4 | 5
  const kaltmieteGrenze = kdu.kaltmiete[size]
  const qmGrenze = kdu.qmGrenzen[size]
  const heizkostenGrenze = Math.round(kdu.heizkostenProQm * qmGrenze)

  const kaltmieteAngemessen = input.kaltmiete <= kaltmieteGrenze
  const qmAngemessen = input.qm <= qmGrenze
  const heizkostenAngemessen = input.heizkosten <= heizkostenGrenze

  const gesamtKdu = input.kaltmiete + input.nebenkosten + input.heizkosten
  const angemesseneKdu = Math.min(input.kaltmiete, kaltmieteGrenze) + input.nebenkosten + Math.min(input.heizkosten, heizkostenGrenze)
  const differenz = gesamtKdu - angemesseneKdu

  const hinweise: string[] = []
  if (!kaltmieteAngemessen) {
    hinweise.push(`Kaltmiete ${input.kaltmiete - kaltmieteGrenze} EUR ueber der Grenze. Nach 6 Monaten droht Kuerzung!`)
  }
  if (!qmAngemessen) {
    hinweise.push(`Wohnung ${input.qm - qmGrenze} qm zu gross. Relevant fuer Kostensenkungsaufforderung.`)
  }
  if (!heizkostenAngemessen) {
    hinweise.push(`Heizkosten ${input.heizkosten - heizkostenGrenze} EUR ueber dem Richtwert.`)
  }
  if (!kdu.schluessigesKonzept) {
    hinweise.push('WICHTIG: Kein schluessiges Konzept vorhanden! Tatsaechliche Kosten koennen gefordert werden (§ 22 SGB II + BSG-Rechtsprechung).')
  }
  if (kaltmieteAngemessen && qmAngemessen && heizkostenAngemessen) {
    hinweise.push('Alle Kosten im Rahmen - deine KdU sind angemessen!')
  }

  return {
    stadt: kdu.stadt,
    kaltmieteGrenze,
    kaltmieteAngemessen,
    kaltmieteDifferenz: Math.max(0, input.kaltmiete - kaltmieteGrenze),
    qmGrenze,
    qmAngemessen,
    heizkostenGrenze,
    heizkostenAngemessen,
    gesamtKdu,
    angemesseneKdu,
    differenz,
    hinweise,
    schluessigesKonzept: kdu.schluessigesKonzept,
  }
}
