import {
  FeatureCollection,
  Hint,
  Warning,
  Status as HStatus,
  Trip,
} from "hafas-client";
import { CarriageSequenceT } from "./carriageSequence";
export interface JourneyT extends Trip {
  remarks: readonly (Hint | HStatus | Warning)[];
  polyline: FeatureCollection | undefined;
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
