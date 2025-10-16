"use server";

import { getJourneyInfoVendo } from "@/lib/db-web-api/journey-info";
import {
  createHafas,
  tripInfo,
  findTrips,
  convertTripIdToRis,
} from "@/lib/hafas";
import mergeHafasVendo from "@/lib/merge";
import { JourneyT } from "@/types/journey";
import { getCarriageSequence } from "@/util/request/carriageSequenceRequest";
import { Trip } from "hafas-client";
import moment from "moment";

export const getJourneyFromTrainNumber = async (
  trainName: string,
  trainNumber: string,
  evaNo: string,
  date: string,
): Promise<{ data: JourneyT | null; error?: string }> => {
  const mdate = moment(date);
  const hafasClient = createHafas();

  // Find possible trips
  const possibleTrips = await findTrips(
    trainNumber,
    hafasClient,
    1,
    ["80"],
    mdate.toDate(),
  ).catch((_) => []);

  if (possibleTrips.length === 0)
    return { data: null, error: "No Hafas Trips found" };

  // Get detailed trip info from Hafas
  const hafasTrip = await tripInfo(possibleTrips[0].id, hafasClient);
  const regex = /(?<=(RE|S)\s)\d+\s*/;
  const fixed = hafasTrip.id.replace(regex, hafasTrip.line?.fahrtNr || "");
  // Fetch Vendo journey data
  const vendoJourney = await getVendoJourney(fixed);

  // Merge Hafas and Vendo data (Vendo takes priority)
  const mergedTrip = mergeHafasVendo(vendoJourney, hafasTrip);
  // console.log(mergedTrip);
  // Get carriage sequence
  const carriageSequence = await getCarriageSequence({
    category: trainName.includes("ICE") ? "ICE" : "IC",
    date: mdate.format("YYYY-MM-DD"),
    evaNumber: evaNo,
    number: parseInt(trainNumber),
    time: mdate.toDate(),
  });

  const data = {
    ...mergedTrip,
    hafasId: hafasTrip.id,
    polyline: mergedTrip.polyline || undefined,
    remarks: mergedTrip.remarks || [],
    carriageSequence: carriageSequence,
  };
  // Return merged journey with additional data
  return {
    data: data,
    error: undefined,
  };
};

export const getRisId = async (hafasTrip: Trip): Promise<string> => {
  return await convertTripIdToRis(hafasTrip);
};

export const getVendoJourney = async (hafasJourneyId: string) => {
  const res = await getJourneyInfoVendo(hafasJourneyId);
  if (!res) return null;
  return res;
};
