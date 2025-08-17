"use server";
import { getJourneyInfo } from "@/lib/db-web-api";
import { getJourneyInfoWeb } from "@/lib/db-web-api/journey-info";
// import { findJourneys } from "@/lib/journey-search";
import {
  createHafas,
  tripInfo,
  findTrips,
  convertTripId as getJIDFromTrip,
} from "@/lib/hafas";
import { JourneyT } from "@/types/journey";
import { getCarriageSequence } from "@/util/request/carriageSequenceRequest";
import { Trip } from "hafas-client";
import moment from "moment";

export const getJourneyFromJID = async (
  journeyID: string
): Promise<JourneyT | null> => {
  const journey = await getJourneyInfo(journeyID);
  if (!journey) return null;
  // findJourneys(journey.no.toString());
  const hafasClient = createHafas();
  const possibleTrips = await findTrips(
    journey.no.toString(),
    hafasClient,
    1,
    ["80"],
    journey.date
  ).catch((_) => []);
  if (possibleTrips.length === 0) return journey;
  const trip = await tripInfo(possibleTrips[0].id, hafasClient);
  const carriageSequence = await getCarriageSequence({
    category: journey.name.includes("ICE") ? "ICE" : "IC",
    date: moment(journey.date).format("YYYY-MM-DD"),
    evaNumber: journey.stops[0].station.evaNo,
    number: journey.no,
    time: journey.date,
  });
  // console.log(carriageSequence)

  return {
    ...journey,
    risId: trip.id,
    polyline: trip.polyline || null,
    remarks: trip.remarks || [],
    carriageSequence: carriageSequence,
  };
};

export const getJourneyId = async (trip: Trip): Promise<string> =>
  await getJIDFromTrip(trip);

export const getWebJourney = async (risId: string) => { 
  const res = await getJourneyInfoWeb(risId);
  if (!res) return null;
  return res;
};