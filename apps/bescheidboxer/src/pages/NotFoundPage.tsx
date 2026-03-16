import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <div className="container py-24 text-center">
      <div className="text-8xl font-extrabold gradient-text-amt mb-4">404</div>
      <h1 className="text-2xl font-bold mb-2">Seite nicht gefunden</h1>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        Diese Seite existiert nicht. Aber deine Rechte beim Amt - die existieren.
        Lass uns dir helfen, sie durchzusetzen.
      </p>
      <div className="flex gap-4 justify-center">
        <Button variant="outline" asChild>
          <Link to="/">
            <Home className="mr-2 h-4 w-4" />
            Zur Startseite
          </Link>
        </Button>
        <Button variant="amt" asChild>
          <Link to="/chat">
            KI-Berater fragen
          </Link>
        </Button>
      </div>
    </div>
  )
}
