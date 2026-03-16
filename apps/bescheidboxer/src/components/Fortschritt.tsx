import { useState, useEffect } from "react";
import { Check, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface Meilenstein {
  id: string;
  titel: string;
  beschreibung: string;
  erreicht: boolean;
  link: string;
  linkText: string;
}

interface Level {
  name: string;
  farbe: string;
  ringFarbe: string;
  min: number;
  max: number;
}

const LEVELS: Level[] = [
  { name: "Neuling", farbe: "bg-gray-100 text-gray-600 border-gray-300", ringFarbe: "stroke-gray-400", min: 0, max: 2 },
  { name: "Einsteiger", farbe: "bg-blue-100 text-blue-700 border-blue-300", ringFarbe: "stroke-blue-500", min: 3, max: 5 },
  { name: "Kaempfer", farbe: "bg-amber-100 text-amber-700 border-amber-300", ringFarbe: "stroke-amber-500", min: 6, max: 7 },
  { name: "Bescheid-Boxer", farbe: "gradient-boxer text-white border-red-400", ringFarbe: "stroke-red-500", min: 8, max: 9 },
];

function getLevel(erreicht: number): Level {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (erreicht >= LEVELS[i].min) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

function pruefeMeilensteine(): Meilenstein[] {
  const chatHistory = localStorage.getItem("bescheidboxer_chat_history");
  const widersprueche = localStorage.getItem("bescheidboxer_widersprueche");
  const rechnerVerlauf = localStorage.getItem("bescheidboxer_rechner_verlauf");
  const onboardingDone = localStorage.getItem("bescheidboxer_onboarding_done");

  let chatNachrichten = 0;
  try {
    const parsed = chatHistory ? JSON.parse(chatHistory) : [];
    chatNachrichten = Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    chatNachrichten = 0;
  }

  let trackerEintraege = 0;
  try {
    const parsed = widersprueche ? JSON.parse(widersprueche) : [];
    trackerEintraege = Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    trackerEintraege = 0;
  }

  let rechnerErgebnisse = 0;
  try {
    const parsed = rechnerVerlauf ? JSON.parse(rechnerVerlauf) : [];
    rechnerErgebnisse = Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    rechnerErgebnisse = 0;
  }

  const termine = localStorage.getItem("bescheidboxer_termine");
  const bewerbungen = localStorage.getItem("bescheidboxer_bewerbungen");
  const dokumente = localStorage.getItem("bescheidboxer_dokumente");

  let terminEintraege = 0;
  try {
    const parsed = termine ? JSON.parse(termine) : [];
    terminEintraege = Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    terminEintraege = 0;
  }

  let bewerbungEintraege = 0;
  try {
    const parsed = bewerbungen ? JSON.parse(bewerbungen) : [];
    bewerbungEintraege = Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    bewerbungEintraege = 0;
  }

  let dokumentEintraege = 0;
  try {
    const parsed = dokumente ? JSON.parse(dokumente) : [];
    dokumentEintraege = Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    dokumentEintraege = 0;
  }

  const hatOnboarding = onboardingDone === "true";
  const hatChat = chatNachrichten > 0;
  const hatRechner = rechnerErgebnisse > 0;
  const hatWiderspruch = trackerEintraege > 0;
  const hat5Berechnungen = rechnerErgebnisse >= 5;
  const hatTermin = terminEintraege > 0;
  const hatBewerbung = bewerbungEintraege > 0;
  const hatDokument = dokumentEintraege > 0;

  const genutzteFeatures = [hatChat, hatRechner, hatWiderspruch, hatTermin, hatBewerbung, hatDokument].filter(Boolean).length;
  const istProfi = genutzteFeatures >= 4;

  return [
    {
      id: "onboarding",
      titel: "Erste Schritte",
      beschreibung: "Onboarding abgeschlossen",
      erreicht: hatOnboarding,
      link: "/dashboard",
      linkText: "Onboarding starten",
    },
    {
      id: "erster-chat",
      titel: "Erster Chat",
      beschreibung: "Erste Nachricht im Chat gesendet",
      erreicht: hatChat,
      link: "/chat",
      linkText: "Zum Chat",
    },
    {
      id: "rechner",
      titel: "Rechner genutzt",
      beschreibung: "Einen Rechner verwendet",
      erreicht: hatRechner,
      link: "/rechner",
      linkText: "Zu den Rechnern",
    },
    {
      id: "widerspruch",
      titel: "Widerspruch gestartet",
      beschreibung: "Ersten Tracker-Eintrag angelegt",
      erreicht: hatWiderspruch,
      link: "/widerspruch",
      linkText: "Zum Tracker",
    },
    {
      id: "5-berechnungen",
      titel: "5 Berechnungen",
      beschreibung: "5 oder mehr Rechner-Ergebnisse erzielt",
      erreicht: hat5Berechnungen,
      link: "/rechner",
      linkText: "Weiter rechnen",
    },
    {
      id: "termin",
      titel: "Termin geplant",
      beschreibung: "Ersten Jobcenter-Termin angelegt",
      erreicht: hatTermin,
      link: "/termine",
      linkText: "Termin anlegen",
    },
    {
      id: "bewerbung",
      titel: "Bewerbung erfasst",
      beschreibung: "Erste Bewerbung dokumentiert",
      erreicht: hatBewerbung,
      link: "/bewerbungen",
      linkText: "Bewerbung erfassen",
    },
    {
      id: "dokument",
      titel: "Dokument hochgeladen",
      beschreibung: "Erstes Dokument abgelegt",
      erreicht: hatDokument,
      link: "/dokumente",
      linkText: "Dokument hochladen",
    },
    {
      id: "profi",
      titel: "Profi-Nutzer",
      beschreibung: "4+ verschiedene Features genutzt",
      erreicht: istProfi,
      link: "/dashboard",
      linkText: "Features entdecken",
    },
  ];
}

function FortschrittsRing({ prozent, ringFarbe }: { prozent: number; ringFarbe: string }) {
  const radius = 54;
  const umfang = 2 * Math.PI * radius;
  const offset = umfang - (prozent / 100) * umfang;

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-gray-200"
          strokeWidth="8"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          className={ringFarbe}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={umfang}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease-in-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{Math.round(prozent)}%</span>
        <span className="text-xs text-gray-500">Fortschritt</span>
      </div>
    </div>
  );
}

export default function Fortschritt() {
  const [meilensteine, setMeilensteine] = useState<Meilenstein[]>([]);

  useEffect(() => {
    setMeilensteine(pruefeMeilensteine());
  }, []);

  const erreichtAnzahl = meilensteine.filter((m) => m.erreicht).length;
  const gesamt = meilensteine.length;
  const prozent = gesamt > 0 ? (erreichtAnzahl / gesamt) * 100 : 0;
  const level = getLevel(erreichtAnzahl);

  const naechsterMeilenstein = meilensteine.find((m) => !m.erreicht);

  return (
    <div className="space-y-6">
      {/* Level-Badge und Fortschrittsring */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <FortschrittsRing prozent={prozent} ringFarbe={level.ringFarbe} />

          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm text-gray-500 mb-1">Dein aktuelles Level</p>
            <span
              className={`inline-block px-4 py-2 rounded-full text-lg font-bold border ${level.farbe}`}
            >
              {level.name}
            </span>
            <p className="text-sm text-gray-500 mt-3">
              {erreichtAnzahl} von {gesamt} Meilensteinen erreicht
            </p>
            {erreichtAnzahl === gesamt && (
              <p className="text-sm font-semibold text-green-600 mt-1">
                Alle Meilensteine freigeschaltet!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Naechster Meilenstein Hinweis */}
      {naechsterMeilenstein && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Naechster Meilenstein</p>
            <p className="text-sm text-amber-700">
              {naechsterMeilenstein.titel} &ndash; {naechsterMeilenstein.beschreibung}
            </p>
          </div>
          <Link to={naechsterMeilenstein.link}>
            <Button size="sm" variant="outline" className="border-amber-400 text-amber-700 hover:bg-amber-100">
              {naechsterMeilenstein.linkText}
            </Button>
          </Link>
        </div>
      )}

      {/* Meilenstein-Checkliste */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Meilensteine</h3>
        <ul className="space-y-3">
          {meilensteine.map((m) => {
            const Icon = m.erreicht ? Check : Lock;
            return (
              <li
                key={m.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  m.erreicht
                    ? "bg-green-50 border border-green-200"
                    : "bg-gray-50 border border-gray-200"
                }`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    m.erreicht ? "bg-green-500 text-white" : "bg-gray-300 text-gray-500"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      m.erreicht ? "text-green-800" : "text-gray-600"
                    }`}
                  >
                    {m.titel}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{m.beschreibung}</p>
                </div>
                {!m.erreicht && (
                  <Link to={m.link}>
                    <Button size="sm" variant="ghost" className="text-xs text-gray-500 hover:text-gray-700">
                      {m.linkText}
                    </Button>
                  </Link>
                )}
                {m.erreicht && (
                  <span className="text-xs font-medium text-green-600 flex-shrink-0">Erreicht</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
