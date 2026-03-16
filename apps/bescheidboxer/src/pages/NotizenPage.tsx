import { useState, useEffect, useCallback } from 'react'
import {
  StickyNote,
  Plus,
  Trash2,
  Search,
  Copy,
  Check,
  Tag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import useDocumentTitle from '@/hooks/useDocumentTitle'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NoteCategory = 'Telefonat' | 'Bescheid' | 'Termin' | 'Dokument' | 'Sonstiges'

interface Notiz {
  id: string
  title: string
  content: string
  category?: NoteCategory
  createdAt: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'bescheidboxer_notizen'

const CATEGORIES: NoteCategory[] = [
  'Telefonat',
  'Bescheid',
  'Termin',
  'Dokument',
  'Sonstiges',
]

const CATEGORY_COLORS: Record<NoteCategory, { bg: string; text: string }> = {
  Telefonat: { bg: 'bg-blue-100', text: 'text-blue-700' },
  Bescheid: { bg: 'bg-red-100', text: 'text-red-700' },
  Termin: { bg: 'bg-amber-100', text: 'text-amber-700' },
  Dokument: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  Sonstiges: { bg: 'bg-gray-100', text: 'text-gray-700' },
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

function loadNotizen(): Notiz[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Notiz[]
  } catch {
    return []
  }
}

function saveNotizen(notizen: Notiz[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notizen))
  } catch {
    // ignore storage errors
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function deriveTitle(content: string): string {
  const firstLine = content.trim().split('\n')[0]?.trim()
  if (!firstLine) return 'Neue Notiz'
  return firstLine.length > 60 ? firstLine.slice(0, 60) + '...' : firstLine
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NotizenPage() {
  useDocumentTitle('Notizen - BescheidBoxer')

  const [notizen, setNotizen] = useState<Notiz[]>(loadNotizen)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<NoteCategory | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editCategory, setEditCategory] = useState<NoteCategory | undefined>(undefined)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Persist to localStorage whenever notizen changes
  useEffect(() => {
    saveNotizen(notizen)
  }, [notizen])

  // --- Create new note ---
  const handleCreate = useCallback(() => {
    const newNote: Notiz = {
      id: generateId(),
      title: 'Neue Notiz',
      content: '',
      createdAt: new Date().toISOString(),
    }
    setNotizen((prev) => [newNote, ...prev])
    setEditingId(newNote.id)
    setEditContent('')
    setEditCategory(undefined)
  }, [])

  // --- Start editing ---
  const handleStartEdit = useCallback((notiz: Notiz) => {
    setEditingId(notiz.id)
    setEditContent(notiz.content)
    setEditCategory(notiz.category)
  }, [])

  // --- Save edit ---
  const handleSaveEdit = useCallback(() => {
    if (editingId === null) return
    setNotizen((prev) =>
      prev.map((n) =>
        n.id === editingId
          ? {
              ...n,
              content: editContent,
              title: deriveTitle(editContent),
              category: editCategory,
            }
          : n
      )
    )
    setEditingId(null)
    setEditContent('')
    setEditCategory(undefined)
  }, [editingId, editContent, editCategory])

  // --- Delete note ---
  const handleDelete = useCallback((id: string) => {
    setNotizen((prev) => prev.filter((n) => n.id !== id))
    setDeleteConfirmId(null)
    setEditingId(null)
  }, [])

  // --- Export all notes ---
  const handleExport = useCallback(async () => {
    const text = notizen
      .map((n) => {
        const lines = [`[${formatDate(n.createdAt)}]`]
        if (n.category) lines[0] += ` [${n.category}]`
        lines.push(n.title)
        lines.push(n.content)
        lines.push('---')
        return lines.join('\n')
      })
      .join('\n\n')

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: do nothing
    }
  }, [notizen])

  // --- Filtering ---
  const filteredNotizen = notizen.filter((n) => {
    const matchesCategory = activeCategory === null || n.category === activeCategory
    const matchesSearch =
      searchQuery.trim() === '' ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.category && n.category.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* ---------------------------------------------------------------- */}
        {/* Header                                                          */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-boxer rounded-full">
              <StickyNote className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Meine Notizen</h1>
              <p className="text-sm text-gray-500">
                Halte wichtige Infos zu deinem Fall fest
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {notizen.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleExport}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? 'Kopiert!' : 'Exportieren'}
              </Button>
            )}
            <Button size="sm" className="gap-2" onClick={handleCreate}>
              <Plus className="h-4 w-4" />
              Neue Notiz
            </Button>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Search bar                                                      */}
        {/* ---------------------------------------------------------------- */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Notizen durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-colors"
          />
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Category filter tabs                                            */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeCategory === null
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Alle
          </button>
          {CATEGORIES.map((cat) => {
            const colors = CATEGORY_COLORS[cat]
            const isActive = activeCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(isActive ? null : cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : `${colors.bg} ${colors.text} hover:opacity-80`
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Empty state                                                     */}
        {/* ---------------------------------------------------------------- */}
        {notizen.length === 0 && (
          <div className="text-center py-16">
            <StickyNote className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-lg text-gray-900 mb-2">
              Noch keine Notizen vorhanden
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              Halte hier alles Wichtige fest: Telefonate mit dem Jobcenter,
              Inhalte von Bescheiden, anstehende Termine oder eigene Gedanken
              zu deinem Fall.
            </p>
            <Button className="gap-2" onClick={handleCreate}>
              <Plus className="h-4 w-4" />
              Erste Notiz erstellen
            </Button>
          </div>
        )}

        {/* No search results */}
        {notizen.length > 0 && filteredNotizen.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">
              Keine Notizen gefunden
            </h3>
            <p className="text-sm text-gray-500">
              Versuche einen anderen Suchbegriff oder waehle eine andere Kategorie.
            </p>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Notes list                                                      */}
        {/* ---------------------------------------------------------------- */}
        <div className="space-y-3">
          {filteredNotizen.map((notiz) => {
            const isEditing = editingId === notiz.id
            const isDeleting = deleteConfirmId === notiz.id

            return (
              <div
                key={notiz.id}
                className={`bg-white rounded-xl border shadow-sm transition-all ${
                  isEditing
                    ? 'border-red-300 ring-2 ring-red-500/10'
                    : 'border-gray-200 hover:shadow-md'
                }`}
              >
                {/* Card header */}
                <div className="flex items-start justify-between p-4 pb-0">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="text-xs text-gray-400">
                      {formatDate(notiz.createdAt)}
                    </span>
                    {(isEditing ? editCategory : notiz.category) && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          CATEGORY_COLORS[
                            (isEditing ? editCategory : notiz.category) as NoteCategory
                          ].bg
                        } ${
                          CATEGORY_COLORS[
                            (isEditing ? editCategory : notiz.category) as NoteCategory
                          ].text
                        }`}
                      >
                        <Tag className="h-3 w-3" />
                        {isEditing ? editCategory : notiz.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {!isEditing && (
                      <button
                        onClick={() => setDeleteConfirmId(isDeleting ? null : notiz.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Notiz loeschen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Delete confirmation */}
                {isDeleting && !isEditing && (
                  <div className="mx-4 mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-red-800 mb-2">
                      Notiz wirklich loeschen?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-1"
                        onClick={() => handleDelete(notiz.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Loeschen
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirmId(null)}
                      >
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                )}

                {/* Card body */}
                <div className="p-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      {/* Category selector */}
                      <div className="flex flex-wrap gap-1.5">
                        {CATEGORIES.map((cat) => {
                          const colors = CATEGORY_COLORS[cat]
                          const isSelected = editCategory === cat
                          return (
                            <button
                              key={cat}
                              onClick={() =>
                                setEditCategory(isSelected ? undefined : cat)
                              }
                              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                                isSelected
                                  ? `${colors.bg} ${colors.text} border-current`
                                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              {cat}
                            </button>
                          )
                        })}
                      </div>

                      {/* Content textarea */}
                      <textarea
                        autoFocus
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        placeholder="Schreibe deine Notiz hier... Die erste Zeile wird automatisch als Titel verwendet."
                        className="w-full min-h-[160px] p-3 rounded-lg border border-gray-200 text-sm bg-gray-50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 resize-y transition-colors"
                      />

                      {/* Character count + actions */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {editContent.length} Zeichen
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // If the note is brand new and empty, delete it
                              if (notiz.content === '' && editContent.trim() === '') {
                                handleDelete(notiz.id)
                              } else {
                                setEditingId(null)
                                setEditContent('')
                                setEditCategory(undefined)
                              }
                            }}
                          >
                            Abbrechen
                          </Button>
                          <Button size="sm" onClick={handleSaveEdit}>
                            Speichern
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="cursor-pointer"
                      onClick={() => handleStartEdit(notiz)}
                    >
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        {notiz.title}
                      </h3>
                      {notiz.content && (
                        <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-4">
                          {notiz.content}
                        </p>
                      )}
                      {!notiz.content && (
                        <p className="text-sm text-gray-400 italic">
                          Klicke, um diese Notiz zu bearbeiten...
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Footer info                                                     */}
        {/* ---------------------------------------------------------------- */}
        {notizen.length > 0 && (
          <p className="text-xs text-gray-400 text-center mt-10 max-w-2xl mx-auto leading-relaxed">
            Deine Notizen werden lokal in deinem Browser gespeichert und nicht an
            unsere Server uebertragen. Nutze die Export-Funktion, um eine Kopie
            deiner Notizen zu erstellen.
          </p>
        )}
      </div>
    </div>
  )
}
