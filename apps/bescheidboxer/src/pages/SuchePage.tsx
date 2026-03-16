import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import { Search, Calculator, FileText, HelpCircle, Wrench, ArrowRight, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface SearchItem {
  title: string
  description: string
  category: 'rechner' | 'musterschreiben' | 'hilfe' | 'tool'
  href: string
  keywords: string[]
}

const SEARCH_ITEMS: SearchItem[] = [
  // Rechner (10 total)
  {
    title: 'Buergergeld-Rechner',
    description: 'Berechne deinen Buergergeld-Anspruch und Regelsatz',
    category: 'rechner',
    href: '/rechner/buergergeld',
    keywords: ['regelsatz', 'berechnung', 'anspruch']
  },
  {
    title: 'KdU-Rechner',
    description: 'Berechne Kosten der Unterkunft und Heizung',
    category: 'rechner',
    href: '/rechner/kdu',
    keywords: ['miete', 'unterkunft', 'heizkosten', 'wohnung']
  },
  {
    title: 'Mehrbedarf-Rechner',
    description: 'Pruefe deinen Anspruch auf Mehrbedarf',
    category: 'rechner',
    href: '/rechner/mehrbedarf',
    keywords: ['schwanger', 'alleinerziehend', 'behindert']
  },
  {
    title: 'Freibetrags-Rechner',
    description: 'Berechne Freibetraege bei Erwerbseinkommen',
    category: 'rechner',
    href: '/rechner/freibetrag',
    keywords: ['einkommen', 'verdienst', 'nebenjob']
  },
  {
    title: 'Sanktions-Rechner',
    description: 'Berechne die Hoehe von Sanktionen',
    category: 'rechner',
    href: '/rechner/sanktion',
    keywords: ['kuerzung', 'pflichtverletzung', 'termin']
  },
  {
    title: 'Schonvermoegens-Rechner',
    description: 'Pruefe dein anrechnungsfreies Vermoegen',
    category: 'rechner',
    href: '/rechner/schonvermoegen',
    keywords: ['vermoegen', 'sparen', 'auto']
  },
  {
    title: 'Fristenrechner',
    description: 'Berechne Widerspruchs- und Klagefristen',
    category: 'rechner',
    href: '/rechner/fristen',
    keywords: ['widerspruch', 'frist', 'klage', 'termin']
  },
  {
    title: 'PKH-Rechner',
    description: 'Pruefe deinen Anspruch auf Prozesskostenhilfe',
    category: 'rechner',
    href: '/rechner/pkh',
    keywords: ['prozesskostenhilfe', 'anwalt', 'gericht']
  },
  {
    title: 'Erstausstattungs-Rechner',
    description: 'Berechne Anspruch auf Erstausstattung',
    category: 'rechner',
    href: '/rechner/erstausstattung',
    keywords: ['wohnung', 'baby', 'moebel']
  },
  {
    title: 'Umzugskosten-Rechner',
    description: 'Berechne erstattungsfaehige Umzugskosten',
    category: 'rechner',
    href: '/rechner/umzugskosten',
    keywords: ['umzug', 'wohnung', 'kaution', 'doppelmiete']
  },
  // Musterschreiben (8 total)
  {
    title: 'Widerspruch gegen Bescheid',
    description: 'Lege Widerspruch gegen einen fehlerhaften Bescheid ein',
    category: 'musterschreiben',
    href: '/generator/widerspruch_bescheid',
    keywords: ['bescheid', 'fehler']
  },
  {
    title: 'Widerspruch KdU-Kuerzung',
    description: 'Widersprich einer unrechtmaessigen Mietkuerzung',
    category: 'musterschreiben',
    href: '/generator/widerspruch_kdu',
    keywords: ['miete', 'kuerzung']
  },
  {
    title: 'Widerspruch Sanktion',
    description: 'Widersprich einer ungerechtfertigten Sanktion',
    category: 'musterschreiben',
    href: '/generator/widerspruch_sanktion',
    keywords: ['sanktion', 'kuerzung']
  },
  {
    title: 'Ueberpruefungsantrag',
    description: 'Beantrage Ueberpruefung alter Bescheide',
    category: 'musterschreiben',
    href: '/generator/ueberpruefungsantrag',
    keywords: ['alt', 'nachzahlung']
  },
  {
    title: 'Antrag Mehrbedarf',
    description: 'Beantrage Mehrbedarf bei besonderer Lebenssituation',
    category: 'musterschreiben',
    href: '/generator/antrag_mehrbedarf',
    keywords: ['mehrbedarf', 'schwanger']
  },
  {
    title: 'Antrag einmalige Leistung',
    description: 'Beantrage einmalige Leistungen fuer Haushaltsgeraete',
    category: 'musterschreiben',
    href: '/generator/antrag_einmalige_leistung',
    keywords: ['waschmaschine', 'moebel']
  },
  {
    title: 'Antrag Umzug',
    description: 'Beantrage Genehmigung und Kostenuebernahme fuer Umzug',
    category: 'musterschreiben',
    href: '/generator/antrag_umzug',
    keywords: ['umzug', 'wohnung']
  },
  {
    title: 'Eilantrag Sozialgericht',
    description: 'Stelle Eilantrag beim Sozialgericht',
    category: 'musterschreiben',
    href: '/generator/eilantrag_sozialgericht',
    keywords: ['eilantrag', 'gericht']
  },
  // Hilfe & Tools (6 total)
  {
    title: 'BescheidScan',
    description: 'Lade deinen Bescheid hoch und pruefe auf Fehler',
    category: 'tool',
    href: '/scan',
    keywords: ['bescheid', 'pruefen', 'fehler', 'upload']
  },
  {
    title: 'KI-Rechtsberater',
    description: 'Stelle deine Fragen zum Buergergeld',
    category: 'tool',
    href: '/chat',
    keywords: ['frage', 'beratung', 'hilfe']
  },
  {
    title: 'Widerspruch-Tracker',
    description: 'Verfolge den Status deiner Widersprueche',
    category: 'tool',
    href: '/tracker',
    keywords: ['widerspruch', 'status', 'frist']
  },
  {
    title: 'Community-Forum',
    description: 'Tausche dich mit anderen Betroffenen aus',
    category: 'hilfe',
    href: '/forum',
    keywords: ['forum', 'community', 'frage']
  },
  {
    title: 'Haeufige Probleme',
    description: 'Loesungen fuer typische Probleme mit dem Jobcenter',
    category: 'hilfe',
    href: '/probleme',
    keywords: ['probleme', 'guide']
  },
  {
    title: 'Mein Profil',
    description: 'Verwalte dein Profil und Abo-Einstellungen',
    category: 'hilfe',
    href: '/profil',
    keywords: ['profil', 'einstellungen', 'abo', 'credits']
  }
]

type CategoryFilter = 'alle' | 'rechner' | 'musterschreiben' | 'hilfe'

export default function SuchePage() {
  useDocumentTitle('Suche')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('alle')

  const filteredItems = useMemo(() => {
    let items = SEARCH_ITEMS

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(term) ||
          item.description.toLowerCase().includes(term) ||
          item.keywords.some((kw) => kw.toLowerCase().includes(term))
      )
    }

    // Filter by category
    if (categoryFilter !== 'alle') {
      items = items.filter((item) => {
        if (categoryFilter === 'hilfe') {
          return item.category === 'hilfe' || item.category === 'tool'
        }
        return item.category === categoryFilter
      })
    }

    return items
  }, [searchTerm, categoryFilter])

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'rechner':
        return Calculator
      case 'musterschreiben':
        return FileText
      case 'hilfe':
        return HelpCircle
      case 'tool':
        return Wrench
      default:
        return HelpCircle
    }
  }

  const groupedItems = useMemo(() => {
    const groups: { [key: string]: SearchItem[] } = {
      rechner: [],
      musterschreiben: [],
      hilfe: []
    }

    filteredItems.forEach((item) => {
      if (item.category === 'rechner') {
        groups.rechner.push(item)
      } else if (item.category === 'musterschreiben') {
        groups.musterschreiben.push(item)
      } else {
        groups.hilfe.push(item)
      }
    })

    return groups
  }, [filteredItems])

  const renderResults = () => {
    if (filteredItems.length === 0) {
      return (
        <div className="text-center py-12">
          <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Keine Ergebnisse</h3>
          <p className="text-muted-foreground mb-6">
            Probiere andere Suchbegriffe oder frag den KI-Berater
          </p>
          <Button asChild>
            <Link to="/chat">
              <MessageCircle className="w-4 h-4 mr-2" />
              Frag den KI-Berater
            </Link>
          </Button>
        </div>
      )
    }

    if (!searchTerm.trim()) {
      // Show grouped by category
      return (
        <div className="space-y-8">
          {Object.entries(groupedItems).map(([category, items]) => {
            if (items.length === 0) return null

            const categoryLabel =
              category === 'rechner'
                ? 'Rechner'
                : category === 'musterschreiben'
                  ? 'Musterschreiben'
                  : 'Hilfe & Tools'

            return (
              <div key={category}>
                <h2 className="text-xl font-semibold mb-4">{categoryLabel}</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
                    <ResultCard key={item.href} item={item} getCategoryIcon={getCategoryIcon} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )
    }

    // Show flat results with count
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {filteredItems.length} {filteredItems.length === 1 ? 'Ergebnis' : 'Ergebnisse'}
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <ResultCard key={item.href} item={item} getCategoryIcon={getCategoryIcon} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Search className="w-8 h-8" />
        <h1 className="text-3xl font-bold">Suche</h1>
      </div>

      {/* Search Input */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Suche nach Rechnern, Musterschreiben oder Hilfe..."
          className="w-full pl-12 pr-4 py-4 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Badge
          variant={categoryFilter === 'alle' ? 'default' : 'outline'}
          className="cursor-pointer px-4 py-2"
          onClick={() => setCategoryFilter('alle')}
        >
          Alle
        </Badge>
        <Badge
          variant={categoryFilter === 'rechner' ? 'default' : 'outline'}
          className="cursor-pointer px-4 py-2"
          onClick={() => setCategoryFilter('rechner')}
        >
          Rechner
        </Badge>
        <Badge
          variant={categoryFilter === 'musterschreiben' ? 'default' : 'outline'}
          className="cursor-pointer px-4 py-2"
          onClick={() => setCategoryFilter('musterschreiben')}
        >
          Musterschreiben
        </Badge>
        <Badge
          variant={categoryFilter === 'hilfe' ? 'default' : 'outline'}
          className="cursor-pointer px-4 py-2"
          onClick={() => setCategoryFilter('hilfe')}
        >
          Hilfe &amp; Tools
        </Badge>
      </div>

      {/* Results */}
      {renderResults()}
    </div>
  )
}

function ResultCard({
  item,
  getCategoryIcon
}: {
  item: SearchItem
  getCategoryIcon: (category: string) => any
}) {
  const Icon = getCategoryIcon(item.category)

  return (
    <Link to={item.href}>
      <Card className="h-full hover:shadow-lg transition-shadow">
        <CardContent className="p-6 flex items-start gap-4">
          <div className="flex-shrink-0">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold mb-1">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        </CardContent>
      </Card>
    </Link>
  )
}
