import axios from "axios";
import config from "./base.json"
import { JourneyT } from "@/types/journey";
import { loadFactorToText } from "@/util";
import { WebJourneyT } from "@/types/web";

const randomHexString = (length: number): string => 
    [...Array(length)]
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join('');

const createRandomUserAgent = (): string => {
     let ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';
    const randomPart =randomHexString(16);
     ua = ua.replace('115.0.0.0', `115.0.${randomHexString(4)}.${randomHexString(2)}`);
    return ua + ` UniqueId/${randomPart}`;
}
const getBrowserHeaders = () => ({
     'Accept': 'application/json',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': 'https://www.bahn.de/',
    'Origin': 'https://www.bahn.de',
    'User-Agent': createRandomUserAgent(), 
    'X-Requested-With': 'XMLHttpRequest', 
})

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
    const url = `${config["journey-web-base"]}?journeyId=${encodeURIComponent(journeyID)}&poly=false`;

    return axios.get(url, {
        headers: getBrowserHeaders(), // Use the new header generation function
        timeout: 10000
    }).then((response) => {
        // Your existing data mapping logic is fine
        return {
            ...response.data,
            stops: response.data.halte.map((stop: any) => ({
                ...stop,
                loadFactor: loadFactorToText(stop.auslastungsmeldungen[1].stufe, false)
            }))
        };
    }).catch(e => {
        console.error('API Error (Web):', e.response?.status, e.response?.data);
        return null;
    });
};