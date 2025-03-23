import axios from "axios";
import config from "./base.json"
import { JourneyT } from "@/types/journey";

export const getJourneyInfo = async (journeyID: string) : Promise<JourneyT | null> => {
    return axios.get(config["base-url"] + "journey/" + journeyID, {}).then((response) => {
        return response.data;
    }).catch(_=>{});
};