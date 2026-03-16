import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import {
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Clock,
  RotateCcw,
  CheckCircle2,
  Circle,
  FileText,
  Truck,
  AlertTriangle,
  Scale,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChecklistItem {
  id: string
  title: string
  description: string
  link?: { label: string; to: string }
}

interface Checklist {
  id: string
  title: string
  description: string
  estimatedMinutes: number
  icon: React.ElementType
  color: string
  bgColor: string
  items: ChecklistItem[]
}

type CheckedState = Record<string, Record<string, boolean>>

const STORAGE_KEY = 'bescheidboxer_checklisten'

const checklists: Checklist[] = [
  {
    id: 'erstantrag',
    title: 'Erstantrag Buergergeld',
    description:
      'Alle Unterlagen und Schritte fuer Ihren ersten Buergergeld-Antrag beim Jobcenter.',
    estimatedMinutes: 60,
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    items: [
      {
        id: 'personalausweis',
        title: 'Personalausweis oder Reisepass bereitlegen',
        description:
          'Gueltiges Ausweisdokument in Kopie. Bei abgelaufenem Ausweis: trotzdem Antrag stellen, Erneuerung kann als Bedarf geltend gemacht werden.',
      },
      {
        id: 'meldebescheinigung',
        title: 'Meldebescheinigung besorgen',
        description:
          'Aktuelle Meldebescheinigung vom Einwohnermeldeamt (nicht aelter als 3 Monate).',
      },
      {
        id: 'kontoauszuege',
        title: 'Kontoauszuege der letzten 3 Monate sammeln',
        description:
          'Lueckenlose Kontoauszuege aller Konten (auch Sparbuecher, PayPal etc.). Schwarz auf weiss, keine Screenshots.',
      },
      {
        id: 'mietvertrag',
        title: 'Mietvertrag und letzte Nebenkostenabrechnung kopieren',
        description:
          'Aktueller Mietvertrag inkl. aller Nachtraege. Heizkostenabrechnung des letzten Jahres beilegen.',
        link: { label: 'KdU-Rechner', to: '/rechner/kdu' },
      },
      {
        id: 'lohnabrechnungen',
        title: 'Letzte Lohnabrechnungen zusammenstellen',
        description:
          'Falls zuletzt erwerbstaetig: die letzten 3 Lohn-/Gehaltsabrechnungen oder den Kuendigungsnachweis.',
      },
      {
        id: 'kuendigung',
        title: 'Kuendigungsschreiben oder Aufhebungsvertrag',
        description:
          'Nachweis ueber Beendigung des letzten Arbeitsverhaeltnisses. Wichtig fuer die Pruefung einer Sperrzeit.',
      },
      {
        id: 'alg1-bescheid',
        title: 'ALG-I-Bescheid (falls vorhanden)',
        description:
          'Wenn Sie Arbeitslosengeld I beziehen oder bezogen haben: den aktuellen Bescheid der Agentur fuer Arbeit.',
      },
      {
        id: 'krankenversicherung',
        title: 'Krankenversicherungsnachweis',
        description:
          'Nachweis der Krankenversicherung (Mitgliedsbescheinigung oder letzte Beitragsrechnung).',
      },
      {
        id: 'kinder-nachweise',
        title: 'Nachweise fuer Kinder (falls zutreffend)',
        description:
          'Geburtsurkunden, Kindergeldbescheid, Schulbescheinigungen, Nachweise ueber Unterhalt oder Unterhaltsvorschuss.',
      },
      {
        id: 'vermoegen',
        title: 'Vermoegensaufstellung erstellen',
        description:
          'Ueberblick ueber Ersparnisse, Wertpapiere, Lebensversicherungen, Fahrzeuge. In der Karenzzeit (12 Monate) gilt ein Schonvermoegen von 40.000 EUR.',
        link: { label: 'Schonvermoegens-Rechner', to: '/rechner/schonvermoegen' },
      },
      {
        id: 'antrag-stellen',
        title: 'Antrag beim Jobcenter stellen (auch formlos moeglich)',
        description:
          'Der Antrag wirkt auf den Ersten des Monats zurueck. Stellen Sie ihn so frueh wie moeglich, auch wenn noch Unterlagen fehlen.',
      },
      {
        id: 'eingangsbestaetigung',
        title: 'Eingangsbestaetigung sichern',
        description:
          'Lassen Sie sich den Eingang des Antrags schriftlich bestaetigen oder senden Sie ihn per Einschreiben.',
      },
    ],
  },
  {
    id: 'umzug',
    title: 'Umzug mit Buergergeld',
    description:
      'Schritt-fuer-Schritt-Anleitung fuer einen Umzug waehrend des Leistungsbezugs nach SGB II.',
    estimatedMinutes: 45,
    icon: Truck,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    items: [
      {
        id: 'genehmigung',
        title: 'Zusicherung des Jobcenters einholen',
        description:
          'Vor dem Umzug unbedingt die Zusicherung nach ss 22 Abs. 6 SGB II beantragen. Ohne Zusicherung werden Umzugskosten und hoehere Miete moeglicherweise nicht uebernommen.',
      },
      {
        id: 'neue-kdu',
        title: 'Neue Mietkosten auf Angemessenheit pruefen',
        description:
          'Die neue Miete muss innerhalb der KdU-Grenze Ihrer neuen Stadt/Gemeinde liegen. Vorab beim neuen Jobcenter anfragen.',
        link: { label: 'KdU-Rechner', to: '/rechner/kdu' },
      },
      {
        id: 'wohnungssuche',
        title: 'Wohnungssuche dokumentieren',
        description:
          'Alle Bewerbungen, Besichtigungen und Absagen schriftlich festhalten. Dies kann bei Streitigkeiten ueber die Angemessenheit wichtig werden.',
      },
      {
        id: 'mietvertrag-neu',
        title: 'Neuen Mietvertrag dem Jobcenter vorlegen',
        description:
          'Vor Unterschrift den Entwurf dem Jobcenter zeigen und die Zusicherung der Kostenuebernahme abwarten.',
      },
      {
        id: 'umzugskosten',
        title: 'Umzugskosten beantragen',
        description:
          'Antrag auf Uebernahme der Umzugskosten stellen: Transporter, Umzugshelfer, Verpackungsmaterial. Kostenvoranschlaege einholen.',
        link: { label: 'Umzugskosten-Rechner', to: '/rechner/umzugskosten' },
      },
      {
        id: 'kaution',
        title: 'Mietkaution als Darlehen beantragen',
        description:
          'Die Mietkaution wird als zinsloses Darlehen vom Jobcenter uebernommen (ss 22 Abs. 6 SGB II). Antrag fruehzeitig stellen.',
      },
      {
        id: 'ummelden',
        title: 'Ummeldung beim Einwohnermeldeamt',
        description:
          'Innerhalb von 2 Wochen nach Umzug beim neuen Einwohnermeldeamt ummelden. Neue Meldebescheinigung dem Jobcenter vorlegen.',
      },
      {
        id: 'jobcenter-wechsel',
        title: 'Zustaendiges Jobcenter informieren',
        description:
          'Bei Umzug in einen anderen Bezirk wechselt die Zustaendigkeit. Akten werden uebertragen. Neuen Ansprechpartner erfragen.',
      },
      {
        id: 'nachsendeauftrag',
        title: 'Nachsendeauftrag bei der Post einrichten',
        description:
          'Damit keine Post vom Jobcenter verloren geht. Wichtig, um keine Fristen zu versaeumen.',
      },
      {
        id: 'erstausstattung-pruefen',
        title: 'Erstausstattung pruefen (bei Bedarf)',
        description:
          'Bei Erstbezug einer eigenen Wohnung oder nach Trennung besteht ggf. Anspruch auf Erstausstattung fuer die Wohnung.',
        link: { label: 'Erstausstattungs-Rechner', to: '/rechner/erstausstattung' },
      },
    ],
  },
  {
    id: 'widerspruch',
    title: 'Widerspruch einlegen',
    description:
      'Systematische Anleitung zum Widerspruch gegen einen fehlerhaften Jobcenter-Bescheid.',
    estimatedMinutes: 30,
    icon: Scale,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    items: [
      {
        id: 'bescheid-pruefen',
        title: 'Bescheid sorgfaeltig pruefen',
        description:
          'Jeden Posten im Bescheid kontrollieren: Regelsatz, KdU, Mehrbedarfe, Einkommensanrechnung, Vermoegen. Unser BescheidScan hilft dabei.',
        link: { label: 'BescheidScan', to: '/scan' },
      },
      {
        id: 'frist-notieren',
        title: 'Widerspruchsfrist notieren',
        description:
          '1 Monat ab Zugang (3 Tage nach Absendung bei Post). Bei fehlender Rechtsbehelfsbelehrung: 1 Jahr Frist. Datum im Kalender markieren!',
        link: { label: 'Fristen-Rechner', to: '/rechner/fristen' },
      },
      {
        id: 'fehler-dokumentieren',
        title: 'Gefundene Fehler dokumentieren',
        description:
          'Jeden Fehler mit Paragraphen-Verweis aufschreiben. Haeufige Fehler: falsche KdU, fehlende Mehrbedarfe, falsche Einkommensanrechnung.',
      },
      {
        id: 'begruendung',
        title: 'Begruendung schreiben',
        description:
          'Den Widerspruch mit konkreter Begruendung formulieren. Tipp: Die Begruendung kann auch nachgereicht werden - zunaechst reicht "Hiermit lege ich Widerspruch ein".',
        link: { label: 'Musterschreiben', to: '/musterschreiben' },
      },
      {
        id: 'einschreiben',
        title: 'Widerspruch per Einschreiben senden',
        description:
          'Per Einschreiben mit Rueckschein oder persoenlich abgeben (Eingangsstempel auf Kopie!). Alternativ: Fax mit Sendebericht.',
      },
      {
        id: 'kopie-aufbewahren',
        title: 'Kopie des Widerspruchs aufbewahren',
        description:
          'Eine vollstaendige Kopie des Widerspruchs inkl. aller Anlagen sicher aufbewahren.',
      },
      {
        id: 'tracker-anlegen',
        title: 'Widerspruch im Tracker erfassen',
        description:
          'Den Widerspruch mit Datum und Aktenzeichen im Tracker erfassen, um den Status zu verfolgen und keine Fristen zu verpassen.',
        link: { label: 'Widerspruch-Tracker', to: '/tracker' },
      },
      {
        id: 'widerspruchsbescheid',
        title: 'Widerspruchsbescheid pruefen (nach Erhalt)',
        description:
          'Bei Ablehnung: Innerhalb von 1 Monat Klage beim Sozialgericht moeglich. Klagen sind fuer Leistungsempfaenger kostenfrei (ss 183 SGG).',
      },
    ],
  },
  {
    id: 'sanktion',
    title: 'Sanktion erhalten',
    description:
      'Was tun, wenn das Jobcenter eine Leistungsminderung (Sanktion) verhaengt hat?',
    estimatedMinutes: 25,
    icon: AlertTriangle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    items: [
      {
        id: 'anhoerung-pruefen',
        title: 'Anhoerungsschreiben pruefen',
        description:
          'Vor jeder Sanktion muss das Jobcenter Sie anhoeren (ss 24 SGB X). Pruefen Sie: Wurde eine Anhoerung durchgefuehrt? Stimmen die Vorwuerfe?',
      },
      {
        id: 'anhoerung-beantworten',
        title: 'Anhoerung fristgerecht beantworten',
        description:
          'Innerhalb der gesetzten Frist (meist 2 Wochen) schriftlich antworten und einen "wichtigen Grund" fuer die Pflichtverletzung vortragen.',
        link: { label: 'Musterschreiben', to: '/musterschreiben' },
      },
      {
        id: 'wichtiger-grund',
        title: 'Wichtigen Grund nachweisen',
        description:
          'Wichtige Gruende: Krankheit (AU-Bescheinigung), fehlende Kinderbetreuung, unzumutbare Arbeit, Post nicht erhalten, persoenliche Notlage.',
      },
      {
        id: 'sanktion-hoehe',
        title: 'Hoehe der Sanktion pruefen',
        description:
          'Maximum: 30% des Regelsatzes (BVerfG-Urteil). Erste Pflichtverletzung: 10% fuer 1 Monat, zweite: 20% fuer 2 Monate, dritte: 30% fuer 3 Monate.',
        link: { label: 'Sanktions-Rechner', to: '/rechner/sanktion' },
      },
      {
        id: 'widerspruch-sanktion',
        title: 'Widerspruch gegen Sanktionsbescheid einlegen',
        description:
          'Innerhalb von 1 Monat Widerspruch einlegen. Etwa 40% aller Widersprueche gegen Sanktionen sind erfolgreich.',
        link: { label: 'Musterschreiben', to: '/musterschreiben' },
      },
      {
        id: 'eilantrag',
        title: 'Bei Existenzbedrohung: Eilantrag stellen',
        description:
          'Bei drohender Obdachlosigkeit oder Unterversorgung: Eilantrag (einstweilige Anordnung, ss 86b Abs. 2 SGG) beim Sozialgericht.',
      },
      {
        id: 'beratung',
        title: 'Sozialberatung aufsuchen',
        description:
          'Kostenlose Beratung bei Sozialverbaenden (VdK, SoVD), Caritas, Diakonie oder AWO. Alternativ: Beratungshilfe fuer Anwalt beantragen.',
      },
      {
        id: 'dokumentation',
        title: 'Alles lueckenlos dokumentieren',
        description:
          'Alle Schreiben, Nachweise und Termine mit Datum und Inhalt festhalten. Dokumentation ist Ihr wichtigstes Beweismittel.',
        link: { label: 'Widerspruch-Tracker', to: '/tracker' },
      },
    ],
  },
]

function loadCheckedState(): CheckedState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // ignore parse errors
  }
  return {}
}

function saveCheckedState(state: CheckedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore storage errors
  }
}

export default function ChecklistenPage() {
  useDocumentTitle('Checklisten - BescheidBoxer')
  const [checked, setChecked] = useState<CheckedState>(loadCheckedState)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    saveCheckedState(checked)
  }, [checked])

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const toggleItem = (checklistId: string, itemId: string) => {
    setChecked((prev) => {
      const checklistState = prev[checklistId] || {}
      return {
        ...prev,
        [checklistId]: {
          ...checklistState,
          [itemId]: !checklistState[itemId],
        },
      }
    })
  }

  const resetChecklist = (checklistId: string) => {
    setChecked((prev) => {
      const next = { ...prev }
      delete next[checklistId]
      return next
    })
  }

  const getProgress = (checklist: Checklist) => {
    const checklistState = checked[checklist.id] || {}
    const completed = checklist.items.filter(
      (item) => checklistState[item.id]
    ).length
    return { completed, total: checklist.items.length }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-boxer rounded-full mb-4">
            <ClipboardList className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Checklisten</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Interaktive Checklisten fuer die wichtigsten Situationen im
            Buergergeld-Bezug. Haken Sie erledigte Schritte ab - Ihr Fortschritt
            wird automatisch gespeichert.
          </p>
        </div>

        {/* Checklist Cards */}
        <div className="space-y-4">
          {checklists.map((checklist) => {
            const Icon = checklist.icon
            const isExpanded = expandedId === checklist.id
            const { completed, total } = getProgress(checklist)
            const progressPercent = total > 0 ? (completed / total) * 100 : 0
            const isDone = completed === total

            return (
              <div
                key={checklist.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md"
              >
                {/* Card Header */}
                <button
                  onClick={() => toggleExpanded(checklist.id)}
                  className="w-full text-left p-5 sm:p-6 flex items-start gap-4"
                >
                  <div
                    className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${checklist.bgColor}`}
                  >
                    <Icon className={`w-5 h-5 ${checklist.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {checklist.title}
                      </h3>
                      {isDone && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          Erledigt
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {checklist.description}
                    </p>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isDone
                              ? 'bg-green-500'
                              : 'bg-gradient-to-r from-red-500 to-red-400'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-500 whitespace-nowrap">
                        {completed}/{total}
                      </span>
                      <span className="hidden sm:flex items-center gap-1 text-xs text-gray-400 whitespace-nowrap">
                        <Clock className="w-3 h-3" />
                        ca. {checklist.estimatedMinutes} Min.
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0 mt-1">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Checklist Items */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {/* Reset button */}
                    <div className="flex items-center justify-between px-5 sm:px-6 pt-4 pb-2">
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Geschaetzter Zeitaufwand: ca. {checklist.estimatedMinutes}{' '}
                        Minuten
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          resetChecklist(checklist.id)
                        }}
                        className="text-gray-400 hover:text-red-600 text-xs gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Zuruecksetzen
                      </Button>
                    </div>

                    {/* Items */}
                    <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-1">
                      {checklist.items.map((item) => {
                        const isChecked =
                          checked[checklist.id]?.[item.id] || false

                        return (
                          <div
                            key={item.id}
                            className={`group flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-green-50/60'
                                : 'hover:bg-gray-50'
                            }`}
                            onClick={() =>
                              toggleItem(checklist.id, item.id)
                            }
                          >
                            {/* Checkbox */}
                            <div className="flex-shrink-0 mt-0.5">
                              {isChecked ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                              ) : (
                                <Circle className="w-5 h-5 text-gray-300 group-hover:text-gray-400" />
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-medium transition-colors ${
                                  isChecked
                                    ? 'text-gray-400 line-through'
                                    : 'text-gray-900'
                                }`}
                              >
                                {item.title}
                              </p>
                              <p
                                className={`text-xs mt-0.5 leading-relaxed ${
                                  isChecked
                                    ? 'text-gray-400'
                                    : 'text-gray-500'
                                }`}
                              >
                                {item.description}
                              </p>
                              {item.link && (
                                <Link
                                  to={item.link.to}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:underline"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  {item.link.label}
                                </Link>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-gray-400 text-center mt-10 max-w-2xl mx-auto leading-relaxed">
          Hinweis: Diese Checklisten dienen der Orientierung und ersetzen keine
          individuelle Rechtsberatung. Fuer verbindliche Auskuenfte wenden Sie sich
          an einen Fachanwalt fuer Sozialrecht oder eine Beratungsstelle (VdK, SoVD,
          Caritas, Diakonie). Alle Angaben ohne Gewaehr.
        </p>
      </div>
    </div>
  )
}
