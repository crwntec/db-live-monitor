import {createClient, HafasClient, Trip} from "hafas-client";
import {profile} from "hafas-client/p/oebb";
// import { stationBoard } from "../db-web-api";
import moment from "moment-timezone";

// In-memory cache (simple key-value store)
const tripCache = new Map<string, Promise<Trip[]>>();
const tripInfoCache = new Map<string, Promise<Trip|null>>();
// const tripIdCache = new Map<string, Promise<string>>();

export const createHafas = () => createClient(profile, "db-live");

export const findTrips = async (
    query: string,
    hafasClient: HafasClient,
    limit: number,
    allowedEVAPrefixes: string[],
    date?: Date,
): Promise<Trip[]> => {
    // Check if query contains at least some digits (train number)
    if (!/\d+/.test(query)) return [];

    const cacheKey = `${query}-${allowedEVAPrefixes.join(",")}-${date ? date.toISOString() : 'today'}`;
    if (tripCache.has(cacheKey)) {
        return tripCache.get(cacheKey)!;
    }

    if (!hafasClient.tripsByName) {
        throw new Error("tripsByName is not defined on hafasClient");
    }

    // Set time range based on whether date is provided
    let fromWhen: Date;
    let untilWhen: Date;

    if (date) {
        // Specific date/time provided - search around that exact time
        fromWhen = moment(date).subtract(1, "seconds").tz("Europe/Berlin").toDate();
        untilWhen = moment(date).add(1, "seconds").tz("Europe/Berlin").toDate();
    } else {
        // No date provided - search entire day (for autocomplete)
        fromWhen = moment().tz("Europe/Berlin").startOf("day").toDate();
        untilWhen = moment().tz("Europe/Berlin").endOf("day").toDate();
    }

    const tripPromise = hafasClient
        .tripsByName(query, {
            fromWhen,
            untilWhen,
            products: {
                suburban: true,
                subway: false,
                tram: false,
                bus: false,
                ferry: false,
                regional: true,
                taxi: false,
                onCall: false,
            },
            onlyCurrentlyRunning: false,
        })
        .then((trips) => {
            const seenLineNames = new Set();
            return trips.trips
                .filter((trip) => {
                    if (!trip.line?.fahrtNr) return false;

                    // Skip duplicate line names
                    if (seenLineNames.has(trip.line.name)) return false;
                    seenLineNames.add(trip.line.name);

                    // Check if origin or destination matches allowed EVA prefixes
                    return (
                        allowedEVAPrefixes.includes(trip.origin?.id?.slice(0, 2) || "") ||
                        allowedEVAPrefixes.includes(trip.destination?.id?.slice(0, 2) || "")
                    );
                })
                .slice(0, limit);
        })
        .catch((e) => {
            try {
                let body: any = e.request?.body;

                // If it's a function (hafas-client often stores it this way)
                if (typeof body === "function") body = body();

                // If it's a Node.js Buffer, decode it to string
                if (body && body.type === "Buffer" && Array.isArray(body.data)) {
                    body = Buffer.from(body.data).toString("utf8");
                }

                // If it's still a stringified JSON, pretty-print it
                try {
                    body = JSON.stringify(JSON.parse(body), null, 2);
                } catch {
                    // ignore if it's not valid JSON
                }

                console.error("❌ HAFAS Error:", e.message);
                console.error("➡️ URL:", e.request?.url);
                console.error("➡️ Body:", body);
                console.error("➡️ fromWhen:", fromWhen);
                console.error("➡️ untilWhen:", untilWhen);
                console.error("➡️ Date:", date);
                console.error("➡️ Query:", query);
            } catch (err) {
                console.error("⚠️ Could not log request:", err);
            }
            return [];
        });

    tripCache.set(cacheKey, tripPromise);
    return tripPromise;
};

export const tripInfo = async (
  tripId: string,
  hafasClient: HafasClient,
): Promise<Trip | null> => {
  if (tripInfoCache.has(tripId)) {
    return tripInfoCache.get(tripId)!;
  }

  if (!hafasClient.trip) {
    throw new Error("trip is not defined on hafasClient");
  }

  const tripPromise = hafasClient
    .trip(tripId, { polyline: true })
    .then((trip) => trip.trip).catch((_err) => {
        console.log("Trip not found " + tripId)
          return null
      });
 tripInfoCache.set(tripId, tripPromise);
  return tripPromise;
};

// export const convertTripIdToRis = async (hafasTrip: Trip): Promise<string> => {
//   // if (!hafasTrip || !hafasTrip.origin || !hafasTrip.origin.id) return "";

//   // const cacheKey = hafasTrip.line?.fahrtNr || "";
//   // if (tripIdCache.has(cacheKey)) {
//   //   return tripIdCache.get(cacheKey)!;
//   // }

//   // const timeFrame = {
//   //   start: hafasTrip.plannedDeparture || "",
//   //   end: hafasTrip.plannedDeparture || "",
//   // };

//   // const tripPromise = stationBoard
//   //   .departures(hafasTrip.origin.id, timeFrame)
//   //   .then((regioGuideResults) => {
//   //     const matchingTrip = regioGuideResults.items.find(
//   //       (item) => String(item.train.no) === String(hafasTrip.line?.fahrtNr),
//   //     );
//   //     return matchingTrip ? matchingTrip.train.journeyId || "" : "";
//   //   });

//   // tripIdCache.set(cacheKey, tripPromise);
//   // return tripPromise;
//   return "TODO";
// };
