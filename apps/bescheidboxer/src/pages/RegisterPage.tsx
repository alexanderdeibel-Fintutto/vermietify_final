import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein.')
      return
    }

    setIsLoading(true)

    try {
      await signUp(email, password, name)
      navigate('/dashboard')
    } catch (err) {
      setError('Registrierung fehlgeschlagen. Bitte versuche es erneut.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container py-16 max-w-md">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-amt text-white mb-4">
          <Shield className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold">Kostenlos registrieren</h1>
        <p className="text-muted-foreground mt-1">Erstelle dein Amtshilfe24-Konto</p>
      </div>

      <Card>
        <CardContent className="p-6">
          {/* Benefits */}
          <div className="mb-6 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm font-medium mb-2">Kostenlos enthalten:</p>
            <ul className="space-y-1">
              {['1 KI-Frage pro Tag', 'Alle Musterschreiben einsehen', 'Forum-Zugang (lesen)'].map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
            <div>
              <Label htmlFor="name">Name (optional)</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dein Name"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="deine@email.de"
                required
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mindestens 6 Zeichen"
                required
                className="mt-1.5"
              />
            </div>
            <Button type="submit" variant="amt" size="lg" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Kostenlos registrieren
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Bereits registriert?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Anmelden
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
