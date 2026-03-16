const STORAGE_KEY = 'bescheidboxer_rechner_verlauf'

export interface RechnerErgebnis {
  id: string
  rechner: string
  rechnerSlug: string
  datum: string
  ergebnis: Record<string, string | number>
}

export function saveRechnerErgebnis(
  rechner: string,
  rechnerSlug: string,
  ergebnis: Record<string, string | number>
) {
  const entry: RechnerErgebnis = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    rechner,
    rechnerSlug,
    datum: new Date().toISOString(),
    ergebnis,
  }

  const existing = loadRechnerVerlauf()
  const updated = [entry, ...existing].slice(0, 50) // keep last 50
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  return entry
}

export function loadRechnerVerlauf(): RechnerErgebnis[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as RechnerErgebnis[]
  } catch {
    return []
  }
}
