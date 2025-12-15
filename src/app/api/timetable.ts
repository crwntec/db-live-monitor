import moment from "moment-timezone";
import { makeRequest } from "@/util/request/makeRequest";
import { convertTimetable } from "@/util/iris/convertTimetable";
import { stationBoard } from "@/lib/db-web-api";
import { IrisFchg, IrisResult, IrisStop, IrisTimetable } from "@/types/iris";
import { StationData, Stop, WebAPIResult, WebAPIStop } from "@/types/timetable";
import { getTime } from "@/util";
import { LRUCache } from "lru-cache";

// Add caching for IRIS data with a short TTL (e.g., 30 seconds)
const IRIS_CACHE_TTL = 30000; // 30 seconds
const IRIS_CACHE = new LRUCache<string, { timestamp: number; data: any }>({
  max: 100,
  ttl: IRIS_CACHE_TTL,
  ttlAutopurge: true,
});

// Add caching for all API responses, not just IRIS
const API_CACHE_TTL = 30000; // 30 seconds
const API_CACHE = new LRUCache<string, { timestamp: number; data: any }>({
  max: 100,
  ttl: API_CACHE_TTL,
  ttlAutopurge: true,
});

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

  const nextHourMoment = now.clone().add(1, "hour");
  const nextDate = nextHourMoment.format("YYMMDD");
  const nextHour = nextHourMoment.format("HH");

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

  // const hasNextTimetable =
  //   parsedNextTimetable.elements[0].elements != undefined;
  const converted = await convertTimetable(
    parsedCurrentTimetable,
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

const getRelatedJourneyIDs = (stop: Stop): string[] => {
  const ids = new Set<string>();
  ids.add(stop.transport.journeyID);
  const stopArrDep = stop.departure ? stop.departure : stop.arrival;
  if (stopArrDep?.travelsWith.length) {
    for (const twin of stopArrDep?.travelsWith) {
      if (twin.journeyID) ids.add(twin.journeyID);
    }
  }
  return Array.from(ids);
};
const buildWingGroups = (stops: Stop[]): Map<string, Stop[]> => {
  const graph = new Map<string, Set<string>>();
  const stopMap = new Map<string, Stop>();

  for (const stop of stops) {
    const mainId = stop.transport.journeyID;
    stopMap.set(mainId, stop);
    if (!graph.has(mainId)) graph.set(mainId, new Set());
    const related = getRelatedJourneyIDs(stop);
    for (const id of related) {
      if (!graph.has(id)) graph.set(id, new Set());
      graph.get(mainId)!.add(id);
      graph.get(id)!.add(mainId); // undirected
    }
    if (stop.wing?.wing) {
      const wingKey = `WING:${stop.wing.wing}`;
      if (!graph.has(wingKey)) graph.set(wingKey, new Set());
      graph.get(mainId)!.add(wingKey);
      graph.get(wingKey)!.add(mainId);
    }
  }
  const visited = new Set<string>();
  const components = new Map<string, string[]>();

  for (const nodeId of graph.keys()) {
    if (visited.has(nodeId)) continue;
    const component: string[] = [];
    const queue = [nodeId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      if (!current.startsWith("WING:")) {
        component.push(current);
      }

      for (const neighbor of graph.get(current) || []) {
        if (!visited.has(neighbor)) {
          queue.push(neighbor);
        }
      }
      if (component.length > 0) {
        const rep = component[0];
        components.set(rep, component);
      }
    }
  }
  const wingGroups = new Map<string, Stop[]>();
  for (const [rep, journeyIds] of components) {
    const group: Stop[] = [];
    for (const id of journeyIds) {
      const stop = stopMap.get(id);
      if (stop) group.push(stop);
    }
    if (group.length > 0) {
      wingGroups.set(rep, group);
    }
  }

  return wingGroups;
};
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
      const currentStation = mergedData.stationName;
      const scheduledDestination =
        item.transport.destination?.name ||
        item.transport.direction?.stopPlaces[0]?.name ||
        currentStation;

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
          const isScheduledToContinue =
            scheduledDestination != undefined &&
            scheduledDestination !== currentStation;
          const doesNotContinue =
            irisItem != undefined &&
            (!irisItem?.departurePath || irisItem?.departurePath.length === 0);

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
            isEarlyTerminated: isScheduledToContinue && doesNotContinue,
            irisDelayMessages: irisItem?.delayMessages || [],
            irisQualityChanges: irisItem?.qualityChanges || [],
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
                  .name !== scheduledDestination) ||
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
            irisDelayMessages: irisItem?.delayMessages || [],
            irisQualityChanges: irisItem?.qualityChanges || [],
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
      moment.utc(irisItem.when.arrival).isValid() &&
      moment.utc(irisItem.when.arrival).tz("Europe/Berlin").valueOf() > cutoffTimestamp
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
        irisDelayMessages: irisItem.delayMessages,
        irisQualityChanges: irisItem.qualityChanges,
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

  const allStops = Array.from(processedItems.values());
  const wingGroups = buildWingGroups(allStops);
  mergedData.stopGroups = Array.from(wingGroups.values());

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
