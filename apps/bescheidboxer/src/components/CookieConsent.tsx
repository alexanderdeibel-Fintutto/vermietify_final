import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Cookie, Shield, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CookiePreferences {
  necessary: true
  statistics: boolean
  marketing: boolean
  timestamp: string
}

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    statistics: false,
    marketing: false,
    timestamp: new Date().toISOString()
  })

  useEffect(() => {
    const consent = localStorage.getItem('bescheidboxer_cookie_consent')
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem('bescheidboxer_cookie_consent', JSON.stringify(prefs))
    setShowBanner(false)
    setShowSettings(false)
  }

  const acceptAll = () => {
    saveConsent({
      necessary: true,
      statistics: true,
      marketing: true,
      timestamp: new Date().toISOString()
    })
  }

  const acceptNecessary = () => {
    saveConsent({
      necessary: true,
      statistics: false,
      marketing: false,
      timestamp: new Date().toISOString()
    })
  }

  const saveSettings = () => {
    saveConsent({
      ...preferences,
      timestamp: new Date().toISOString()
    })
  }

  if (!showBanner) return null

  return (
    <>
      {/* Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Cookie className="h-5 w-5 flex-shrink-0 text-blue-600" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Cookies & Datenschutz</h3>
                <p className="text-sm text-muted-foreground">
                  Wir verwenden Cookies, um Ihre Erfahrung zu verbessern. Weitere Informationen in unserer{' '}
                  <Link to="/datenschutz" className="text-blue-600 hover:underline">
                    Datenschutzerklaerung
                  </Link>
                  .
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={acceptNecessary}>
                Nur notwendige
              </Button>
              <Button size="sm" className="gradient-boxer text-white" onClick={acceptAll}>
                Alle akzeptieren
              </Button>
              <button
                onClick={() => setShowSettings(true)}
                className="text-sm text-blue-600 hover:underline"
              >
                Einstellungen
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <button
              onClick={() => setShowSettings(false)}
              className="absolute right-4 top-4 text-gray-500 hover:text-gray-900"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6 flex items-center gap-3">
              <Shield className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold">Cookie-Einstellungen</h2>
            </div>

            <div className="space-y-4">
              {/* Necessary */}
              <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
                <div className="flex-1">
                  <h3 className="font-medium">Notwendig</h3>
                  <p className="text-sm text-muted-foreground">
                    Erforderlich fuer Session und Authentifizierung
                  </p>
                </div>
                <div className="flex items-center">
                  <div className="rounded bg-gray-200 px-3 py-1 text-xs font-medium">Immer aktiv</div>
                </div>
              </div>

              {/* Statistics */}
              <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
                <div className="flex-1">
                  <h3 className="font-medium">Statistik</h3>
                  <p className="text-sm text-muted-foreground">Anonyme Nutzungsanalyse zur Verbesserung</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={preferences.statistics}
                    onChange={(e) => setPreferences({ ...preferences, statistics: e.target.checked })}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-focus:ring-2 peer-focus:ring-blue-300"></div>
                </label>
              </div>

              {/* Marketing */}
              <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
                <div className="flex-1">
                  <h3 className="font-medium">Marketing</h3>
                  <p className="text-sm text-muted-foreground">Derzeit nicht verwendet</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-focus:ring-2 peer-focus:ring-blue-300"></div>
                </label>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={acceptNecessary} className="flex-1">
                Nur notwendige
              </Button>
              <Button onClick={saveSettings} className="gradient-boxer flex-1 text-white">
                Speichern
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
