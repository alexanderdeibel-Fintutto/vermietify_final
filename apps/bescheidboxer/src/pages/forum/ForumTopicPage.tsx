import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ThumbsUp,
  MessageSquare,
  Clock,
  CheckCircle2,
  Send,
  Shield,
  Pin,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useCreditsContext } from '@/contexts/CreditsContext'
import { type SgbCategory } from '@/lib/sgb-knowledge'

interface ForumReply {
  id: string
  author: string
  content: string
  createdAt: string
  likes: number
  isBestAnswer: boolean
}

// Demo topic data
const DEMO_TOPIC = {
  id: '3',
  title: 'Ueberpruefungsantrag - 1.800 EUR Nachzahlung bekommen!',
  content: `Hallo zusammen,

ich wollte meine Erfahrung mit euch teilen, weil ich glaube, dass viele von euch auch zu wenig bekommen haben.

**Meine Situation:**
Ich bin alleinerziehend mit 2 Kindern (4 und 8 Jahre). Seit 2022 beziehe ich Buergergeld. Letztes Jahr habe ich durch Amtshilfe24 erfahren, dass mir ein Mehrbedarf als Alleinerziehende zusteht, der aber in meinen Bescheiden NIE beruecksichtigt wurde.

**Was ich gemacht habe:**
1. Zuerst habe ich Akteneinsicht beantragt (Tipp: IMMER machen!)
2. Dann habe ich alle Bescheide der letzten 4 Jahre angeschaut
3. Tatsaechlich fehlte der Mehrbedarf von 36% (fuer 2 Kinder unter 16) in ALLEN Bescheiden
4. Ich habe einen Ueberpruefungsantrag nach § 44 SGB X gestellt
5. Nach 3 Monaten kam die Nachzahlung: **1.823,40 EUR!**

**Tipps fuer euch:**
- Der Ueberpruefungsantrag kostet NICHTS und ist einfach
- Ihr koennt 4 Jahre zurueckgehen
- Besonders pruefen: Mehrbedarf, KdU, Einkommensanrechnung
- Ich habe die Vorlage von Amtshilfe24 benutzt, hat super funktioniert

Traut euch! Die Aemter machen viele Fehler und wir haben ein Recht auf korrekte Leistungen.

LG Sandra`,
  author: 'Sandra L.',
  category: 'sgb10' as SgbCategory,
  createdAt: '2026-02-04T18:00:00',
  likes: 89,
  views: 567,
  isPinned: true,
  isResolved: true,
}

const DEMO_REPLIES: ForumReply[] = [
  {
    id: 'r1',
    author: 'Carsten W.',
    content: 'Super dass du das teilst Sandra! Das ist genau der Grund warum Akteneinsicht so wichtig ist. Bei mir waren es 600 EUR Nachzahlung wegen falscher Heizkosten-Berechnung. Immer pruefen!',
    createdAt: '2026-02-04T18:45:00',
    likes: 23,
    isBestAnswer: false,
  },
  {
    id: 'r2',
    author: 'Petra M.',
    content: 'Kann ich bestaetigen. Mein Mehrbedarf als Schwangere wurde auch nicht beruecksichtigt. Nach Widerspruch gab es 400 EUR Nachzahlung. Die Sachbearbeiter berechnen oft einfach nur den Regelsatz und vergessen die Mehrbedarfe.',
    createdAt: '2026-02-04T19:30:00',
    likes: 15,
    isBestAnswer: false,
  },
  {
    id: 'r3',
    author: 'Marco K.',
    content: `Danke fuer den Beitrag! Ich habe eine Frage: Muss ich fuer jeden einzelnen Bescheid einen eigenen Ueberpruefungsantrag stellen, oder reicht einer fuer den ganzen Zeitraum?

Und noch was: Kann das Jobcenter mir Probleme machen, wenn ich zu viele Antraege stelle?`,
    createdAt: '2026-02-04T20:15:00',
    likes: 8,
    isBestAnswer: false,
  },
  {
    id: 'r4',
    author: 'Sandra L.',
    content: `@Marco: Du kannst einen Sammelantrag stellen, also alle Bescheide in einem Antrag auflisten. Mach ich in der Regel so: "Hiermit beantrage ich die Ueberpruefung ALLER Bescheide im Zeitraum 01/2022 bis 12/2025."

Und nein, das Jobcenter kann dir keine Probleme machen. Das ist dein gutes Recht nach § 44 SGB X! Die muessen jeden Antrag bearbeiten.`,
    createdAt: '2026-02-04T21:00:00',
    likes: 31,
    isBestAnswer: true,
  },
  {
    id: 'r5',
    author: 'Thomas H.',
    content: 'Wichtiger Hinweis noch: Wenn euer Ueberpruefungsantrag abgelehnt wird, habt ihr wieder 1 Monat Widerspruchsfrist! Also nicht einfach hinnehmen.',
    createdAt: '2026-02-05T08:30:00',
    likes: 19,
    isBestAnswer: false,
  },
]

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' um ' +
    date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

export default function ForumTopicPage() {
  const { topicId: _topicId } = useParams()
  const { checkForum } = useCreditsContext()
  const forumCheck = checkForum()

  const [replyText, setReplyText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // For demo, always show the same topic
  const topic = DEMO_TOPIC
  const replies = DEMO_REPLIES

  const handleReply = async () => {
    if (!replyText.trim() || !forumCheck.allowed) return
    setIsSubmitting(true)
    // TODO: Save to Supabase
    setTimeout(() => {
      setReplyText('')
      setIsSubmitting(false)
    }, 500)
  }

  return (
    <div className="container py-8 max-w-4xl">
      <Link
        to="/forum"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurueck zum Forum
      </Link>

      {/* Topic */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {topic.isPinned && <Pin className="h-4 w-4 text-primary" />}
            <Badge variant={topic.category as 'sgb2' | 'sgb3' | 'kdu' | 'sgb10'}>
              {topic.category === 'sgb10' ? 'Verwaltung' : topic.category.toUpperCase()}
            </Badge>
            {topic.isResolved && <Badge variant="success">Geloest</Badge>}
          </div>

          <h1 className="text-2xl font-bold mb-4">{topic.title}</h1>

          <div className="prose prose-sm max-w-none mb-4">
            {topic.content.split('\n').map((line, i) => {
              if (line.startsWith('**') && line.endsWith('**')) {
                return <p key={i} className="font-semibold mt-3 mb-1">{line.replace(/\*\*/g, '')}</p>
              }
              if (line.match(/^\d+\./)) {
                return <p key={i} className="ml-4 mb-1">{line.replace(/\*\*/g, '')}</p>
              }
              if (line.startsWith('- ')) {
                return <p key={i} className="ml-4 mb-1">&bull; {line.slice(2).replace(/\*\*/g, '')}</p>
              }
              if (line === '') return <br key={i} />
              return <p key={i} className="mb-1">{line.replace(/\*\*/g, '')}</p>
            })}
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-border text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{topic.author}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatTime(topic.createdAt)}
            </span>
            <button className="flex items-center gap-1 hover:text-primary transition-colors">
              <ThumbsUp className="h-3.5 w-3.5" />
              {topic.likes}
            </button>
            <span>{topic.views} Aufrufe</span>
          </div>
        </CardContent>
      </Card>

      {/* Suggested Templates */}
      <div className="mb-6 p-4 rounded-xl border border-primary/20 bg-primary/5">
        <div className="flex items-start gap-2">
          <Shield className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium">Passende Musterschreiben:</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Link
                to="/generator/ueberpruefungsantrag"
                className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors"
              >
                Ueberpruefungsantrag § 44
              </Link>
              <Link
                to="/generator/akteneinsicht"
                className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors"
              >
                Akteneinsicht beantragen
              </Link>
              <Link
                to="/generator/antrag_mehrbedarf"
                className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors"
              >
                Antrag Mehrbedarf
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Replies */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          {replies.length} Antworten
        </h2>
      </div>

      <div className="space-y-4 mb-8">
        {replies.map((reply) => (
          <Card
            key={reply.id}
            className={reply.isBestAnswer ? 'border-success/40 bg-success/[0.03]' : ''}
          >
            <CardContent className="p-5">
              {reply.isBestAnswer && (
                <div className="flex items-center gap-1 text-success text-xs font-medium mb-2">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Beste Antwort
                </div>
              )}

              <div className="prose prose-sm max-w-none mb-3">
                {reply.content.split('\n').map((line, i) => {
                  if (line.startsWith('@')) {
                    return <p key={i} className="mb-1"><span className="text-primary font-medium">{line.split(':')[0]}</span>:{line.split(':').slice(1).join(':')}</p>
                  }
                  if (line === '') return <br key={i} />
                  return <p key={i} className="mb-1">{line}</p>
                })}
              </div>

              <div className="flex items-center gap-4 pt-3 border-t border-border text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{reply.author}</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(reply.createdAt)}
                </span>
                <button className="flex items-center gap-1 hover:text-primary transition-colors">
                  <ThumbsUp className="h-3 w-3" />
                  {reply.likes}
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reply Form */}
      <Card>
        <CardContent className="p-5">
          <h3 className="font-semibold mb-3">Deine Antwort</h3>
          {forumCheck.allowed ? (
            <div>
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Teile deine Erfahrung oder gib einen Tipp..."
                rows={4}
                className="mb-3"
              />
              <Button
                onClick={handleReply}
                disabled={!replyText.trim() || isSubmitting}
                variant="amt"
              >
                <Send className="mr-2 h-4 w-4" />
                Antwort posten
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-3">{forumCheck.reason}</p>
              <Button variant="amt" size="sm" asChild>
                <Link to="/preise">Upgrade</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
