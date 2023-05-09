export interface Timetable {
    station: string;
    stops:   Stop[];
}

export interface Stop {
    tripId:          string;
    himMessages:     HimMessage[];
    qualityChanges:  QualityChange[];
    hasArrival:      boolean;
    hasDeparture:    boolean;
    hasNewArr:       boolean;
    when:            string;
    plannedWhen:     string;
    causesOfDelay:   CausesOfDelay[];
    platform:        string;
    plannedPlatform: string;
    direction:       string;
    line:            Line;
}

export interface CausesOfDelay {
    id: string;
    cat:       number;
    text:      string;
    timestamp: string;
}

export interface HimMessage {
    id:    string;
    t:     T;
    from?: string;
    to?:   string;
    ts:    string;
    cat?:  string;
}

export enum T {
    C = "c",
    H = "h",
    R = "r",
}

export interface Line {
    fahrtNr:     string;
    name:        string;
    productName: string;
    operator:    string;
}

export interface QualityChange {
    id:       string;
    t:        string;
    c:        string;
    ts:       string;
    "ts-tts": string;
}
