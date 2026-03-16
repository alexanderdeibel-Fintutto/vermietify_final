import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Swords,
  ArrowRight,
  ArrowLeft,
  ScanSearch,
  MessageCircle,
  Calculator,
  FileText,
  ClipboardList,
  CheckCircle2,
  Sparkles,
  User,
  Shield,
  PartyPopper,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const TOTAL_STEPS = 4

const SITUATION_OPTIONS = [
  { id: 'bescheid', label: 'Bescheid erhalten & unsicher', icon: ScanSearch },
  { id: 'sanktion', label: 'Sanktion oder Kuerzung', icon: Shield },
  { id: 'umzug', label: 'Umzug geplant oder noetig', icon: ClipboardList },
  { id: 'erstausstattung', label: 'Erstausstattung beantragen', icon: FileText },
]

const FEATURE_CARDS = [
  {
    to: '/scan',
    icon: ScanSearch,
    title: 'BescheidScan',
    description: 'Lade deinen Bescheid hoch — unsere KI findet Fehler in Sekunden.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    to: '/chat',
    icon: MessageCircle,
    title: 'KI-Rechtsberater',
    description: 'Stelle Fragen zu Buergergeld, Sanktionen, KdU und mehr.',
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    to: '/rechner',
    icon: Calculator,
    title: 'Rechner-Suite',
    description: '10 Rechner fuer Buergergeld, Mehrbedarf, Fristen und mehr.',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
  {
    to: '/musterschreiben',
    icon: Swords,
    title: 'Musterschreiben',
    description: 'Widersprueche, Antraege und Schreiben per Klick erstellen.',
    color: 'text-red-500',
    bg: 'bg-red-500/10',
  },
  {
    to: '/tracker',
    icon: ClipboardList,
    title: 'Widerspruch-Tracker',
    description: 'Behalte Fristen und den Status deiner Widersprueche im Blick.',
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10',
  },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [receivesBuergergeld, setReceivesBuergergeld] = useState<boolean | null>(null)
  const [situations, setSituations] = useState<string[]>([])

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const handleComplete = () => {
    localStorage.setItem('bescheidboxer_onboarding_done', 'true')
    if (name.trim()) {
      localStorage.setItem('bescheidboxer_user_name', name.trim())
    }
    navigate('/dashboard')
  }

  const toggleSituation = (id: string) => {
    setSituations(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const progressPercent = ((step + 1) / TOTAL_STEPS) * 100

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress Header */}
      <div className="container max-w-2xl pt-8 px-4">
        <div className="flex items-center gap-2 mb-2">
          <Swords className="h-6 w-6 text-primary" />
          <span className="font-bold gradient-text-boxer text-lg">BescheidBoxer</span>
          <span className="ml-auto text-sm text-muted-foreground">
            Schritt {step + 1} von {TOTAL_STEPS}
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full gradient-boxer rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 container max-w-2xl py-8 px-4 flex flex-col">
        {/* ---------------------------------------------------------------- */}
        {/* Step 1: Willkommen                                               */}
        {/* ---------------------------------------------------------------- */}
        <div
          className={`flex-1 flex flex-col transition-all duration-400 ease-out ${
            step === 0
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4 pointer-events-none absolute'
          }`}
        >
          {step === 0 && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl gradient-boxer mb-4">
                  <Swords className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold mb-3">
                  Willkommen bei BescheidBoxer!
                </h1>
                <p className="text-muted-foreground text-lg leading-relaxed max-w-lg mx-auto">
                  Dein KI-Assistent fuer Buergergeld &amp; Sozialrecht.
                  Wir helfen dir, deine Rechte durchzusetzen.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-8">
                {[
                  { icon: MessageCircle, label: 'KI-Berater', desc: 'Fragen beantworten' },
                  { icon: ScanSearch, label: 'BescheidScan', desc: 'Fehler finden' },
                  { icon: Calculator, label: 'Rechner', desc: 'Ansprueche berechnen' },
                  { icon: FileText, label: 'Musterschreiben', desc: 'Widersprueche erstellen' },
                ].map((feature) => (
                  <div
                    key={feature.label}
                    className="flex items-center gap-3 rounded-xl border border-border p-3 bg-card"
                  >
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <feature.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{feature.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Wie heisst du? (optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="z.B. Max"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <p className="text-xs text-muted-foreground">
                  Damit wir dich persoenlich ansprechen koennen.
                </p>
              </div>
            </>
          )}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Step 2: Deine Situation                                          */}
        {/* ---------------------------------------------------------------- */}
        <div
          className={`flex-1 flex flex-col transition-all duration-400 ease-out ${
            step === 1
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4 pointer-events-none absolute'
          }`}
        >
          {step === 1 && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Deine Situation</h2>
                  <p className="text-muted-foreground">
                    Damit wir dir passende Empfehlungen geben koennen.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Buergergeld question */}
                <div>
                  <p className="text-sm font-medium mb-3">
                    Beziehst du aktuell Buergergeld (SGB II)?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setReceivesBuergergeld(true)}
                      className={`flex-1 p-4 rounded-xl border-2 text-center font-medium transition-all ${
                        receivesBuergergeld === true
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      Ja
                    </button>
                    <button
                      onClick={() => setReceivesBuergergeld(false)}
                      className={`flex-1 p-4 rounded-xl border-2 text-center font-medium transition-all ${
                        receivesBuergergeld === false
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      Nein / Noch nicht
                    </button>
                  </div>
                </div>

                {/* Current issues */}
                <div>
                  <p className="text-sm font-medium mb-3">
                    Hast du gerade ein konkretes Anliegen? (Mehrfachauswahl)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SITUATION_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => toggleSituation(option.id)}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                          situations.includes(option.id)
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/40'
                        }`}
                      >
                        <option.icon className={`h-5 w-5 shrink-0 ${
                          situations.includes(option.id) ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                        <span className="font-medium text-sm">{option.label}</span>
                        {situations.includes(option.id) && (
                          <CheckCircle2 className="h-5 w-5 text-primary ml-auto shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Step 3: Schnellstart                                             */}
        {/* ---------------------------------------------------------------- */}
        <div
          className={`flex-1 flex flex-col transition-all duration-400 ease-out ${
            step === 2
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4 pointer-events-none absolute'
          }`}
        >
          {step === 2 && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-primary/10">
                  <ArrowRight className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Schnellstart</h2>
                  <p className="text-muted-foreground">
                    Entdecke die wichtigsten Funktionen von BescheidBoxer.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {FEATURE_CARDS.map((feature) => (
                  <Link
                    key={feature.to}
                    to={feature.to}
                    className="flex items-center gap-4 rounded-xl border border-border p-4 bg-card hover:border-primary/40 hover:shadow-sm transition-all group"
                  >
                    <div className={`p-3 rounded-xl ${feature.bg} shrink-0`}>
                      <feature.icon className={`h-5 w-5 ${feature.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{feature.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Step 4: Fertig                                                   */}
        {/* ---------------------------------------------------------------- */}
        <div
          className={`flex-1 flex flex-col transition-all duration-400 ease-out ${
            step === 3
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4 pointer-events-none absolute'
          }`}
        >
          {step === 3 && (
            <>
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
                  <PartyPopper className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-3xl font-bold mb-3">
                  {name.trim() ? `Alles klar, ${name.trim()}!` : 'Alles klar!'}
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed max-w-md mb-2">
                  Du bist bereit, deine Rechte durchzusetzen.
                  BescheidBoxer steht dir ab jetzt zur Seite.
                </p>

                {situations.length > 0 && (
                  <div className="mt-4 mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20 max-w-md">
                    <p className="text-sm font-medium text-primary mb-2 flex items-center justify-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Basierend auf deiner Situation empfehlen wir:
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {situations.includes('bescheid') && (
                        <Link to="/scan">
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 text-xs font-medium">
                            <ScanSearch className="h-3 w-3" />
                            Bescheid scannen
                          </span>
                        </Link>
                      )}
                      {situations.includes('sanktion') && (
                        <Link to="/chat">
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 text-xs font-medium">
                            <MessageCircle className="h-3 w-3" />
                            KI-Berater fragen
                          </span>
                        </Link>
                      )}
                      {situations.includes('umzug') && (
                        <Link to="/rechner">
                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-3 py-1 text-xs font-medium">
                            <Calculator className="h-3 w-3" />
                            Umzugskosten berechnen
                          </span>
                        </Link>
                      )}
                      {situations.includes('erstausstattung') && (
                        <Link to="/musterschreiben">
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-3 py-1 text-xs font-medium">
                            <FileText className="h-3 w-3" />
                            Antrag erstellen
                          </span>
                        </Link>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  size="lg"
                  onClick={handleComplete}
                  className="gap-2 mt-4"
                >
                  Zum Dashboard
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </>
          )}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Navigation Footer                                                */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === 0}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurueck
          </Button>

          {step < TOTAL_STEPS - 1 ? (
            <Button variant="amt" onClick={handleNext} className="gap-2">
              Weiter
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="amt" onClick={handleComplete} className="gap-2">
              Abschliessen
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
