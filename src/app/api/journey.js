import { getJourneyInfo } from "../../lib/db-web-api";
import { getCarriageSequence } from "@/util/request/carriageSequenceRequest";
import moment from "moment";

export const getJourney = async (journeyID) => {
    const journey = await getJourneyInfo(journeyID);
    if (!journey) return null;
    
    const carriageSequence = await getCarriageSequence({
        category: journey.name.includes("ICE") ? "ICE" : "IC",
        date: moment(journey.date).format("YYYY-MM-DD"),
        evaNumber: journey.stops[0].station.evaNo,
        number: journey.no,
        time: journey.date
    });
    

    return {
        ...journey,
        carriageSequence: carriageSequence
    };
}