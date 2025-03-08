export interface CarriageSequenceT {
    departureID: string;
    departurePlatform: string;
    departurePlatformSchedule: string;
    journeyID: string
    sequenceStatus: string
    groups: CarriageSequenceGroup[]
    platform: CarriageSequencePlatform
}

export interface CarriageSequenceGroup {
    name: string;
    transport: CarriageSequenceTransport
    vehicles: CarriageSequenceVehicle[]
}

export interface CarriageSequenceTransport {
    category: string;
    destination: {name: string};
    journeyID: string;
    line: string;
    number: number;
    type: string;
}

export interface CarriageSequenceVehicle {
    amenities: CarriageSequenceAmenity[]
    orientation: "FORWARDS" | "BACKWARDS"
    platformPosition: {
        start: number;
        end: number;
        sector: string;
    }
    status: 'OPEN' | 'CLOSED'
    type: {
        category: string;
        constructionType: string;
        hasEconomyClass: boolean;
        hasFirstClass: boolean;
    }
    vehicleID: string;
    wagonIdentificationNumber: number;
}

export interface CarriageSequenceAmenity {
    amount: number;
    status: string;
    type: string
}

export interface CarriageSequencePlatform {

}