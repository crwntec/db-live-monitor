'use server';
// import { createHafas, findTrips } from '@/lib/hafas';
import { createHafas, findTrips } from '@/lib/hafas';
import { findStationByEvaId, findStationByDS100, autocompleteStation } from '@/lib/stations';
import { Station } from '@/types/stations';
import { HafasClient, Trip } from 'hafas-client';

const ds100Pattern = /^[abdefhklmnrstuw]{1}[a-z]|[A-Z]{1,4}$/gmy;
let hafasClient: HafasClient | null = null;

export const getEVAFromDS100 = async (input: string) : Promise<number[] | null> => {
    if (ds100Pattern.test(input)) {
        try {
            const station = await findStationByDS100(input);
            return station ? [ station.eva, ...station.meta_evas] : null;
        } catch (error) {
            console.error('Error reading stations:', error);
            return null;
        }
    } else {
        const station = await findStationByEvaId(input);
        return station ? [station.eva, ...station.meta_evas] : null;
    }
};


export const autoCompleteStation = async (
  input: string
): Promise<{
  possibleTrips?: Trip[];
  possibleStations?: Station[];
  isTrips: boolean;
}> => {
  if (!hafasClient) hafasClient = createHafas();
  //Check if input is a DS100 code
  input = input.toUpperCase();
  if (ds100Pattern.test(input)) {
    const station = await findStationByDS100(input);
    return station
      ? { possibleStations: [station], isTrips: false }
      : { possibleStations: [], isTrips: false };
  }
  const trainNumberPattern = /^\d{1,5}$/;
    if (trainNumberPattern.test(input)) {
      const possibleTrips = await findTrips(input, hafasClient, 5, ["80"]);
    return { possibleTrips, isTrips: true };
  }

  const possibleStations = await autocompleteStation(input);
  return { possibleStations, isTrips: false };
};

