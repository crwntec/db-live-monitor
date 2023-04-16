export interface Departure {
    tripId:               string;
    stop:                 Destination;
    when:                 Date | null;
    plannedWhen:          Date;
    prognosedWhen?:       null;
    delay:                number | null;
    platform:             null | string;
    plannedPlatform:      null | string;
    prognosedPlatform?:   null;
    prognosisType:        PrognosisType | null;
    direction:            string;
    provenance:           null;
    line:                 Line;
    remarks:              Remark[];
    origin:               null;
    destination:          Destination;
    cancelled?:           boolean;
    currentTripPosition?: Position;
    loadFactor?:          string;
}

export interface Position {
    type:      CurrentTripPositionType;
    latitude:  number;
    longitude: number;
    id?:       string;
}

export type CurrentTripPositionType = "location";

export interface Destination {
    type:     DestinationType;
    id:       string;
    name:     string;
    location: Position;
    products: Products;
    station?: Destination;
}

export interface Products {
    nationalExpress: boolean;
    national:        boolean;
    regionalExpress: boolean;
    regional:        boolean;
    suburban:        boolean;
    bus:             boolean;
    ferry:           boolean;
    subway:          boolean;
    tram:            boolean;
    taxi:            boolean;
}

export type DestinationType = "stop" | "station";

export interface Line {
    type:            LineType;
    id:              string;
    fahrtNr:         string;
    name:            string;
    public:          boolean;
    adminCode:       string;
    productName:     ProductName;
    mode:            Mode;
    product:         Product;
    operator:        Operator;
    additionalName?: string;
}

export type Mode = "bus" | "train";

export interface Operator {
    type: OperatorType;
    id:   ID;
    name: Name;
}

export type ID = "nahreisezug" | "national-express" | "db-regio-ag-nrw" | "db-fernverkehr-ag";

export type Name = "Nahreisezug" | "National Express" | "DB Regio AG NRW" | "DB Fernverkehr AG";

export type OperatorType = "operator";

export type Product = "bus" | "regional" | "tram" | "suburban" | "national" | "nationalExpress";

export type ProductName = "Bus" | "RE" | "STR" | "S" | "IC" | "RB" | "ICE";

export type LineType = "line";

export type PrognosisType = "prognosed";

export interface Remark {
    type:     string;
    code:     null | string;
    text:     string;
    summary?: string;
}
