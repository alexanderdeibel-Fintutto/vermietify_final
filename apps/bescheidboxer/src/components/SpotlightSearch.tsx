import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Calculator, FileText, MessageCircle, ScanSearch, ClipboardList, HelpCircle, ArrowRight } from 'lucide-react'

interface SearchItem {
  title: string
  href: string
  icon: any
  keywords: string[]
}

const searchItems: SearchItem[] = [
  { title: 'BescheidScan', href: '/scan', icon: ScanSearch, keywords: ['scan', 'bescheid', 'pruefen'] },
  { title: 'KI-Rechtsberater', href: '/chat', icon: MessageCircle, keywords: ['chat', 'frage', 'beratung'] },
  { title: 'Buergergeld-Rechner', href: '/rechner/buergergeld', icon: Calculator, keywords: ['rechner', 'buergergeld', 'regelsatz'] },
  { title: 'KdU-Rechner', href: '/rechner/kdu', icon: Calculator, keywords: ['miete', 'wohnung', 'heizung'] },
  { title: 'Mehrbedarf-Rechner', href: '/rechner/mehrbedarf', icon: Calculator, keywords: ['schwanger', 'alleinerziehend'] },
  { title: 'Sanktions-Rechner', href: '/rechner/sanktion', icon: Calculator, keywords: ['sanktion', 'kuerzung'] },
  { title: 'Fristenrechner', href: '/rechner/fristen', icon: Calculator, keywords: ['frist', 'widerspruch', 'klage'] },
  { title: 'Erstausstattung', href: '/rechner/erstausstattung', icon: Calculator, keywords: ['moebel', 'baby', 'wohnung'] },
  { title: 'Umzugskosten', href: '/rechner/umzugskosten', icon: Calculator, keywords: ['umzug', 'kaution'] },
  { title: 'Dokumenten-Werkstatt', href: '/musterschreiben', icon: FileText, keywords: ['brief', 'widerspruch', 'antrag'] },
  { title: 'Widerspruch-Tracker', href: '/tracker', icon: ClipboardList, keywords: ['tracker', 'status', 'frist'] },
  { title: 'Community-Forum', href: '/forum', icon: HelpCircle, keywords: ['forum', 'community'] },
  { title: 'FAQ', href: '/faq', icon: HelpCircle, keywords: ['frage', 'hilfe', 'antwort'] },
  { title: 'Suche', href: '/suche', icon: Search, keywords: ['suche', 'finden'] },
  { title: 'Dashboard', href: '/dashboard', icon: HelpCircle, keywords: ['dashboard', 'uebersicht'] },
  { title: 'Mein Profil', href: '/profil', icon: HelpCircle, keywords: ['profil', 'abo', 'einstellungen'] },
]

export default function SpotlightSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle Ctrl+K / Cmd+K to toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Filter items based on query
  const filteredItems = useMemo(() => {
    if (!query) return searchItems
    const lowerQuery = query.toLowerCase()
    return searchItems.filter(item =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.keywords.some(kw => kw.toLowerCase().includes(lowerQuery))
    )
  }, [query])

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [filteredItems])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      setQuery('')
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % filteredItems.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length)
    } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      handleSelect(filteredItems[selectedIndex].href)
    }
  }

  const handleSelect = (href: string) => {
    navigate(href)
    setIsOpen(false)
    setQuery('')
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-start justify-center pt-32"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="max-w-lg w-full mx-4 bg-white rounded-xl shadow-2xl max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div className="p-4 border-b flex items-center gap-3">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suche..."
            className="flex-1 outline-none text-lg"
          />
        </div>

        {/* Results */}
        <div className="overflow-y-auto max-h-[50vh] p-2">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Keine Ergebnisse
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon
              return (
                <button
                  key={item.href}
                  onClick={() => handleSelect(item.href)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    index === selectedIndex ? 'bg-accent' : 'hover:bg-accent'
                  }`}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <span className="flex-1 text-left">{item.title}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </button>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t text-xs text-muted-foreground text-center">
          ↑↓ navigieren · Enter oeffnen · Esc schliessen
        </div>
      </div>
    </div>
  )
}
