export interface WebJourneyT {
  reisetag: string;
  regulaereVerkehrstage: string;
  irregulaereVerkehrstage: string;
  zugName: string;
  stops: Halte[];
  himMeldungen: any[];
  risNotizen: RisNotiz[];
  zugattribute: ZugAttribut[];
  priorisierteMeldungen: PriorisierteMeldung[];
  abfahrtsZeitpunkt: string;
  ankunftsZeitpunkt: string;
  ezAbfahrtsZeitpunkt: string;
  ezAnkunftsZeitpunkt: string;
  cancelled: boolean;
}

export interface Halte {
  id: string;
  abfahrtsZeitpunkt: string;
  ankunftsZeitpunkt: string;
  auslastungsmeldungen: AuslastungMeldung[];
  loadFactor: string;
  ezAbfahrtsZeitpunkt: string;
  ezAnkunftsZeitpunkt: string;
  gleis: string;
  haltTyp: string;
  name: string;
  risNotizen: any[];
  bahnhofsInfoId: string;
  extId: string;
  routeIdx: number;
  priorisierteMeldungen: any[];
  adminID: string;
  kategorie: string;
  nummer: string;
}

interface AuslastungMeldung {
  klasse: string;
  stufe: number;
}

interface RisNotiz {
  key: string;
  value: string;
  routeIdxFrom: number;
  routeIdxTo: number;
}

interface ZugAttribut {
  kategorie: string;
  key: string;
  value: string;
}

interface PriorisierteMeldung {
  prioritaet: string;
  text: string;
}