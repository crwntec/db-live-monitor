type HaltT = {
    ankunftsDatum?: string;
    ezAnkunftsDatum?: string;
    abgangsDatum?: string;
    ezAbgangsDatum?: string;
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
    ezGleis?: string;
    plattform?: string;
    plattformTyp?: string;
    attributNotizen: { text?: string; key?: string; priority?: number }[];
    echtzeitNotizen: { text?: string; prio?: number }[];
    himNotizen: {
        text?: string;
        ueberschrift?: string;
        prio?: number;
        letzteAktualisierung?: string;
    }[];
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
    attributNotizen: { text?: string; key?: string; priority?: number }[];
    echtzeitNotizen: { text?: string; prio?: number }[];
    himNotizen: {
        text?: string;
        ueberschrift?: string;
        prio?: number;
        letzteAktualisierung?: string;
    }[];
    verkehrsmittelNummer: string;
    richtung: string;
    produktGattung: string;
    produktGattungen: string;
    reisetag: string; // ISO-Date (YYYY-MM-DD)
};

// New types for the departure board API
type AbfrageOrtT = {
    name: string;
    locationId: string;
    evaNr: string;
    stationId: string;
};
type AbgangsOrtT = {
    name: string;
    locationId: string;
}

type ProduktGattungT =
    | "ICE"
    | "IC_EC"
    | "RB"
    | "SBAHN"
    | "SONSTIGE"
    | "ERSATZVERKEHR";

type BahnhofstafelPositionT = {
    gleis?: string;
    plattform?: string;
    plattformTyp?: string;
    zuglaufId: string; // HAFAS Trip ID
    kurztext: string; // e.g., "ICE", "RE", "S", "Bus"
    mitteltext: string; // e.g., "ICE 947", "RE 2", "S 1"
    abfrageOrt: AbfrageOrtT;
    abgangsOrt?: AbgangsOrtT;
    richtung: string; // Destination
    echtzeitNotizen: { text?: string; prio?: number }[];
    ankunftsDatum?: string;
    abgangsDatum?: string; // ISO DateTime
    produktGattung: ProduktGattungT;
    produktGattungen: string; // Can be same as produktGattung or different
};

type BahnhofstafelResponseT = {
    bahnhofstafelAbfahrtPositionen?: BahnhofstafelPositionT[];
    bahnhofstafelAnkunftPositionen?: BahnhofstafelPositionT[];
};

export type {
    HaltT,
    VendoJourneyT,
    AbfrageOrtT,
    ProduktGattungT,
    BahnhofstafelPositionT,
    BahnhofstafelResponseT
};