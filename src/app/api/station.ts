// src/api/station.ts - Optimized with caching and error handling
'use server';

import { createHafas, findTrips } from '@/lib/hafas';
import { findStationByEvaId, findStationByDS100, autocompleteStation } from '@/lib/stations';
import { Station } from '@/types/stations';
import { HafasClient, Trip } from 'hafas-client';

const ds100Pattern = /^[abdefhklmnrstuw]{1}[a-z]|[A-Z]{1,4}$/gmy;

let hafasClient: HafasClient | null = null;

const evaCache = new Map<string, number[] | null>();
const autocompleteCache = new Map<string, any>();

const CACHE_TTL = 5 * 60 * 1000;
const cacheTimestamps = new Map<string, number>();

function isCacheValid(key: string): boolean {
  const timestamp = cacheTimestamps.get(key);
  return timestamp ? (Date.now() - timestamp) < CACHE_TTL : false;
}

function setCacheWithTTL<T>(cache: Map<string, T>, key: string, value: T): void {
  cache.set(key, value);
  cacheTimestamps.set(key, Date.now());
}

function getHafasClient(): HafasClient {
  if (!hafasClient) {
    hafasClient = createHafas();
  }
  return hafasClient;
}

export const getEVAFromDS100 = async (input: string): Promise<number[] | null> => {
  const cacheKey = `eva_${input}`;
  if (isCacheValid(cacheKey) && evaCache.has(cacheKey)) {
    const cached = evaCache.get(cacheKey);
    if (!cached) evaCache.delete(cacheKey);
    return cached || null
  }

  try {
    let result: number[] | null;

    if (ds100Pattern.test(input)) {
      const station = await findStationByDS100(input);
      result = station ? [station.eva, ...station.meta_evas] : null;
    } else {
      const station = await findStationByEvaId(input);
      result = station ? [station.eva, ...station.meta_evas] : null;
    }

    setCacheWithTTL(evaCache, cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error in getEVAFromDS100:', error);
    return null;
  }
};

export const autoCompleteStation = async (
  input: string
): Promise<{
  possibleTrips?: Trip[];
  possibleStations?: Station[];
  isTrips: boolean;
}> => {
  // Normalize input
  const normalizedInput = input.toUpperCase().trim();
  
  // Check cache first
  const cacheKey = `autocomplete_${normalizedInput}`;
  if (isCacheValid(cacheKey) && autocompleteCache.has(cacheKey)) {
    return autocompleteCache.get(cacheKey);
  }

  try {
    let result: any;

    // Check if input is a DS100 code
    if (ds100Pattern.test(normalizedInput)) {
      const station = await findStationByDS100(normalizedInput);
      result = {
        possibleStations: station ? [station] : [],
        isTrips: false
      };
    }
    // Check if input is a train number
    else if (/^\d{1,5}$/.test(normalizedInput)) {
      const client = getHafasClient();
      const possibleTrips = await findTrips(normalizedInput, client, 5, ["80"]);
      result = { possibleTrips, isTrips: true };
    }
    // Regular station autocomplete
    else {
      const possibleStations = await autocompleteStation(normalizedInput);
      result = { possibleStations, isTrips: false };
    }

    // Cache the result
    setCacheWithTTL(autocompleteCache, cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error in autoCompleteStation:', error);
    return { possibleStations: [], isTrips: false };
  }
};

