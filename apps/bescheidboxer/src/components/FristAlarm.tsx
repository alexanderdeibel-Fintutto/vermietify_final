import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Clock, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react'

interface TrackerEntry {
  id: string
  aktenzeichen: string
  status: string
  fristDatum?: string
  beschreibung?: string
}

interface Alarm {
  id: string
  label: string
  daysLeft: number
  severity: 'urgent' | 'warning' | 'ok'
}

function getAlarms(): Alarm[] {
  try {
    const raw = localStorage.getItem('bescheidboxer_widersprueche')
    if (!raw) return []
    const entries: TrackerEntry[] = JSON.parse(raw)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return entries
      .filter((e) => e.fristDatum && e.status !== 'erledigt')
      .map((e) => {
        const frist = new Date(e.fristDatum!)
        frist.setHours(0, 0, 0, 0)
        const diffMs = frist.getTime() - today.getTime()
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
        const severity: Alarm['severity'] =
          daysLeft <= 3 ? 'urgent' : daysLeft <= 7 ? 'warning' : 'ok'

        return {
          id: e.id,
          label: e.aktenzeichen || e.beschreibung || 'Widerspruch',
          daysLeft,
          severity,
        }
      })
      .filter((a) => a.daysLeft >= 0 && a.daysLeft <= 30)
      .sort((a, b) => a.daysLeft - b.daysLeft)
  } catch {
    return []
  }
}

export default function FristAlarm() {
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setAlarms(getAlarms())
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const urgentCount = alarms.filter((a) => a.severity === 'urgent').length
  const totalCount = alarms.length

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-muted transition-colors"
        aria-label="Frist-Alarm"
      >
        <Bell className={`h-4 w-4 ${urgentCount > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
        {totalCount > 0 && (
          <span
            className={`absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white ${
              urgentCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
            }`}
          >
            {totalCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border bg-popover shadow-lg z-50">
          <div className="p-3 border-b">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Frist-Alarm
            </h3>
          </div>

          {alarms.length === 0 ? (
            <div className="p-4 text-center">
              <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Keine anstehenden Fristen</p>
              <Link
                to="/tracker"
                className="text-xs text-primary hover:underline mt-2 inline-block"
                onClick={() => setOpen(false)}
              >
                Zum Widerspruch-Tracker
              </Link>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {alarms.map((alarm) => (
                <div
                  key={alarm.id}
                  className={`px-3 py-2.5 border-b last:border-b-0 flex items-start gap-2.5 ${
                    alarm.severity === 'urgent' ? 'bg-red-50' : ''
                  }`}
                >
                  {alarm.severity === 'urgent' ? (
                    <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  ) : alarm.severity === 'warning' ? (
                    <Clock className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Clock className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{alarm.label}</p>
                    <p
                      className={`text-xs ${
                        alarm.severity === 'urgent'
                          ? 'text-red-600 font-semibold'
                          : alarm.severity === 'warning'
                            ? 'text-amber-600'
                            : 'text-muted-foreground'
                      }`}
                    >
                      {alarm.daysLeft === 0
                        ? 'Frist laeuft HEUTE ab!'
                        : alarm.daysLeft === 1
                          ? 'Noch 1 Tag'
                          : `Noch ${alarm.daysLeft} Tage`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="p-2 border-t">
            <Link
              to="/tracker"
              className="flex items-center justify-center gap-1.5 text-xs text-primary hover:underline py-1.5"
              onClick={() => setOpen(false)}
            >
              Alle Widersprueche anzeigen
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
