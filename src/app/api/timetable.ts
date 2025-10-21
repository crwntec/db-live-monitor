import moment from "moment-timezone";
import { makeRequest } from "@/util/request/makeRequest";
import { convertTimetable } from "@/util/iris/convertTimetable";
import { stationBoard } from "../../lib/db-web-api";
import { IrisFchg, IrisResult, IrisStop, IrisTimetable } from "@/types/iris";
import { WebAPIResult, WebAPIStop, StationData, Stop } from "@/types/timetable";
import { getTime } from "@/util";

// Add caching for IRIS data with a short TTL (e.g., 30 seconds)
const IRIS_CACHE = new Map();
const IRIS_CACHE_TTL = 30000; // 30 seconds

// Add caching for all API responses, not just IRIS
const API_CACHE = new Map();
const API_CACHE_TTL = 30000; // 30 seconds

const cachedFetch = async (key: string, fetchFn: CallableFunction) => {
  const cached = API_CACHE.get(key);
  if (cached && Date.now() - cached.timestamp < API_CACHE_TTL) {
    return cached.data;
  }
  const data = await fetchFn();
  API_CACHE.set(key, {
    timestamp: Date.now(),
    data,
  });
  return data;
};

const fetchIrisDepartures = async (eva: string) => {
  const cacheKey = `iris_${eva}`;
  const cached = IRIS_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < IRIS_CACHE_TTL) {
    return cached.data;
  }

  const now = moment().tz("Europe/Berlin");
  const currentDate = now.format("YYMMDD");
  const currentHour = now.format("HH");
  const nextDate = now.add(1, "hour").format("YYMMDD");
  const nextHour = now.format("HH");

  const urls = {
    currentTimetable: `https://iris.noncd.db.de/iris-tts/timetable/plan/${eva}/${currentDate}/${currentHour}`,
    nextTimetable: `https://iris.noncd.db.de/iris-tts/timetable/plan/${eva}/${nextDate}/${nextHour}`,
    fchg: `https://iris.noncd.db.de/iris-tts/timetable/fchg/${eva}/`,
  };

  const [parsedCurrentTimetable, parsedNextTimetable, parsedFchg] =
    await Promise.all([
      makeRequest<IrisTimetable>(urls.currentTimetable),
      makeRequest<IrisTimetable>(urls.nextTimetable),
      makeRequest<IrisFchg>(urls.fchg),
    ]);
  if (
    !parsedCurrentTimetable ||
    !parsedCurrentTimetable.elements[0].elements ||
    !parsedNextTimetable ||
    !parsedFchg
  )
    return null;

  const combinedTimetable = parsedCurrentTimetable;

  // const hasNextTimetable =
  //   parsedNextTimetable.elements[0].elements != undefined;
  const converted = await convertTimetable(
    combinedTimetable,
    parsedNextTimetable,
    parsedFchg,
  );

  IRIS_CACHE.set(cacheKey, {
    timestamp: Date.now(),
    data: converted,
  });

  return converted;
};

const hasLeft = (stop: Stop) => moment(getTime(stop, true)).isBefore(moment());

const mergeStationData = (
  arrivals: WebAPIResult,
  departures: WebAPIResult,
  irisData: IrisResult,
): StationData => {
  if (
    !arrivals ||
    !departures ||
    !irisData ||
    !arrivals.arrivals ||
    !departures.departures
  ) {
    return {
      evaNo: "",
      stationName: "",
      stopGroups: [],
    };
  }

  const irisStopsIndex = new Map<number, IrisStop>(
    irisData.stops.map(
      (stop) => [parseInt(stop.line.fahrtNr), stop] as [number, IrisStop],
    ),
  );

  const now = moment().tz("Europe/Berlin");
  const cutoffTimestamp = now.subtract(10, "minutes").valueOf();

  const mergedData: StationData = {
    evaNo: arrivals.arrivals[0].station.evaNumber,
    stationName: arrivals.arrivals[0].station.name,
    stopGroups: [],
  };

  // Process all items in a single iteration
  const processedItems = new Map<string, Stop>();

  function processItems(items: WebAPIStop[], isArrival: boolean) {
    for (const item of items) {
      const key = item.transport.category + "-" + item.transport.number;
      const irisItem = irisStopsIndex.get(item.transport.number);
      const existing = processedItems.get(key);

      if (isArrival) {
        if (existing) {
          processedItems.set(key, {
            ...existing,
            arrival: {
              ...item,
              path: irisItem?.arrivalPath || [],
              origin: item.transport.origin || { name: "" },
            },
          });
        } else {
          processedItems.set(key, {
            irisOverride: false,
            transport: item.transport,
            irisId: irisItem ? irisItem.tripId : "",
            wing: irisItem && irisItem.wing ? irisItem.wing : null,
            arrival: {
              ...item,
              path: irisItem?.arrivalPath || [],
              origin: item.transport.origin || { name: "" },
            },
            departure: null,
            isEarlyTerminated:
              (irisItem?.departurePath && irisItem?.departurePath.length > 0) ||
              false,
            delayMessages: irisItem?.delayMessages || [],
            qualityChanges: irisItem?.qualityChanges || [],
            canceled: irisItem?.canceled || item.canceled,
          });
        }
      } else {
        if (existing) {
          processedItems.set(key, {
            ...existing,
            departure: {
              ...item,
              path: irisItem?.departurePath || [],
              destination: item.transport.destination || { name: "" },
            },
            isEarlyTerminated:
              (irisItem &&
                irisItem.departurePath.length > 0 &&
                irisItem.departurePath[irisItem?.departurePath.length - 1]
                  .name !== item.transport.destination?.name) ||
              item.transport.differingDestination != null,
          });
        } else {
          processedItems.set(key, {
            irisOverride: false,
            transport: item.transport,
            irisId: irisItem ? irisItem.tripId : "",
            wing: irisItem && irisItem.wing ? irisItem.wing : null,
            arrival: null,
            departure: {
              ...item,
              path: irisItem?.departurePath || [],
              destination: item.transport.destination || { name: "" },
            },
            isEarlyTerminated:
              (irisItem &&
                irisItem.departurePath[irisItem?.departurePath.length - 1]
                  .name !== item.transport.destination?.name) ||
              item.transport.differingDestination != null,
            delayMessages: irisItem?.delayMessages || [],
            qualityChanges: irisItem?.qualityChanges || [],
            canceled: irisItem?.canceled || item.canceled,
          });
        }
      }
    }
  }

  processItems(arrivals.arrivals, true);
  processItems(departures.departures, false);

  // Process IRIS data
  irisData.stops.forEach((irisItem) => {
    const key = irisItem.line.productName + "-" + irisItem.line.fahrtNr;
    const existing = processedItems.get(key);
    if (
      !existing &&
      irisItem.when.arrival &&
      moment(irisItem.when.arrival, moment.ISO_8601, true).isValid() &&
      moment(irisItem.when.arrival).valueOf() > cutoffTimestamp
    ) {
      // Create shared transport object to avoid duplication
      const sharedTransport = {
        type: memoizedGetTrainType(irisItem.line.productName || ""),
        journeyDescription: irisItem.line.name,
        label: "",
        number: parseInt(irisItem.line.fahrtNr),
        dfid: null,
        category: irisItem.line.productName || "",
        categoryInternal: irisItem.line.productName || "",
        line: irisItem.line.name.split(" ")[1],
        dtid: null,
        replacementTransport: null,
        direction: null,
        journeyID: key,
        ...(irisItem.hasDeparture
          ? {
              destination: {
                evaNumber: "",
                ifopt: "",
                name: irisItem.to,
                canceled: false,
              },
              differingDestination: null,
            }
          : {
              origin: {
                evaNumber: "",
                ifopt: "",
                name: irisItem.from,
                canceled: false,
              },
              differingOrigin: null,
            }),
        via: [],
      };

      processedItems.set(key, {
        irisOverride: true,
        transport: sharedTransport,
        irisId: irisItem.tripId,
        wing: irisItem.wing || null,
        delayMessages: irisItem.delayMessages,
        qualityChanges: irisItem.qualityChanges,
        canceled: irisItem.canceled,
        arrival: irisItem.hasArrival
          ? {
              station: {
                evaNumber: mergedData.evaNo,
                ifopt: "",
                name: mergedData.stationName,
              },
              journeyID: key,
              timeSchedule: irisItem.plannedWhen.arrival,
              timeType: irisItem.onlyPlanData ? "SCHEDULE" : "PREVIEW",
              time: irisItem.when.arrival || irisItem.plannedWhen.arrival,
              onDemand: false,
              platformSchedule: irisItem.plannedPlatform || "",
              platform: irisItem.platform || irisItem.plannedPlatform || "",
              administration: {
                administrationID: "",
                operatorCode: "",
                operatorName: irisItem.line.operator || "",
              },
              messages: [],
              disruptions: [],
              attributes: [],
              arrivalID: key,
              transport: sharedTransport,
              journeyType: "REGULAR",
              additional: false,
              canceled: irisItem.canceled,
              reliefFor: [],
              reliefBy: [],
              replacementFor: [],
              replacedBy: [],
              continuationFor: null,
              travelsWith: [],
              codeshares: [],
              pastDisruptions: false,
              path: irisItem.arrivalPath || [],
              origin: {
                name: irisItem.from,
              },
            }
          : null,
        departure: irisItem.hasDeparture
          ? {
              station: {
                evaNumber: mergedData.evaNo,
                ifopt: "",
                name: mergedData.stationName,
              },
              journeyID: key,
              timeSchedule: irisItem.plannedWhen.departure,
              timeType: irisItem.onlyPlanData ? "SCHEDULE" : "PREVIEW",
              time: irisItem.when.departure || irisItem.plannedWhen.departure,
              onDemand: false,
              platformSchedule: irisItem.plannedPlatform || "",
              platform: irisItem.platform || irisItem.plannedPlatform || "",
              administration: {
                administrationID: "",
                operatorCode: "",
                operatorName: irisItem.line.operator || "",
              },
              messages: [],
              disruptions: [],
              attributes: [],
              departureID: key,
              transport: sharedTransport,
              journeyType: "REGULAR",
              additional: false,
              canceled: irisItem.canceled,
              reliefFor: [],
              reliefBy: [],
              replacementFor: [],
              replacedBy: [],
              continuationBy: null,
              travelsWith: [],
              codeshares: [],
              futureDisruptions: false,
              path: irisItem.departurePath || [],
              destination: {
                name: irisItem.to,
              },
            }
          : null,
        isEarlyTerminated: false,
      });
    }
  });

  // Fixed wing grouping logic
  const wingGroups = new Map<string, Stop[]>();
  const processedStops = new Set<string>(); // Track which stops have been grouped

  function extractId(idString: string): string {
    const parts = idString.split("-");
    return parts[0] === "" ? `-${parts[1]}` : parts[0];
  }

  // Convert to array for easier iteration
  const stopsArray = Array.from(processedItems.entries());
  for (const [stopKey, stop] of stopsArray) {
    // Skip if already processed
    if (processedStops.has(stopKey)) continue;

    let groupId: string | null = null;

    // Determine the group ID
    if (stop.wing?.wing) {
      groupId = extractId(stop.wing.wing);
    } else if (stop.irisId) {
      groupId = extractId(stop.irisId);
    } else {
      // Use the journey ID as fallback
      groupId = stopKey;
    }

    if (!groupId) continue;

    // Create new group or add to existing
    if (!wingGroups.has(groupId)) {
      wingGroups.set(groupId, [stop]);
      processedStops.add(stopKey);
    } else {
      const group = wingGroups.get(groupId);
      if (group) {
        group.push(stop);
        processedStops.add(stopKey);
      }
    }
  }

  // Convert to plain array and log
  const stopGroups = Array.from(wingGroups.values());
  mergedData.stopGroups = stopGroups;

  return mergedData;
};

// Memoize frequently called pure functions
const memoizedGetTrainType = (() => {
  const cache = new Map();
  return (cat: string) => {
    if (cache.has(cat)) return cache.get(cat);
    const result = (() => {
      switch (cat) {
        case "S":
          return "CITY_TRAIN";
        case "RB":
        case "RE":
          return "REGIONAL_TRAIN";
        case "ICE":
        case "IC":
          return "LONG_DISTANCE_TRAIN";
        default:
          return "UNKNOWN";
      }
    })();
    cache.set(cat, result);
    return result;
  };
})();

export const getTimetableForStation = async (
  evaId: string,
  lookBackItems: number,
): Promise<StationData | null> => {
  if (!evaId) return null;

  // Cache the time frame calculations
  const timeFrame = {
    start: moment().tz("Europe/Berlin").subtract(10, "minutes").toISOString(),
    end: moment().tz("Europe/Berlin").add(2, "hour").toISOString(),
  };

  // Create an array of fetch promises for arrivals and departures
  const fetchResults = await Promise.allSettled([
    cachedFetch(`arrivals-${evaId}`, () =>
      stationBoard.arrivals(evaId, timeFrame),
    ),
    cachedFetch(`departures-${evaId}`, () =>
      stationBoard.departures(evaId, timeFrame),
    ),
    fetchIrisDepartures(evaId),
  ]).then(([arrivalsResult, departuresResult, irisData]) => {
    return {
      evaId,
      arrivals:
        arrivalsResult.status === "fulfilled" ? arrivalsResult.value : null,
      departures:
        departuresResult.status === "fulfilled" ? departuresResult.value : null,
      irisData: irisData.status === "fulfilled" ? irisData.value : null, // Assuming fetchIrisDepartures is already handled
    };
  });

  const result = mergeStationData(
    fetchResults.arrivals,
    fetchResults.departures,
    fetchResults.irisData,
  );

  result.stopGroups.sort((a, b) => {
    return moment(getTime(a[0])).diff(moment(getTime(b[0])));
  });
  //Extract trains that have left and sort by predicted time. This ensures no mixing of left and not left trains
  const leftStopGroups = result.stopGroups
    .filter((group) => hasLeft(group[0]))
    .sort((a, b) =>
      moment(getTime(a[0], true)).diff(moment(getTime(b[0], true))),
    );
  const combined = [
    ...leftStopGroups.slice(-lookBackItems),
    ...result.stopGroups.filter((group) => !hasLeft(group[0])),
  ];

  return {
    evaNo: evaId,
    stationName: fetchResults.irisData?.station || "",
    stopGroups: combined,
  };
};
