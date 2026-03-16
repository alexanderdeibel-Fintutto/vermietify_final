import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Settings, CreditCard, Shield, Download, Trash2, Key, Bell, MapPin, Users, Mail, ArrowRight, CheckCircle2, AlertCircle, User as UserIcon, ScanSearch, MessageCircle, Upload, HardDrive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/contexts/AuthContext'
import { useCreditsContext } from '@/contexts/CreditsContext'
import { PLANS, CREDIT_COSTS } from '@/lib/credits'
import { downloadExport, importData, getStorageStats } from '@/lib/daten-export'
import useDocumentTitle from '@/hooks/useDocumentTitle'

export default function ProfilPage() {
  useDocumentTitle('Mein Profil - BescheidBoxer')
  const { profile } = useAuth()
  const { credits } = useCreditsContext()

  // Demo form state
  const [name, setName] = useState(profile?.name || 'Max Mustermann')
  const [email] = useState(profile?.email || 'max@beispiel.de')
  const [plz, setPlz] = useState('10115')
  const [bedarfsgemeinschaft, setBedarfsgemeinschaft] = useState('1')

  // Notification settings
  const [fristErinnerung, setFristErinnerung] = useState(true)
  const [communityAntworten, setCommunityAntworten] = useState(true)
  const [produktUpdates, setProduktUpdates] = useState(true)

  // Get current plan
  const currentPlan = credits?.plan || 'schnupperer'
  const planDetails = PLANS[currentPlan]

  // Calculate progress percentages (handle -1 = unlimited and 0 = none)
  const safePercent = (used: number, limit: number) => {
    if (limit <= 0) return 0
    return Math.min((used / limit) * 100, 100)
  }
  const creditsProgress = credits ? safePercent(credits.creditsAktuell, planDetails.creditsPerMonth) : 0
  const chatProgress = credits ? safePercent(credits.chatMessagesUsedToday, planDetails.chatMessagesPerDay) : 0
  const scansProgress = credits ? safePercent(credits.scansThisMonth, planDetails.bescheidScansPerMonth) : 0
  const lettersProgress = credits ? safePercent(credits.lettersGeneratedThisMonth, planDetails.lettersPerMonth) : 0

  const handleSaveProfile = () => {
    console.log('Profil speichern:', { name, plz, bedarfsgemeinschaft })
    // TODO: Add toast notification
  }

  const [importStatus, setImportStatus] = useState<string | null>(null)
  const storageStats = getStorageStats()

  const handleExportData = () => {
    downloadExport()
  }

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const result = await importData(file)
    if (result.success) {
      setImportStatus(`${result.keysImported} Datensaetze importiert. Seite wird neu geladen...`)
      setTimeout(() => window.location.reload(), 1500)
    } else {
      setImportStatus(result.error || 'Import fehlgeschlagen')
    }
    e.target.value = ''
  }

  const handleDeleteAccount = () => {
    if (confirm('ACHTUNG: Moechten Sie Ihr Konto wirklich unwiderruflich loeschen? Alle Ihre Daten gehen verloren.')) {
      console.log('Konto loeschen angefordert')
      // TODO: Implement account deletion
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold gradient-text-boxer">Mein Profil</h1>
          </div>
          <p className="text-gray-600">Verwalten Sie Ihre Kontodaten und Einstellungen</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Overview */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Account-Uebersicht
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">{name}</h3>
                    <p className="text-muted-foreground flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4" />
                      {email}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Mitglied seit {new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{planDetails.name}{planDetails.badge ? ` — ${planDetails.badge}` : ''}</Badge>
                    <p className="text-sm text-muted-foreground mt-2">
                      {planDetails.price === 0 ? 'Kostenlos' : `${planDetails.price} EUR / Monat`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Persoenliche Daten */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Persoenliche Daten
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">E-Mail</label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Aendern via E-Mail-Verifizierung</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Postleitzahl
                    </label>
                    <input
                      type="text"
                      value={plz}
                      onChange={(e) => setPlz(e.target.value)}
                      placeholder="12345"
                      maxLength={5}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Bedarfsgemeinschaft
                    </label>
                    <select
                      value={bedarfsgemeinschaft}
                      onChange={(e) => setBedarfsgemeinschaft(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <option key={num} value={num}>{num} {num === 1 ? 'Person' : 'Personen'}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <Button onClick={handleSaveProfile} className="gradient-boxer">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Aenderungen speichern
                </Button>
              </CardContent>
            </Card>

            {/* Abo & Credits */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Abo & Credits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Plan */}
                <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Aktuelles Abo:</span>
                    <Badge variant="outline">{planDetails.name}</Badge>
                  </div>
                  <p className="text-2xl font-bold mb-1">
                    {planDetails.price === 0 ? 'Kostenlos' : `${planDetails.price} EUR / Monat`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Periode endet: {credits?.periodEnd ? new Date(credits.periodEnd).toLocaleDateString('de-DE') : 'N/A'}
                  </p>
                </div>

                {/* Usage Stats */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Credits verfuegbar</span>
                      <span>{credits?.creditsAktuell || 0}{planDetails.creditsPerMonth > 0 ? ` / ${planDetails.creditsPerMonth}` : ''}</span>
                    </div>
                    <Progress value={creditsProgress} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Chat-Nachrichten heute</span>
                      <span>{planDetails.chatMessagesPerDay === -1 ? 'Unbegrenzt' : `${credits?.chatMessagesUsedToday || 0} / ${planDetails.chatMessagesPerDay}`}</span>
                    </div>
                    {planDetails.chatMessagesPerDay > 0 && <Progress value={chatProgress} className="h-2" />}
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Bescheid-Scans diesen Monat</span>
                      <span>{planDetails.bescheidScansPerMonth === -1 ? 'Unbegrenzt' : `${credits?.scansThisMonth || 0} / ${planDetails.bescheidScansPerMonth}`}</span>
                    </div>
                    {planDetails.bescheidScansPerMonth > 0 && <Progress value={scansProgress} className="h-2" />}
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Briefe generiert diesen Monat</span>
                      <span>{planDetails.lettersPerMonth === -1 ? 'Unbegrenzt' : `${credits?.lettersGeneratedThisMonth || 0} / ${planDetails.lettersPerMonth}`}</span>
                    </div>
                    {planDetails.lettersPerMonth > 0 && <Progress value={lettersProgress} className="h-2" />}
                  </div>
                </div>

                {/* Credit Costs Table */}
                <div>
                  <h4 className="font-medium mb-3">Credit-Kosten pro Aktion</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-2 border-b">
                      <span>Bescheid-Scan</span>
                      <span className="font-medium">{CREDIT_COSTS.bescheidScan} Credit</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>Detaillierte Bescheid-Analyse</span>
                      <span className="font-medium">{CREDIT_COSTS.bescheidAnalyseDetail} Credits</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>5 Chat-Nachrichten</span>
                      <span className="font-medium">{CREDIT_COSTS.chatNachrichten5} Credit</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>Personalisierter Brief</span>
                      <span className="font-medium">{CREDIT_COSTS.personalisierterBrief} Credits</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>Postversand Standard</span>
                      <span className="font-medium">{CREDIT_COSTS.postversandStandard} Credits</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span>Postversand Einschreiben</span>
                      <span className="font-medium">{CREDIT_COSTS.postversandEinschreiben} Credits</span>
                    </div>
                  </div>
                </div>

                {/* Upgrade Button */}
                {currentPlan !== 'vollschutz' && (
                  <Link to="/preise">
                    <Button className="w-full gradient-boxer">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Abo upgraden und mehr Credits erhalten
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Benachrichtigungen */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Benachrichtigungen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium">Frist-Erinnerungen</p>
                    <p className="text-sm text-gray-600">Erhalten Sie Benachrichtigungen bei nahenden Fristen</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fristErinnerung}
                      onChange={(e) => setFristErinnerung(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium">Neue Community-Antworten</p>
                    <p className="text-sm text-gray-600">Benachrichtigung bei Antworten auf Ihre Forum-Beitraege</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={communityAntworten}
                      onChange={(e) => setCommunityAntworten(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">Produkt-Updates</p>
                    <p className="text-sm text-gray-600">Informationen ueber neue Features und Verbesserungen</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={produktUpdates}
                      onChange={(e) => setProduktUpdates(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Sicherheit */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Sicherheit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <Key className="h-4 w-4 mr-2" />
                  Passwort aendern
                </Button>

                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Aktive Sitzungen</p>
                  <p className="text-sm text-gray-600">1 aktive Sitzung</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Letzte Anmeldung: {new Date().toLocaleDateString('de-DE')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Daten & Datenschutz */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Daten & Backup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Storage Stats */}
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  <p className="font-medium mb-1">Gespeicherte Daten: {storageStats.totalSize}</p>
                  <div className="space-y-1 text-gray-600">
                    {storageStats.keyDetails.map(k => (
                      <div key={k.key} className="flex justify-between">
                        <span>{k.key}</span>
                        <span>{k.entries} {k.entries === 1 ? 'Eintrag' : 'Eintraege'} ({k.size})</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleExportData}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Backup herunterladen (JSON)
                </Button>

                <div>
                  <label className="cursor-pointer">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      asChild
                    >
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Backup wiederherstellen
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportData}
                      className="hidden"
                    />
                  </label>
                  {importStatus && (
                    <p className="text-sm mt-2 text-blue-600">{importStatus}</p>
                  )}
                </div>

                <Link to="/datenschutz">
                  <Button variant="ghost" className="w-full justify-start">
                    <Shield className="h-4 w-4 mr-2" />
                    Datenschutzerklaerung
                  </Button>
                </Link>

                <div className="pt-4 border-t">
                  <div className="mb-3 p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-800 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Das Loeschen Ihres Kontos ist unwiderruflich. Alle Ihre Daten werden permanent geloescht.</span>
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                    onClick={handleDeleteAccount}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Konto loeschen
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-2 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">Schnellzugriff</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                <Link to="/dashboard" className="block">
                  <Button variant="ghost" className="w-full justify-start gap-2 h-9 text-sm">
                    <Settings className="h-4 w-4 text-blue-500" />
                    Dashboard
                  </Button>
                </Link>
                <Link to="/scan" className="block">
                  <Button variant="ghost" className="w-full justify-start gap-2 h-9 text-sm">
                    <ScanSearch className="h-4 w-4 text-green-500" />
                    Bescheid scannen
                  </Button>
                </Link>
                <Link to="/chat" className="block">
                  <Button variant="ghost" className="w-full justify-start gap-2 h-9 text-sm">
                    <MessageCircle className="h-4 w-4 text-purple-500" />
                    KI-Berater fragen
                  </Button>
                </Link>
                <Link to="/preise" className="block">
                  <Button variant="ghost" className="w-full justify-start gap-2 h-9 text-sm">
                    <CreditCard className="h-4 w-4 text-orange-500" />
                    Preise & Abos
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
