import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  FileText,
  Search,
  ArrowRight,
  Clock,
  BarChart3,
  Scale,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  LETTER_TEMPLATES,
  SGB_CATEGORIES,
  COMMON_PROBLEMS,
  type SgbCategory,
} from '@/lib/sgb-knowledge'

const CATEGORY_FILTERS: { id: SgbCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'Alle' },
  { id: 'sgb2', label: 'SGB II (Buergergeld)' },
  { id: 'sgb3', label: 'SGB III (ALG I)' },
  { id: 'kdu', label: 'KdU (Miete)' },
  { id: 'sgb10', label: 'Verwaltung' },
  { id: 'sgb12', label: 'SGB XII' },
]

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors = {
    einfach: 'bg-emerald-100 text-emerald-800',
    mittel: 'bg-amber-100 text-amber-800',
    komplex: 'bg-red-100 text-red-800',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[difficulty as keyof typeof colors] || ''}`}>
      {difficulty}
    </span>
  )
}

export default function MusterschreibenPage() {
  const [searchParams] = useSearchParams()
  const initialCategory = searchParams.get('kategorie') as SgbCategory | null
  const problemFilter = searchParams.get('problem')

  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<SgbCategory | 'all'>(initialCategory || 'all')

  // Get relevant templates based on problem filter
  const problemTemplateIds = problemFilter
    ? COMMON_PROBLEMS.find(p => p.id === problemFilter)?.suggestedTemplates || []
    : []

  const filteredTemplates = LETTER_TEMPLATES.filter((t) => {
    // Category filter
    if (activeCategory !== 'all' && t.category !== activeCategory) return false

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      return (
        t.title.toLowerCase().includes(searchLower) ||
        t.shortDescription.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower)
      )
    }

    return true
  })

  // Sort: problem-suggested templates first
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    const aIsSuggested = problemTemplateIds.includes(a.id)
    const bIsSuggested = problemTemplateIds.includes(b.id)
    if (aIsSuggested && !bIsSuggested) return -1
    if (!aIsSuggested && bIsSuggested) return 1
    return 0
  })

  const problem = problemFilter ? COMMON_PROBLEMS.find(p => p.id === problemFilter) : null

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Musterschreiben</h1>
        <p className="text-muted-foreground max-w-2xl">
          {LETTER_TEMPLATES.length} fertige Vorlagen fuer Widersprueche, Antraege und Beschwerden.
          Waehle ein Schreiben, fuelle deine Daten ein, und sende es ab.
        </p>
      </div>

      {/* Problem Banner */}
      {problem && (
        <div className="mb-6 p-4 rounded-xl border border-primary/30 bg-primary/5">
          <div className="flex items-start gap-3">
            <Scale className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-sm">{problem.title}</h3>
              <p className="text-sm text-muted-foreground">{problem.description}</p>
              <p className="text-xs text-primary mt-1">
                Empfohlene Schreiben sind hervorgehoben
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Musterschreiben suchen..."
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORY_FILTERS.map((cat) => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(cat.id)}
              className="whitespace-nowrap"
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-muted-foreground mb-4">
        {sortedTemplates.length} Musterschreiben gefunden
      </p>

      {/* Template Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedTemplates.map((template) => {
          const isSuggested = problemTemplateIds.includes(template.id)
          const categoryInfo = SGB_CATEGORIES[template.category]

          return (
            <Link key={template.id} to={`/generator/${template.id}`}>
              <Card className={`h-full group transition-all hover:shadow-md ${
                isSuggested ? 'border-primary/40 ring-2 ring-primary/10' : 'hover:border-primary/30'
              }`}>
                <CardContent className="p-5">
                  {isSuggested && (
                    <Badge variant="default" className="mb-2 text-xs">
                      Empfohlen
                    </Badge>
                  )}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant={template.category as 'sgb2' | 'sgb3' | 'sgb12' | 'kdu' | 'sgb10'}>
                      {categoryInfo?.name || template.category}
                    </Badge>
                    <DifficultyBadge difficulty={template.difficulty} />
                  </div>

                  <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                    {template.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {template.shortDescription}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {template.estimatedTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <BarChart3 className="h-3 w-3" />
                      {template.requiredFields.length} Felder
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {template.legalBasis.slice(0, 2).map((basis) => (
                        <span key={basis} className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {basis}
                        </span>
                      ))}
                      {template.legalBasis.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{template.legalBasis.length - 2}
                        </span>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {sortedTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Keine Schreiben gefunden</h3>
          <p className="text-muted-foreground mb-4">
            Versuche einen anderen Suchbegriff oder waehle eine andere Kategorie.
          </p>
          <Button variant="outline" onClick={() => { setSearch(''); setActiveCategory('all') }}>
            Filter zuruecksetzen
          </Button>
        </div>
      )}
    </div>
  )
}
