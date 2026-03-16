/**
 * Aktuelle Regelsaetze und Daten fuer das Sozialrecht (Stand 2026)
 */

// =============================================
// Buergergeld Regelsaetze 2026 (SGB II)
// =============================================
export const REGELSAETZE_2026 = {
  rs1: { stufe: 'Regelbedarfsstufe 1', beschreibung: 'Alleinstehende / Alleinerziehende', betrag: 563 },
  rs2: { stufe: 'Regelbedarfsstufe 2', beschreibung: 'Paare (je Person)', betrag: 506 },
  rs3: { stufe: 'Regelbedarfsstufe 3', beschreibung: 'Erwachsene im Haushalt anderer', betrag: 451 },
  rs4: { stufe: 'Regelbedarfsstufe 4', beschreibung: 'Jugendliche 14-17 Jahre', betrag: 471 },
  rs5: { stufe: 'Regelbedarfsstufe 5', beschreibung: 'Kinder 6-13 Jahre', betrag: 390 },
  rs6: { stufe: 'Regelbedarfsstufe 6', beschreibung: 'Kinder 0-5 Jahre', betrag: 357 },
}

// =============================================
// Mehrbedarfe (§ 21 SGB II)
// =============================================
export const MEHRBEDARFE = {
  schwangerschaft: {
    paragraph: '§ 21 Abs. 2 SGB II',
    titel: 'Mehrbedarf Schwangerschaft',
    prozent: 17,
    beschreibung: 'Ab der 13. Schwangerschaftswoche, 17% des Regelsatzes',
    betrag_rs1: Math.round(563 * 0.17 * 100) / 100, // 95,71
  },
  alleinerziehend: {
    paragraph: '§ 21 Abs. 3 SGB II',
    titel: 'Mehrbedarf Alleinerziehende',
    staffelung: [
      { kinder: '1 Kind unter 7', prozent: 36 },
      { kinder: '1 Kind ueber 7', prozent: 12 },
      { kinder: '2 Kinder unter 16', prozent: 36 },
      { kinder: '2 Kinder, davon 1 ueber 16', prozent: 24 },
      { kinder: '3 Kinder', prozent: 36 },
      { kinder: '4 Kinder', prozent: 48 },
      { kinder: '5+ Kinder', prozent: 60 },
    ],
    max_prozent: 60,
  },
  behinderung: {
    paragraph: '§ 21 Abs. 4 SGB II',
    titel: 'Mehrbedarf Behinderung',
    prozent: 17,
    beschreibung: 'Bei Teilhabe am Arbeitsleben + Merkzeichen G oder aG',
  },
  ernaehrung: {
    paragraph: '§ 21 Abs. 5 SGB II',
    titel: 'Mehrbedarf kostenaufwaendige Ernaehrung',
    beschreibung: 'Bei Krankheit die besondere Ernaehrung erfordert (aerztliches Attest noetig)',
    beispiele: [
      { krankheit: 'Niereninsuffizienz (Dialyse)', betrag: '10% des RS' },
      { krankheit: 'Zoeliakei', betrag: 'individuell' },
      { krankheit: 'HIV/AIDS', betrag: 'individuell' },
      { krankheit: 'Morbus Crohn', betrag: 'individuell' },
    ],
  },
  warmwasser: {
    paragraph: '§ 21 Abs. 7 SGB II',
    titel: 'Mehrbedarf dezentrale Warmwassererzeugung',
    beschreibung: 'Wenn Warmwasser nicht ueber die Heizung, sondern z.B. Durchlauferhitzer erzeugt wird',
    prozent_rs1: 2.3,
    prozent_rs2: 2.3,
    prozent_rs3: 2.3,
    prozent_rs4: 1.4,
    prozent_rs5: 1.2,
    prozent_rs6: 0.8,
  },
  unabweisbar: {
    paragraph: '§ 21 Abs. 6 SGB II',
    titel: 'Unabweisbarer laufender Mehrbedarf',
    beschreibung: 'Auffangtatbestand fuer besondere laufende Bedarfe die nicht vom Regelsatz gedeckt werden',
    beispiele: [
      'Hygieneartikel bei Inkontinenz',
      'Putz-/Haushaltshilfe bei Behinderung',
      'Umgangskosten mit Kindern',
      'Nicht verschreibungspflichtige Medikamente bei chron. Krankheit',
    ],
  },
}

// =============================================
// Sanktionsregeln (seit Buergergeld 2023)
// =============================================
export const SANKTIONEN = {
  maxKuerzung: 30, // Prozent des Regelsatzes
  kduSchutz: true, // KdU darf nicht gekuerzt werden
  dauer: {
    erstePflichtverletzung: '1 Monat, 10% Kuerzung',
    zweitePflichtverletzung: '2 Monate, 20% Kuerzung',
    drittePflichtverletzung: '3 Monate, 30% Kuerzung',
    meldeversaeumnis: '1 Monat, 10% Kuerzung',
  },
  wichtigeGruende: [
    'Krankheit (eigene oder Angehoeriger)',
    'Kinderbetreuung nicht sichergestellt',
    'Pflege eines Angehoerigen',
    'Brief/Einladung nicht erhalten',
    'Unzumutbare Arbeitsbedingungen',
    'Sittenwidrig niedrige Entlohnung',
    'Gewissensgruende (z.B. Ruestungsindustrie)',
    'Fehlende Kinderbetreuung fuer unter 3-Jaehrige',
  ],
  karenzzeit: '6 Monate - in den ersten 6 Monaten des Leistungsbezugs keine Sanktionen',
}

// =============================================
// Kosten der Unterkunft - Richtwerte (Beispiel groessere Staedte)
// =============================================
export interface KduRichtwert {
  stadt: string
  personenAnzahl: number
  wohnflaeche: number
  bruttokalt: number
  stand: string
}

export const KDU_RICHTWERTE: KduRichtwert[] = [
  // Berlin (Stand 2025/2026)
  { stadt: 'Berlin', personenAnzahl: 1, wohnflaeche: 50, bruttokalt: 426, stand: '2025' },
  { stadt: 'Berlin', personenAnzahl: 2, wohnflaeche: 60, bruttokalt: 516, stand: '2025' },
  { stadt: 'Berlin', personenAnzahl: 3, wohnflaeche: 75, bruttokalt: 635, stand: '2025' },
  { stadt: 'Berlin', personenAnzahl: 4, wohnflaeche: 85, bruttokalt: 713, stand: '2025' },
  { stadt: 'Berlin', personenAnzahl: 5, wohnflaeche: 97, bruttokalt: 812, stand: '2025' },
  // Hamburg
  { stadt: 'Hamburg', personenAnzahl: 1, wohnflaeche: 50, bruttokalt: 443, stand: '2025' },
  { stadt: 'Hamburg', personenAnzahl: 2, wohnflaeche: 60, bruttokalt: 536, stand: '2025' },
  { stadt: 'Hamburg', personenAnzahl: 3, wohnflaeche: 75, bruttokalt: 659, stand: '2025' },
  // Muenchen
  { stadt: 'Muenchen', personenAnzahl: 1, wohnflaeche: 50, bruttokalt: 688, stand: '2025' },
  { stadt: 'Muenchen', personenAnzahl: 2, wohnflaeche: 65, bruttokalt: 837, stand: '2025' },
  { stadt: 'Muenchen', personenAnzahl: 3, wohnflaeche: 75, bruttokalt: 1006, stand: '2025' },
  // Koeln
  { stadt: 'Koeln', personenAnzahl: 1, wohnflaeche: 50, bruttokalt: 426, stand: '2025' },
  { stadt: 'Koeln', personenAnzahl: 2, wohnflaeche: 65, bruttokalt: 515, stand: '2025' },
  { stadt: 'Koeln', personenAnzahl: 3, wohnflaeche: 80, bruttokalt: 625, stand: '2025' },
  // Frankfurt
  { stadt: 'Frankfurt', personenAnzahl: 1, wohnflaeche: 50, bruttokalt: 510, stand: '2025' },
  { stadt: 'Frankfurt', personenAnzahl: 2, wohnflaeche: 60, bruttokalt: 619, stand: '2025' },
  { stadt: 'Frankfurt', personenAnzahl: 3, wohnflaeche: 75, bruttokalt: 765, stand: '2025' },
]

export function getKduRichtwert(stadt: string, personen: number): KduRichtwert | null {
  return KDU_RICHTWERTE.find(
    r => r.stadt.toLowerCase() === stadt.toLowerCase() && r.personenAnzahl === personen
  ) || null
}

// =============================================
// ALG I Berechnung (SGB III)
// =============================================
export const ALG1_INFO = {
  berechnungsgrundlage: 'Durchschnittliches Brutto der letzten 12 Monate vor Arbeitslosigkeit',
  leistungssatz: {
    ohne_kinder: 60, // Prozent des Netto
    mit_kindern: 67, // Prozent des Netto (erhoehter Satz)
  },
  anspruchsdauer: [
    { beitragsmonate: 12, alter_ab: 0, dauer_monate: 6 },
    { beitragsmonate: 16, alter_ab: 0, dauer_monate: 8 },
    { beitragsmonate: 20, alter_ab: 0, dauer_monate: 10 },
    { beitragsmonate: 24, alter_ab: 0, dauer_monate: 12 },
    { beitragsmonate: 30, alter_ab: 50, dauer_monate: 15 },
    { beitragsmonate: 36, alter_ab: 55, dauer_monate: 18 },
    { beitragsmonate: 48, alter_ab: 58, dauer_monate: 24 },
  ],
  sperrzeit: {
    eigenkuendigung: '12 Wochen (kann auf 3-6 Wochen verkuerzt werden bei wichtigem Grund)',
    arbeitsablehnung: '3-12 Wochen (je nach Schwere)',
    massnahme_abbruch: '3-12 Wochen',
    meldeversaeumnis: '1 Woche',
    verspätete_meldung: 'Kein Anspruch fuer verspaetete Tage (§ 38 SGB III: Fruehzeitige Meldung 3 Monate vor Ende)',
  },
  wichtigeGruendeSperrzeit: [
    'Mobbing / Diskriminierung am Arbeitsplatz',
    'Gesundheitliche Gruende (aerztliches Attest)',
    'Umzug zum Partner (bei eingetragener Partnerschaft)',
    'Unzumutbare Arbeitsbedingungen',
    'Aufhebungsvertrag zur Vermeidung betriebsbedingter Kuendigung',
  ],
}

// =============================================
// Wichtige Fristen
// =============================================
export const FRISTEN = {
  widerspruch: {
    frist: '1 Monat',
    ab: 'Bekanntgabe des Bescheids (Zugangsfiktion: 3 Tage nach Absendung)',
    paragraph: '§ 84 SGG',
    hinweis: 'Fehlt die Rechtsbehelfsbelehrung, verlaengert sich die Frist auf 1 Jahr!',
  },
  klage: {
    frist: '1 Monat',
    ab: 'Bekanntgabe des Widerspruchsbescheids',
    paragraph: '§ 87 SGG',
    hinweis: 'Klage beim Sozialgericht - kostenfrei! PKH beantragen.',
  },
  ueberpruefungsantrag: {
    frist: 'Bis zu 4 Jahre rueckwirkend',
    paragraph: '§ 44 SGB X',
    hinweis: 'Kein Fristdruck, aber: Je frueher, desto mehr Nachzahlung.',
  },
  weiterbewilligung: {
    frist: 'Rechtzeitig vor Ablauf des Bewilligungszeitraums',
    empfehlung: '2-4 Wochen vorher',
    hinweis: 'Bei verspaetetem Antrag: Leistungen erst ab Antragsmonat!',
  },
  arbeitssuchendMeldung: {
    frist: '3 Monate vor Ende des Arbeitsverhaeltnisses',
    paragraph: '§ 38 SGB III',
    hinweis: 'Bei Versaeumnis: Sperrzeit von 1 Woche pro verspaetetem Tag',
  },
}

// =============================================
// Nuetzliche Beratungsstellen
// =============================================
export const BERATUNGSSTELLEN = [
  {
    name: 'Sozialverband VdK',
    beschreibung: 'Groesster Sozialverband Deutschlands. Rechtsberatung und Vertretung im Sozialrecht.',
    url: 'https://www.vdk.de',
    kostenlos: false,
    mitgliedschaft: 'Ab ca. 6 EUR/Monat',
  },
  {
    name: 'Sozialverband SoVD',
    beschreibung: 'Beratung und Vertretung im Sozialrecht.',
    url: 'https://www.sovd.de',
    kostenlos: false,
    mitgliedschaft: 'Ab ca. 5 EUR/Monat',
  },
  {
    name: 'Rechtsantragstelle Sozialgericht',
    beschreibung: 'Kostenlose Hilfe beim Verfassen von Klagen und Eilantraegen direkt am Sozialgericht.',
    url: '',
    kostenlos: true,
  },
  {
    name: 'Erwerbslosenberatung / Arbeitslosenzentren',
    beschreibung: 'Kostenlose Beratung in vielen Staedten. Oft von Gewerkschaften oder Wohlfahrtsverbaenden betrieben.',
    kostenlos: true,
  },
  {
    name: 'Prozesskostenhilfe (PKH)',
    beschreibung: 'Kostenlose anwaltliche Vertretung wenn du dir keinen Anwalt leisten kannst. Antrag beim Sozialgericht.',
    kostenlos: true,
  },
]
