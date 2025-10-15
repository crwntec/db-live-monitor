import { IrisMessage, IrisPathItem, IrisWing } from "./iris";

// New API Response Types
export interface WebAPIResult {
  departures?: WebAPIStop[];
  arrivals?: WebAPIStop[];
  disruptions: Disruption[];
}

export interface WebAPIStop {
  station: Station;
  journeyID: string;
  timeSchedule: string;
  timeType: "SCHEDULE" | "PREVIEW";
  time: string;
  onDemand: boolean;
  platformSchedule: string;
  platform: string;
  administration: Administration;
  messages: Message[];
  disruptions: Disruption[];
  attributes: Attribute[];
  departureID?: string;
  arrivalID?: string;
  transport: Transport;
  journeyType: "REGULAR" | "EXTRA" | "REPLACEMENT";
  additional: boolean;
  canceled: boolean;
  reliefFor: Transport[];
  reliefBy: Transport[];
  replacementFor: Transport[];
  replacedBy: Transport[];
  continuationBy?: Transport | null;
  continuationFor?: Transport | null;
  travelsWith: Transport[];
  codeshares: Codeshare[];
  futureDisruptions?: boolean;
  pastDisruptions?: boolean;
}

export interface Station {
  evaNumber: string;
  ifopt: string;
  name: string;
}

export interface Administration {
  administrationID: string;
  operatorCode: string;
  operatorName: string;
}

export interface Message {
  code: string | null;
  type: "CUSTOMER_REASON" | "CUSTOMER_TEXT" | "QUALITY_VARIATION";
  displayPriority: number | null;
  category: string | null;
  text: string;
  textShort: string | null;
}

export interface Disruption {
  disruptionID: string;
  disruptionCommunicationID: string | null;
  displayPriority: number;
  descriptions: {
    [languageCode: string]: {
      text: string;
      textShort: string;
    };
  };
}

export interface Attribute {
  displayPriority: number | null;
  displayPriorityDetail: number | null;
  code: string;
  text: string;
  textShort: string | null;
}

export interface Transport {
  type:
    | "HIGH_SPEED_TRAIN"
    | "INTERCITY_TRAIN"
    | "REGIONAL_TRAIN"
    | "BUS"
    | "FERRY"
    | "SUBWAY"
    | "TRAM";
  journeyDescription: string;
  label: string;
  number: number;
  dfid: string | null;
  category: string;
  categoryInternal: string;
  line: string | null;
  dtid: string | null;
  replacementTransport: Transport | null;
  direction: Direction | null;
  journeyID: string;
  destination?: Destination;
  differingDestination?: Destination | null;
  origin?: Destination;
  differingOrigin?: Destination | null;
  via?: ViaStop[];
}

export interface Direction {
  text: string | null;
  stopPlaces: StopPlace[];
}

export interface StopPlace {
  evaNumber: string;
  ifopt: string;
  name: string;
}

export interface Destination {
  evaNumber: string;
  ifopt: string;
  name: string;
  canceled: boolean;
}

export interface ViaStop {
  evaNumber: string;
  ifopt: string;
  name: string;
  canceled: boolean;
  additional: boolean;
  displayPriority: number;
}

export interface Codeshare {
  airlineCode: string;
  flightnumber: number;
}

// Legacy compatibility type (if you need to maintain some old structure)
export interface WebAPITrain {
  journeyId: string;
  category: string;
  type: string;
  no: number;
  lineName: string;
}

// Station data structure (if still needed)
export interface StationData {
  evaNo: string;
  stationName: string;
  stopGroups: Stop[][];
}

export interface StopTime {
  time: string;
  timeScheduled: string;
  diff: number;
}

// If you still need the combined Stop type for your UI
export interface Stop {
  irisOverride: boolean;
  transport: Transport;
  irisId: string;
  wing: IrisWing | null;
  arrival:
    | (WebAPIStop & { path: IrisPathItem[]; origin: { name: string } })
    | null;
  departure:
    | (WebAPIStop & { path: IrisPathItem[]; destination: { name: string } })
    | null;
  isEarlyTerminated: boolean;
  delayMessages: IrisMessage[];
  qualityChanges: IrisMessage[];
  canceled: boolean;
}
