import { useState, useEffect, useCallback, useRef } from 'react'
import {
  FileText,
  Upload,
  Trash2,
  Search,
  FolderOpen,
  File,
  FileCheck,
  Stethoscope,
  Receipt,
  FileQuestion,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import Breadcrumbs from '@/components/Breadcrumbs'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Dokument {
  id: string
  name: string
  kategorie: string
  datum: string // ISO date
  groesse: number // bytes
  typ: string // mime type
}

type Kategorie =
  | 'Bescheide'
  | 'Widersprueche'
  | 'Nachweise (Einkommen)'
  | 'Mietvertrag/KdU'
  | 'Aerztliche Atteste'
  | 'Sonstiges'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'bescheidboxer_dokumente'

const KATEGORIEN: { label: Kategorie; icon: React.ElementType; color: string; bg: string }[] = [
  { label: 'Bescheide', icon: FileText, color: 'text-red-600', bg: 'bg-red-50' },
  { label: 'Widersprueche', icon: FileCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'Nachweise (Einkommen)', icon: Receipt, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Mietvertrag/KdU', icon: File, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Aerztliche Atteste', icon: Stethoscope, color: 'text-purple-600', bg: 'bg-purple-50' },
  { label: 'Sonstiges', icon: FileQuestion, color: 'text-gray-600', bg: 'bg-gray-100' },
]

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

function loadDokumente(): Dokument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Dokument[]
  } catch {
    return []
  }
}

function saveDokumente(dokumente: Dokument[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dokumente))
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

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = bytes / Math.pow(1024, i)
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

function getKategorieConfig(kategorie: string) {
  return KATEGORIEN.find((k) => k.label === kategorie) ?? KATEGORIEN[KATEGORIEN.length - 1]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DokumentePage() {
  useDocumentTitle('Dokumente - BescheidBoxer')

  const [dokumente, setDokumente] = useState<Dokument[]>(loadDokumente)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeKategorie, setActiveKategorie] = useState<Kategorie | null>(null)
  const [selectedKategorie, setSelectedKategorie] = useState<Kategorie>('Bescheide')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Persist to localStorage whenever dokumente changes
  useEffect(() => {
    saveDokumente(dokumente)
  }, [dokumente])

  // --- Upload handler ---
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || files.length === 0) return

      const newDokumente: Dokument[] = Array.from(files).map((file) => ({
        id: generateId(),
        name: file.name,
        kategorie: selectedKategorie,
        datum: new Date().toISOString(),
        groesse: file.size,
        typ: file.type || 'application/octet-stream',
      }))

      setDokumente((prev) => [...newDokumente, ...prev])

      // Reset file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [selectedKategorie]
  )

  // --- Delete handler ---
  const handleDelete = useCallback((id: string) => {
    setDokumente((prev) => prev.filter((d) => d.id !== id))
    setDeleteConfirmId(null)
  }, [])

  // --- Trigger file input ---
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // --- Count documents per category ---
  const countByKategorie = (kategorie: string): number => {
    return dokumente.filter((d) => d.kategorie === kategorie).length
  }

  // --- Filtering & sorting ---
  const filteredDokumente = dokumente
    .filter((d) => {
      const matchesKategorie = activeKategorie === null || d.kategorie === activeKategorie
      const matchesSearch =
        searchQuery.trim() === '' ||
        d.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesKategorie && matchesSearch
    })
    .sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime())

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Dokumente' },
          ]}
          className="mb-4"
        />

        {/* ---------------------------------------------------------------- */}
        {/* Header                                                          */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-boxer rounded-full">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Meine Dokumente</h1>
              <p className="text-sm text-gray-500">
                Verwalte alle wichtigen Unterlagen an einem Ort
              </p>
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Tipp info box                                                   */}
        {/* ---------------------------------------------------------------- */}
        <Card className="mb-6 border-blue-200 bg-blue-50/50">
          <CardContent className="p-4 sm:p-5">
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  Tipp: Warum Dokumentenverwaltung wichtig ist
                </h3>
                <p className="text-sm text-blue-800 leading-relaxed">
                  Bei einem Widerspruch gegen Jobcenter-Bescheide ist eine lueckenlose
                  Dokumentation entscheidend. Bewahren Sie alle Bescheide, Nachweise
                  und Schreiben sorgfaeltig auf. Wer seine Unterlagen griffbereit hat,
                  kann Fristen einhalten und Fehler im Bescheid schneller nachweisen.
                  Ordnung schafft Sicherheit - besonders wenn es um Ihre Rechte geht.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ---------------------------------------------------------------- */}
        {/* Upload section                                                  */}
        {/* ---------------------------------------------------------------- */}
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4 text-gray-500" />
              Dokument hinzufuegen
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Category selector */}
              <select
                value={selectedKategorie}
                onChange={(e) => setSelectedKategorie(e.target.value as Kategorie)}
                className="flex-1 px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-colors"
              >
                {KATEGORIEN.map((k) => (
                  <option key={k.label} value={k.label}>
                    {k.label}
                  </option>
                ))}
              </select>

              {/* Upload button */}
              <Button className="gap-2" onClick={handleUploadClick}>
                <Upload className="h-4 w-4" />
                Datei auswaehlen
              </Button>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt,.odt,.rtf"
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Unterstuetzte Formate: PDF, JPG, PNG, DOC, DOCX, TXT, ODT, RTF.
              Die Dateien werden nicht hochgeladen - nur Name und Metadaten werden lokal gespeichert.
            </p>
          </CardContent>
        </Card>

        {/* ---------------------------------------------------------------- */}
        {/* Search bar                                                      */}
        {/* ---------------------------------------------------------------- */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Dokument suchen..."
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
            onClick={() => setActiveKategorie(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeKategorie === null
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Alle ({dokumente.length})
          </button>
          {KATEGORIEN.map((kat) => {
            const count = countByKategorie(kat.label)
            const isActive = activeKategorie === kat.label
            return (
              <button
                key={kat.label}
                onClick={() => setActiveKategorie(isActive ? null : kat.label)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : `${kat.bg} ${kat.color} hover:opacity-80`
                }`}
              >
                {kat.label} ({count})
              </button>
            )
          })}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Empty state                                                     */}
        {/* ---------------------------------------------------------------- */}
        {dokumente.length === 0 && (
          <div className="text-center py-16">
            <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-lg text-gray-900 mb-2">
              Noch keine Dokumente vorhanden
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              Legen Sie hier Ihre wichtigen Unterlagen ab: Bescheide vom Jobcenter,
              Widersprueche, Einkommensnachweise, Mietvertraege und aerztliche Atteste.
              So haben Sie alles griffbereit, wenn Sie es brauchen.
            </p>
            <Button className="gap-2" onClick={handleUploadClick}>
              <Upload className="h-4 w-4" />
              Erstes Dokument hinzufuegen
            </Button>
          </div>
        )}

        {/* No search results */}
        {dokumente.length > 0 && filteredDokumente.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">
              Keine Dokumente gefunden
            </h3>
            <p className="text-sm text-gray-500">
              Versuchen Sie einen anderen Suchbegriff oder waehlen Sie eine andere Kategorie.
            </p>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Document list                                                   */}
        {/* ---------------------------------------------------------------- */}
        <div className="space-y-3">
          {filteredDokumente.map((dok) => {
            const katConfig = getKategorieConfig(dok.kategorie)
            const KatIcon = katConfig.icon
            const isDeleting = deleteConfirmId === dok.id

            return (
              <Card
                key={dok.id}
                className={`transition-all ${
                  isDeleting
                    ? 'border-red-300 ring-2 ring-red-500/10'
                    : 'hover:shadow-md'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Category icon */}
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${katConfig.bg}`}
                    >
                      <KatIcon className={`w-5 h-5 ${katConfig.color}`} />
                    </div>

                    {/* Document info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">
                        {dok.name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${katConfig.bg} ${katConfig.color}`}
                        >
                          {dok.kategorie}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(dok.datum)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatFileSize(dok.groesse)}
                        </span>
                        {dok.typ && (
                          <span className="text-xs text-gray-400 uppercase">
                            {dok.typ.split('/').pop()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Delete button */}
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => setDeleteConfirmId(isDeleting ? null : dok.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Dokument loeschen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Delete confirmation */}
                  {isDeleting && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm text-red-800 mb-2">
                        Dokument &quot;{dok.name}&quot; wirklich loeschen?
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleDelete(dok.id)}
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
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Footer info                                                     */}
        {/* ---------------------------------------------------------------- */}
        {dokumente.length > 0 && (
          <p className="text-xs text-gray-400 text-center mt-10 max-w-2xl mx-auto leading-relaxed">
            Ihre Dokumenten-Metadaten werden lokal in Ihrem Browser gespeichert und
            nicht an unsere Server uebertragen. Es werden keine Dateiinhalte gespeichert -
            nur Name, Kategorie, Datum und Dateigroesse.
          </p>
        )}
      </div>
    </div>
  )
}
