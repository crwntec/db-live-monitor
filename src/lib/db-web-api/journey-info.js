import axios from "axios";
import config from "./base.json"

export const getJourneyInfo = async (journeyID) => {
    return axios.get(config["base-url"] + "journey/" + journeyID, {}).then((response) => {
        return response.data;
    });
};