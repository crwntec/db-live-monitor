import {
  FeatureCollection,
  Hint,
  Warning,
  Status as HStatus,
} from "hafas-client";
import { CarriageSequenceT } from "./carriageSequence";
export interface JourneyT {
  name: string;
  no: number;
  risId: string;
  journeyId: string;
  tenantId: string;
  administrationId: string;
  operatorName: string;
  operatorCode: string;
  category: string;
  type: string;
  date: Date;
  stops: Stop[];
  started: boolean;
  finished: boolean;
  hims: Him[];
  remarks: readonly (Hint | HStatus | Warning)[];
  polyline: FeatureCollection | null;
  validUntil: Date;
  validFrom: Date;
  isLoyaltyCaseEligible: boolean;
  carriageSequence?: CarriageSequenceT | null;
}
export interface Him {
  id: string;
  caption: string;
  shortText: string;
}

export interface Stop {
  status: Status;
  departureId?: string;
  station: Station;
  track: Track;
  messages: Message[];
  departureTime?: Time;
  arrivalId?: string;
  arrivalTime?: Time;
  loadFactor?: string;
}

export interface Time {
  target: Date;
  predicted: Date;
  diff: number;
  timeType: TimeType;
}

export type TimeType = "REAL" | "PREVIEW";

export interface Message {
  code: string;
  text: string;
  textShort: string;
}

export interface Station {
  evaNo: string;
  name: string;
  position: Position;
}

export interface Position {
  latitude: number;
  longitude: number;
}

export type Status = "Normal" | "Canceled";

export interface Track {
  target: string;
  prediction: string;
}
