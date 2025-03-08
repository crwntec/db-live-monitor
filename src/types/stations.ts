export interface Station {
    eva: number;
    ds100: string;
    lat: number;
    lon: number;
    name: string;
    is_active_ris: boolean;
    is_active_iris: boolean;
    meta_evas: number[];
    available_transports: string[];
    number_of_events: number;
}
