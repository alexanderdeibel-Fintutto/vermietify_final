import { useState } from 'react'
import { Clock, AlertTriangle, CheckCircle, Calendar, Info, Shield, Download, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generateRechnerPdf } from '@/lib/pdf-export'
import { saveRechnerErgebnis } from '@/lib/rechner-verlauf'
import { shareResult } from '@/lib/share'
import Breadcrumbs from '@/components/Breadcrumbs'

type FristTyp = 'widerspruch' | 'klage' | 'ueberpruefung' | 'eilantrag' | 'berufung' | 'anhoerung' | 'mitwirkung'

interface FristErgebnis {
  fristende: Date
  tageVerbleibend: number
  fristDauer: string
  paragraph: string
  tipps: string[]
  keineStarreFrist: boolean
}

function berechneFrist(
  bescheidDatum: Date,
  fristTyp: FristTyp,
  perPost: boolean
): FristErgebnis {
  const zugang = new Date(bescheidDatum)
  if (perPost) {
    zugang.setDate(zugang.getDate() + 3)
  }

  const fristende = new Date(zugang)
  let fristDauer = ''
  let paragraph = ''
  let tipps: string[] = []
  let keineStarreFrist = false

  switch (fristTyp) {
    case 'widerspruch':
      fristende.setMonth(fristende.getMonth() + 1)
      fristDauer = '1 Monat'
      paragraph = '\u00a7 84 Abs. 1 SGG'
      tipps = [
        'Der Widerspruch muss schriftlich oder zur Niederschrift beim Jobcenter eingelegt werden.',
        'Ein formloses Schreiben reicht aus - es muss nur klar sein, dass du mit dem Bescheid nicht einverstanden bist.',
        'Die Begruendung kann auch nachgereicht werden - lege zuerst fristwahrend Widerspruch ein!',
        'Sende den Widerspruch per Einschreiben oder gib ihn persoenlich ab und lass dir den Empfang bestaetigen.',
      ]
      break
    case 'klage':
      fristende.setMonth(fristende.getMonth() + 1)
      fristDauer = '1 Monat'
      paragraph = '\u00a7 87 Abs. 1 SGG'
      tipps = [
        'Die Klage wird beim zustaendigen Sozialgericht eingereicht - nicht beim Jobcenter.',
        'Das Sozialgericht ist im Widerspruchsbescheid angegeben.',
        'Das Verfahren vor dem Sozialgericht ist kostenfrei (\u00a7 183 SGG).',
        'Du kannst Prozesskostenhilfe beantragen, wenn du dir keinen Anwalt leisten kannst.',
      ]
      break
    case 'berufung':
      fristende.setMonth(fristende.getMonth() + 1)
      fristDauer = '1 Monat'
      paragraph = '\u00a7 151 Abs. 1 SGG'
      tipps = [
        'Die Berufung wird beim Landessozialgericht eingelegt.',
        'Die Berufung muss schriftlich eingelegt werden.',
        'Pruefe, ob die Berufung zugelassen wurde oder ob du eine Nichtzulassungsbeschwerde brauchst.',
        'Ziehe einen Anwalt hinzu - das Berufungsverfahren ist komplexer.',
      ]
      break
    case 'ueberpruefung':
      fristende.setFullYear(fristende.getFullYear() + 4)
      fristDauer = '4 Jahre (Rueckwirkung: 1 Jahr ab Antrag)'
      paragraph = '\u00a7 44 SGB X'
      tipps = [
        'Ein Ueberpruefungsantrag ist auch moeglich, wenn die Widerspruchsfrist bereits abgelaufen ist.',
        'Die Leistungen werden rueckwirkend fuer maximal 1 Jahr ab Antragstellung nachgezahlt (\u00a7 44 Abs. 4 SGB X).',
        'Stelle den Antrag so frueh wie moeglich, um moeglichst viele Monate abzudecken.',
        'Begruende konkret, welcher Fehler im urspruenglichen Bescheid vorliegt.',
      ]
      break
    case 'eilantrag':
      keineStarreFrist = true
      fristDauer = 'Keine starre Frist'
      paragraph = '\u00a7 86b SGG'
      tipps = [
        'Ein Eilantrag (einstweiliger Rechtsschutz) hat keine feste Frist, sollte aber so schnell wie moeglich gestellt werden.',
        'Voraussetzung ist ein Anordnungsanspruch und ein Anordnungsgrund (Eilbeduerfnigkeit).',
        'Typischer Fall: Das Jobcenter hat Leistungen eingestellt und du kannst deine Miete nicht mehr zahlen.',
        'Der Eilantrag wird direkt beim Sozialgericht gestellt.',
      ]
      break
    case 'anhoerung':
      fristende.setDate(fristende.getDate() + 14)
      fristDauer = '2 Wochen'
      paragraph = '\u00a7 24 SGB X'
      tipps = [
        'Die Anhoerung gibt dir die Moeglichkeit, dich zu aeussern, bevor ein belastender Bescheid ergeht.',
        'Nutze die Anhoerung unbedingt! Deine Stellungnahme kann den Bescheid beeinflussen.',
        'Erklaere sachlich deine Sicht der Dinge und fuege Nachweise bei.',
        'Wenn du die Frist verpasst, kann der Bescheid trotzdem ergehen - du hast dann aber noch die Widerspruchsfrist.',
      ]
      break
    case 'mitwirkung':
      fristende.setDate(fristende.getDate() + 14)
      fristDauer = 'Meistens 1-2 Wochen (individuell festgelegt)'
      paragraph = '\u00a7\u00a7 60-67 SGB I'
      tipps = [
        'Die Frist fuer Mitwirkungspflichten wird individuell vom Jobcenter festgelegt.',
        'Wenn du die Unterlagen nicht rechtzeitig beschaffen kannst, bitte schriftlich um Fristverlaengerung.',
        'Bei Nichteinhaltung droht Versagung oder Entziehung der Leistungen (\u00a7 66 SGB I).',
        'Bewahre Nachweise auf, dass du dich um die Mitwirkung bemueht hast.',
      ]
      break
  }

  const heute = new Date()
  heute.setHours(0, 0, 0, 0)
  fristende.setHours(0, 0, 0, 0)

  const diffMs = fristende.getTime() - heute.getTime()
  const tageVerbleibend = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  return {
    fristende,
    tageVerbleibend,
    fristDauer,
    paragraph,
    tipps,
    keineStarreFrist,
  }
}

function formatDatum(date: Date): string {
  return date.toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const fristOptionen: { value: FristTyp; label: string; dauer: string }[] = [
  { value: 'widerspruch', label: 'Widerspruch gegen Bescheid', dauer: '1 Monat' },
  { value: 'klage', label: 'Klage beim Sozialgericht', dauer: '1 Monat' },
  { value: 'ueberpruefung', label: 'Ueberpruefungsantrag \u00a7 44 SGB X', dauer: '4 Jahre' },
  { value: 'eilantrag', label: 'Eilantrag', dauer: 'keine starre Frist' },
  { value: 'berufung', label: 'Berufung', dauer: '1 Monat' },
  { value: 'anhoerung', label: 'Anhoerung beantworten', dauer: '2 Wochen' },
  { value: 'mitwirkung', label: 'Mitwirkungspflicht', dauer: 'meistens 1-2 Wochen' },
]

export default function FristenRechner() {
  const [fristTyp, setFristTyp] = useState<FristTyp>('widerspruch')
  const [bescheidDatum, setBescheidDatum] = useState('')
  const [perPost, setPerPost] = useState(true)
  const [ergebnis, setErgebnis] = useState<FristErgebnis | null>(null)

  const handleBerechnen = () => {
    if (!bescheidDatum) return
    const datum = new Date(bescheidDatum)
    const result = berechneFrist(datum, fristTyp, perPost)
    setErgebnis(result)
    saveRechnerErgebnis('Fristen-Rechner', 'fristen', {
      fristTyp,
      fristende: result.fristende.toLocaleDateString('de-DE'),
      tageVerbleibend: result.tageVerbleibend,
      paragraph: result.paragraph,
    })
  }

  const getAmpelFarbe = (tage: number, keineStarreFrist: boolean) => {
    if (keineStarreFrist) return 'blue'
    if (tage < 0) return 'red'
    if (tage <= 3) return 'red'
    if (tage <= 7) return 'yellow'
    return 'green'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Breadcrumbs items={[{ label: 'Rechner', href: '/rechner' }, { label: 'Fristenrechner' }]} className="mb-4" />
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Fristenrechner</h1>
          </div>
          <p className="text-lg text-gray-600 mt-2">
            Berechne, wann deine Frist fuer Widerspruch, Klage oder andere Rechtsbehelfe ablaeuft.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            Deine Angaben
          </h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Art der Frist
            </label>
            <select
              value={fristTyp}
              onChange={(e) => setFristTyp(e.target.value as FristTyp)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {fristOptionen.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.dauer})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Datum des Bescheids / Zugang
            </label>
            <input
              type="date"
              value={bescheidDatum}
              onChange={(e) => setBescheidDatum(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="mb-6">
            <label className="flex items-center p-4 bg-gray-50 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={perPost}
                onChange={(e) => setPerPost(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded"
              />
              <div className="ml-3">
                <span className="font-medium text-gray-900">Bescheid per Post erhalten</span>
                <p className="text-sm text-gray-500 mt-0.5">
                  Fuegt 3 Tage Zugangsfiktion hinzu (\u00a7 37 Abs. 2 SGB X)
                </p>
              </div>
            </label>
          </div>

          <Button onClick={handleBerechnen} className="w-full py-6 text-lg">
            Frist berechnen
          </Button>
        </div>

        {/* Result */}
        {ergebnis && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              {/* Traffic Light */}
              {!ergebnis.keineStarreFrist ? (
                <>
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <div
                      className={`w-16 h-16 rounded-full transition-all ${
                        getAmpelFarbe(ergebnis.tageVerbleibend, false) === 'green'
                          ? 'bg-green-500 shadow-lg ring-4 ring-green-200'
                          : 'bg-gray-200 opacity-30'
                      }`}
                    />
                    <div
                      className={`w-16 h-16 rounded-full transition-all ${
                        getAmpelFarbe(ergebnis.tageVerbleibend, false) === 'yellow'
                          ? 'bg-yellow-500 shadow-lg ring-4 ring-yellow-200'
                          : 'bg-gray-200 opacity-30'
                      }`}
                    />
                    <div
                      className={`w-16 h-16 rounded-full transition-all ${
                        getAmpelFarbe(ergebnis.tageVerbleibend, false) === 'red'
                          ? 'bg-red-500 shadow-lg ring-4 ring-red-200'
                          : 'bg-gray-200 opacity-30'
                      }`}
                    />
                  </div>

                  <div className="text-center mb-6">
                    <div className="text-lg text-gray-600 mb-2">Fristende</div>
                    <div className="text-3xl font-bold text-gray-900 mb-4">
                      {formatDatum(ergebnis.fristende)}
                    </div>
                    {ergebnis.tageVerbleibend > 0 ? (
                      <div
                        className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-xl font-semibold ${
                          getAmpelFarbe(ergebnis.tageVerbleibend, false) === 'green'
                            ? 'bg-green-100 text-green-800'
                            : getAmpelFarbe(ergebnis.tageVerbleibend, false) === 'yellow'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        <Clock className="w-6 h-6" />
                        Noch {ergebnis.tageVerbleibend} {ergebnis.tageVerbleibend === 1 ? 'Tag' : 'Tage'} verbleibend
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xl font-semibold bg-red-100 text-red-800">
                        <AlertTriangle className="w-6 h-6" />
                        {ergebnis.tageVerbleibend === 0 ? 'Frist laeuft HEUTE ab!' : `Frist seit ${Math.abs(ergebnis.tageVerbleibend)} ${Math.abs(ergebnis.tageVerbleibend) === 1 ? 'Tag' : 'Tagen'} abgelaufen`}
                      </div>
                    )}
                  </div>

                  {/* Expired Warning */}
                  {ergebnis.tageVerbleibend < 0 && (
                    <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 mb-6">
                      <div className="flex items-start gap-3 mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0" />
                        <div>
                          <h3 className="text-xl font-bold text-red-900 mb-2">FRIST ABGELAUFEN</h3>
                          <p className="text-red-800 mb-3">
                            Die Frist ist leider abgelaufen. Aber es gibt noch Moeglichkeiten:
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-start gap-2 bg-white p-3 rounded-lg">
                          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-gray-900">Wiedereinsetzung in den vorigen Stand (\u00a7 67 SGG)</p>
                            <p className="text-sm text-gray-600">
                              Wenn du ohne eigenes Verschulden die Frist versaeumt hast (z.B. Krankheit, falsche Rechtsbehelfsbelehrung),
                              kannst du innerhalb von einem Monat nach Wegfall des Hindernisses Wiedereinsetzung beantragen.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 bg-white p-3 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-gray-900">Ueberpruefungsantrag nach \u00a7 44 SGB X</p>
                            <p className="text-sm text-gray-600">
                              Unabhaengig von der Frist kannst du einen Ueberpruefungsantrag stellen. Das Amt muss pruefen,
                              ob der Bescheid rechtswidrig war. Leistungen werden bis zu 1 Jahr rueckwirkend nachgezahlt.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Success hint when enough time */}
                  {ergebnis.tageVerbleibend > 7 && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-green-900">Du hast noch genuegend Zeit</h3>
                          <p className="text-sm text-green-800 mt-1">
                            Nutze die Zeit, um deinen Rechtsbehelf sorgfaeltig vorzubereiten. Wenn noetig, lege
                            zuerst fristwahrend einen formlosen Widerspruch ein und reiche die Begruendung nach.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Urgent hint */}
                  {ergebnis.tageVerbleibend > 0 && ergebnis.tageVerbleibend <= 3 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-red-900">Eile geboten!</h3>
                          <p className="text-sm text-red-800 mt-1">
                            Die Frist laeuft bald ab. Lege sofort einen formlosen Widerspruch ein, um die Frist zu wahren.
                            Die ausfuehrliche Begruendung kannst du nachreichen.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Eilantrag - no fixed deadline */
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-16 h-16 rounded-full bg-blue-500 shadow-lg ring-4 ring-blue-200" />
                  </div>
                  <div className="text-3xl font-bold text-blue-800 mb-2">Keine starre Frist</div>
                  <p className="text-lg text-gray-600">
                    Fuer den Eilantrag gibt es keine feste Frist. Handle aber so schnell wie moeglich,
                    da die Eilbeduerfnigkeit nachgewiesen werden muss.
                  </p>
                </div>
              )}

              {/* Legal Basis */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900">Rechtsgrundlage: {ergebnis.paragraph}</p>
                    <p className="text-sm text-blue-800 mt-1">Fristdauer: {ergebnis.fristDauer}</p>
                  </div>
                </div>
              </div>

              {/* Tips */}
              {ergebnis.tipps.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    Praktische Tipps
                  </h3>
                  <ul className="space-y-2">
                    {ergebnis.tipps.map((tipp, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-1" />
                        <span className="text-gray-700">{tipp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* PDF + Actions */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => {
                    generateRechnerPdf('Fristenberechnung (Sozialrecht)', [
                      { label: 'Art der Frist', value: fristOptionen.find(f => f.value === fristTyp)?.label || fristTyp },
                      { label: 'Bescheiddatum', value: bescheidDatum },
                      { label: 'Per Post', value: perPost ? 'Ja (+3 Tage)' : 'Nein' },
                      { label: 'Fristende', value: ergebnis.keineStarreFrist ? 'Keine starre Frist' : formatDatum(ergebnis.fristende), highlight: true },
                      { label: 'Tage verbleibend', value: ergebnis.keineStarreFrist ? '-' : `${ergebnis.tageVerbleibend}`, highlight: true },
                      { label: 'Rechtsgrundlage', value: ergebnis.paragraph },
                    ])
                  }}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />Als PDF
                </Button>
                <Button
                  onClick={() => shareResult({
                    title: 'Fristenberechnung',
                    text: `Fristenberechnung: ${ergebnis.keineStarreFrist ? 'Keine starre Frist' : `Fristende ${formatDatum(ergebnis.fristende)}, noch ${ergebnis.tageVerbleibend} Tage`}`,
                    url: window.location.href,
                  })}
                  variant="outline"
                  className="flex-1"
                >
                  <Share2 className="w-4 h-4 mr-2" />Teilen
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Zugangsfiktion</h3>
            </div>
            <p className="text-sm text-gray-600">
              Nach <strong>\u00a7 37 Abs. 2 SGB X</strong> gilt ein Brief als am dritten Tag nach Aufgabe zur Post
              zugegangen. Bei Zweifeln muss die Behoerde den Zugang beweisen.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Fristberechnung</h3>
            </div>
            <p className="text-sm text-gray-600">
              Nach <strong>\u00a7 64 SGG</strong> beginnt die Frist am Tag nach dem Zugang. Faellt das Fristende
              auf einen Samstag, Sonntag oder Feiertag, endet die Frist am naechsten Werktag.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Frist verpasst?</h3>
            </div>
            <p className="text-sm text-gray-600">
              <strong>Wiedereinsetzung</strong> (\u00a7 67 SGG) ist moeglich bei unverschuldeter Fristversaeumnis.
              Alternativ: <strong>Ueberpruefungsantrag</strong> nach \u00a7 44 SGB X - jederzeit moeglich,
              Nachzahlung bis 1 Jahr rueckwirkend.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
