import { useState } from 'react'
import { Link } from 'react-router-dom'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import {
  Users,
  MessageSquare,
  ThumbsUp,
  Clock,
  Eye,
  PenSquare,
  Pin,
  Search,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useCreditsContext } from '@/contexts/CreditsContext'
import { type SgbCategory } from '@/lib/sgb-knowledge'

interface ForumPost {
  id: string
  title: string
  excerpt: string
  author: string
  category: SgbCategory
  createdAt: string
  replies: number
  likes: number
  views: number
  isPinned: boolean
  isResolved: boolean
}

const DEMO_POSTS: ForumPost[] = [
  {
    id: '1',
    title: 'Widerspruch gegen Sanktion erfolgreich! Meine Erfahrung',
    excerpt: 'Ich wurde sanktioniert weil ich angeblich einen Termin verpasst habe. Den Brief habe ich aber nie bekommen. So habe ich mich gewehrt...',
    author: 'Petra M.',
    category: 'sgb2',
    createdAt: '2026-02-05T14:30:00',
    replies: 23,
    likes: 47,
    views: 312,
    isPinned: true,
    isResolved: true,
  },
  {
    id: '2',
    title: 'KdU Kuerzung - Amt sagt Miete ist zu hoch. Was tun?',
    excerpt: 'Mein Jobcenter hat meine Miete als unangemessen eingestuft und will kuerzen. Ich finde aber keine billigere Wohnung in meiner Stadt...',
    author: 'Marco K.',
    category: 'kdu',
    createdAt: '2026-02-05T10:15:00',
    replies: 15,
    likes: 22,
    views: 189,
    isPinned: false,
    isResolved: false,
  },
  {
    id: '3',
    title: 'Ueberpruefungsantrag - 1.800 EUR Nachzahlung bekommen!',
    excerpt: 'Habe alte Bescheide pruefen lassen und tatsaechlich wurde mein Mehrbedarf als Alleinerziehende 2 Jahre lang nicht berechnet...',
    author: 'Sandra L.',
    category: 'sgb10',
    createdAt: '2026-02-04T18:00:00',
    replies: 31,
    likes: 89,
    views: 567,
    isPinned: true,
    isResolved: true,
  },
  {
    id: '4',
    title: 'Eingliederungsvereinbarung unterschreiben oder nicht?',
    excerpt: 'Mein Sachbearbeiter draengt mich eine EGV zu unterschreiben. Muss ich das? Was passiert wenn ich nicht unterschreibe?',
    author: 'Thomas H.',
    category: 'sgb2',
    createdAt: '2026-02-04T09:20:00',
    replies: 19,
    likes: 33,
    views: 245,
    isPinned: false,
    isResolved: true,
  },
  {
    id: '5',
    title: 'Sperrzeit ALG I - Eigenkuendigung wegen Mobbing',
    excerpt: 'Habe meinen Job gekuendigt weil ich gemobbt wurde. Jetzt droht mir eine Sperrzeit von 12 Wochen. Hat jemand Erfahrung damit?',
    author: 'Anna B.',
    category: 'sgb3',
    createdAt: '2026-02-03T16:45:00',
    replies: 8,
    likes: 14,
    views: 98,
    isPinned: false,
    isResolved: false,
  },
  {
    id: '6',
    title: 'Eilantrag beim Sozialgericht - Wie schnell geht das?',
    excerpt: 'Mein Antrag wird seit 3 Monaten nicht bearbeitet, habe kein Geld mehr. Will einen Eilantrag stellen. Wie laeuft das ab?',
    author: 'Ralf D.',
    category: 'sgb10',
    createdAt: '2026-02-03T11:00:00',
    replies: 12,
    likes: 28,
    views: 176,
    isPinned: false,
    isResolved: true,
  },
  {
    id: '7',
    title: 'Waschmaschine kaputt - Jobcenter sagt nein. Einmalige Leistung?',
    excerpt: 'Meine Waschmaschine ist kaputt, ich habe den Antrag auf einmalige Leistung gestellt aber der wurde abgelehnt...',
    author: 'Melanie F.',
    category: 'sgb2',
    createdAt: '2026-02-02T14:30:00',
    replies: 7,
    likes: 11,
    views: 87,
    isPinned: false,
    isResolved: false,
  },
  {
    id: '8',
    title: 'Tipp: So bekommt ihr Akteneinsicht beim Jobcenter',
    excerpt: 'Viele wissen nicht dass man ein Recht auf komplette Akteneinsicht hat. Hier erklaere ich Schritt fuer Schritt wie es geht...',
    author: 'Carsten W.',
    category: 'sgb10',
    createdAt: '2026-02-01T20:00:00',
    replies: 42,
    likes: 156,
    views: 1243,
    isPinned: true,
    isResolved: false,
  },
]

const CATEGORY_TABS = [
  { id: 'all', label: 'Alle Beitraege' },
  { id: 'sgb2', label: 'Buergergeld' },
  { id: 'sgb3', label: 'ALG I' },
  { id: 'kdu', label: 'Miete (KdU)' },
  { id: 'sgb10', label: 'Widerspruch & Klage' },
]

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffHours < 1) return 'gerade eben'
  if (diffHours < 24) return `vor ${diffHours} Std.`
  if (diffDays < 7) return `vor ${diffDays} Tagen`
  return date.toLocaleDateString('de-DE')
}

export default function ForumPage() {
  useDocumentTitle('Community-Forum - BescheidBoxer')
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const { checkForum } = useCreditsContext()

  const forumCheck = checkForum()

  const filteredPosts = DEMO_POSTS.filter(post => {
    if (activeCategory !== 'all' && post.category !== activeCategory) return false
    if (search) {
      const searchLower = search.toLowerCase()
      return post.title.toLowerCase().includes(searchLower) || post.excerpt.toLowerCase().includes(searchLower)
    }
    return true
  })

  // Pinned first, then by date
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Community-Forum
          </h1>
          <p className="text-muted-foreground">
            Erfahrungen teilen, Tipps geben und von anderen lernen.
          </p>
        </div>
        {forumCheck.allowed ? (
          <Button variant="amt" asChild>
            <Link to="/forum/neu">
              <PenSquare className="mr-2 h-4 w-4" />
              Neuen Beitrag schreiben
            </Link>
          </Button>
        ) : (
          <Button variant="outline" asChild>
            <Link to="/preise">
              <Lock className="mr-2 h-4 w-4" />
              Upgrade zum Schreiben
            </Link>
          </Button>
        )}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{DEMO_POSTS.length}</div>
            <div className="text-xs text-muted-foreground">Beitraege</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {DEMO_POSTS.reduce((sum, p) => sum + p.replies, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Antworten</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {DEMO_POSTS.filter(p => p.isResolved).length}
            </div>
            <div className="text-xs text-muted-foreground">Geloest</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Forum durchsuchen..."
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORY_TABS.map((tab) => (
            <Button
              key={tab.id}
              variant={activeCategory === tab.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(tab.id)}
              className="whitespace-nowrap"
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-3">
        {sortedPosts.map((post) => (
          <Card
            key={post.id}
            className={`forum-post transition-all ${
              post.isPinned ? 'border-primary/30 bg-primary/[0.02]' : ''
            }`}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                {/* Vote count */}
                <div className="hidden sm:flex flex-col items-center gap-1 min-w-[50px]">
                  <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-sm">{post.likes}</span>
                  <span className="text-xs text-muted-foreground">Likes</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {post.isPinned && (
                      <Pin className="h-3.5 w-3.5 text-primary" />
                    )}
                    <Badge variant={post.category as 'sgb2' | 'sgb3' | 'kdu' | 'sgb10'} className="text-[10px]">
                      {post.category === 'sgb2' ? 'Buergergeld' :
                       post.category === 'sgb3' ? 'ALG I' :
                       post.category === 'kdu' ? 'KdU' : 'Verwaltung'}
                    </Badge>
                    {post.isResolved && (
                      <Badge variant="success" className="text-[10px]">Geloest</Badge>
                    )}
                  </div>

                  <Link to={`/forum/${post.id}`} className="font-semibold mb-1 hover:text-primary transition-colors block">
                    {post.title}
                  </Link>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{post.author}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(post.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {post.replies} Antworten
                    </span>
                    <span className="hidden sm:flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {post.views}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sortedPosts.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Keine Beitraege gefunden</h3>
          <p className="text-muted-foreground">
            Versuche einen anderen Suchbegriff oder eine andere Kategorie.
          </p>
        </div>
      )}

      {/* Forum info */}
      {!forumCheck.allowed && (
        <Card className="mt-8 border-primary/30">
          <CardContent className="p-6 text-center">
            <Lock className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Schreibe eigene Beitraege</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ab dem Plus-Tarif (3,99 EUR/Monat) kannst du eigene Beitraege und Antworten schreiben.
            </p>
            <Button variant="amt" asChild>
              <Link to="/preise">Jetzt upgraden</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
