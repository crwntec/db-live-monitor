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
    hasNewTime:      boolean;
    when:            string;
    plannedWhen:     string;
    cancelled:       boolean;
    causesOfDelay:   CausesOfDelay[];
    hasNewPlatform:  boolean;
    platform:        string;
    plannedPlatform: string;
    plannedPath:     string[];
    currentPath:     string[];
    removedStops:    PathChange[];
    additionalStops: PathChange[];
    direction:       string;
    isEnding:        boolean;
    line:            Line;
}

export interface PathChange {
    id:      string;
    newStop: string;
}

export interface CausesOfDelay {
    id:        string;
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
