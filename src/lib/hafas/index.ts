import { createClient, HafasClient, Trip } from "hafas-client";
import { profile } from "hafas-client/p/oebb/index";
import { stationBoard } from "../db-web-api";

// In-memory cache (simple key-value store)
const tripCache = new Map<string, Promise<Trip[]>>();
const tripInfoCache = new Map<string, Promise<Trip>>();
const tripIdCache = new Map<string, Promise<string>>();

export const createHafas = () => createClient(profile, "db-live");

export const findTrips = async (
  query: string,
  hafasClient: HafasClient,
  limit: number,
  allowedEVAPrefixes: string[]
): Promise<Trip[]> => {
  const cacheKey = `${query}-${allowedEVAPrefixes.join(",")}`;

  if (tripCache.has(cacheKey)) {
    return tripCache.get(cacheKey)!;
  }

  if (!hafasClient.tripsByName) {
    throw new Error("tripsByName is not defined on hafasClient");
  }

  const tripPromise = hafasClient
    .tripsByName(query, {
      fromWhen: new Date(new Date().setHours(0, 0, 0, 0)), // Midnight today
      untilWhen: new Date(new Date().setDate(new Date().getDate() + 1)), // Until tomorrow
      products: {
        suburban: true,
        subway: false,
        tram: false,
        bus: false,
        ferry: false,
        regional: true,
        taxi: false,
      },
      onlyCurrentlyRunning: false,
    })
    .then((trips) => {
      const seenLineNames = new Set();
      const filteredTrips = trips.trips
        .filter((trip) => {
          if (!trip.line?.fahrtNr) return false;
          if (seenLineNames.has(trip.line.name)) return false;
          seenLineNames.add(trip.line.name);
          if (!trip.line.fahrtNr.includes(query)) return false;
          return (
            allowedEVAPrefixes.includes(trip.origin?.id?.slice(0, 2) || "") ||
            allowedEVAPrefixes.includes(trip.destination?.id?.slice(0, 2) || "")
          );
        })
        .slice(0, limit);
      return filteredTrips;
    });

  tripCache.set(cacheKey, tripPromise);
  return tripPromise;
};

export const tripInfo = async (
  tripId: string,
  hafasClient: HafasClient
): Promise<Trip> => {
  if (tripInfoCache.has(tripId)) {
    return tripInfoCache.get(tripId)!;
  }

  if (!hafasClient.trip) {
    throw new Error("trip is not defined on hafasClient");
  }

  const tripPromise = hafasClient
    .trip(tripId, { polyline: true })
    .then((trip) => trip.trip);

  tripInfoCache.set(tripId, tripPromise);
  return tripPromise;
};

export const convertTripId = async (trip: Trip): Promise<string> => {
  if (!trip || !trip.origin || !trip.origin.id) return "";

  const cacheKey = trip.line?.fahrtNr || "";
  if (tripIdCache.has(cacheKey)) {
    return tripIdCache.get(cacheKey)!;
  }

  const timeFrame = {
    start: trip.plannedDeparture || "",
    end: trip.plannedDeparture || "",
  };

  const tripPromise = stationBoard
    .departures(trip.origin.id, timeFrame)
    .then((regioGuideResults) => {
      const matchingTrip = regioGuideResults.items.find(
        (item) => String(item.train.no) === String(trip.line?.fahrtNr)
      );
      return matchingTrip ? matchingTrip.train.journeyId || "" : "";
    });

  tripIdCache.set(cacheKey, tripPromise);
  return tripPromise;
};
