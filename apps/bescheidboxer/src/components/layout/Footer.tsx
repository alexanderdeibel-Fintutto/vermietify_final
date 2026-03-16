import { Link } from 'react-router-dom'
import { Swords } from 'lucide-react'

const footerLinks = {
  hilfe: [
    { name: 'BescheidScan', href: '/scan' },
    { name: 'KI-Rechtsberater', href: '/chat' },
    { name: 'Dokumenten-Werkstatt', href: '/musterschreiben' },
    { name: 'AmtsRechner-Suite', href: '/rechner' },
    { name: 'Widerspruch-Tracker', href: '/tracker' },
    { name: 'Widerspruch-Vorlagen', href: '/widerspruch-vorlagen' },
    { name: 'Community-Forum', href: '/forum' },
    { name: 'Haeufige Probleme', href: '/probleme' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Checklisten', href: '/checklisten' },
    { name: 'Suche', href: '/suche' },
    { name: 'Kontakt & Hilfe', href: '/kontakt' },
    { name: 'Notfall-Hilfe', href: '/notfall' },
    { name: 'Anbieter-Vergleich', href: '/anbieter-vergleich' },
    { name: 'Anwaltssuche', href: '/anwaltssuche' },
    { name: 'Lernbereich', href: '/lernen' },
    { name: 'Erfolgsgeschichten', href: '/erfolgsgeschichten' },
    { name: 'Sanktions-Tracker', href: '/sanktions-tracker' },
    { name: 'Bescheid-Archiv', href: '/bescheid-archiv' },
    { name: 'Erinnerungen', href: '/erinnerungen' },
  ],
  themen: [
    { name: 'Buergergeld (SGB II)', href: '/musterschreiben?kategorie=sgb2' },
    { name: 'ALG I (SGB III)', href: '/musterschreiben?kategorie=sgb3' },
    { name: 'Kosten der Unterkunft', href: '/musterschreiben?kategorie=kdu' },
    { name: 'Widerspruch & Klage', href: '/musterschreiben?kategorie=sgb10' },
    { name: 'Wissen & Ratgeber', href: '/wissen' },
    { name: 'Glossar', href: '/glossar' },
  ],
  konto: [
    { name: 'Mein Profil', href: '/profil' },
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Mein Verlauf', href: '/verlauf' },
    { name: 'Meine Notizen', href: '/notizen' },
    { name: 'Meine Dokumente', href: '/dokumente' },
    { name: 'Aktenzeichen', href: '/aktenzeichen' },
    { name: 'Termine', href: '/termine' },
    { name: 'Bewerbungen', href: '/bewerbungen' },
    { name: 'Meine Faelle', href: '/faelle' },
    { name: 'Statistiken', href: '/statistiken' },
    { name: 'Kosten-Uebersicht', href: '/kosten' },
    { name: 'Preise & Abos', href: '/preise' },
  ],
  oekosystem: [
    { name: 'Mieter-Checker', href: 'https://mieter.fintutto.cloud', external: true },
    { name: 'Vermieter-Portal', href: 'https://vermieter.fintutto.cloud', external: true },
    { name: 'Formulare', href: 'https://formulare.fintutto.cloud', external: true },
  ] as ({ name: string; href: string; external: true } | { name: string; href: string })[],
  rechtliches: [
    { name: 'Impressum', href: '/impressum' },
    { name: 'Datenschutz', href: '/datenschutz' },
    { name: 'AGB', href: '/agb' },
  ],
}

export default function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-boxer">
                <Swords className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-extrabold gradient-text-boxer">Bescheid</span>
                <span className="font-extrabold text-foreground/80">Boxer</span>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground">
              Dein KI-Assistent gegen falsche Bescheide. Rechte kennen, Fehler finden, Widerspruch einlegen.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Ein Fintutto-Produkt.
            </p>
          </div>

          {/* Hilfe */}
          <div>
            <h3 className="font-semibold mb-3">Hilfe</h3>
            <ul className="space-y-2">
              {footerLinks.hilfe.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Themen */}
          <div>
            <h3 className="font-semibold mb-3">Rechtsgebiete</h3>
            <ul className="space-y-2">
              {footerLinks.themen.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Konto */}
          <div>
            <h3 className="font-semibold mb-3">Konto</h3>
            <ul className="space-y-2">
              {footerLinks.konto.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Oekosystem */}
          <div>
            <h3 className="font-semibold mb-3">Fintutto</h3>
            <ul className="space-y-2">
              {footerLinks.oekosystem.map((link) => (
                <li key={link.name}>
                  {'external' in link ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </a>
                  ) : (
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Rechtliches */}
          <div>
            <h3 className="font-semibold mb-3">Rechtliches</h3>
            <ul className="space-y-2">
              {footerLinks.rechtliches.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Fintutto. Alle Rechte vorbehalten.
          </p>
          <p className="text-xs text-muted-foreground text-center md:text-right">
            Keine Rechtsberatung. KI-gestuetzte Informationen basierend auf SGB II, III, X, XII.
          </p>
        </div>
      </div>
    </footer>
  )
}
