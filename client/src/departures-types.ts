export interface Timetable {
    station: string;
    stops:   Stop[];
}

export interface Stop {
    tripId:          string;
    hasArrival:      boolean;
    hasDeparture:    boolean;
    when:            string;
    plannedWhen:     string;
    platform:        string;
    plannedPlatform: string;
    direction:       string;
    line:            Line;
}

export interface Line {
    fahrtNr:     string;
    name:        string;
    productName: ProductName;
    operator:    string;
}

export enum ProductName {
    Ec = "EC",
    IC = "IC",
    Ice = "ICE",
    Rb = "RB",
    Re = "RE",
    S = "S",
    Tha = "THA",
}
