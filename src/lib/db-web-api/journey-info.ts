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

export const getJourneyInfoWeb = async (journeyID: string) : Promise<WebJourneyT | null> => {
    return axios.get(`${config["journey-web-base"]}?journeyId=${encodeURIComponent(journeyID)}&poly=false`, {}).then((response) => {
        return {
            ...response.data,
            stops: response.data.halte.map((stop: any) => ({
                ...stop,
                loadFactor: loadFactorToText(stop.auslastungsmeldungen[1].stufe, false)
            }))
        };
    }).catch(e=>console.error(e));
};