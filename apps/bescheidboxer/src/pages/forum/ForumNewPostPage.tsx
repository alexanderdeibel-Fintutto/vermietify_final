import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useCreditsContext } from '@/contexts/CreditsContext'
import { type SgbCategory } from '@/lib/sgb-knowledge'

const CATEGORY_OPTIONS: { id: SgbCategory; label: string }[] = [
  { id: 'sgb2', label: 'Buergergeld (SGB II)' },
  { id: 'sgb3', label: 'ALG I (SGB III)' },
  { id: 'kdu', label: 'Kosten der Unterkunft' },
  { id: 'sgb10', label: 'Widerspruch & Verwaltung' },
  { id: 'sgb12', label: 'Sozialhilfe (SGB XII)' },
]

const GUIDELINES = [
  'Bleibe sachlich und respektvoll',
  'Keine persoenlichen Daten (echte Namen, Aktenzeichen) posten',
  'Beschreibe dein Problem moeglichst genau',
  'Nenne wenn moeglich relevante Bescheiddaten und Paragraphen',
  'Frage lieber einmal zu viel als zu wenig',
]

export default function ForumNewPostPage() {
  const navigate = useNavigate()
  const { checkForum } = useCreditsContext()
  const forumCheck = checkForum()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<SgbCategory | ''>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isValid = title.trim().length >= 10 && content.trim().length >= 30 && category !== ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || !forumCheck.allowed) return

    setIsSubmitting(true)

    // TODO: Save to Supabase
    // For now, simulate and redirect
    setTimeout(() => {
      navigate('/forum')
    }, 500)
  }

  if (!forumCheck.allowed) {
    return (
      <div className="container py-16 text-center max-w-md">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Upgrade erforderlich</h2>
        <p className="text-muted-foreground mb-6">{forumCheck.reason}</p>
        <Button variant="amt" asChild>
          <Link to="/preise">Tarife ansehen</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container py-8 max-w-3xl">
      <Link
        to="/forum"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurueck zum Forum
      </Link>

      <h1 className="text-2xl font-bold mb-6">Neuen Beitrag schreiben</h1>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Category */}
                <div>
                  <Label htmlFor="category" className="mb-1.5 block">
                    Kategorie <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_OPTIONS.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                          category === cat.id
                            ? 'border-primary bg-primary/10 text-primary font-medium'
                            : 'border-border hover:border-primary/40'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <Label htmlFor="title" className="mb-1.5 block">
                    Titel <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="z.B. Widerspruch gegen Sanktion - Hat jemand Erfahrung?"
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Mindestens 10 Zeichen. {title.length}/200
                  </p>
                </div>

                {/* Content */}
                <div>
                  <Label htmlFor="content" className="mb-1.5 block">
                    Dein Beitrag <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Beschreibe dein Problem oder deine Erfahrung moeglichst genau. Je mehr Details, desto besser koennen andere dir helfen..."
                    rows={8}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Mindestens 30 Zeichen. {content.length} Zeichen
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="amt"
                    size="lg"
                    className="w-full"
                    disabled={!isValid || isSubmitting}
                  >
                    <Send className="mr-2 h-5 w-5" />
                    {isSubmitting ? 'Wird gepostet...' : 'Beitrag veroeffentlichen'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Community-Regeln</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {GUIDELINES.map((rule, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-primary">{i + 1}.</span>
                    {rule}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                <strong>Tipp:</strong> Nutze zuerst den KI-Berater fuer eine schnelle Einschaetzung
                und poste dann im Forum fuer Erfahrungswerte anderer.
              </p>
              <Button variant="outline" size="sm" className="w-full mt-3" asChild>
                <Link to="/chat">KI-Berater fragen</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
