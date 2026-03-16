import { Link } from 'react-router-dom'
import { Shield } from 'lucide-react'

export default function DatenschutzPage() {
  return (
    <div className="container py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-amt text-white mx-auto mb-4">
          <Shield className="h-7 w-7" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Datenschutzerklaerung
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          Informationen zum Schutz Ihrer personenbezogenen Daten
        </p>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto space-y-10">
        {/* 1. Datenschutz auf einen Blick */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            1. Datenschutz auf einen Blick
          </h2>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Allgemeine Hinweise
          </h3>
          <p className="text-gray-600">
            Die folgenden Hinweise geben einen einfachen Ueberblick darueber,
            was mit Ihren personenbezogenen Daten passiert, wenn Sie diese
            Website besuchen. Personenbezogene Daten sind alle Daten, mit denen
            Sie persoenlich identifiziert werden koennen. Ausfuehrliche
            Informationen zum Thema Datenschutz entnehmen Sie unserer unter
            diesem Text aufgefuehrten Datenschutzerklaerung.
          </p>
          <p className="text-gray-600 mt-3">
            Die Datenverarbeitung auf dieser Website erfolgt durch den
            Websitebetreiber. Dessen Kontaktdaten koennen Sie dem Abschnitt
            &bdquo;Verantwortliche Stelle&ldquo; in dieser
            Datenschutzerklaerung entnehmen.
          </p>
        </section>

        {/* 2. Verantwortliche Stelle */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            2. Verantwortliche Stelle
          </h2>
          <div className="space-y-2 text-gray-600">
            <p className="font-semibold text-gray-900">
              Fintutto UG (haftungsbeschraenkt) i.G.
            </p>
            <p>[Adresse wird nach Eintragung ergaenzt]</p>
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
          <p className="text-gray-600 mt-3">
            Verantwortliche Stelle ist die natuerliche oder juristische Person,
            die allein oder gemeinsam mit anderen ueber die Zwecke und Mittel
            der Verarbeitung von personenbezogenen Daten (z.&nbsp;B. Namen,
            E-Mail-Adressen o.&nbsp;Ae.) entscheidet.
          </p>
        </section>

        {/* 3. Erhebung und Speicherung personenbezogener Daten */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            3. Erhebung und Speicherung personenbezogener Daten
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                a) Beim Besuch der Website
              </h3>
              <p className="text-gray-600 mb-2">
                Beim Aufrufen unserer Website werden durch den auf Ihrem
                Endgeraet zum Einsatz kommenden Browser automatisch
                Informationen an den Server unserer Website gesendet. Diese
                Informationen werden temporaer in einem sogenannten Logfile
                (Server-Log-Files) gespeichert. Folgende Informationen werden
                dabei ohne Ihr Zutun erfasst und bis zur automatisierten
                Loeschung gespeichert:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                <li>IP-Adresse des anfragenden Rechners</li>
                <li>Datum und Uhrzeit des Zugriffs</li>
                <li>Name und URL der abgerufenen Datei</li>
                <li>
                  Website, von der aus der Zugriff erfolgt (Referrer-URL)
                </li>
                <li>
                  Verwendeter Browser und ggf. das Betriebssystem Ihres
                  Rechners sowie der Name Ihres Access-Providers
                </li>
              </ul>
              <p className="text-gray-600 mt-2">
                Die Rechtsgrundlage fuer die Datenverarbeitung ist Art. 6 Abs. 1
                lit. f DSGVO. Die Verarbeitung dient der Gewaehrleistung eines
                reibungslosen Verbindungsaufbaus der Website, einer komfortablen
                Nutzung unserer Website, der Auswertung der Systemsicherheit und
                -stabilitaet sowie zu weiteren administrativen Zwecken.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                b) Bei Nutzung unseres Kontaktformulars
              </h3>
              <p className="text-gray-600">
                Bei Fragen jeglicher Art bieten wir Ihnen die Moeglichkeit, mit
                uns ueber ein auf der Website bereitgestelltes Formular oder per
                E-Mail Kontakt aufzunehmen. Dabei ist die Angabe einer
                gueltigen E-Mail-Adresse erforderlich, damit wir wissen, von
                wem die Anfrage stammt und um diese beantworten zu koennen. Die
                Verarbeitung der Daten erfolgt auf Grundlage von Art. 6 Abs. 1
                lit. b DSGVO (Vertragsanbahnung) bzw. Art. 6 Abs. 1 lit. f
                DSGVO (berechtigtes Interesse).
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                c) Bei Registrierung eines Benutzerkontos
              </h3>
              <p className="text-gray-600">
                Wenn Sie ein Benutzerkonto erstellen, erheben wir Ihre
                E-Mail-Adresse und ein verschluesseltes Passwort. Die
                Authentifizierung erfolgt ueber Supabase Auth. Ihr Passwort wird
                ausschliesslich in gehashter Form gespeichert und ist fuer uns
                nicht einsehbar. Die Rechtsgrundlage ist Art. 6 Abs. 1 lit. b
                DSGVO (Vertragsdurchfuehrung).
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                d) Bei Nutzung des BescheidScan
              </h3>
              <p className="text-gray-600">
                Wenn Sie die BescheidScan-Funktion nutzen, laden Sie Dokumente
                (z.&nbsp;B. Bescheide) hoch. Diese Dokumente werden
                ausschliesslich temporaer zur Verarbeitung durch unsere
                KI-Analyse verwendet und nicht dauerhaft auf unseren Servern
                gespeichert. Die Verarbeitung erfolgt auf Grundlage von Art. 6
                Abs. 1 lit. b DSGVO (Vertragsdurchfuehrung) und Art. 6 Abs. 1
                lit. a DSGVO (Einwilligung).
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                e) Bei Nutzung des KI-Chats
              </h3>
              <p className="text-gray-600">
                Wenn Sie den KI-Rechtsberater nutzen, werden Ihre
                Chatverlaeufe verschluesselt in unserer Datenbank gespeichert.
                Sie koennen Ihre Chatverlaeufe jederzeit selbststaendig
                loeschen. Die Verarbeitung erfolgt auf Grundlage von Art. 6
                Abs. 1 lit. b DSGVO (Vertragsdurchfuehrung).
              </p>
            </div>
          </div>
        </section>

        {/* 4. Weitergabe von Daten */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            4. Weitergabe von Daten
          </h2>
          <p className="text-gray-600 mb-3">
            Eine Uebermittlung Ihrer persoenlichen Daten an Dritte zu anderen
            als den im Folgenden aufgefuehrten Zwecken findet nicht statt. Wir
            geben Ihre persoenlichen Daten nur an Dritte weiter, wenn dies zur
            Vertragsdurchfuehrung erforderlich ist. Folgende Auftragsverarbeiter
            setzen wir ein:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>
              <strong className="text-gray-900">Supabase</strong> &ndash;
              Datenbank, Authentifizierung und Dateispeicherung
            </li>
            <li>
              <strong className="text-gray-900">Stripe</strong> &ndash;
              Zahlungsabwicklung (bei kostenpflichtigen Tarifen)
            </li>
            <li>
              <strong className="text-gray-900">
                Anthropic / OpenAI
              </strong>{' '}
              &ndash; KI-Funktionen (BescheidScan, KI-Chat). Es werden nur die
              fuer die Analyse notwendigen Daten uebermittelt.
            </li>
          </ul>
          <p className="text-gray-600 mt-3">
            Mit allen Auftragsverarbeitern haben wir
            Auftragsverarbeitungsvertraege (AVV) gemaess Art. 28 DSGVO
            abgeschlossen.
          </p>
        </section>

        {/* 5. Cookies */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Cookies</h2>
          <p className="text-gray-600">
            Wir verwenden auf unserer Website ausschliesslich technisch
            notwendige Cookies. Ein technisch notwendiges Cookie wird gesetzt,
            um den Supabase Auth Token zu speichern, der fuer die
            Authentifizierung und Aufrechterhaltung Ihrer Sitzung erforderlich
            ist. Dieses Cookie ist fuer den Betrieb der Website unbedingt
            erforderlich und kann nicht deaktiviert werden. Es werden keine
            Tracking-Cookies oder Cookies zu Werbezwecken eingesetzt. Die
            Rechtsgrundlage fuer die Verwendung technisch notwendiger Cookies
            ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).
          </p>
        </section>

        {/* 6. SSL-Verschluesselung */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            6. SSL-Verschluesselung
          </h2>
          <p className="text-gray-600">
            Diese Seite nutzt aus Sicherheitsgruenden und zum Schutz der
            Uebertragung vertraulicher Inhalte, wie zum Beispiel Anfragen, die
            Sie an uns als Seitenbetreiber senden, eine SSL- bzw.
            TLS-Verschluesselung. Eine verschluesselte Verbindung erkennen Sie
            daran, dass die Adresszeile des Browsers von &bdquo;http://&ldquo;
            auf &bdquo;https://&ldquo; wechselt und an dem Schloss-Symbol in
            Ihrer Browserzeile. Wenn die SSL- bzw. TLS-Verschluesselung
            aktiviert ist, koennen die Daten, die Sie an uns uebermitteln, nicht
            von Dritten mitgelesen werden.
          </p>
        </section>

        {/* 7. Rechte der betroffenen Person */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            7. Rechte der betroffenen Person
          </h2>
          <p className="text-gray-600 mb-3">
            Sie haben gegenueber uns folgende Rechte hinsichtlich der Sie
            betreffenden personenbezogenen Daten:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>
              <strong className="text-gray-900">Recht auf Auskunft</strong>{' '}
              (Art. 15 DSGVO) &ndash; Sie haben das Recht, Auskunft ueber Ihre
              von uns verarbeiteten personenbezogenen Daten zu verlangen.
            </li>
            <li>
              <strong className="text-gray-900">Recht auf Berichtigung</strong>{' '}
              (Art. 16 DSGVO) &ndash; Sie haben das Recht, die Berichtigung
              unrichtiger oder die Vervollstaendigung Ihrer bei uns
              gespeicherten personenbezogenen Daten zu verlangen.
            </li>
            <li>
              <strong className="text-gray-900">Recht auf Loeschung</strong>{' '}
              (Art. 17 DSGVO) &ndash; Sie haben das Recht, die Loeschung Ihrer
              bei uns gespeicherten personenbezogenen Daten zu verlangen, soweit
              nicht die Verarbeitung zur Ausuebung des Rechts auf freie
              Meinungsaeusserung und Information, zur Erfuellung einer
              rechtlichen Verpflichtung oder aus Gruenden des oeffentlichen
              Interesses erforderlich ist.
            </li>
            <li>
              <strong className="text-gray-900">
                Recht auf Einschraenkung der Verarbeitung
              </strong>{' '}
              (Art. 18 DSGVO) &ndash; Sie haben das Recht, die Einschraenkung
              der Verarbeitung Ihrer personenbezogenen Daten zu verlangen.
            </li>
            <li>
              <strong className="text-gray-900">
                Recht auf Datenportabilitaet
              </strong>{' '}
              (Art. 20 DSGVO) &ndash; Sie haben das Recht, Ihre
              personenbezogenen Daten, die Sie uns bereitgestellt haben, in
              einem strukturierten, gaengigen und maschinenlesbaren Format zu
              erhalten.
            </li>
            <li>
              <strong className="text-gray-900">Recht auf Widerspruch</strong>{' '}
              (Art. 21 DSGVO) &ndash; Sie haben das Recht, jederzeit gegen die
              Verarbeitung Ihrer personenbezogenen Daten Widerspruch einzulegen.
            </li>
          </ul>
          <p className="text-gray-600 mt-3">
            Zur Ausuebung Ihrer Rechte wenden Sie sich bitte an{' '}
            <a
              href="mailto:kontakt@fintutto.de"
              className="text-primary hover:underline"
            >
              kontakt@fintutto.de
            </a>
            .
          </p>
        </section>

        {/* 8. Recht auf Beschwerde */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            8. Recht auf Beschwerde bei der Aufsichtsbehoerde
          </h2>
          <p className="text-gray-600">
            Unbeschadet eines anderweitigen verwaltungsrechtlichen oder
            gerichtlichen Rechtsbehelfs steht Ihnen das Recht auf Beschwerde bei
            einer Aufsichtsbehoerde, insbesondere in dem Mitgliedstaat Ihres
            Aufenthaltsorts, Ihres Arbeitsplatzes oder des Orts des
            mutmasslichen Verstosses, zu, wenn Sie der Ansicht sind, dass die
            Verarbeitung der Sie betreffenden personenbezogenen Daten gegen die
            DSGVO verstoesst (Art. 77 DSGVO).
          </p>
        </section>

        {/* 9. Aenderung der Datenschutzerklaerung */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            9. Aenderung der Datenschutzerklaerung
          </h2>
          <p className="text-gray-600">
            Wir behalten uns vor, diese Datenschutzerklaerung anzupassen, damit
            sie stets den aktuellen rechtlichen Anforderungen entspricht oder um
            Aenderungen unserer Leistungen in der Datenschutzerklaerung
            umzusetzen, z.&nbsp;B. bei der Einfuehrung neuer Services. Fuer
            Ihren erneuten Besuch gilt dann die neue Datenschutzerklaerung.
          </p>
        </section>

        {/* Stand */}
        <p className="text-sm text-gray-500 italic">Stand: Februar 2026</p>

        {/* Navigation */}
        <div className="flex flex-wrap gap-4 pt-6 border-t border-border">
          <Link
            to="/impressum"
            className="text-primary hover:underline text-sm"
          >
            Impressum
          </Link>
          <Link to="/agb" className="text-primary hover:underline text-sm">
            Allgemeine Geschaeftsbedingungen
          </Link>
        </div>
      </div>
    </div>
  )
}
