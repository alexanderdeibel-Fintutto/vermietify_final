import { Link, useLocation } from 'react-router-dom'
import { ScanSearch, MessageCircle, Calculator, FileText, LayoutDashboard } from 'lucide-react'

const items = [
  { name: 'Scan', href: '/scan', icon: ScanSearch },
  { name: 'Berater', href: '/chat', icon: MessageCircle },
  { name: 'Rechner', href: '/rechner', icon: Calculator },
  { name: 'Briefe', href: '/musterschreiben', icon: FileText },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
]

export default function MobileNavBar() {
  const { pathname } = useLocation()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border print:hidden" aria-label="Mobile Navigation">
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 w-full h-full text-xs transition-colors ${
                active
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground'
              }`}
            >
              <item.icon className={`h-5 w-5 ${active ? 'text-primary' : ''}`} />
              {item.name}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
