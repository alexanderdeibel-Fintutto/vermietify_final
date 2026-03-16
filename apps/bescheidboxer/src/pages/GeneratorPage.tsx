import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import {
  FileText,
  ArrowLeft,
  Send,
  Download,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Scale,
  CreditCard,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { getTemplateById, SGB_CATEGORIES, type LetterType } from '@/lib/sgb-knowledge'
import { useCreditsContext } from '@/contexts/CreditsContext'
import { generateLetterPdf } from '@/lib/pdf-export'

export default function GeneratorPage() {
  useDocumentTitle('Dokumenten-Werkstatt - BescheidBoxer')
  const { templateId } = useParams<{ templateId: string }>()
  const { checkLetter } = useCreditsContext()

  const template = getTemplateById(templateId as LetterType)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [step, setStep] = useState<'form' | 'preview' | 'done'>('form')
  const [generatedLetter, setGeneratedLetter] = useState('')

  if (!template) {
    return (
      <div className="container py-16 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Vorlage nicht gefunden</h2>
        <Button variant="outline" asChild>
          <Link to="/musterschreiben">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurueck zu Musterschreiben
          </Link>
        </Button>
      </div>
    )
  }

  const categoryInfo = SGB_CATEGORIES[template.category]
  const requiredFieldsFilled = template.requiredFields
    .filter(f => f.required)
    .every(f => formData[f.id]?.trim())
  const totalFields = template.requiredFields.length
  const filledFields = template.requiredFields.filter(f => formData[f.id]?.trim()).length
  const progress = totalFields > 0 ? (filledFields / totalFields) * 100 : 0

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }))
  }

  const handleGenerate = () => {
    // Generate demo letter
    const letter = generateDemoLetter(template, formData)
    setGeneratedLetter(letter)
    setStep('preview')
  }

  const letterCheck = checkLetter()

  return (
    <div className="container py-8 max-w-4xl">
      {/* Back link */}
      <Link
        to="/musterschreiben"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurueck zu Musterschreiben
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant={template.category as 'sgb2' | 'sgb3' | 'sgb12' | 'kdu' | 'sgb10'}>
            {categoryInfo?.name}
          </Badge>
          <Badge variant="outline">{template.difficulty}</Badge>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{template.title}</h1>
        <p className="text-muted-foreground">{template.description}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Form / Preview */}
        <div className="md:col-span-2">
          {step === 'form' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Deine Angaben</CardTitle>
                  <span className="text-sm text-muted-foreground">{filledFields}/{totalFields} Felder</span>
                </div>
                <Progress value={progress} className="mt-2" />
              </CardHeader>
              <CardContent className="space-y-5">
                {template.requiredFields.map((field) => (
                  <div key={field.id}>
                    <Label htmlFor={field.id} className="mb-1.5 block">
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        id={field.id}
                        placeholder={field.placeholder}
                        value={formData[field.id] || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        rows={3}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        id={field.id}
                        value={formData[field.id] || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Bitte waehlen...</option>
                        {field.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        id={field.id}
                        type={field.type}
                        placeholder={field.placeholder}
                        value={formData[field.id] || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      />
                    )}
                    {field.helpText && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                        <Lightbulb className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        {field.helpText}
                      </p>
                    )}
                  </div>
                ))}

                <div className="pt-4 border-t border-border">
                  {letterCheck.cost > 0 && (
                    <div className="mb-4 p-3 rounded-lg bg-muted flex items-start gap-2">
                      <CreditCard className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Kosten: {letterCheck.cost.toFixed(2).replace('.', ',')} EUR</p>
                        <p className="text-xs text-muted-foreground">
                          {letterCheck.reason || 'Fuer die Erstellung des personalisierten Schreibens.'}
                        </p>
                      </div>
                    </div>
                  )}
                  <Button
                    onClick={handleGenerate}
                    disabled={!requiredFieldsFilled}
                    variant="amt"
                    size="lg"
                    className="w-full"
                  >
                    <FileText className="mr-2 h-5 w-5" />
                    Schreiben generieren
                    {letterCheck.cost > 0 && ` (${letterCheck.cost.toFixed(2).replace('.', ',')} EUR)`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'preview' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    Dein Schreiben ist fertig
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setStep('form')}>
                    Bearbeiten
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-white border border-border rounded-lg p-6 md:p-8 font-serif text-sm leading-relaxed whitespace-pre-wrap">
                  {generatedLetter}
                </div>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="amt"
                    size="lg"
                    className="flex-1"
                    onClick={() => generateLetterPdf(generatedLetter, template.title, categoryInfo?.name || '')}
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Als PDF herunterladen
                  </Button>
                  <Button variant="outline" size="lg" className="flex-1">
                    <Send className="mr-2 h-5 w-5" />
                    Per Post senden (1,99 EUR)
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Tipp: Sende den Widerspruch per Einschreiben oder gib ihn persoenlich ab!
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Legal Basis */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Scale className="h-4 w-4 text-primary" />
                Rechtsgrundlage
              </h3>
              <div className="space-y-1">
                {template.legalBasis.map((basis) => (
                  <div key={basis} className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                    {basis}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-warning" />
                Wichtige Tipps
              </h3>
              <ul className="space-y-2">
                {template.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Dieses Schreiben ersetzt keine Rechtsberatung. Bei komplexen Faellen empfehlen wir eine Beratung
                  beim Sozialverband oder einer Rechtsantragstelle.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* KI Chat Link */}
          <Card className="hover:border-primary/30 transition-colors">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-2">Fragen zu diesem Thema?</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Unser KI-Rechtsberater hilft dir, deine Situation besser zu verstehen.
              </p>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link to="/chat">KI-Berater fragen</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function generateDemoLetter(template: ReturnType<typeof getTemplateById>, data: Record<string, string>): string {
  if (!template) return ''

  const today = new Date().toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const name = data.name || '[Dein Name]'
  const bgNummer = data.bg_nummer || '[BG-Nummer]'
  const jobcenter = data.jobcenter || '[Jobcenter]'
  const bescheidDatum = data.bescheid_datum
    ? new Date(data.bescheid_datum).toLocaleDateString('de-DE')
    : '[Bescheiddatum]'

  let letterBody = ''

  switch (template.id) {
    case 'widerspruch_bescheid':
      letterBody = `${name}
[Deine Adresse]
[PLZ Ort]

${jobcenter}
[Adresse des Jobcenters]
[PLZ Ort]

${today}

Betreff: Widerspruch gegen Ihren Bescheid vom ${bescheidDatum}
BG-Nummer: ${bgNummer}

Sehr geehrte Damen und Herren,

hiermit lege ich gegen Ihren Bescheid vom ${bescheidDatum}, mir zugegangen am [Datum des Zugangs], fristgerecht

                    WIDERSPRUCH

ein.

Begruendung:
${data.grund || '[Deine Begruendung wird hier eingefuegt]'}

Ich bitte um Ueberpruefung des Bescheids und um Erlass eines rechtsmittelfaehigen Widerspruchsbescheids fuer den Fall, dass meinem Widerspruch nicht abgeholfen wird.

Vorsorglich beantrage ich die Aussetzung der sofortigen Vollziehung gemaess § 86a SGG.

Eine ausfuehrliche Begruendung behalte ich mir vor.

Mit freundlichen Gruessen

${name}`
      break

    case 'widerspruch_sanktion':
      const sanktionsgrund = data.sanktionsgrund === 'termin' ? 'Meldeversaeumnis'
        : data.sanktionsgrund === 'massnahme' ? 'Nichtantritt einer Massnahme'
        : data.sanktionsgrund === 'arbeit' ? 'Nichtannahme eines Arbeitsangebots'
        : data.sanktionsgrund === 'egv' ? 'Nichterfuellung der Eingliederungsvereinbarung'
        : 'den genannten Grund'

      letterBody = `${name}
[Deine Adresse]
[PLZ Ort]

${jobcenter}
[Adresse des Jobcenters]
[PLZ Ort]

${today}

Betreff: Widerspruch gegen Sanktionsbescheid vom ${bescheidDatum}
BG-Nummer: ${bgNummer}

Sehr geehrte Damen und Herren,

hiermit lege ich gegen Ihren Sanktionsbescheid vom ${bescheidDatum} wegen ${sanktionsgrund} fristgerecht

                    WIDERSPRUCH

ein.

Die Sanktion ist rechtswidrig aus folgendem Grund:
${data.wichtiger_grund || '[Begruendung]'}

Ich hatte einen wichtigen Grund im Sinne des § 31 Abs. 1 Satz 2 SGB II, der die Pflichtverletzung entschuldigt.

Ich weise darauf hin, dass nach der aktuellen Rechtslage (Buergergeld-Gesetz) Sanktionen auf maximal 30% des Regelsatzes begrenzt sind und die Kosten der Unterkunft nicht gekuerzt werden duerfen.

Ich beantrage:
1. Aufhebung des Sanktionsbescheids
2. Weiterzahlung der ungekürzten Leistungen
3. Nachzahlung bereits einbehaltener Betraege

Mit freundlichen Gruessen

${name}`
      break

    case 'ueberpruefungsantrag':
      letterBody = `${name}
[Deine Adresse]
[PLZ Ort]

${jobcenter}
[Adresse des Jobcenters]
[PLZ Ort]

${today}

Betreff: Ueberpruefungsantrag gemaess § 44 SGB X
BG-Nummer: ${bgNummer}
Bescheid vom: ${bescheidDatum}
Bewilligungszeitraum: ${data.zeitraum || '[Zeitraum]'}

Sehr geehrte Damen und Herren,

hiermit beantrage ich gemaess § 44 SGB X die Ueberpruefung Ihres Bescheids vom ${bescheidDatum} fuer den Bewilligungszeitraum ${data.zeitraum || '[Zeitraum]'}.

Der Bescheid ist rechtswidrig:
${data.grund || '[Begruendung]'}

Ich beantrage:
1. Ueberpruefung des genannten Bescheids
2. Abänderung zugunsten des Antragstellers
3. Nachzahlung der zu Unrecht vorenthaltenen Leistungen fuer den gesamten Zeitraum (bis zu 4 Jahre, § 44 Abs. 4 SGB X)

Mit freundlichen Gruessen

${name}`
      break

    case 'widerspruch_kdu': {
      const tatsaechlich = data.tatsaechliche_miete || '[tatsaechliche Miete]'
      const anerkannt = data.anerkannte_miete || '[anerkannte Miete]'
      const differenz = (Number(data.tatsaechliche_miete) - Number(data.anerkannte_miete)) || 0

      letterBody = `${name}
[Deine Adresse]
[PLZ Ort]

${jobcenter}
[Adresse des Jobcenters]
[PLZ Ort]

${today}

Betreff: Widerspruch gegen Bescheid vom ${bescheidDatum} - Kosten der Unterkunft
BG-Nummer: ${bgNummer}

Sehr geehrte Damen und Herren,

hiermit lege ich gegen Ihren Bescheid vom ${bescheidDatum} fristgerecht

                    WIDERSPRUCH

ein, soweit die Kosten der Unterkunft und Heizung nicht in tatsaechlicher Hoehe uebernommen werden.

Meine tatsaechlichen Unterkunftskosten betragen ${tatsaechlich} EUR monatlich (warm). In Ihrem Bescheid werden jedoch nur ${anerkannt} EUR anerkannt. Dies ergibt eine monatliche Unterdeckung von ${differenz > 0 ? differenz.toFixed(2) : '[...]'} EUR.

Die Kuerzung ist rechtswidrig:

1. Gemaess § 22 Abs. 1 Satz 1 SGB II sind die tatsaechlichen Aufwendungen fuer Unterkunft und Heizung zu uebernehmen, soweit sie angemessen sind.

2. Sofern die Kosten als unangemessen angesehen werden, sind die tatsaechlichen Kosten gemaess § 22 Abs. 1 Satz 3 SGB II solange zu uebernehmen, wie eine Senkung nicht moeglich oder zumutbar ist, laengstens jedoch fuer 6 Monate.

3. Das von Ihnen herangezogene Konzept zur Bestimmung der Angemessenheitsgrenze in ${data.wohnort || '[Wohnort]'} ist nicht schluessig im Sinne der Rechtsprechung des BSG (B 4 AS 18/09 R). Ohne schluessiges Konzept gelten die tatsaechlichen Kosten als Obergrenze.

4. Darueber hinaus ist auf dem aktuellen Wohnungsmarkt keine guenstigere vergleichbare Wohnung verfuegbar. Eine Kostensenkung ist daher nicht moeglich.

Ich beantrage:
1. Uebernahme der tatsaechlichen Kosten der Unterkunft und Heizung in Hoehe von ${tatsaechlich} EUR
2. Nachzahlung des einbehaltenen Differenzbetrags

Mit freundlichen Gruessen

${name}`
      break
    }

    case 'widerspruch_aufhebung':
      letterBody = `${name}
[Deine Adresse]
[PLZ Ort]

${jobcenter}
[Adresse des Jobcenters]
[PLZ Ort]

${today}

Betreff: Widerspruch gegen Aufhebungs- und Erstattungsbescheid vom ${bescheidDatum}
BG-Nummer: ${bgNummer}

Sehr geehrte Damen und Herren,

hiermit lege ich gegen Ihren Aufhebungs- und Erstattungsbescheid vom ${bescheidDatum} fristgerecht

                    WIDERSPRUCH

ein.

Die Aufhebung und die Erstattungsforderung in Hoehe von ${data.rueckforderung_hoehe || '[Betrag]'} EUR sind rechtswidrig:

${data.grund || '[Begruendung]'}

Ich mache insbesondere geltend:

1. Die Voraussetzungen des § 45 SGB X (Ruecknahme eines rechtswidrigen beguenstigenden VA) bzw. § 48 SGB X (Aufhebung wegen geaenderter Verhaeltnisse) liegen nicht vor.

2. Soweit § 45 SGB X herangezogen wird: Ich durfte auf den Bestand des Bescheids vertrauen (Vertrauensschutz). Die in § 45 Abs. 2 SGB X genannten Ausnahmen liegen nicht vor.

3. Die Jahresfrist des § 45 Abs. 4 Satz 2 SGB X wurde nicht eingehalten.

4. Hilfsweise beantrage ich den Erlass der Erstattungsforderung gemaess § 44 SGB II, da die Einziehung fuer mich eine besondere Haerte darstellen wuerde.

Vorsorglich beantrage ich die Aussetzung der sofortigen Vollziehung.

Mit freundlichen Gruessen

${name}`
      break

    case 'widerspruch_rueckforderung':
      letterBody = `${name}
[Deine Adresse]
[PLZ Ort]

${jobcenter}
[Adresse des Jobcenters]
[PLZ Ort]

${today}

Betreff: Widerspruch gegen Erstattungsbescheid vom ${bescheidDatum}
BG-Nummer: ${bgNummer}
Erstattungsforderung: ${data.forderung_hoehe || '[Betrag]'} EUR

Sehr geehrte Damen und Herren,

hiermit lege ich gegen Ihren Erstattungsbescheid vom ${bescheidDatum} ueber ${data.forderung_hoehe || '[Betrag]'} EUR fristgerecht

                    WIDERSPRUCH

ein.

Die Erstattungsforderung ist rechtswidrig:

${data.grund || '[Begruendung]'}

Ich beanstande insbesondere:

1. Der zugrundeliegende Aufhebungsbescheid ist selbst rechtswidrig (siehe oben).
2. Die Berechnung der Erstattungsforderung ist fehlerhaft.
3. Hilfsweise beantrage ich den vollstaendigen Erlass der Erstattungsforderung gemaess § 44 SGB II, da die Einziehung eine besondere Haerte darstellt.
4. Hoechst hilfsweise beantrage ich eine Ratenzahlung in Hoehe von maximal 10% des Regelsatzes.

Ich weise darauf hin, dass eine Aufrechnung mit laufenden Leistungen gemaess § 43 SGB II maximal 30% des Regelsatzes betragen darf.

Vorsorglich beantrage ich die Aussetzung der sofortigen Vollziehung gemaess § 86a SGG.

Mit freundlichen Gruessen

${name}`
      break

    case 'antrag_mehrbedarf': {
      const artMap: Record<string, string> = {
        alleinerziehend: 'Alleinerziehend (§ 21 Abs. 3 SGB II)',
        schwanger: 'Schwangerschaft ab der 13. Woche (§ 21 Abs. 2 SGB II)',
        behinderung: 'Behinderung mit Merkzeichen G/aG (§ 21 Abs. 4 SGB II)',
        ernaehrung: 'Kostenaufwaendige Ernaehrung (§ 21 Abs. 5 SGB II)',
        warmwasser: 'Dezentrale Warmwassererzeugung (§ 21 Abs. 7 SGB II)',
        unabweisbar: 'Unabweisbarer laufender Mehrbedarf (§ 21 Abs. 6 SGB II)',
      }
      const artText = artMap[data.mehrbedarf_art] || data.mehrbedarf_art || '[Art des Mehrbedarfs]'

      letterBody = `${name}
[Deine Adresse]
[PLZ Ort]

${jobcenter}
[Adresse des Jobcenters]
[PLZ Ort]

${today}

Betreff: Antrag auf Anerkennung eines Mehrbedarfs
BG-Nummer: ${bgNummer}

Sehr geehrte Damen und Herren,

hiermit beantrage ich die Anerkennung eines Mehrbedarfs nach § 21 SGB II.

Art des Mehrbedarfs: ${artText}

Begruendung:
${data.begruendung || '[Begruendung]'}

Ich bitte um schriftliche Bescheidung meines Antrags. Sofern dem Antrag nicht entsprochen wird, bitte ich um Erlass eines rechtsmittelfaehigen Bescheids.

Anlagen:
- [ggf. aerztliches Attest]
- [ggf. Nachweise]

Mit freundlichen Gruessen

${name}`
      break
    }

    case 'antrag_einmalige_leistung': {
      const leistungMap: Record<string, string> = {
        erstausstattung_wohnung: 'Erstausstattung fuer die Wohnung (§ 24 Abs. 3 Nr. 1 SGB II)',
        erstausstattung_kleidung: 'Erstausstattung fuer Bekleidung (§ 24 Abs. 3 Nr. 2 SGB II)',
        erstausstattung_schwangerschaft: 'Erstausstattung bei Schwangerschaft/Geburt (§ 24 Abs. 3 Nr. 2 SGB II)',
        reparatur: 'Ersatzbeschaffung/Reparatur notwendiger Geraete',
        klassenfahrt: 'Klassenfahrt/Schulausflug (§ 28 Abs. 2 SGB II)',
        sonstiges: 'Sonstige einmalige Leistung',
      }
      const leistungText = leistungMap[data.leistung_art] || '[Art der Leistung]'

      letterBody = `${name}
[Deine Adresse]
[PLZ Ort]

${jobcenter}
[Adresse des Jobcenters]
[PLZ Ort]

${today}

Betreff: Antrag auf einmalige Leistung gemaess § 24 Abs. 3 SGB II
BG-Nummer: ${bgNummer}

Sehr geehrte Damen und Herren,

hiermit beantrage ich die Gewaehrung einer einmaligen Leistung:

Art: ${leistungText}

Begruendung:
${data.begruendung || '[Was wird benoetigt und warum]'}

Die Anschaffung kann nicht aus dem Regelsatz finanziert werden, da dieser nur den laufenden Lebensbedarf deckt und keine Ansparmoeglichkeit fuer groessere Anschaffungen bietet (BSG, Urteil vom 20.08.2009, B 14 AS 45/08 R).

Ich bitte um Gewaehrung als Geldleistung gemaess § 24 Abs. 3 Satz 5 SGB II, da ich die Anschaffung selbst guenstiger taetigen kann.

Sofern dem Antrag nicht entsprochen wird, bitte ich um Erlass eines rechtsmittelfaehigen Bescheids.

Anlagen:
- [ggf. Fotos defekter Geraete]
- [ggf. Kostenvoranschlaege]

Mit freundlichen Gruessen

${name}`
      break
    }

    case 'antrag_weiterbewilligung':
      letterBody = `${name}
[Deine Adresse]
[PLZ Ort]

${jobcenter}
[Adresse des Jobcenters]
[PLZ Ort]

${today}

Betreff: Antrag auf Weiterbewilligung von Leistungen nach dem SGB II
BG-Nummer: ${bgNummer}
Aktueller Bewilligungszeitraum endet: ${data.bewilligungsende ? new Date(data.bewilligungsende).toLocaleDateString('de-DE') : '[Datum]'}

Sehr geehrte Damen und Herren,

hiermit beantrage ich die Weiterbewilligung von Leistungen zur Sicherung des Lebensunterhalts nach dem SGB II ab dem ${data.bewilligungsende ? new Date(new Date(data.bewilligungsende).getTime() + 86400000).toLocaleDateString('de-DE') : '[Datum]'}.

Meine Beduerftigkeit besteht unveraendert fort.

${data.aenderungen ? `Folgende Aenderungen sind eingetreten:\n${data.aenderungen}` : 'Es sind keine wesentlichen Aenderungen in meinen Verhaeltnissen eingetreten.'}

Ich bitte um rechtzeitige Bescheidung vor Ablauf des aktuellen Bewilligungszeitraums, um eine lueckenlose Leistungsgewaehrung sicherzustellen.

Mit freundlichen Gruessen

${name}`
      break

    case 'eilantrag_sozialgericht':
      letterBody = `${name}
${data.adresse || '[Deine Adresse]'}

An das
${data.sozialgericht || 'Sozialgericht [Stadt]'}
[Adresse des Sozialgerichts]

${today}

Antrag auf Erlass einer einstweiligen Anordnung
gemaess § 86b Abs. 2 SGG

Antragsteller: ${name}, wohnhaft ${data.adresse || '[Adresse]'}

Antragsgegner: ${data.jobcenter || '[Jobcenter]'}, [Adresse]

Ich beantrage,

den Antragsgegner im Wege der einstweiligen Anordnung zu verpflichten, mir vorlaeufig Leistungen zur Sicherung des Lebensunterhalts nach dem SGB II in gesetzlicher Hoehe zu gewaehren.

I. Sachverhalt:

${data.sachverhalt || '[Sachverhalt]'}

II. Anordnungsanspruch:

Mir stehen Leistungen nach dem SGB II zu. [Begruendung]

III. Anordnungsgrund (Eilbeduerfnis):

${data.notlage || '[Notlage beschreiben]'}

Die Eilbeduerfigkeit ergibt sich daraus, dass ich ohne die Leistungen meinen Lebensunterhalt nicht sicherstellen kann. Es droht eine Notlage, die den Erlass einer einstweiligen Anordnung rechtfertigt.

IV. Prozesskostenhilfe:

Gleichzeitig beantrage ich die Bewilligung von Prozesskostenhilfe unter Beiordnung eines Rechtsanwalts, da ich nicht in der Lage bin, die Kosten der Prozessfuehrung aufzubringen.

Anlagen:
- Ablehnungsbescheid / streitiger Bescheid
- Widerspruch (falls eingelegt)
- Nachweis der Notlage
- PKH-Erklaerung ueber die persoenlichen und wirtschaftlichen Verhaeltnisse

${name}`
      break

    case 'akteneinsicht':
      letterBody = `${name}
[Deine Adresse]
[PLZ Ort]

${jobcenter}
[Adresse des Jobcenters]
[PLZ Ort]

${today}

Betreff: Antrag auf Akteneinsicht gemaess § 25 SGB X
BG-Nummer: ${bgNummer}

Sehr geehrte Damen und Herren,

hiermit beantrage ich gemaess § 25 Abs. 1 SGB X Einsicht in meine vollstaendige Leistungsakte.

Ich bitte um einen Termin zur Akteneinsicht in Ihren Raeumlichkeiten. Alternativ bitte ich um Uebersendung von Kopien der vollstaendigen Akte an meine oben genannte Adresse.

Gemaess § 25 Abs. 5 SGB X bin ich bereit, die anfallenden Kopierkosten zu uebernehmen. Ich bitte jedoch um vorherige Mitteilung der voraussichtlichen Kosten.

Ich bitte um Erledigung innerhalb von 2 Wochen.

Mit freundlichen Gruessen

${name}`
      break

    case 'beschwerde_sachbearbeiter':
      letterBody = `${name}
[Deine Adresse]
[PLZ Ort]

${jobcenter}
- Geschaeftsfuehrung / Teamleitung -
[Adresse des Jobcenters]
[PLZ Ort]

${today}

Betreff: Dienstaufsichtsbeschwerde
BG-Nummer: ${bgNummer}
${data.sachbearbeiter ? `Betroffener Sachbearbeiter: ${data.sachbearbeiter}` : ''}

Sehr geehrte Damen und Herren,

hiermit erhebe ich Dienstaufsichtsbeschwerde gemaess Art. 17 GG (Petitionsrecht) ueber folgenden Vorfall:

${data.vorfall || '[Beschreibung des Vorfalls]'}

Ich bitte um:
1. Pruefung des Sachverhalts
2. Schriftliche Stellungnahme zu meiner Beschwerde
3. Ggf. Sicherstellung, dass sich ein derartiger Vorfall nicht wiederholt

Ich behalte mir vor, bei ausbleibender oder unbefriedigender Reaktion weitere Schritte einzuleiten (Petition beim Landtag, Buergerbeauftragter).

Ich bitte um Bestaetigung des Eingangs dieser Beschwerde und um Bearbeitung innerhalb von 4 Wochen.

Mit freundlichen Gruessen

${name}`
      break

    case 'fristverlängerung':
      letterBody = `${name}
[Deine Adresse]
[PLZ Ort]

${jobcenter}
[Adresse des Jobcenters]
[PLZ Ort]

${today}

Betreff: Antrag auf Fristverlaengerung
BG-Nummer: ${bgNummer}

Sehr geehrte Damen und Herren,

hiermit beantrage ich eine Verlaengerung der mir gesetzten Frist bezueglich:

${data.frist_bezug || '[Bezug zur Frist]'}

Begruendung:
${data.grund || '[Begruendung]'}

Ich bitte um Gewaehrung einer angemessenen Nachfrist von mindestens 2 Wochen.

Mit freundlichen Gruessen

${name}`
      break

    case 'antrag_umzug': {
      const umzugsgrundMap: Record<string, string> = {
        aufforderung: 'Kostensenkungsaufforderung durch das Jobcenter',
        kuendigung: 'Kuendigung durch den Vermieter',
        gesundheit: 'Gesundheitliche Gruende',
        familie: 'Familiaere Gruende (z.B. Nachwuchs)',
        arbeit: 'Arbeitsaufnahme in anderer Stadt',
        gewalt: 'Haeusliche Gewalt',
        sonstiges: 'Sonstige Gruende',
      }
      const grund = umzugsgrundMap[data.umzugsgrund] || '[Umzugsgrund]'

      letterBody = `${name}
[Deine Adresse]
[PLZ Ort]

${jobcenter}
[Adresse des Jobcenters]
[PLZ Ort]

${today}

Betreff: Antrag auf Zusicherung der Kostenuebernahme fuer eine neue Wohnung gemaess § 22 Abs. 4 SGB II
sowie Antrag auf Uebernahme der Umzugskosten gemaess § 22 Abs. 6 SGB II
BG-Nummer: ${bgNummer}

Sehr geehrte Damen und Herren,

hiermit beantrage ich die Zusicherung zur Uebernahme der Aufwendungen fuer die nachfolgend bezeichnete Wohnung sowie die Uebernahme der Umzugskosten.

Neue Wohnung:
Adresse: ${data.neue_adresse || '[Adresse]'}
Warmmiete: ${data.neue_miete || '[Miete]'} EUR monatlich

Grund des Umzugs: ${grund}

Der Umzug ist notwendig und die Kosten der neuen Unterkunft sind angemessen im Sinne des § 22 SGB II.

Ich beantrage:
1. Zusicherung der Uebernahme der Mietkosten fuer die neue Wohnung
2. Uebernahme der Umzugskosten (Umzugswagen, Helfer)
3. Uebernahme einer ggf. anfallenden Mietkaution als Darlehen gemaess § 22 Abs. 6 SGB II

Ich bitte um zeitnahe Bearbeitung, da der Vermieter eine Zusage benoetigt.

Mit freundlichen Gruessen

${name}`
      break
    }

    default:
      letterBody = `${name}
[Deine Adresse]
[PLZ Ort]

${jobcenter}
[Adresse des Jobcenters]
[PLZ Ort]

${today}

Betreff: ${template.title}
BG-Nummer: ${bgNummer}

Sehr geehrte Damen und Herren,

[Der Inhalt wird basierend auf Ihren Angaben generiert]

Rechtsgrundlagen: ${template.legalBasis.join(', ')}

Mit freundlichen Gruessen

${name}`
  }

  return letterBody
}
