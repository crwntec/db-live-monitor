type HaltT = {
  ankunftsDatum?: string;
  abgangsDatum?: string;
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
  plattform?: string;
  plattformTyp?: string;
  attributNotizen: { text?: string; key?: string; priority?: number }[];
  echtzeitNotizen: { text?: string; key?: string; priority?: number }[];
  himNotizen: { text?: string; key?: string; priority?: number }[];
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
  himNotizen: { text?: string; key?: string; priority?: number }[];
  echtzeitNotizen: { text?: string; key?: string; priority?: number }[];
  attributNotizen: {
    text: string;
    key: string;
    priority?: number;
  }[];
  verkehrsmittelNummer: string;
  richtung: string;
  produktGattung: string;
  produktGattungen: string;
  reisetag: string; // ISO-Date (YYYY-MM-DD)
};

export type { HaltT, VendoJourneyT };