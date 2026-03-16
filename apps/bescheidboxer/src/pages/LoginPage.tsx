import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await signIn(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError('E-Mail oder Passwort falsch. Bitte versuche es erneut.')
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
        <h1 className="text-2xl font-bold">Anmelden</h1>
        <p className="text-muted-foreground mt-1">Bei Amtshilfe24 anmelden</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
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
                placeholder="Dein Passwort"
                required
                className="mt-1.5"
              />
            </div>
            <Button type="submit" variant="amt" size="lg" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Anmelden
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Noch kein Konto?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Kostenlos registrieren
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
