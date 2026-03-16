import { Link } from 'react-router-dom'
import { Scale } from 'lucide-react'

export default function ImpressumPage() {
  return (
    <div className="container py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-amt text-white mx-auto mb-4">
          <Scale className="h-7 w-7" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Impressum</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          Angaben gemaess &sect; 5 TMG
        </p>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Angaben gemaess § 5 TMG */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Angaben gemaess &sect; 5 TMG
          </h2>
          <div className="space-y-2 text-gray-600">
            <p className="font-semibold text-gray-900">
              Fintutto UG (haftungsbeschraenkt) &ndash; i.G. (in Gruendung)
            </p>
            <p>
              <strong className="text-gray-900">Vertreten durch:</strong>{' '}
              [Name wird ergaenzt]
            </p>
            <p>
              <strong className="text-gray-900">Adresse:</strong>{' '}
              [Wird nach Eintragung ergaenzt]
            </p>
          </div>
        </section>

        {/* Kontakt */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Kontakt</h2>
          <div className="space-y-2 text-gray-600">
            <p>
              <strong className="text-gray-900">E-Mail:</strong>{' '}
              <a
                href="mailto:kontakt@fintutto.de"
                className="text-primary hover:underline"
              >
                kontakt@fintutto.de
              </a>
            </p>
          </div>
        </section>

        {/* Umsatzsteuer-ID */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Umsatzsteuer-ID
          </h2>
          <p className="text-gray-600">
            Umsatzsteuer-Identifikationsnummer gemaess &sect; 27 a
            Umsatzsteuergesetz: [Wird nach Anmeldung ergaenzt]
          </p>
        </section>

        {/* Handelsregister */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Handelsregister
          </h2>
          <p className="text-gray-600">[Wird nach Eintragung ergaenzt]</p>
        </section>

        {/* Verantwortlich fuer den Inhalt */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Verantwortlich fuer den Inhalt nach &sect; 18 Abs. 2 MStV
          </h2>
          <p className="text-gray-600">[Wird ergaenzt]</p>
        </section>

        {/* EU-Streitschlichtung */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            EU-Streitschlichtung
          </h2>
          <p className="text-gray-600">
            Die Europaeische Kommission stellt eine Plattform zur
            Online-Streitbeilegung (OS) bereit:{' '}
            <a
              href="https://ec.europa.eu/consumers/odr/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              https://ec.europa.eu/consumers/odr/
            </a>
          </p>
          <p className="text-gray-600 mt-2">
            Unsere E-Mail-Adresse finden Sie oben im Impressum. Wir sind nicht
            bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </section>

        {/* Haftungsausschluss */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Haftungsausschluss
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Haftung fuer Inhalte
              </h3>
              <p className="text-gray-600">
                Als Diensteanbieter sind wir gemaess &sect; 7 Abs. 1 TMG fuer
                eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen
                verantwortlich. Nach &sect;&sect; 8 bis 10 TMG sind wir als
                Diensteanbieter jedoch nicht verpflichtet, uebermittelte oder
                gespeicherte fremde Informationen zu ueberwachen oder nach
                Umstaenden zu forschen, die auf eine rechtswidrige Taetigkeit
                hinweisen. Verpflichtungen zur Entfernung oder Sperrung der
                Nutzung von Informationen nach den allgemeinen Gesetzen bleiben
                hiervon unberuehrt. Eine diesbezuegliche Haftung ist jedoch erst
                ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung
                moeglich. Bei Bekanntwerden von entsprechenden
                Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Haftung fuer Links
              </h3>
              <p className="text-gray-600">
                Unser Angebot enthaelt Links zu externen Websites Dritter, auf
                deren Inhalte wir keinen Einfluss haben. Deshalb koennen wir
                fuer diese fremden Inhalte auch keine Gewaehr uebernehmen. Fuer
                die Inhalte der verlinkten Seiten ist stets der jeweilige
                Anbieter oder Betreiber der Seiten verantwortlich. Die
                verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf
                moegliche Rechtsverstoesse ueberprueft. Rechtswidrige Inhalte
                waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine
                permanente inhaltliche Kontrolle der verlinkten Seiten ist
                jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht
                zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir
                derartige Links umgehend entfernen.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Urheberrecht
              </h3>
              <p className="text-gray-600">
                Die durch die Seitenbetreiber erstellten Inhalte und Werke auf
                diesen Seiten unterliegen dem deutschen Urheberrecht. Die
                Vervielfaeltigung, Bearbeitung, Verbreitung und jede Art der
                Verwertung ausserhalb der Grenzen des Urheberrechtes beduerfen
                der schriftlichen Zustimmung des jeweiligen Autors bzw.
                Erstellers. Downloads und Kopien dieser Seite sind nur fuer den
                privaten, nicht kommerziellen Gebrauch gestattet. Soweit die
                Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden,
                werden die Urheberrechte Dritter beachtet. Insbesondere werden
                Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem
                auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir
                um einen entsprechenden Hinweis. Bei Bekanntwerden von
                Rechtsverletzungen werden wir derartige Inhalte umgehend
                entfernen.
              </p>
            </div>
          </div>
        </section>

        {/* Hinweis BescheidBoxer */}
        <section className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Wichtiger Hinweis
          </h2>
          <p className="text-gray-600">
            BescheidBoxer bietet keine Rechtsberatung im Sinne des RDG
            (Rechtsdienstleistungsgesetz). Die KI-gestuetzten Analysen dienen
            lediglich der Information und ersetzen nicht die Beratung durch
            einen Fachanwalt. Bei konkreten Rechtsfragen wenden Sie sich bitte
            an einen Rechtsanwalt oder eine anerkannte Beratungsstelle.
          </p>
        </section>

        {/* Navigation */}
        <div className="flex flex-wrap gap-4 pt-6 border-t border-border">
          <Link
            to="/datenschutz"
            className="text-primary hover:underline text-sm"
          >
            Datenschutzerklaerung
          </Link>
          <Link to="/agb" className="text-primary hover:underline text-sm">
            Allgemeine Geschaeftsbedingungen
          </Link>
        </div>
      </div>
    </div>
  )
}
