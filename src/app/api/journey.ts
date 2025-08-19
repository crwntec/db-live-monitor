"use server";
import { getJourneyInfoRegio } from "@/lib/db-web-api";
import { getJourneyInfoVendo } from "@/lib/db-web-api/journey-info";
// import { findJourneys } from "@/lib/journey-search";
import {
  createHafas,
  tripInfo,
  findTrips,
  convertTripIdToRis,
} from "@/lib/hafas";
import { JourneyT } from "@/types/journey";
import { getCarriageSequence } from "@/util/request/carriageSequenceRequest";
import { Trip } from "hafas-client";
import moment from "moment";

export const getJourneyFromRisId = async (
  risId: string
): Promise<JourneyT | null> => {
  const journey = await getJourneyInfoRegio(risId);
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
  const hafasTrip = await tripInfo(possibleTrips[0].id, hafasClient);
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
    hafasId: hafasTrip.id,
    polyline: hafasTrip.polyline || null,
    remarks: hafasTrip.remarks || [],
    carriageSequence: carriageSequence,
  };
};

export const getRisId = async (hafasTrip: Trip): Promise<string> =>
  await convertTripIdToRis(hafasTrip);

export const getVendoJourney = async (hafasJourneyId: string) => { 
  const res = await getJourneyInfoVendo(hafasJourneyId);
  if (!res) return null;
  return res;
};