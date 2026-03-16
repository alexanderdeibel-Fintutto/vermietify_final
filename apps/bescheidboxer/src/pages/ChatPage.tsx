import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import {
  Send,
  Swords,
  Lightbulb,
  FileText,
  AlertCircle,
  ArrowRight,
  Loader2,
  ScanSearch,
  Calculator,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCreditsContext } from '@/contexts/CreditsContext'
import { LETTER_TEMPLATES } from '@/lib/sgb-knowledge'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  suggestedTemplates?: string[]
  relatedCategories?: string[]
  crossSell?: CrossSell[]
}

interface CrossSell {
  label: string
  description: string
  to: string
  icon: 'scan' | 'werkstatt' | 'rechner'
}

interface QuickAction {
  label: string
  emoji: string
  type: 'link' | 'chat'
  to?: string
  chatMessage?: string
}

// ---------------------------------------------------------------------------
// Quick actions (the six buttons in the empty state)
// ---------------------------------------------------------------------------

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: 'Bescheid pruefen lassen',
    emoji: '\uD83D\uDD0D',
    type: 'link',
    to: '/scan',
  },
  {
    label: 'Widerspruch schreiben',
    emoji: '\u270D\uFE0F',
    type: 'link',
    to: '/musterschreiben',
  },
  {
    label: 'Berechnen was mir zusteht',
    emoji: '\uD83E\uDDEE',
    type: 'chat',
    chatMessage: 'Ich moechte berechnen, was mir an Buergergeld zusteht.',
  },
  {
    label: 'Frage zum Buergergeld',
    emoji: '\u2753',
    type: 'chat',
    chatMessage: 'Ich habe eine allgemeine Frage zum Buergergeld.',
  },
  {
    label: 'Ich wurde sanktioniert!',
    emoji: '\u26A0\uFE0F',
    type: 'chat',
    chatMessage: 'Ich wurde sanktioniert und brauche Hilfe!',
  },
  {
    label: 'Meine Miete wird gekuerzt',
    emoji: '\uD83C\uDFE0',
    type: 'chat',
    chatMessage: 'Das Jobcenter zahlt nicht meine volle Miete. Was kann ich tun?',
  },
]

// ---------------------------------------------------------------------------
// Opening message (proactive, empathetic BescheidBoxer identity)
// ---------------------------------------------------------------------------

const OPENING_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: `**Hey! Ich bin dein BescheidBoxer-Assistent.** \uD83E\uDD4A

Ich kenne mich mit Buergergeld-Recht aus und bin auf **DEINER** Seite.

Egal ob falscher Bescheid, Sanktion oder Mietkuerzung \u2013 ich helfe dir, deine Rechte zu verstehen **und** durchzusetzen. Kein Amtsdeutsch, keine Angst.

**Wie kann ich dir helfen?** Waehle unten eine Option oder schreib mir einfach dein Anliegen.`,
  timestamp: new Date(),
}

// ---------------------------------------------------------------------------
// Demo response generator
// ---------------------------------------------------------------------------

function generateDemoResponse(question: string): ChatMessage {
  const q = question.toLowerCase()
  let content = ''
  let suggestedTemplates: string[] = []
  let relatedCategories: string[] = []
  let crossSell: CrossSell[] = []

  // ---- Bescheid falsch / berechnen ----
  if (
    (q.includes('bescheid') && (q.includes('falsch') || q.includes('berechnung') || q.includes('pruefen'))) ||
    q.includes('berechnen') ||
    q.includes('zusteht')
  ) {
    content = `**Das klingt so, als haette das Jobcenter sich verrechnet \u2013 und das passiert leider oefter, als man denkt.** Gut, dass du das pruefen willst!

Hier ist dein Fahrplan:

**1. Frist pruefen**
Du hast **1 Monat** nach Zugang des Bescheids Zeit fuer einen Widerspruch (\u00A7 84 SGG). Noch innerhalb der Frist? Dann schnell handeln!

**2. Was du pruefen solltest:**
- **Regelsatz** \u2013 2024/2025: 563 EUR fuer Alleinstehende (\u00A7 20 SGB II)
- **Mehrbedarf** \u2013 Alleinerziehend? Schwanger? Krank? (\u00A7 21 SGB II)
- **Einkommensanrechnung** \u2013 Wurde korrekt abgezogen? (\u00A7 11 SGB II)
- **Kosten der Unterkunft** \u2013 Wird die volle Miete gezahlt? (\u00A7 22 SGB II)

**3. Frist verpasst? Kein Problem!**
Mit dem **Ueberpruefungsantrag nach \u00A7 44 SGB X** kannst du Bescheide der letzten **4 Jahre** pruefen lassen \u2013 und dir Nachzahlungen sichern.

**Dein naechster Schritt:** Lade deinen Bescheid in unseren **BescheidScan** hoch \u2013 die KI findet Fehler in Sekunden. Oder erstelle direkt deinen Widerspruch in der **Dokumenten-Werkstatt**.

[TEMPLATE:widerspruch_bescheid] [TEMPLATE:ueberpruefungsantrag]`
    suggestedTemplates = ['widerspruch_bescheid', 'ueberpruefungsantrag', 'akteneinsicht']
    relatedCategories = ['sgb2', 'sgb10']
    crossSell = [
      {
        label: 'BescheidScan',
        description: 'Lade deinen Bescheid hoch und lass ihn automatisch pruefen.',
        to: '/scan',
        icon: 'scan',
      },
      {
        label: 'Dokumenten-Werkstatt',
        description: 'Erstelle deinen Widerspruch in wenigen Minuten.',
        to: '/musterschreiben',
        icon: 'werkstatt',
      },
    ]
  }
  // ---- Sanktion ----
  else if (q.includes('sanktion') || q.includes('sanktioniert') || q.includes('gekuerzt') || q.includes('pflichtverletzung')) {
    content = `**Das tut mir leid \u2013 Sanktionen sind fuer viele eine echte Belastung.** Aber: Du bist dem nicht hilflos ausgeliefert. Viele Sanktionen sind angreifbar!

**Deine Rechte seit dem Buergergeld-Gesetz (2023):**
- Sanktionen duerfen **maximal 30 %** des Regelsatzes betragen (\u00A7 31a SGB II)
- Die alten 60 %- und 100 %-Kuerzungen sind **abgeschafft**
- Kosten der Unterkunft (Miete) duerfen **NICHT** gekuerzt werden
- Bei einem **wichtigen Grund** (Krankheit, Kinderbetreuung, Brief nicht erhalten) darf gar nicht sanktioniert werden (\u00A7 31 Abs. 1 S. 2 SGB II)

**Was du JETZT tun solltest:**
1. **Widerspruch einlegen** \u2013 du hast 1 Monat Zeit (\u00A7 84 SGG)
2. **Beweise sichern** \u2013 Attest, Zeugen, Nachweise sammeln
3. Falls Existenz bedroht: **Eilantrag beim Sozialgericht** (\u00A7 86b SGG) \u2013 kostenfrei!

**Dein naechster Schritt:** Erstelle jetzt deinen Widerspruch gegen die Sanktion in der **Dokumenten-Werkstatt** \u2013 dauert nur 10 Minuten.

[TEMPLATE:widerspruch_sanktion]`
    suggestedTemplates = ['widerspruch_sanktion', 'eilantrag_sozialgericht']
    relatedCategories = ['sgb2']
    crossSell = [
      {
        label: 'Dokumenten-Werkstatt',
        description: 'Widerspruch gegen deine Sanktion \u2013 in 10 Min. fertig.',
        to: '/musterschreiben',
        icon: 'werkstatt',
      },
    ]
  }
  // ---- Miete / KdU ----
  else if (q.includes('miete') || q.includes('kdu') || q.includes('unterkunft') || q.includes('wohnung') || q.includes('mietkuerzung')) {
    content = `**Wenn das Amt nicht die volle Miete zahlt, ist das ein harter Schlag \u2013 schliesslich geht es um dein Zuhause.** Aber: Die Rechtslage ist oft auf deiner Seite!

**Deine Rechte nach \u00A7 22 SGB II:**

**1. 6-Monats-Schutz**
In den ersten 12 Monaten des Leistungsbezugs (Karenzzeit) muss das Amt die **tatsaechlichen** Kosten uebernehmen \u2013 egal wie hoch.

**2. Schluessiges Konzept**
Das Amt braucht ein sog. "schluessiges Konzept" fuer die Mietobergrenze. Viele Jobcenter haben das **nicht** \u2013 dann gelten deine tatsaechlichen Kosten!

**3. Kostensenkungsaufforderung**
Bevor das Amt kuerzen darf, muss es dich schriftlich auffordern, die Kosten zu senken \u2013 und dir angemessene Zeit geben (i.d.R. 6 Monate).

**4. Kein guenstigerer Wohnraum verfuegbar?**
Wenn du nachweisen kannst, dass es in deiner Stadt nichts Guenstigeres gibt, muss das Amt die hoehere Miete weiterzahlen (BSG, Urteil v. 19.02.2009 \u2013 B 4 AS 30/08 R).

**Dein naechster Schritt:** Lade deinen Bescheid in den **BescheidScan** hoch \u2013 wir pruefen automatisch, ob die KdU korrekt berechnet wurde. Oder erstelle direkt einen Widerspruch.

[TEMPLATE:widerspruch_kdu]`
    suggestedTemplates = ['widerspruch_kdu', 'antrag_umzug']
    relatedCategories = ['kdu', 'sgb2']
    crossSell = [
      {
        label: 'BescheidScan',
        description: 'Automatisch pruefen, ob deine Mietkosten korrekt berechnet wurden.',
        to: '/scan',
        icon: 'scan',
      },
      {
        label: 'Dokumenten-Werkstatt',
        description: 'KdU-Widerspruch erstellen.',
        to: '/musterschreiben',
        icon: 'werkstatt',
      },
    ]
  }
  // ---- Allgemeine Frage Buergergeld ----
  else if (q.includes('allgemeine frage') || q.includes('frage zum buergergeld') || q.includes('buergergeld')) {
    content = `**Klar, frag mich alles zum Buergergeld \u2013 dafuer bin ich da!**

Hier ein paar Sachen, bei denen ich dir sofort helfen kann:

**Regelsaetze 2025:**
- Alleinstehend: **563 EUR** (\u00A7 20 SGB II)
- Paare (je): **506 EUR**
- Kinder 0\u20135: **357 EUR** | 6\u201313: **390 EUR** | 14\u201317: **471 EUR**

**Haeufige Themen:**
- Mehrbedarf (Alleinerziehend, Schwangerschaft, Ernaehrung) \u2013 \u00A7 21 SGB II
- Einkommensanrechnung \u2013 \u00A7 11 SGB II (Freibetraege beachten!)
- Vermoegen \u2013 \u00A7 12 SGB II (Karenzzeit: 40.000 EUR geschuetzt!)
- Kosten der Unterkunft \u2013 \u00A7 22 SGB II
- Sanktionen \u2013 \u00A7 31 SGB II (max. 30 %!)

**Beschreib mir einfach dein konkretes Problem** und ich sage dir genau, welche Paragraphen greifen und was du tun kannst.

**Dein naechster Schritt:** Wenn du einen konkreten Bescheid hast, lade ihn in unseren **BescheidScan** hoch \u2013 so finden wir Fehler am schnellsten.`
    relatedCategories = ['sgb2']
    crossSell = [
      {
        label: 'BescheidScan',
        description: 'Bescheid hochladen und automatisch auf Fehler pruefen lassen.',
        to: '/scan',
        icon: 'scan',
      },
    ]
  }
  // ---- Alte Bescheide / Ueberpruefung ----
  else if (q.includes('alte bescheide') || q.includes('ueberpruefung') || q.includes('nachtraeglich') || q.includes('nachzahlung')) {
    content = `**Gute Nachricht: Auch alte Bescheide koennen nochmal geprueft werden \u2013 bis zu 4 Jahre zurueck!**

Der **Ueberpruefungsantrag nach \u00A7 44 SGB X** ist eines der staerksten Instrumente, das die wenigsten kennen:

**So funktioniert es:**
1. Du stellst einen formellen Antrag beim Jobcenter
2. Das Amt muss den alten Bescheid nochmal pruefen
3. War er rechtswidrig? Dann muss das Amt aendern und **nachzahlen**!
4. Das gilt fuer bis zu **4 Jahre** zurueck (\u00A7 44 Abs. 4 SGB X)

**Typische Fehler, die Nachzahlungen bringen:**
- Regelsatz war zu niedrig angesetzt
- Mehrbedarf wurde nicht anerkannt (z.B. Alleinerziehend)
- KdU (Miete) wurde unrechtmaessig gekuerzt
- Einkommen wurde falsch berechnet
- Sanktionen waren rechtswidrig

**Erfahrungswert:** Bei vielen Betroffenen kommen so **mehrere hundert bis ueber tausend Euro** Nachzahlung zusammen.

**Dein naechster Schritt:** Lade deine alten Bescheide in den **BescheidScan** hoch \u2013 die KI findet Fehler sofort. Dann erstelle den Ueberpruefungsantrag in der **Dokumenten-Werkstatt**.

[TEMPLATE:ueberpruefungsantrag] [TEMPLATE:akteneinsicht]`
    suggestedTemplates = ['ueberpruefungsantrag', 'akteneinsicht']
    relatedCategories = ['sgb10']
    crossSell = [
      {
        label: 'BescheidScan',
        description: 'Alte Bescheide hochladen und Fehler finden.',
        to: '/scan',
        icon: 'scan',
      },
      {
        label: 'Dokumenten-Werkstatt',
        description: 'Ueberpruefungsantrag in 5 Minuten erstellen.',
        to: '/musterschreiben',
        icon: 'werkstatt',
      },
    ]
  }
  // ---- Waschmaschine / Einmalige Leistung ----
  else if (q.includes('waschmaschine') || q.includes('moebel') || q.includes('erstausstattung') || q.includes('kaputt')) {
    content = `**Wenn die Waschmaschine den Geist aufgibt, ist das natuerlich Stress \u2013 besonders wenn das Geld eh schon knapp ist.** Aber es gibt Hilfe!

Nach **\u00A7 24 Abs. 3 SGB II** hast du Anspruch auf **einmalige Leistungen** fuer:
- Erstausstattung der Wohnung (Moebel, Haushaltsgeraete)
- Erstausstattung Bekleidung
- Schwangerschaftsbekleidung / Babyausstattung

**Wichtig:** Auch ein **Ersatz** fuer kaputte Geraete kann als einmalige Leistung beantragt werden, wenn du es nicht aus dem Regelsatz bezahlen kannst.

**So gehst du vor:**
1. Stelle einen **schriftlichen Antrag** auf einmalige Leistungen
2. Begruende, warum du die Anschaffung brauchst
3. Fuege Nachweise bei (Fotos vom defekten Geraet, Kostenvoranschlag)

**Typische Betraege:** 100\u2013250 EUR fuer eine Waschmaschine (je nach Kommune). Du kannst aber auch einen hoeheren Betrag beantragen.

**Dein naechster Schritt:** Erstelle den Antrag in der **Dokumenten-Werkstatt** \u2013 dauert nur 5 Minuten und ist rechtssicher formuliert.

[TEMPLATE:antrag_einmalige_leistung]`
    suggestedTemplates = ['antrag_einmalige_leistung']
    relatedCategories = ['sgb2']
    crossSell = [
      {
        label: 'Dokumenten-Werkstatt',
        description: 'Antrag auf einmalige Leistungen erstellen.',
        to: '/musterschreiben',
        icon: 'werkstatt',
      },
    ]
  }
  // ---- Sachbearbeiter / Beschwerde ----
  else if (q.includes('sachbearbeiter') || q.includes('behandelt') || q.includes('schlecht') || q.includes('respektlos')) {
    content = `**Das tut mir leid, dass du so behandelt wirst. Niemand muss sich das gefallen lassen \u2013 auch nicht vom Amt!**

Du hast ein **Recht auf respektvolle Behandlung** (\u00A7 14 SGB I \u2013 Beratungspflicht). Hier sind deine Optionen:

**1. Dienstaufsichtsbeschwerde** (Art. 17 GG)
- Formelle Beschwerde an die Teamleitung / Geschaeftsfuehrung
- Das Amt **muss** reagieren
- Beschreibe den Vorfall sachlich mit Datum, Uhrzeit, Zeugen

**2. Sachbearbeiterwechsel beantragen**
- Du kannst schriftlich beantragen, einen anderen Sachbearbeiter zu bekommen
- Kein Recht darauf, aber in der Praxis oft moeglich

**3. Buergerbeauftragter / Petitionsausschuss**
- Bei schweren Faellen: Petition beim Landtag einreichen

**Praxis-Tipps:**
- Nimm immer eine **Begleitperson** zu Terminen mit
- **Dokumentiere alles** schriftlich (Gedaechtnisprotokoll)
- Lass dir muendliche Aussagen **schriftlich bestaetigen**
- Bleibe sachlich \u2013 das staerkt deine Position

**Dein naechster Schritt:** Erstelle deine Dienstaufsichtsbeschwerde in der **Dokumenten-Werkstatt** \u2013 rechtssicher und sachlich formuliert.

[TEMPLATE:beschwerde_sachbearbeiter]`
    suggestedTemplates = ['beschwerde_sachbearbeiter', 'akteneinsicht']
    relatedCategories = ['sgb10']
    crossSell = [
      {
        label: 'Dokumenten-Werkstatt',
        description: 'Dienstaufsichtsbeschwerde erstellen.',
        to: '/musterschreiben',
        icon: 'werkstatt',
      },
    ]
  }
  // ---- Fallback ----
  else {
    content = `**Verstanden \u2013 ich helfe dir gern weiter!**

Damit ich dir die bestmoegliche Auskunft geben kann, beschreib mir dein Anliegen etwas genauer. Zum Beispiel:

- "Mein Bescheid ist falsch berechnet"
- "Ich wurde sanktioniert und hatte einen wichtigen Grund"
- "Das Amt zahlt nicht meine volle Miete"
- "Ich brauche Geld fuer eine Erstausstattung"
- "Mein Sachbearbeiter behandelt mich schlecht"

Ich kenne mich aus mit **SGB II** (Buergergeld), **SGB III** (ALG I), **SGB X** (Widerspruch & Ueberpruefung) und **SGB XII** (Sozialhilfe) \u2013 inklusive aller relevanten Paragraphen und aktueller Rechtsprechung.

**Tipp:** Wenn du einen konkreten Bescheid hast, lade ihn in unseren **BescheidScan** hoch. Die KI findet Fehler sofort und du sparst dir langes Suchen.`
    relatedCategories = ['sgb2', 'sgb3', 'sgb10']
    crossSell = [
      {
        label: 'BescheidScan',
        description: 'Bescheid hochladen und automatisch pruefen lassen.',
        to: '/scan',
        icon: 'scan',
      },
    ]
  }

  return {
    id: Date.now().toString(),
    role: 'assistant',
    content,
    timestamp: new Date(),
    suggestedTemplates,
    relatedCategories,
    crossSell,
  }
}

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------

function renderCrossSellIcon(icon: CrossSell['icon']) {
  switch (icon) {
    case 'scan':
      return <ScanSearch className="h-4 w-4 text-primary flex-shrink-0" />
    case 'werkstatt':
      return <FileText className="h-4 w-4 text-primary flex-shrink-0" />
    case 'rechner':
      return <Calculator className="h-4 w-4 text-primary flex-shrink-0" />
  }
}

function renderQuickActionIcon(emoji: string) {
  return <span className="text-lg leading-none" aria-hidden="true">{emoji}</span>
}

// ---------------------------------------------------------------------------
// Markdown-lite renderer
// ---------------------------------------------------------------------------

function renderMessageContent(text: string) {
  // Strip [TEMPLATE:xxx] markers from visible text (they are shown as buttons below)
  const cleaned = text.replace(/\[TEMPLATE:[^\]]+\]/g, '').trimEnd()

  return cleaned.split('\n').map((line, i) => {
    // Bold-only line
    if (line.startsWith('**') && line.endsWith('**') && line.indexOf('**', 2) === line.length - 2) {
      return (
        <p key={i} className="font-semibold mb-1">
          {line.replace(/\*\*/g, '')}
        </p>
      )
    }

    // Render inline bold segments
    const renderInlineBold = (raw: string) => {
      const segments = raw.split(/(\*\*[^*]+\*\*)/g)
      return segments.map((seg, j) => {
        if (seg.startsWith('**') && seg.endsWith('**')) {
          return (
            <strong key={j} className="font-semibold">
              {seg.slice(2, -2)}
            </strong>
          )
        }
        return <span key={j}>{seg}</span>
      })
    }

    // Bullet list item
    if (line.startsWith('- ')) {
      return (
        <p key={i} className="ml-3 mb-0.5 flex gap-1.5">
          <span className="text-primary flex-shrink-0">&bull;</span>
          <span>{renderInlineBold(line.slice(2))}</span>
        </p>
      )
    }

    // Numbered list item
    if (/^\d+\.\s/.test(line)) {
      return (
        <p key={i} className="ml-2 mb-0.5">
          {renderInlineBold(line)}
        </p>
      )
    }

    // Blank line
    if (line === '') return <br key={i} />

    // Normal paragraph
    return (
      <p key={i} className="mb-1">
        {renderInlineBold(line)}
      </p>
    )
  })
}

// ---------------------------------------------------------------------------
// ChatPage component
// ---------------------------------------------------------------------------

const CHAT_STORAGE_KEY = 'bescheidboxer_chat_history'

function loadChatHistory(): ChatMessage[] | null {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ChatMessage[]
    if (parsed.length <= 1) return null
    // Restore Date objects
    return parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }))
  } catch {
    return null
  }
}

function saveChatHistory(messages: ChatMessage[]) {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages))
  } catch {
    // localStorage full or unavailable
  }
}

export default function ChatPage() {
  useDocumentTitle('KI-Rechtsberater - BescheidBoxer')
  const restored = loadChatHistory()
  const [messages, setMessages] = useState<ChatMessage[]>(restored || [OPENING_MESSAGE])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(!restored)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { checkQuestion, useQuestion } = useCreditsContext()

  // Auto-scroll on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Persist messages to localStorage
  useEffect(() => {
    saveChatHistory(messages)
  }, [messages])

  // Focus the input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleNewChat = () => {
    setMessages([OPENING_MESSAGE])
    setShowQuickActions(true)
    setInput('')
    localStorage.removeItem(CHAT_STORAGE_KEY)
  }

  // Remaining daily messages
  const creditCheck = checkQuestion()

  // ------ Core send handler ------
  const handleSend = async (text?: string) => {
    const messageText = text || input.trim()
    if (!messageText || isLoading) return

    // Credit gate
    const check = checkQuestion()
    if (!check.allowed) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: `**Tageslimit erreicht**\n\n${check.reason}\n\nAber keine Sorge \u2013 du kannst trotzdem deinen **BescheidScan** nutzen oder Schreiben in der **Dokumenten-Werkstatt** erstellen.`,
          timestamp: new Date(),
          crossSell: [
            { label: 'BescheidScan', description: 'Bescheid automatisch pruefen.', to: '/scan', icon: 'scan' as const },
            { label: 'Dokumenten-Werkstatt', description: 'Musterschreiben erstellen.', to: '/musterschreiben', icon: 'werkstatt' as const },
          ],
        },
      ])
      return
    }

    // Hide quick actions after first message
    setShowQuickActions(false)

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Consume credit
    await useQuestion()

    // Call API or fall back to demo
    try {
      const apiEndpoint = import.meta.env.VITE_AI_API_ENDPOINT
      if (apiEndpoint) {
        const response = await fetch(`${apiEndpoint}/amt-chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: messageText,
            history: messages
              .filter((m) => m.role !== 'system')
              .map((m) => ({ role: m.role, content: m.content })),
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'assistant',
              content: data.response,
              timestamp: new Date(),
              suggestedTemplates: data.suggestedTemplates || [],
              crossSell: data.crossSell || [],
            },
          ])
        } else {
          throw new Error('API error')
        }
      } else {
        // Demo mode
        await new Promise((r) => setTimeout(r, 600))
        const response = generateDemoResponse(messageText)
        setMessages((prev) => [...prev, response])
      }
    } catch {
      // Fallback to demo response
      const response = generateDemoResponse(messageText)
      setMessages((prev) => [...prev, response])
    } finally {
      setIsLoading(false)
    }
  }

  // ------ Keyboard handling ------
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ------ JSX ------
  return (
    <div className="flex flex-col h-[calc(100vh-65px)]">
      {/* ---- Header ---- */}
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-amt">
              <Swords className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-sm flex items-center gap-1.5">
                BescheidBoxer
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                  KI-Assistent
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground">
                SGB II &middot; SGB III &middot; SGB X &middot; SGB XII
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewChat}
              className="gap-1 text-xs h-7"
            >
              <RotateCcw className="h-3 w-3" />
              Neuer Chat
            </Button>
            <Lightbulb className="h-3.5 w-3.5 text-muted-foreground" />
            <Badge
              variant={creditCheck.allowed ? 'outline' : 'destructive'}
              className="text-xs"
            >
              {creditCheck.allowed ? 'Nachrichten verfuegbar' : 'Tageslimit erreicht'}
            </Badge>
          </div>
        </div>
      </div>

      {/* ---- Messages ---- */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="container max-w-3xl space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div className={`max-w-[85%] ${message.role === 'user' ? 'order-2' : ''}`}>
                {/* Bubble */}
                <div
                  className={
                    message.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'
                  }
                >
                  <div className="prose prose-sm max-w-none">
                    {renderMessageContent(message.content)}
                  </div>
                </div>

                {/* Suggested templates */}
                {message.suggestedTemplates && message.suggestedTemplates.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Passende Musterschreiben:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {message.suggestedTemplates.map((templateId) => {
                        const template = LETTER_TEMPLATES.find(
                          (t) => t.id === templateId
                        )
                        if (!template) return null
                        return (
                          <Link
                            key={templateId}
                            to={`/generator/${templateId}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/5 text-primary text-xs font-medium hover:bg-primary/10 transition-colors"
                          >
                            <FileText className="h-3 w-3" />
                            {template.title}
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Cross-sell cards */}
                {message.crossSell && message.crossSell.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.crossSell.map((cs) => (
                      <Link
                        key={cs.to}
                        to={cs.to}
                        className="flex items-start gap-3 p-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors group"
                      >
                        {renderCrossSellIcon(cs.icon)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-primary group-hover:underline">
                            {cs.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {cs.description}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-primary/50 group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Quick action grid (shown after opening message, hidden once user sends) */}
          {showQuickActions && (
            <div className="animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
                {QUICK_ACTIONS.map((action) => {
                  if (action.type === 'link' && action.to) {
                    return (
                      <Link
                        key={action.label}
                        to={action.to}
                        className="flex items-center gap-3 p-3.5 rounded-xl border border-border hover:border-primary/40 hover:bg-accent/50 transition-all text-sm group"
                      >
                        {renderQuickActionIcon(action.emoji)}
                        <span className="text-foreground/80 group-hover:text-foreground font-medium">
                          {action.label}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    )
                  }
                  return (
                    <button
                      key={action.label}
                      onClick={() => handleSend(action.chatMessage)}
                      className="flex items-center gap-3 p-3.5 rounded-xl border border-border hover:border-primary/40 hover:bg-accent/50 transition-all text-sm group text-left"
                    >
                      {renderQuickActionIcon(action.emoji)}
                      <span className="text-foreground/80 group-hover:text-foreground font-medium">
                        {action.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <div className="chat-bubble-ai flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  Analysiere dein Anliegen...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ---- Input ---- */}
      <div className="border-t border-border bg-card px-4 py-4">
        <div className="container max-w-3xl">
          <div className="flex gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Beschreib dein Problem \u2013 ich bin auf deiner Seite..."
              className="chat-input flex-1"
              rows={1}
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              variant="amt"
              size="icon"
              className="h-[46px] w-[46px] flex-shrink-0"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Keine Rechtsberatung \u2013 KI-gestuetzte Ersteinschaetzung.
            </p>
            <div className="flex items-center gap-3">
              <Link
                to="/scan"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <ScanSearch className="h-3 w-3" />
                BescheidScan
              </Link>
              <span className="text-xs text-muted-foreground">
                Enter zum Senden
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
