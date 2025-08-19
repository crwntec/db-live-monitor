// Import the JSON data
import stationsData from "@/app/assets/data/stations.json";
import { Station } from "@/types/stations";
import autocomplete from "db-hafas-stations-autocomplete";

// Define caching mechanism
let stationsCache: Station[] = [];
let evaIdMap: Map<number, Station> = new Map();
let ds100Map: Map<string, Station> = new Map();
let nameMap: Map<string, Station> = new Map();
let isInitialized = false;

async function initializeMaps(): Promise<void> {
  if (isInitialized) return;
  
  try {
    stationsCache = stationsData;
    
    for (const station of stationsCache) {
      evaIdMap.set(station.eva, station);
      if (station.ds100) {
        ds100Map.set(station.ds100, station);
      }
      if (station.name) {
        nameMap.set(station.name, station);
      }
    }
    
    isInitialized = true;
  } catch (error) {
    console.error("Error initializing station maps:", error);
    throw error;
  }
}
/**
 * Reads and returns station data with lazy initialization
 */
export async function readStations(): Promise<Station[]> {
  await initializeMaps();
  return stationsCache;
}

/**
 * Finds a station by its EVA ID
 * @param {string | number} evaId - The EVA ID to search for
 * @returns {Promise<Station | null>} Promise that resolves to a station object or null if not found
 */
export async function findStationByEvaId(
  evaId: string | number
): Promise<Station | null> {
  await initializeMaps();
  return evaIdMap.get(Number(evaId)) || null;
}

/**
 * Finds a station by its DS100 code
 * @param {string} ds100 - The DS100 code to search for
 * @returns {Promise<Station | null>} Promise that resolves to a station object or null if not found
 */
export async function findStationByDS100(
  ds100: string
): Promise<Station | null> {
  await initializeMaps();
  return ds100Map.get(ds100) || null;
}

/**
 * Gets the relevance of a station by name based on the number of events
 * @param {string} name - The name of the station
 * @returns {Promise<number>} Promise that resolves to the number of events or 0 if not found
 */
export async function getStationRelevance(name: string): Promise<number> {
  await initializeMaps();
  return nameMap.get(name)?.number_of_events || 0;
}

export async function autocompleteStation(input: string): Promise<Station[]> {
  await initializeMaps();
  
  const results = autocomplete(input, 6);
  const mappedResults: Station[] = [];
  
  // Batch lookup instead of individual awaits
  for (const result of results) {
    const station = evaIdMap.get(Number(result.id));
    if (station) {
      mappedResults.push(station);
    }
  }
  
  return mappedResults;
}