// Import the JSON data
import stationsData from "@/app/assets/data/stations.json";
import { Station } from "@/types/stations";
import autocomplete from "db-hafas-stations-autocomplete";

// Define caching mechanism
let stationsCache: Station[] = [];

/**
 * Reads and returns station data from the imported JSON data with caching
 * @returns {Promise<Station[]>} Promise that resolves to an array of station objects
 */
export async function readStations(): Promise<Station[]> {
  if (stationsCache.length > 0) {
    return stationsCache;
  }

  try {
    stationsCache = stationsData;
    return stationsCache;
  } catch (error) {
    console.error("Error reading stations:", error);
    return [];
  }
}

/**
 * Finds a station by its EVA ID
 * @param {string | number} evaId - The EVA ID to search for
 * @returns {Promise<Station | null>} Promise that resolves to a station object or null if not found
 */
export async function findStationByEvaId(
  evaId: string | number
): Promise<Station | null> {
  const stations = await readStations();
  const station = stations.find((station) => station.eva == Number(evaId));
  return station || null;
}

/**
 * Finds a station by its DS100 code
 * @param {string} ds100 - The DS100 code to search for
 * @returns {Promise<Station | null>} Promise that resolves to a station object or null if not found
 */
export async function findStationByDS100(
  ds100: string
): Promise<Station | null> {
  const stations = await readStations();
  return stations.find((station) => station.ds100 === ds100) || null;
}

/**
 * Gets the relevance of a station by name based on the number of events
 * @param {string} name - The name of the station
 * @returns {Promise<number>} Promise that resolves to the number of events or 0 if not found
 */
export async function getStationRelevance(name: string): Promise<number> {
  const stations = await readStations();
  return (
    stations.find((station) => station.name === name)?.number_of_events || 0
  );
}
export async function autocompleteStation(input: string) {
  const results = autocomplete(input, 6);
  const mappedResults = [];

  for (const result of results) {
    const station = await findStationByEvaId(result.id);
    if (station) {
      mappedResults.push(station);
    }
  }
  return mappedResults;
}
