type HaltT = {
  ankunftsDatum?: string;
  ezAnkunftsDatum?: string;
  abgangsDatum?: string;
  ezAbgangsDatum?: string;
  ort: {
    name: string;
    locationId: string;
    evaNr: string;
    position: {
      latitude: number;
      longitude: number;
    };
    stationId: string;
  };
  gleis?: string;
  ezGleis?: string;
  plattform?: string;
  plattformTyp?: string;
  attributNotizen: { text?: string; key?: string; priority?: number }[];
  echtzeitNotizen: { text?: string; prio?: number }[];
  himNotizen: {
    text?: string;
    ueberschrift?: string;
    prio?: number;
    letzteAktualisierung?: string;
  }[];
  serviceNotiz?: {
    key: string;
    text: string;
  };
  auslastungsInfos: {
    klasse: "KLASSE_1" | "KLASSE_2";
    stufe: number;
    anzeigeTextKurz: string;
  }[];
  loadFactor: string;
  istZusatzhalt: boolean;
};

type VendoJourneyT = {
  fahrplan: {
    regulaererFahrplan: string;
    tageOhneFahrt?: string;
  };
  kurztext: string;
  mitteltext: string;
  halte: HaltT[];
  stops: HaltT[];
  attributNotizen: { text?: string; key?: string; priority?: number }[];
  echtzeitNotizen: { text?: string; prio?: number }[];
  himNotizen: {
    text?: string;
    ueberschrift?: string;
    prio?: number;
    letzteAktualisierung?: string;
  }[];
  verkehrsmittelNummer: string;
  richtung: string;
  produktGattung: string;
  produktGattungen: string;
  reisetag: string; // ISO-Date (YYYY-MM-DD)
};

export type { HaltT, VendoJourneyT };
