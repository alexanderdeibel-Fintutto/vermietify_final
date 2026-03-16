import { Link } from 'react-router-dom'
import { FileText } from 'lucide-react'

export default function AgbPage() {
  return (
    <div className="container py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-amt text-white mx-auto mb-4">
          <FileText className="h-7 w-7" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Allgemeine Geschaeftsbedingungen
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          AGB der BescheidBoxer-Plattform
        </p>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto space-y-10">
        {/* § 1 Geltungsbereich */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            &sect; 1 Geltungsbereich
          </h2>
          <p className="text-gray-600">
            Diese Allgemeinen Geschaeftsbedingungen (AGB) gelten fuer die
            Nutzung der BescheidBoxer-Plattform, betrieben von der Fintutto UG
            (haftungsbeschraenkt) i.G. (nachfolgend &bdquo;Anbieter&ldquo;).
            Die Plattform ist unter der Domain bescheidboxer.de und als
            Webanwendung erreichbar.
          </p>
          <p className="text-gray-600 mt-3">
            Mit der Registrierung oder Nutzung der Plattform erkennt der Nutzer
            diese AGB an. Abweichende Bedingungen des Nutzers werden nicht
            anerkannt, es sei denn, der Anbieter stimmt ihrer Geltung
            ausdruecklich schriftlich zu.
          </p>
        </section>

        {/* § 2 Vertragsgegenstand */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            &sect; 2 Vertragsgegenstand
          </h2>
          <p className="text-gray-600 mb-3">
            Der Anbieter stellt dem Nutzer ueber die BescheidBoxer-Plattform
            folgende Dienste zur Verfuegung:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>
              <strong className="text-gray-900">KI-gestuetzte Analysen</strong>{' '}
              &ndash; Automatische Pruefung von Bescheiden auf moegliche Fehler
              (BescheidScan) sowie einen KI-Rechtsberater fuer Fragen zu SGB II,
              III, X und XII
            </li>
            <li>
              <strong className="text-gray-900">Musterschreiben</strong> &ndash;
              Vorlagen und personalisierte Schreiben fuer Widersprueche,
              Antraege und sonstige Korrespondenz mit Behoerden
            </li>
            <li>
              <strong className="text-gray-900">Rechner</strong> &ndash;
              Tools zur Berechnung von Buergergeld, Kosten der Unterkunft,
              Mehrbedarf und weiteren Leistungsanspruechen
            </li>
            <li>
              <strong className="text-gray-900">Community</strong> &ndash;
              Ein Forum zum Austausch mit anderen Betroffenen
            </li>
          </ul>
        </section>

        {/* § 3 Keine Rechtsberatung */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            &sect; 3 Keine Rechtsberatung
          </h2>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-4">
            <p className="text-gray-700 font-semibold mb-2">
              Ausdruecklicher Hinweis:
            </p>
            <p className="text-gray-600">
              BescheidBoxer bietet <strong>keine Rechtsberatung</strong> im
              Sinne des Rechtsdienstleistungsgesetzes (RDG). Saemtliche
              KI-gestuetzten Analysen, Informationen, Musterschreiben und
              Berechnungen dienen ausschliesslich der allgemeinen Information
              und stellen keine individuelle Rechtsberatung dar.
            </p>
          </div>
          <p className="text-gray-600">
            Der Anbieter uebernimmt keine Haftung fuer die Richtigkeit,
            Vollstaendigkeit oder Aktualitaet der bereitgestellten
            Informationen und Analysen. Die Nutzung der Plattform erfolgt auf
            eigenes Risiko des Nutzers. Es wird ausdruecklich empfohlen, bei
            konkreten Rechtsfragen einen Fachanwalt fuer Sozialrecht oder eine
            anerkannte Beratungsstelle (z.&nbsp;B. VdK, SoVD) zu konsultieren.
          </p>
        </section>

        {/* § 4 Registrierung und Benutzerkonto */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            &sect; 4 Registrierung und Benutzerkonto
          </h2>
          <p className="text-gray-600">
            Fuer die Nutzung bestimmter Funktionen ist die Erstellung eines
            Benutzerkontos erforderlich. Der Nutzer ist verpflichtet, bei der
            Registrierung wahrheitsgemaesse Angaben zu machen und seine
            Zugangsdaten vertraulich zu behandeln. Der Nutzer haftet fuer
            saemtliche Aktivitaeten, die unter seinem Benutzerkonto
            vorgenommen werden.
          </p>
          <p className="text-gray-600 mt-3">
            Der Anbieter ist berechtigt, Benutzerkonten bei Verstoss gegen
            diese AGB oder bei missbräuchlicher Nutzung zu sperren oder zu
            loeschen. Der Nutzer kann sein Benutzerkonto jederzeit loeschen.
            Bei Loeschung werden saemtliche personenbezogenen Daten gemaess
            der Datenschutzerklaerung entfernt.
          </p>
        </section>

        {/* § 5 Preise und Zahlung */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            &sect; 5 Preise und Zahlung
          </h2>
          <p className="text-gray-600 mb-4">
            Die Plattform bietet vier Tarife an:
          </p>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Tarif
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Preis
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Beschreibung
                  </th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">
                    Schnupperer
                  </td>
                  <td className="py-3 px-4">Kostenlos</td>
                  <td className="py-3 px-4">
                    Grundfunktionen mit limitierten Zugriffen
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">
                    Starter
                  </td>
                  <td className="py-3 px-4">2,99 EUR/Monat</td>
                  <td className="py-3 px-4">
                    Erweiterte Funktionen fuer den Einstieg
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">
                    Kaempfer
                  </td>
                  <td className="py-3 px-4">4,99 EUR/Monat</td>
                  <td className="py-3 px-4">
                    Voller Funktionsumfang fuer aktive Nutzer
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">
                    Vollschutz
                  </td>
                  <td className="py-3 px-4">7,99 EUR/Monat</td>
                  <td className="py-3 px-4">
                    Premium-Tarif mit allen Funktionen und VIP-Support
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-gray-600">
            Alle Preise verstehen sich inklusive der gesetzlichen
            Mehrwertsteuer. Die Zahlungsabwicklung erfolgt ueber den
            Zahlungsdienstleister Stripe. Der Nutzer kann zwischen monatlicher
            und jaehrlicher Abrechnung waehlen.
          </p>
          <p className="text-gray-600 mt-3">
            Die Kuendigung ist jederzeit zum Ende des laufenden
            Abrechnungszeitraums (Monatsende bzw. Jahresende) moeglich. Nach
            der Kuendigung wird das Benutzerkonto auf den kostenlosen
            Schnupperer-Tarif zurueckgestuft.
          </p>
        </section>

        {/* § 6 Credits und Kontingente */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            &sect; 6 Credits und Kontingente
          </h2>
          <p className="text-gray-600">
            Die Plattform verwendet ein Credit-System fuer bestimmte
            Zusatzleistungen (z.&nbsp;B. Detail-Analysen, Postversand,
            personalisierte Schreiben). Je nach Tarif erhaelt der Nutzer ein
            monatliches Credit-Guthaben. Darueber hinaus koennen Credits in
            Paketen nachgekauft werden.
          </p>
          <p className="text-gray-600 mt-3">
            Credits sind nicht uebertragbar und nicht auszahlbar. Nicht
            verbrauchte Credits aus dem monatlichen Kontingent verfallen am
            Ende des jeweiligen Abrechnungszeitraums (Monatsende). Nachgekaufte
            Credit-Pakete verfallen ebenfalls am Ende des laufenden Monats.
          </p>
          <p className="text-gray-600 mt-3">
            Die Nutzungskontingente (z.&nbsp;B. Anzahl der KI-Nachrichten pro
            Tag, Bescheid-Scans pro Monat, Schreiben pro Monat) richten sich
            nach dem jeweils gebuchten Tarif und sind in der
            Tarifuebersicht einsehbar.
          </p>
        </section>

        {/* § 7 Widerrufsrecht */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            &sect; 7 Widerrufsrecht
          </h2>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Widerrufsbelehrung
          </h3>
          <p className="text-gray-600">
            Verbraucher im Sinne von &sect; 13 BGB haben ein vierzehntagiges
            Widerrufsrecht. Sie haben das Recht, binnen vierzehn Tagen ohne
            Angabe von Gruenden diesen Vertrag zu widerrufen. Die
            Widerrufsfrist betraegt vierzehn Tage ab dem Tag des
            Vertragsschlusses.
          </p>
          <p className="text-gray-600 mt-3">
            Um Ihr Widerrufsrecht auszuueben, muessen Sie uns (Fintutto UG
            (haftungsbeschraenkt) i.G., E-Mail: kontakt@fintutto.de) mittels
            einer eindeutigen Erklaerung (z.&nbsp;B. ein mit der Post
            versandter Brief oder eine E-Mail) ueber Ihren Entschluss, diesen
            Vertrag zu widerrufen, informieren.
          </p>
          <p className="text-gray-600 mt-3">
            Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die
            Mitteilung ueber die Ausuebung des Widerrufsrechts vor Ablauf der
            Widerrufsfrist absenden. Im Falle eines wirksamen Widerrufs werden
            bereits geleistete Zahlungen unverzueglich zurueckerstattet.
          </p>
        </section>

        {/* § 8 Haftung */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            &sect; 8 Haftung
          </h2>
          <p className="text-gray-600">
            Der Anbieter haftet unbeschraenkt fuer Schaeden aus der Verletzung
            des Lebens, des Koerpers oder der Gesundheit, die auf einer
            vorsaetzlichen oder fahrlaessigen Pflichtverletzung des Anbieters
            beruhen, sowie fuer sonstige Schaeden, die auf einer
            vorsaetzlichen oder grob fahrlaessigen Pflichtverletzung des
            Anbieters beruhen.
          </p>
          <p className="text-gray-600 mt-3">
            Bei leichter Fahrlaessigkeit haftet der Anbieter nur bei Verletzung
            wesentlicher Vertragspflichten (Kardinalpflichten) und der Hoehe
            nach begrenzt auf den vorhersehbaren, vertragstypischen Schaden.
            Wesentliche Vertragspflichten sind solche, deren Erfuellung die
            ordnungsgemaesse Durchfuehrung des Vertrages ueberhaupt erst
            ermoeglicht und auf deren Einhaltung der Vertragspartner
            regelmaessig vertrauen darf.
          </p>
          <p className="text-gray-600 mt-3">
            Die vorstehenden Haftungsbeschraenkungen gelten nicht bei
            arglistigem Verschweigen von Maengeln, bei Uebernahme einer
            Garantie und fuer Ansprueche nach dem Produkthaftungsgesetz.
          </p>
        </section>

        {/* § 9 Datenschutz */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            &sect; 9 Datenschutz
          </h2>
          <p className="text-gray-600">
            Der Schutz Ihrer personenbezogenen Daten ist uns wichtig.
            Ausfuehrliche Informationen zur Erhebung, Verarbeitung und Nutzung
            Ihrer Daten finden Sie in unserer{' '}
            <Link
              to="/datenschutz"
              className="text-primary hover:underline"
            >
              Datenschutzerklaerung
            </Link>
            .
          </p>
        </section>

        {/* § 10 Aenderungen der AGB */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            &sect; 10 Aenderungen der AGB
          </h2>
          <p className="text-gray-600">
            Der Anbieter behaelt sich vor, diese AGB jederzeit mit Wirkung fuer
            die Zukunft zu aendern. Der Nutzer wird ueber Aenderungen per
            E-Mail oder durch einen Hinweis beim naechsten Login informiert.
            Widerspricht der Nutzer den geaenderten AGB nicht innerhalb von
            vier Wochen nach Zugang der Aenderungsmitteilung, gelten die
            geaenderten AGB als angenommen. Der Anbieter wird den Nutzer in
            der Aenderungsmitteilung auf die Bedeutung der Frist und das
            Widerspruchsrecht gesondert hinweisen.
          </p>
        </section>

        {/* § 11 Schlussbestimmungen */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            &sect; 11 Schlussbestimmungen
          </h2>
          <p className="text-gray-600">
            Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss
            des UN-Kaufrechts. Bei Verbrauchern gilt diese Rechtswahl nur
            insoweit, als nicht der durch zwingende Bestimmungen des Rechts des
            Staates, in dem der Verbraucher seinen gewoehnlichen Aufenthalt hat,
            gewaehrte Schutz entzogen wird.
          </p>
          <p className="text-gray-600 mt-3">
            Ist der Nutzer Kaufmann, juristische Person des oeffentlichen Rechts
            oder ein oeffentlich-rechtliches Sondervermoegen, ist Gerichtsstand
            fuer alle Streitigkeiten aus Vertragsverhaeltnissen zwischen dem
            Nutzer und dem Anbieter der Sitz des Anbieters.
          </p>
          <p className="text-gray-600 mt-3">
            Sollten einzelne Bestimmungen dieser AGB unwirksam oder
            undurchfuehrbar sein oder nach Vertragsschluss unwirksam oder
            undurchfuehrbar werden, so wird dadurch die Wirksamkeit der AGB im
            Uebrigen nicht beruehrt. An die Stelle der unwirksamen oder
            undurchfuehrbaren Bestimmung soll diejenige wirksame und
            durchfuehrbare Regelung treten, deren Wirkungen der
            wirtschaftlichen Zielsetzung am naechsten kommen, die die
            Vertragsparteien mit der unwirksamen bzw. undurchfuehrbaren
            Bestimmung verfolgt haben.
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
          <Link
            to="/datenschutz"
            className="text-primary hover:underline text-sm"
          >
            Datenschutzerklaerung
          </Link>
        </div>
      </div>
    </div>
  )
}
