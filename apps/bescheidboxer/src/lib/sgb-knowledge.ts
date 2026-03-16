export type SgbCategory = 'sgb2' | 'sgb3' | 'sgb12' | 'kdu' | 'sgb10'

export interface SgbCategoryInfo {
  id: SgbCategory
  name: string
  fullName: string
  description: string
  color: string
  badgeClass: string
  topics: string[]
}

export const SGB_CATEGORIES: Record<SgbCategory, SgbCategoryInfo> = {
  sgb2: {
    id: 'sgb2',
    name: 'SGB II',
    fullName: 'Buergergeld (ehem. ALG II / Hartz IV)',
    description: 'Grundsicherung fuer Arbeitsuchende - Buergergeld, Regelsatz, Mehrbedarf, Sanktionen',
    color: '#059669',
    badgeClass: 'badge-sgb2',
    topics: [
      'Buergergeld-Regelsatz',
      'Mehrbedarf',
      'Sanktionen & Leistungskuerzungen',
      'Eingliederungsvereinbarung',
      'Anrechnung von Einkommen',
      'Vermoegensanrechnung',
      'Bedarfsgemeinschaft',
      'Zumutbare Arbeit',
      'Massnahmen & Weiterbildung',
      'Ortsabwesenheit',
    ],
  },
  sgb3: {
    id: 'sgb3',
    name: 'SGB III',
    fullName: 'Arbeitslosenversicherung (ALG I)',
    description: 'Arbeitslosengeld I - Anspruch, Berechnung, Sperrzeit, Weiterbildung',
    color: '#2563eb',
    badgeClass: 'badge-sgb3',
    topics: [
      'ALG I Anspruch & Dauer',
      'ALG I Berechnung',
      'Sperrzeit',
      'Arbeitslosmeldung',
      'Eigenkuendigung',
      'Weiterbildung & Umschulung',
      'Existenzgruendungszuschuss',
      'Teilarbeitslosengeld',
    ],
  },
  sgb12: {
    id: 'sgb12',
    name: 'SGB XII',
    fullName: 'Sozialhilfe',
    description: 'Sozialhilfe - Hilfe zum Lebensunterhalt, Grundsicherung im Alter',
    color: '#7c3aed',
    badgeClass: 'badge-sgb12',
    topics: [
      'Hilfe zum Lebensunterhalt',
      'Grundsicherung im Alter',
      'Hilfe bei Krankheit',
      'Eingliederungshilfe',
      'Hilfe zur Pflege',
    ],
  },
  kdu: {
    id: 'kdu',
    name: 'KdU',
    fullName: 'Kosten der Unterkunft',
    description: 'Miete & Heizkosten - Angemessenheit, Aufforderung zur Kostensenkung, Umzug',
    color: '#ea580c',
    badgeClass: 'badge-kdu',
    topics: [
      'Angemessenheit der Miete',
      'Kostensenkungsaufforderung',
      'Umzugsgenehmigung',
      'Heizkosten',
      'Nebenkosten-Nachzahlung',
      'Erstausstattung Wohnung',
      'Renovierungskosten',
      'Mietkaution vom Amt',
    ],
  },
  sgb10: {
    id: 'sgb10',
    name: 'SGB X',
    fullName: 'Verwaltungsverfahren',
    description: 'Widerspruch, Ueberpruefungsantrag, Fristen, Akteneinsicht',
    color: '#6b7280',
    badgeClass: 'badge-sgb2',
    topics: [
      'Widerspruch einlegen',
      'Ueberpruefungsantrag nach Paragraph 44',
      'Fristen & Termine',
      'Akteneinsicht',
      'Eilantrag Sozialgericht',
      'Aufhebung & Erstattung',
    ],
  },
}

export type LetterType =
  | 'widerspruch_bescheid'
  | 'widerspruch_sanktion'
  | 'widerspruch_kdu'
  | 'widerspruch_aufhebung'
  | 'widerspruch_rueckforderung'
  | 'ueberpruefungsantrag'
  | 'antrag_mehrbedarf'
  | 'antrag_einmalige_leistung'
  | 'antrag_weiterbewilligung'
  | 'antrag_umzug'
  | 'eilantrag_sozialgericht'
  | 'akteneinsicht'
  | 'fristverlängerung'
  | 'beschwerde_sachbearbeiter'

export interface LetterTemplate {
  id: LetterType
  title: string
  shortDescription: string
  description: string
  category: SgbCategory
  difficulty: 'einfach' | 'mittel' | 'komplex'
  estimatedTime: string
  isFree: boolean
  requiredFields: LetterField[]
  legalBasis: string[]
  tips: string[]
}

export interface LetterField {
  id: string
  label: string
  type: 'text' | 'date' | 'number' | 'select' | 'textarea'
  placeholder: string
  required: boolean
  helpText?: string
  options?: { value: string; label: string }[]
}

export const LETTER_TEMPLATES: LetterTemplate[] = [
  {
    id: 'widerspruch_bescheid',
    title: 'Widerspruch gegen Leistungsbescheid',
    shortDescription: 'Wenn dein Bescheid falsch berechnet ist oder Leistungen fehlen',
    description: 'Mit diesem Schreiben legst du formgerecht Widerspruch gegen einen Bewilligungsbescheid ein. Geeignet bei falscher Berechnung des Regelbedarfs, fehlenden Mehrbedarfen oder falscher Einkommensanrechnung.',
    category: 'sgb2',
    difficulty: 'einfach',
    estimatedTime: '5-10 Min.',
    isFree: false,
    requiredFields: [
      { id: 'name', label: 'Dein vollstaendiger Name', type: 'text', placeholder: 'Max Mustermann', required: true },
      { id: 'bg_nummer', label: 'BG-Nummer / Aktenzeichen', type: 'text', placeholder: 'z.B. 12345BG0001', required: true, helpText: 'Steht oben rechts auf deinem Bescheid' },
      { id: 'bescheid_datum', label: 'Datum des Bescheids', type: 'date', placeholder: '', required: true },
      { id: 'jobcenter', label: 'Zustaendiges Jobcenter', type: 'text', placeholder: 'z.B. Jobcenter Berlin Mitte', required: true },
      { id: 'grund', label: 'Warum ist der Bescheid falsch?', type: 'textarea', placeholder: 'Beschreibe kurz, was am Bescheid nicht stimmt...', required: true, helpText: 'Keine Sorge, du kannst die Begruendung spaeter nachreichen.' },
    ],
    legalBasis: ['§ 39 SGB II', '§ 84 SGG', '§ 36 SGB X'],
    tips: [
      'Du hast 1 Monat nach Zugang des Bescheids Zeit fuer den Widerspruch.',
      'Du kannst den Widerspruch auch erstmal ohne Begruendung einlegen und diese nachreichen.',
      'Sende den Widerspruch immer per Einschreiben oder gib ihn persoenlich ab und lass dir den Empfang bestaetigen.',
    ],
  },
  {
    id: 'widerspruch_sanktion',
    title: 'Widerspruch gegen Sanktion',
    shortDescription: 'Wenn dir Leistungen gekuerzt werden (Pflichtverletzung)',
    description: 'Widerspruch gegen einen Sanktionsbescheid nach neuem Buergergeld-Recht. Seit 2023 gelten neue, mildere Sanktionsregeln.',
    category: 'sgb2',
    difficulty: 'mittel',
    estimatedTime: '10-15 Min.',
    isFree: false,
    requiredFields: [
      { id: 'name', label: 'Dein vollstaendiger Name', type: 'text', placeholder: 'Max Mustermann', required: true },
      { id: 'bg_nummer', label: 'BG-Nummer', type: 'text', placeholder: 'z.B. 12345BG0001', required: true },
      { id: 'bescheid_datum', label: 'Datum des Sanktionsbescheids', type: 'date', placeholder: '', required: true },
      { id: 'jobcenter', label: 'Zustaendiges Jobcenter', type: 'text', placeholder: 'z.B. Jobcenter Berlin Mitte', required: true },
      { id: 'sanktionsgrund', label: 'Grund der Sanktion', type: 'select', placeholder: '', required: true, options: [
        { value: 'termin', label: 'Meldeversaeumnis (Termin verpasst)' },
        { value: 'massnahme', label: 'Massnahme nicht angetreten' },
        { value: 'arbeit', label: 'Arbeitsangebot nicht angenommen' },
        { value: 'egv', label: 'Eingliederungsvereinbarung nicht erfuellt' },
        { value: 'sonstiges', label: 'Sonstiges' },
      ]},
      { id: 'wichtiger_grund', label: 'Hattest du einen wichtigen Grund?', type: 'textarea', placeholder: 'z.B. krank, Kind krank, Brief nicht erhalten...', required: true },
    ],
    legalBasis: ['§ 31 SGB II', '§ 31a SGB II', '§ 31b SGB II', '§ 32 SGB II'],
    tips: [
      'Seit dem Buergergeld duerfen Sanktionen maximal 30% des Regelsatzes betragen.',
      'Bei einem wichtigen Grund (Krankheit, Kinderbetreuung etc.) darf nicht sanktioniert werden.',
      'Hol dir eine aerztliche Bescheinigung, wenn du krank warst.',
    ],
  },
  {
    id: 'widerspruch_kdu',
    title: 'Widerspruch gegen KdU-Kuerzung',
    shortDescription: 'Wenn das Amt nicht die volle Miete zahlt',
    description: 'Widerspruch wenn das Jobcenter die Kosten der Unterkunft (Miete + Heizung) nicht in voller Hoehe uebernimmt oder eine Kostensenkungsaufforderung schickt.',
    category: 'kdu',
    difficulty: 'mittel',
    estimatedTime: '10-15 Min.',
    isFree: false,
    requiredFields: [
      { id: 'name', label: 'Dein vollstaendiger Name', type: 'text', placeholder: 'Max Mustermann', required: true },
      { id: 'bg_nummer', label: 'BG-Nummer', type: 'text', placeholder: 'z.B. 12345BG0001', required: true },
      { id: 'bescheid_datum', label: 'Datum des Bescheids', type: 'date', placeholder: '', required: true },
      { id: 'jobcenter', label: 'Zustaendiges Jobcenter', type: 'text', placeholder: '', required: true },
      { id: 'tatsaechliche_miete', label: 'Deine tatsaechliche Warmmiete', type: 'number', placeholder: 'z.B. 650', required: true, helpText: 'Kaltmiete + Nebenkosten + Heizung' },
      { id: 'anerkannte_miete', label: 'Vom Amt anerkannte Miete', type: 'number', placeholder: 'z.B. 520', required: true, helpText: 'Steht in deinem Bescheid' },
      { id: 'wohnort', label: 'Dein Wohnort (Stadt)', type: 'text', placeholder: 'z.B. Berlin', required: true },
    ],
    legalBasis: ['§ 22 SGB II', '§ 35 SGB XII'],
    tips: [
      'Das Amt muss die tatsaechlichen Kosten fuer 6 Monate uebernehmen, bevor es kuerzen darf.',
      'Die Angemessenheitsgrenze muss nach einem "schluessigen Konzept" ermittelt worden sein.',
      'Verknuepfung mit dem Mieter-Checker: Pruefe ob deine Miete ortsueblich ist!',
    ],
  },
  {
    id: 'ueberpruefungsantrag',
    title: 'Ueberpruefungsantrag nach § 44 SGB X',
    shortDescription: 'Alte Bescheide nochmal pruefen lassen (bis zu 4 Jahre zurueck)',
    description: 'Mit dem Ueberpruefungsantrag kannst du Bescheide der letzten 4 Jahre nochmal pruefen lassen, auch wenn die Widerspruchsfrist abgelaufen ist. Sehr maechtig!',
    category: 'sgb10',
    difficulty: 'einfach',
    estimatedTime: '5-10 Min.',
    isFree: false,
    requiredFields: [
      { id: 'name', label: 'Dein vollstaendiger Name', type: 'text', placeholder: 'Max Mustermann', required: true },
      { id: 'bg_nummer', label: 'BG-Nummer / Aktenzeichen', type: 'text', placeholder: '', required: true },
      { id: 'bescheid_datum', label: 'Datum des zu pruefenden Bescheids', type: 'date', placeholder: '', required: true },
      { id: 'jobcenter', label: 'Zustaendiges Jobcenter', type: 'text', placeholder: '', required: true },
      { id: 'zeitraum', label: 'Bewilligungszeitraum des Bescheids', type: 'text', placeholder: 'z.B. 01.01.2024 - 30.06.2024', required: true },
      { id: 'grund', label: 'Warum war der Bescheid falsch?', type: 'textarea', placeholder: 'z.B. Regelsatz war zu niedrig, Mehrbedarf wurde nicht beruecksichtigt...', required: true },
    ],
    legalBasis: ['§ 44 SGB X'],
    tips: [
      'Du kannst Bescheide der letzten 4 Jahre pruefen lassen!',
      'Typische Gruende: Falsche Regelsaetze, fehlender Mehrbedarf, zu niedrige KdU.',
      'Das Amt muss den Bescheid aendern, wenn er rechtswidrig war.',
      'Nachzahlungen sind moeglich - manchmal mehrere hundert Euro!',
    ],
  },
  {
    id: 'antrag_mehrbedarf',
    title: 'Antrag auf Mehrbedarf',
    shortDescription: 'Zusaetzliche Leistungen fuer besondere Lebenslagen',
    description: 'Antrag auf Anerkennung eines Mehrbedarfs, z.B. fuer Alleinerziehende, Schwangere, chronisch Kranke oder bei kostenaufwaendiger Ernaehrung.',
    category: 'sgb2',
    difficulty: 'einfach',
    estimatedTime: '5 Min.',
    isFree: false,
    requiredFields: [
      { id: 'name', label: 'Dein vollstaendiger Name', type: 'text', placeholder: 'Max Mustermann', required: true },
      { id: 'bg_nummer', label: 'BG-Nummer', type: 'text', placeholder: '', required: true },
      { id: 'jobcenter', label: 'Zustaendiges Jobcenter', type: 'text', placeholder: '', required: true },
      { id: 'mehrbedarf_art', label: 'Art des Mehrbedarfs', type: 'select', placeholder: '', required: true, options: [
        { value: 'alleinerziehend', label: 'Alleinerziehend' },
        { value: 'schwanger', label: 'Schwangerschaft (ab 13. Woche)' },
        { value: 'behinderung', label: 'Behinderung (Merkzeichen G/aG)' },
        { value: 'ernaehrung', label: 'Kostenaufwaendige Ernaehrung' },
        { value: 'warmwasser', label: 'Dezentrale Warmwassererzeugung' },
        { value: 'unabweisbar', label: 'Unabweisbarer Mehrbedarf (§ 21 Abs. 6)' },
      ]},
      { id: 'begruendung', label: 'Kurze Begruendung', type: 'textarea', placeholder: 'Warum brauchst du den Mehrbedarf?', required: true },
    ],
    legalBasis: ['§ 21 SGB II'],
    tips: [
      'Alleinerziehende haben IMMER Anspruch auf Mehrbedarf (12-60% je nach Kinderzahl/Alter).',
      'Schwangere ab der 13. Woche: 17% Mehrbedarf.',
      'Bei Kostenaufwaendiger Ernaehrung brauchst du ein aerztliches Attest.',
    ],
  },
  {
    id: 'antrag_einmalige_leistung',
    title: 'Antrag auf einmalige Leistungen',
    shortDescription: 'Erstausstattung, Klassenfahrt, Reparaturen etc.',
    description: 'Antrag auf Uebernahme einmaliger Bedarfe wie Erstausstattung der Wohnung, Schwangerschaftsbekleidung, Klassenfahrten oder notwendige Anschaffungen.',
    category: 'sgb2',
    difficulty: 'einfach',
    estimatedTime: '5 Min.',
    isFree: false,
    requiredFields: [
      { id: 'name', label: 'Dein vollstaendiger Name', type: 'text', placeholder: 'Max Mustermann', required: true },
      { id: 'bg_nummer', label: 'BG-Nummer', type: 'text', placeholder: '', required: true },
      { id: 'jobcenter', label: 'Zustaendiges Jobcenter', type: 'text', placeholder: '', required: true },
      { id: 'leistung_art', label: 'Art der Leistung', type: 'select', placeholder: '', required: true, options: [
        { value: 'erstausstattung_wohnung', label: 'Erstausstattung Wohnung (Moebel, Hausrat)' },
        { value: 'erstausstattung_kleidung', label: 'Erstausstattung Bekleidung' },
        { value: 'erstausstattung_schwangerschaft', label: 'Schwangerschaftsbekleidung / Babyausstattung' },
        { value: 'reparatur', label: 'Reparatur/Ersatz notwendiger Geraete' },
        { value: 'klassenfahrt', label: 'Klassenfahrt / Schulausflug' },
        { value: 'sonstiges', label: 'Sonstiges' },
      ]},
      { id: 'begruendung', label: 'Was brauchst du genau?', type: 'textarea', placeholder: 'z.B. Waschmaschine defekt, brauche Ersatz...', required: true },
    ],
    legalBasis: ['§ 24 Abs. 3 SGB II'],
    tips: [
      'Erstausstattung steht dir zu bei erstem Einzug, nach Trennung oder nach Obdachlosigkeit.',
      'Das Amt kann Sachleistungen oder Geldleistungen gewaehren.',
      'Tipp: Mache Fotos von defekten Geraeten als Nachweis.',
    ],
  },
  {
    id: 'widerspruch_aufhebung',
    title: 'Widerspruch gegen Aufhebungs- und Erstattungsbescheid',
    shortDescription: 'Wenn das Amt Geld zurueckfordert',
    description: 'Widerspruch wenn das Amt einen Bewilligungsbescheid aufhebt und geleistetes Geld zurueckfordert. Oft rechtswidrig!',
    category: 'sgb10',
    difficulty: 'komplex',
    estimatedTime: '15-20 Min.',
    isFree: false,
    requiredFields: [
      { id: 'name', label: 'Dein vollstaendiger Name', type: 'text', placeholder: 'Max Mustermann', required: true },
      { id: 'bg_nummer', label: 'BG-Nummer', type: 'text', placeholder: '', required: true },
      { id: 'bescheid_datum', label: 'Datum des Aufhebungsbescheids', type: 'date', placeholder: '', required: true },
      { id: 'jobcenter', label: 'Zustaendiges Jobcenter', type: 'text', placeholder: '', required: true },
      { id: 'rueckforderung_hoehe', label: 'Geforderte Rueckzahlung', type: 'number', placeholder: 'z.B. 1200', required: true },
      { id: 'grund', label: 'Grund der Aufhebung laut Bescheid', type: 'textarea', placeholder: 'Was steht als Begruendung im Bescheid?', required: true },
    ],
    legalBasis: ['§ 45 SGB X', '§ 48 SGB X', '§ 50 SGB X'],
    tips: [
      'Das Amt muss genaue Gruende nennen und die Anhoerung korrekt durchfuehren.',
      'Prüfe ob die Jahresfrist (§ 45 Abs. 4 SGB X) eingehalten wurde.',
      'Bei Vertrauensschutz darf oft nicht aufgehoben werden.',
      'Rueckforderungen koennen oft erlassen oder gestundet werden.',
    ],
  },
  {
    id: 'antrag_weiterbewilligung',
    title: 'Weiterbewilligungsantrag',
    shortDescription: 'Verlaengerung deiner Leistungen rechtzeitig beantragen',
    description: 'Antrag auf Weiterbewilligung von Buergergeld-Leistungen. Sollte rechtzeitig vor Ablauf des Bewilligungszeitraums gestellt werden.',
    category: 'sgb2',
    difficulty: 'einfach',
    estimatedTime: '5 Min.',
    isFree: false,
    requiredFields: [
      { id: 'name', label: 'Dein vollstaendiger Name', type: 'text', placeholder: 'Max Mustermann', required: true },
      { id: 'bg_nummer', label: 'BG-Nummer', type: 'text', placeholder: '', required: true },
      { id: 'jobcenter', label: 'Zustaendiges Jobcenter', type: 'text', placeholder: '', required: true },
      { id: 'bewilligungsende', label: 'Ende des aktuellen Bewilligungszeitraums', type: 'date', placeholder: '', required: true },
      { id: 'aenderungen', label: 'Haben sich deine Verhaeltnisse geaendert?', type: 'textarea', placeholder: 'z.B. neue Miete, Einkommenssaenderung, Familienaenderung...', required: false },
    ],
    legalBasis: ['§ 37 SGB II', '§ 41 SGB II'],
    tips: [
      'Stelle den Antrag mindestens 2-4 Wochen vor Ablauf!',
      'Bei verspaetetem Antrag bekommst du erst ab Antragsmonat Leistungen.',
      'Auch wenn du den Fortzahlungsantrag des Amtes nicht erhalten hast: Stelle selbst einen!',
    ],
  },
  {
    id: 'eilantrag_sozialgericht',
    title: 'Eilantrag beim Sozialgericht',
    shortDescription: 'Wenn es schnell gehen muss - einstweiliger Rechtsschutz',
    description: 'Antrag auf einstweilige Anordnung beim Sozialgericht. Fuer Notfaelle, wenn das Amt nicht zahlt und du sofort Hilfe brauchst.',
    category: 'sgb10',
    difficulty: 'komplex',
    estimatedTime: '15-20 Min.',
    isFree: false,
    requiredFields: [
      { id: 'name', label: 'Dein vollstaendiger Name', type: 'text', placeholder: 'Max Mustermann', required: true },
      { id: 'adresse', label: 'Deine Adresse', type: 'text', placeholder: 'Strasse Nr., PLZ Ort', required: true },
      { id: 'jobcenter', label: 'Zustaendiges Jobcenter (Gegner)', type: 'text', placeholder: '', required: true },
      { id: 'sozialgericht', label: 'Zustaendiges Sozialgericht', type: 'text', placeholder: 'z.B. Sozialgericht Berlin', required: true },
      { id: 'sachverhalt', label: 'Was ist passiert?', type: 'textarea', placeholder: 'Beschreibe die Situation: Warum brauchst du dringend Hilfe?', required: true },
      { id: 'notlage', label: 'Welche Notlage besteht?', type: 'textarea', placeholder: 'z.B. kein Geld fuer Essen, Miete kann nicht bezahlt werden, droht Stromsperre...', required: true },
    ],
    legalBasis: ['§ 86b SGG'],
    tips: [
      'Der Eilantrag ist KOSTENFREI - du brauchst keinen Anwalt (hilft aber).',
      'Das Gericht entscheidet meist innerhalb weniger Tage.',
      'Du brauchst einen Anordnungsanspruch (du hast Recht auf die Leistung) UND einen Anordnungsgrund (es ist eilig).',
      'Beantrage gleichzeitig Prozesskostenhilfe!',
    ],
  },
  {
    id: 'akteneinsicht',
    title: 'Antrag auf Akteneinsicht',
    shortDescription: 'Deine komplette Akte beim Amt einsehen',
    description: 'Du hast das Recht, deine komplette Akte beim Jobcenter einzusehen. Wichtig um Fehler zu finden und Widersprueche vorzubereiten.',
    category: 'sgb10',
    difficulty: 'einfach',
    estimatedTime: '3 Min.',
    isFree: false,
    requiredFields: [
      { id: 'name', label: 'Dein vollstaendiger Name', type: 'text', placeholder: 'Max Mustermann', required: true },
      { id: 'bg_nummer', label: 'BG-Nummer', type: 'text', placeholder: '', required: true },
      { id: 'jobcenter', label: 'Zustaendiges Jobcenter', type: 'text', placeholder: '', required: true },
    ],
    legalBasis: ['§ 25 SGB X'],
    tips: [
      'Du hast ein RECHT auf Akteneinsicht - das Amt darf nicht einfach ablehnen!',
      'Du kannst Kopien verlangen (ggf. gegen Gebuehr) oder Fotos machen.',
      'Tipp: Mache immer Fotos von JEDER Seite deiner Akte.',
      'So findest du oft Fehler, die das Amt gemacht hat.',
    ],
  },
  {
    id: 'beschwerde_sachbearbeiter',
    title: 'Dienstaufsichtsbeschwerde',
    shortDescription: 'Beschwerde ueber Sachbearbeiter-Verhalten',
    description: 'Formelle Beschwerde wenn dein Sachbearbeiter sich fehlverhaelt, Antraege verschleppt oder dich schlecht behandelt.',
    category: 'sgb10',
    difficulty: 'einfach',
    estimatedTime: '5-10 Min.',
    isFree: false,
    requiredFields: [
      { id: 'name', label: 'Dein vollstaendiger Name', type: 'text', placeholder: 'Max Mustermann', required: true },
      { id: 'bg_nummer', label: 'BG-Nummer', type: 'text', placeholder: '', required: true },
      { id: 'jobcenter', label: 'Zustaendiges Jobcenter', type: 'text', placeholder: '', required: true },
      { id: 'sachbearbeiter', label: 'Name des Sachbearbeiters (falls bekannt)', type: 'text', placeholder: '', required: false },
      { id: 'vorfall', label: 'Was ist vorgefallen?', type: 'textarea', placeholder: 'Beschreibe den Vorfall moeglichst genau mit Datum und Uhrzeit...', required: true },
    ],
    legalBasis: ['Art. 17 GG (Petitionsrecht)'],
    tips: [
      'Bleibe sachlich und beschreibe den Vorfall mit Datum und Zeugen.',
      'Die Beschwerde geht an die Teamleitung / Geschaeftsfuehrung des Jobcenters.',
      'Du kannst dich auch beim Buergerbeauftragten oder Petitionsausschuss beschweren.',
    ],
  },
  {
    id: 'fristverlängerung',
    title: 'Antrag auf Fristverlängerung',
    shortDescription: 'Mehr Zeit fuer Unterlagen oder Stellungnahmen',
    description: 'Wenn du fuer eine Mitwirkungspflicht oder Anhoerung mehr Zeit brauchst.',
    category: 'sgb10',
    difficulty: 'einfach',
    estimatedTime: '3 Min.',
    isFree: false,
    requiredFields: [
      { id: 'name', label: 'Dein vollstaendiger Name', type: 'text', placeholder: 'Max Mustermann', required: true },
      { id: 'bg_nummer', label: 'BG-Nummer', type: 'text', placeholder: '', required: true },
      { id: 'jobcenter', label: 'Zustaendiges Jobcenter', type: 'text', placeholder: '', required: true },
      { id: 'frist_bezug', label: 'Welche Frist soll verlaengert werden?', type: 'textarea', placeholder: 'z.B. Anhoerung vom 15.01.2026, Aktenzeichen...', required: true },
      { id: 'grund', label: 'Begruendung', type: 'textarea', placeholder: 'Warum brauchst du mehr Zeit?', required: true },
    ],
    legalBasis: ['§ 24 SGB X'],
    tips: [
      'Stelle den Antrag VOR Ablauf der Frist!',
      'Das Amt muss angemessene Fristen gewaehren.',
    ],
  },
  {
    id: 'antrag_umzug',
    title: 'Antrag auf Zusicherung bei Umzug',
    shortDescription: 'Umzugsgenehmigung und Kostenuebernahme',
    description: 'Antrag auf Zusicherung der Mietuebernahme fuer eine neue Wohnung und ggf. Uebernahme der Umzugskosten.',
    category: 'kdu',
    difficulty: 'mittel',
    estimatedTime: '10 Min.',
    isFree: false,
    requiredFields: [
      { id: 'name', label: 'Dein vollstaendiger Name', type: 'text', placeholder: 'Max Mustermann', required: true },
      { id: 'bg_nummer', label: 'BG-Nummer', type: 'text', placeholder: '', required: true },
      { id: 'jobcenter', label: 'Zustaendiges Jobcenter', type: 'text', placeholder: '', required: true },
      { id: 'neue_miete', label: 'Miete der neuen Wohnung (warm)', type: 'number', placeholder: 'z.B. 580', required: true },
      { id: 'neue_adresse', label: 'Adresse der neuen Wohnung', type: 'text', placeholder: '', required: true },
      { id: 'umzugsgrund', label: 'Grund des Umzugs', type: 'select', placeholder: '', required: true, options: [
        { value: 'aufforderung', label: 'Kostensenkungsaufforderung vom Amt' },
        { value: 'kuendigung', label: 'Kuendigung durch Vermieter' },
        { value: 'gesundheit', label: 'Gesundheitliche Gruende' },
        { value: 'familie', label: 'Familiaere Gruende (z.B. Nachwuchs)' },
        { value: 'arbeit', label: 'Arbeitsaufnahme in anderer Stadt' },
        { value: 'gewalt', label: 'Haeusliche Gewalt' },
        { value: 'sonstiges', label: 'Sonstiges' },
      ]},
    ],
    legalBasis: ['§ 22 Abs. 4 SGB II', '§ 22 Abs. 6 SGB II'],
    tips: [
      'IMMER VOR dem Umzug die Zusicherung einholen!',
      'Ohne Zusicherung riskierst du, dass nur die alte, niedrigere Miete gezahlt wird.',
      'Bei einem Umzug auf Aufforderung des Amtes muessen die Umzugskosten uebernommen werden.',
      'Verknuepfung: Nutze den Mieter-Checker fuer KdU-Angemessenheitspruefung!',
    ],
  },
  {
    id: 'widerspruch_rueckforderung',
    title: 'Widerspruch gegen Rueckforderung',
    shortDescription: 'Wenn das Amt zu Unrecht Geld zurueckfordert',
    description: 'Gezielter Widerspruch gegen die Rueckforderung von Leistungen. Oft wird mehr zurueckgefordert als erlaubt oder die Berechnung ist falsch.',
    category: 'sgb10',
    difficulty: 'komplex',
    estimatedTime: '15 Min.',
    isFree: false,
    requiredFields: [
      { id: 'name', label: 'Dein vollstaendiger Name', type: 'text', placeholder: 'Max Mustermann', required: true },
      { id: 'bg_nummer', label: 'BG-Nummer', type: 'text', placeholder: '', required: true },
      { id: 'bescheid_datum', label: 'Datum des Rueckforderungsbescheids', type: 'date', placeholder: '', required: true },
      { id: 'jobcenter', label: 'Zustaendiges Jobcenter', type: 'text', placeholder: '', required: true },
      { id: 'forderung_hoehe', label: 'Geforderte Summe', type: 'number', placeholder: 'z.B. 800', required: true },
      { id: 'grund', label: 'Warum ist die Forderung falsch?', type: 'textarea', placeholder: 'z.B. ich habe alles korrekt angegeben, Berechnung stimmt nicht...', required: true },
    ],
    legalBasis: ['§ 50 SGB X', '§ 44 SGB II'],
    tips: [
      'Prüfe ob der zugrundeliegende Aufhebungsbescheid korrekt ist.',
      'Du kannst eine Ratenzahlung oder einen Erlass beantragen.',
      'Bei Aufrechnung mit laufenden Leistungen: maximal 30% des Regelsatzes.',
    ],
  },
]

export function getTemplatesByCategory(category: SgbCategory): LetterTemplate[] {
  return LETTER_TEMPLATES.filter(t => t.category === category)
}

export function getTemplateById(id: LetterType): LetterTemplate | undefined {
  return LETTER_TEMPLATES.find(t => t.id === id)
}

export const COMMON_PROBLEMS = [
  {
    id: 'bescheid_falsch',
    title: 'Mein Bescheid ist falsch berechnet',
    description: 'Der Regelsatz stimmt nicht, Mehrbedarf fehlt, oder Einkommen wurde falsch angerechnet.',
    category: 'sgb2' as SgbCategory,
    suggestedTemplates: ['widerspruch_bescheid', 'ueberpruefungsantrag'] as LetterType[],
  },
  {
    id: 'sanktion_erhalten',
    title: 'Ich wurde sanktioniert / Leistungen wurden gekuerzt',
    description: 'Du hast einen Sanktionsbescheid erhalten weil du einen Termin verpasst oder eine Massnahme nicht angetreten hast.',
    category: 'sgb2' as SgbCategory,
    suggestedTemplates: ['widerspruch_sanktion'] as LetterType[],
  },
  {
    id: 'miete_nicht_voll',
    title: 'Das Amt zahlt nicht meine volle Miete',
    description: 'Die Kosten der Unterkunft werden nicht komplett uebernommen oder du hast eine Kostensenkungsaufforderung erhalten.',
    category: 'kdu' as SgbCategory,
    suggestedTemplates: ['widerspruch_kdu', 'antrag_umzug'] as LetterType[],
  },
  {
    id: 'geld_zurueck',
    title: 'Das Amt fordert Geld zurueck',
    description: 'Du hast einen Aufhebungs- und Erstattungsbescheid erhalten.',
    category: 'sgb10' as SgbCategory,
    suggestedTemplates: ['widerspruch_aufhebung', 'widerspruch_rueckforderung'] as LetterType[],
  },
  {
    id: 'brauche_mehr',
    title: 'Ich brauche zusaetzliche Leistungen',
    description: 'Mehrbedarf, Erstausstattung, einmalige Beihilfen oder Sonderleistungen.',
    category: 'sgb2' as SgbCategory,
    suggestedTemplates: ['antrag_mehrbedarf', 'antrag_einmalige_leistung'] as LetterType[],
  },
  {
    id: 'umzug',
    title: 'Ich will/muss umziehen',
    description: 'Du brauchst eine Zusicherung vom Amt fuer die neue Wohnung.',
    category: 'kdu' as SgbCategory,
    suggestedTemplates: ['antrag_umzug'] as LetterType[],
  },
]
