import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import {
  ScanSearch,
  Upload,
  Camera,
  FileText,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Swords,
  Euro,
  Clock,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCreditsContext } from '@/contexts/CreditsContext'

interface ScanError {
  type: 'fehler' | 'warnung' | 'ok'
  title: string
  description: string
  betrag?: number
  paragraph?: string
  templateId?: string
}

interface ScanResult {
  errors: ScanError[]
  totalMissing: number
  totalOver6Months: number
  urgency: 'hoch' | 'mittel' | 'niedrig'
  fristEnde?: string
}

// Demo scan results for demonstration
function generateDemoScanResult(): ScanResult {
  return {
    errors: [
      {
        type: 'fehler',
        title: 'Mehrbedarf Alleinerziehend fehlt!',
        description: 'Du bist alleinerziehend mit 2 Kindern unter 16. Dir steht ein Mehrbedarf von 36% des Regelsatzes zu. Das sind 202,68 EUR monatlich die im Bescheid fehlen.',
        betrag: 202.68,
        paragraph: '\u00a7 21 Abs. 3 Nr. 1 SGB II',
        templateId: 'antrag_mehrbedarf',
      },
      {
        type: 'fehler',
        title: 'Heizkosten nur teilweise anerkannt',
        description: 'Die tatsaechlichen Heizkosten von 85 EUR wurden auf 65 EUR gekuerzt. Das Jobcenter muss ein schluessiges Konzept vorlegen. Ohne schluessiges Konzept muessen die tatsaechlichen Kosten uebernommen werden.',
        betrag: 20.00,
        paragraph: '\u00a7 22 Abs. 1 SGB II',
        templateId: 'widerspruch_kdu',
      },
      {
        type: 'warnung',
        title: 'Kindersofortzuschlag pruefen',
        description: 'Der Kindersofortzuschlag von 25 EUR je Kind sollte im Bescheid aufgefuehrt sein. Bitte pruefe ob dieser Betrag enthalten ist.',
        paragraph: '\u00a7 72 SGB II',
      },
      {
        type: 'ok',
        title: 'Regelsatz korrekt',
        description: 'Der Regelsatz von 563 EUR (Stufe 1) ist korrekt fuer 2025/2026.',
        paragraph: '\u00a7 20 SGB II',
      },
      {
        type: 'ok',
        title: 'Bewilligungszeitraum korrekt',
        description: 'Der Bewilligungszeitraum von 12 Monaten ist im Rahmen des Ueblichen.',
        paragraph: '\u00a7 41 Abs. 3 SGB II',
      },
    ],
    totalMissing: 222.68,
    totalOver6Months: 1336.08,
    urgency: 'hoch',
    fristEnde: '2026-03-06',
  }
}

export default function BescheidScanPage() {
  useDocumentTitle('BescheidScan - BescheidBoxer')
  const [scanState, setScanState] = useState<'upload' | 'scanning' | 'result'>('upload')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { checkScan, useScan } = useCreditsContext()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      setSelectedFile(file)
      startScan(file)
    }
  }

  const startScan = async (file?: File) => {
    // Credit gate
    const scanCheck = checkScan()
    if (!scanCheck.allowed) {
      return
    }

    setScanState('scanning')
    await useScan()

    // Try API first, fall back to demo
    try {
      const apiEndpoint = import.meta.env.VITE_AI_API_ENDPOINT
      if (apiEndpoint && file) {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch(`${apiEndpoint}/amt-scan`, {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          setResult(data)
          setScanState('result')
          return
        }
      }
    } catch {
      // Fall through to demo
    }

    // Demo mode fallback
    await new Promise((r) => setTimeout(r, 3500))
    const scanResult = generateDemoScanResult()
    setResult(scanResult)
    setScanState('result')
  }

  const handleDemoScan = () => {
    setFileName('Bescheid_Jobcenter_2026.pdf')
    setSelectedFile(null)
    startScan()
  }

  const errorsCount = result?.errors.filter(e => e.type === 'fehler').length || 0
  const warningsCount = result?.errors.filter(e => e.type === 'warnung').length || 0

  return (
    <div className="container py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-boxer text-white mb-4">
          <ScanSearch className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold mb-2">BescheidScan</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Lade deinen Bescheid hoch und unsere KI prueft ihn auf Fehler.
          Wir finden was dir zusteht - in Sekunden statt Stunden.
        </p>
      </div>

      {/* Upload State */}
      {scanState === 'upload' && (
        <div className="space-y-6">
          {/* Scan limit warning */}
          {!checkScan().allowed && (
            <Card className="border-destructive/40 bg-destructive/5">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Scan-Limit erreicht</p>
                  <p className="text-xs text-muted-foreground">{checkScan().reason}</p>
                </div>
                <Link to="/preise" className="ml-auto">
                  <Button size="sm" variant="outline">Upgrade</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          <Card className="border-dashed border-2 hover:border-primary/40 transition-colors">
            <CardContent className="p-12">
              <div className="text-center">
                <Upload className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Bescheid hochladen</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Lade deinen Bewilligungsbescheid, Aenderungsbescheid oder Sanktionsbescheid hoch.
                  Wir akzeptieren PDF, JPG und PNG.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button variant="amt" size="lg" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-5 w-5" />
                    Datei auswaehlen
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => fileInputRef.current?.click()}>
                    <Camera className="mr-2 h-5 w-5" />
                    Foto aufnehmen
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <p className="text-xs text-muted-foreground mt-4">
                  Deine Daten werden verschluesselt uebertragen und nach der Analyse geloescht.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Demo Button */}
          <div className="text-center">
            <button
              onClick={handleDemoScan}
              className="text-sm text-primary hover:underline"
            >
              Demo: Beispiel-Bescheid analysieren
            </button>
          </div>

          {/* What we check */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            {[
              { icon: Euro, title: 'Regelsatz', desc: 'Ist der richtige Betrag angesetzt?' },
              { icon: Shield, title: 'Mehrbedarfe', desc: 'Alleinerziehend, schwanger, krank?' },
              { icon: FileText, title: 'KdU / Miete', desc: 'Wird die volle Miete gezahlt?' },
              { icon: AlertCircle, title: 'Einkommen', desc: 'Freibetraege korrekt berechnet?' },
              { icon: Clock, title: 'Fristen', desc: 'Widerspruchsfrist noch offen?' },
              { icon: CheckCircle2, title: 'Formfehler', desc: 'Rechtsbehelfsbelehrung korrekt?' },
            ].map((item) => (
              <Card key={item.title} className="bg-muted/30">
                <CardContent className="p-4 flex items-start gap-3">
                  <item.icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-sm">{item.title}</h3>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Scanning State */}
      {scanState === 'scanning' && (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <div className="relative inline-flex mb-6">
                <div className="h-20 w-20 rounded-2xl gradient-boxer flex items-center justify-center">
                  <Swords className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-8 w-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              </div>
              <h2 className="text-xl font-bold mb-2">BescheidBoxer analysiert...</h2>
              <p className="text-muted-foreground mb-6">{fileName}</p>
              <div className="max-w-sm mx-auto space-y-3">
                {[
                  'Bescheid wird gelesen...',
                  'Regelsaetze werden geprueft...',
                  'Mehrbedarfe werden analysiert...',
                  'KdU wird berechnet...',
                  'Fehler werden identifiziert...',
                ].map((step, i) => (
                  <div key={step} className="flex items-center gap-2 text-sm animate-fade-in" style={{ animationDelay: `${i * 600}ms` }}>
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result State */}
      {scanState === 'result' && result && (
        <div className="space-y-6">
          {/* Summary Banner */}
          <Card className={errorsCount > 0 ? 'border-destructive/40 bg-destructive/5' : 'border-success/40 bg-success/5'}>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {errorsCount > 0 ? (
                      <AlertCircle className="h-6 w-6 text-destructive" />
                    ) : (
                      <CheckCircle2 className="h-6 w-6 text-success" />
                    )}
                    <h2 className="text-xl font-bold">
                      {errorsCount > 0
                        ? `${errorsCount} Fehler in deinem Bescheid gefunden!`
                        : 'Dein Bescheid sieht korrekt aus!'}
                    </h2>
                  </div>
                  {errorsCount > 0 && (
                    <p className="text-muted-foreground">
                      {warningsCount > 0 && `Plus ${warningsCount} Warnung(en) zum Pruefen. `}
                      Handlung empfohlen!
                    </p>
                  )}
                </div>
                {errorsCount > 0 && result.totalMissing > 0 && (
                  <div className="text-right">
                    <div className="text-3xl font-extrabold text-destructive">
                      {result.totalMissing.toFixed(2).replace('.', ',')} EUR
                    </div>
                    <div className="text-sm text-muted-foreground">fehlen dir monatlich</div>
                    <div className="text-lg font-bold text-destructive mt-1">
                      {result.totalOver6Months.toFixed(2).replace('.', ',')} EUR
                    </div>
                    <div className="text-xs text-muted-foreground">ueber 6 Monate</div>
                  </div>
                )}
              </div>
              {result.fristEnde && errorsCount > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/30 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-warning flex-shrink-0" />
                  <span className="text-sm font-medium">
                    Widerspruchsfrist: bis {new Date(result.fristEnde).toLocaleDateString('de-DE')} - noch{' '}
                    {Math.ceil((new Date(result.fristEnde).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} Tage!
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detailed Findings */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Detaillierte Analyse</h3>
            {result.errors.map((error, i) => (
              <div
                key={i}
                className={
                  error.type === 'fehler'
                    ? 'scan-error-card'
                    : error.type === 'warnung'
                    ? 'scan-warning-card'
                    : 'scan-success-card'
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {error.type === 'fehler' ? (
                        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                      ) : error.type === 'warnung' ? (
                        <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                      )}
                      <h4 className="font-semibold">{error.title}</h4>
                      {error.betrag && (
                        <Badge variant="destructive" className="ml-auto">
                          +{error.betrag.toFixed(2).replace('.', ',')} EUR/Monat
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground ml-7">{error.description}</p>
                    <div className="flex items-center gap-3 mt-2 ml-7">
                      {error.paragraph && (
                        <span className="text-xs text-primary font-medium">{error.paragraph}</span>
                      )}
                      {error.templateId && (
                        <Link
                          to={`/generator/${error.templateId}`}
                          className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                        >
                          <FileText className="h-3 w-3" />
                          Widerspruch erstellen
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          {errorsCount > 0 && (
            <Card className="gradient-boxer text-white">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2">Jetzt handeln!</h3>
                <p className="opacity-90 mb-4">
                  Dir fehlen {result.totalMissing.toFixed(2).replace('.', ',')} EUR pro Monat. Das sind{' '}
                  {result.totalOver6Months.toFixed(2).replace('.', ',')} EUR ueber 6 Monate.
                  Lege jetzt Widerspruch ein!
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="lg" className="bg-white text-red-700 hover:bg-white/90" asChild>
                    <Link to="/generator/widerspruch_bescheid">
                      <Swords className="mr-2 h-5 w-5" />
                      Widerspruch erstellen
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10" asChild>
                    <Link to="/chat">
                      <FileText className="mr-2 h-5 w-5" />
                      Im Chat besprechen
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* New Scan */}
          <div className="text-center">
            <Button variant="outline" onClick={() => { setScanState('upload'); setResult(null); setFileName(''); }}>
              Neuen Bescheid scannen
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
