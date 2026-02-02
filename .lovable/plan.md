
# Vermietify - Immobilienverwaltungs-Plattform

## Übersicht
Eine vollständige deutsche Immobilienverwaltungs-Plattform für Vermieter mit Multi-Mandanten-Architektur, die alle Aspekte der Vermietung abdeckt.

---

## Phase 1: Grundgerüst & Design System

### Design System
- **Hauptfarbe**: #2563EB (Blau)
- **Akzentfarbe**: #4F46E5 (Indigo)
- **Hero Gradient**: linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)
- **Font**: Inter (Google Fonts)
- Deutsche Sprache durchgehend mit formeller Anrede (Sie)

### App-Struktur
- Responsive Sidebar-Navigation mit allen 9 Hauptbereichen
- Gemeinsames Layout mit Header und Benutzermenü
- Durchgängiges Komponentendesign (Cards, Buttons, Formulare)

---

## Phase 2: Authentifizierung & Mandanten

### Benutzer-System
- Registrierung und Login mit E-Mail
- Organisation erstellen beim ersten Login
- Benutzer können zu Organisationen eingeladen werden

### Datenbank-Struktur (Supabase)
- **organizations**: Vermieter-Unternehmen/Einzelpersonen
- **profiles**: Benutzerprofile mit Verknüpfung zu Organisationen
- **user_roles**: Rollen (admin, member) für Berechtigungen
- Row-Level Security für alle Tabellen

---

## Phase 3: Dashboard

### KPI-Karten
- Gesamtmiete (monatlich)
- Leerstandsquote (%)
- Offene Reparaturen (Anzahl)
- Ausstehende Zahlungen (€)

### Visualisierungen
- Liniendiagramm: Mieteinnahmen der letzten 12 Monate
- Tabelle: Nächste Fälligkeiten (Mietzahlungen, Vertragsenden)
- Liste: Offene Aufgaben und Erinnerungen

---

## Phase 4: Immobilienverwaltung

### Gebäude-Übersicht
- Karten-Grid mit allen Gebäuden
- Statusanzeige (vermietet/leer)
- Schnellaktionen pro Gebäude

### Gebäude hinzufügen/bearbeiten
- Name, Adresse, PLZ, Stadt
- Gebäudetyp (Mehrfamilienhaus, Einfamilienhaus, Gewerbe)
- Baujahr, Gesamtfläche

### Wohnungseinheiten
- Liste aller Wohnungen pro Gebäude
- Pro Einheit: Nummer, Fläche, Zimmer, Kaltmiete, Status
- Status: Vermietet, Leer, In Renovierung

---

## Phase 5: Mieterverwaltung

### Mieterliste
- Suchbare Tabelle aller Mieter
- Filterung nach Gebäude, Status
- Kontaktdaten auf einen Blick

### Mieter-Profil
- Persönliche Daten (Name, Adresse, Kontakt)
- Aktuelle und vergangene Mietverträge
- Zahlungshistorie
- Dokumentenübersicht

### Mietvertrag-Wizard (Schritt für Schritt)
1. Wohnungsauswahl
2. Mieterdaten eingeben/auswählen
3. Vertragsdaten (Start, Ende, Kaltmiete, Nebenkosten)
4. Kaution und Zahlungsmodalitäten
5. Zusammenfassung und Bestätigung

---

## Phase 6: Finanzen

### Einnahmen & Ausgaben
- Übersicht aller Transaktionen
- Kategorisierung (Miete, Nebenkosten, Reparaturen, etc.)
- Import/Export-Funktionen

### Bankkonten
- Verknüpfung mehrerer Konten
- Zuordnung zu Objekten

### Berichte
- Monatliche/Jährliche Zusammenfassungen
- Objekt-bezogene Auswertungen

---

## Phase 7: Dokumente

### Dokumentenverwaltung
- Upload-Funktion für alle Dokumenttypen
- Kategorisierung (Verträge, Rechnungen, Bescheide, etc.)
- Zuordnung zu Gebäuden/Mietern

### Dokumententypen
- Mietverträge
- Übergabeprotokolle
- Nebenkostenabrechnungen
- Versicherungspolicen

---

## Phase 8: Abrechnungen

### Nebenkostenabrechnung
- Erfassung aller umlagefähigen Kosten
- Verteilerschlüssel (qm, Personen, Einheiten)
- Automatische Berechnung pro Mieter
- PDF-Export

---

## Phase 9: Steuern

### Anlage V Vorbereitung
- Zusammenfassung relevanter Daten
- Export-Format für Steuerberater
- Übersicht aller steuerrelevanten Positionen

---

## Phase 10: Kommunikation

### Nachrichten
- Direkte Nachrichten an Mieter
- E-Mail-Versand
- Vorlagen für häufige Anschreiben
- Nachrichtenhistorie

---

## Phase 11: Einstellungen

### Organisation
- Firmenname, Logo, Kontaktdaten
- Mitgliederverwaltung

### Benutzer
- Profilbearbeitung
- Passwortänderung
- Benachrichtigungseinstellungen

---

## Technische Umsetzung

### Frontend
- React + TypeScript + Tailwind CSS
- shadcn/ui Komponenten
- Recharts für Diagramme
- React Router für Navigation

### Backend (Supabase)
- Authentication mit Multi-Tenant-Unterstützung
- PostgreSQL mit Row-Level Security
- Storage für Dokumente
- Edge Functions bei Bedarf

### Datenbank-Tabellen
- organizations, profiles, user_roles
- buildings, units
- tenants, leases
- transactions, documents
- utility_costs, messages
