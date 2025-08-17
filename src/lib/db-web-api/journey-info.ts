import axios from "axios";
import config from "./base.json"
import { JourneyT } from "@/types/journey";
import { loadFactorToText } from "@/util";
import { WebJourneyT } from "@/types/web";

export const getJourneyInfoRegio = async (journeyID: string) : Promise<JourneyT | null> => {
    return axios.get(`${config["journey-regio-base"]}/${journeyID}`, {}).then((response) => {
        return {
            ...response.data,
            stops: response.data.stops.map((stop: any) => ({
                ...stop,
                loadFactor: stop.occupancy?.economyClass.toLowerCase()
            }))
        };
    }).catch(_ => null);
};

export const getJourneyInfoWeb = async (journeyID: string): Promise<WebJourneyT | null> => {
    return axios.get(`${config["journey-web-base"]}?journeyId=${encodeURIComponent(journeyID)}&poly=false`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
            'Referer': 'https://www.bahn.de/',
        },
        timeout: 10000
    }).then((response) => {
        return {
            ...response.data,
            stops: response.data.halte.map((stop: any) => ({
                ...stop,
                loadFactor: loadFactorToText(stop.auslastungsmeldungen[1].stufe, false)
            }))
        };
    }).catch(e => {
        console.error('API Error:', e.response?.status, e.response?.data);
        return null;
    });
};