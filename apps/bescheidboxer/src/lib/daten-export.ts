/**
 * Export/Import all BescheidBoxer user data from/to localStorage
 */

const STORAGE_KEYS = [
  'bescheidboxer_chat_history',
  'bescheidboxer_widersprueche',
  'bescheidboxer_cookie_consent',
  'bescheidboxer_theme',
  'bescheidboxer_rechner_verlauf',
  'bescheidboxer_notifications_read',
  'bescheidboxer_onboarding_done',
  'bescheidboxer_checklisten',
  'bescheidboxer_notizen',
  'bescheidboxer_dokumente',
  'bescheidboxer_aktenzeichen',
] as const

export interface ExportData {
  version: number
  exportDatum: string
  daten: Record<string, unknown>
}

export function exportAllData(): ExportData {
  const daten: Record<string, unknown> = {}
  for (const key of STORAGE_KEYS) {
    const raw = localStorage.getItem(key)
    if (raw !== null) {
      try {
        daten[key] = JSON.parse(raw)
      } catch {
        daten[key] = raw
      }
    }
  }
  return {
    version: 1,
    exportDatum: new Date().toISOString(),
    daten,
  }
}

export function downloadExport(): void {
  const data = exportAllData()
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bescheidboxer-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function importData(file: File): Promise<{ success: boolean; keysImported: number; error?: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const data: ExportData = JSON.parse(text)
        if (!data.version || !data.daten) {
          resolve({ success: false, keysImported: 0, error: 'Ungueltige Backup-Datei' })
          return
        }
        let count = 0
        for (const [key, value] of Object.entries(data.daten)) {
          if (STORAGE_KEYS.includes(key as typeof STORAGE_KEYS[number])) {
            localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
            count++
          }
        }
        resolve({ success: true, keysImported: count })
      } catch {
        resolve({ success: false, keysImported: 0, error: 'Datei konnte nicht gelesen werden' })
      }
    }
    reader.onerror = () => {
      resolve({ success: false, keysImported: 0, error: 'Fehler beim Lesen der Datei' })
    }
    reader.readAsText(file)
  })
}

export function getStorageStats(): { totalKeys: number; totalSize: string; keyDetails: { key: string; size: string; entries: number }[] } {
  const keyDetails: { key: string; size: string; entries: number }[] = []
  let totalBytes = 0

  for (const key of STORAGE_KEYS) {
    const raw = localStorage.getItem(key)
    if (raw !== null) {
      const bytes = new Blob([raw]).size
      totalBytes += bytes
      let entries = 1
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) entries = parsed.length
      } catch { /* not an array */ }
      keyDetails.push({
        key: key.replace('bescheidboxer_', ''),
        size: formatBytes(bytes),
        entries,
      })
    }
  }

  return {
    totalKeys: keyDetails.length,
    totalSize: formatBytes(totalBytes),
    keyDetails,
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
