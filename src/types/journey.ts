import { CarriageSequenceT } from "./carriageSequence";
export interface JourneyT {
    name:                  string;
    no:                    number;
    journeyId:             string;
    tenantId:              string;
    administrationId:      string;
    operatorName:          string;
    operatorCode:          string;
    category:              string;
    type:                  string;
    date:                  Date;
    stops:                 Stop[];
    started:               boolean;
    finished:              boolean;
    hims:                  any[];
    validUntil:            Date;
    validFrom:             Date;
    isLoyaltyCaseEligible: boolean;
    carriageSequence?:      CarriageSequenceT | null;
}

export interface Stop {
    status:         Status;
    departureId?:   string;
    station:        Station;
    track:          Track;
    messages:       Message[];
    departureTime?: Time;
    arrivalId?:     string;
    arrivalTime?:   Time;
}

export interface Time {
    target:            Date;
    predicted:         Date;
    diff:              number;
    timeType:          TimeType;
}

export type TimeType = "REAL" | "PREVIEW";

export interface Message {
    code:      string;
    text:      string;
    textShort: string;
}

export interface Station {
    evaNo:    string;
    name:     string;
    position: Position;
}

export interface Position {
    latitude:  number;
    longitude: number;
}

export type Status = "Normal" | "Canceled";

export interface Track {
    target:     string;
    prediction: string;
}
