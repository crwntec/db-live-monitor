import { getJourneyInfo } from "../../lib/db-web-api";

export const getJourney = async (journeyID) => {
    return await getJourneyInfo(journeyID);
}