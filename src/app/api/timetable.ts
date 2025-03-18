import moment from "moment-timezone";
import { makeRequest } from "@/util/request/makeRequest";
import { convertTimetable } from "@/util/iris/convertTimetable";
import { stationBoard } from "../../lib/db-web-api";
import { IrisFchg, IrisResult, IrisStop, IrisTimetable } from "@/types/iris";
import { WebAPIResult, WebAPIStop, StationData, Stop } from "@/types/timetable";

// // Add caching for IRIS data with a short TTL (e.g., 30 seconds)
// const IRIS_CACHE = new Map();
// const IRIS_CACHE_TTL = 30000; // 30 seconds

// // Add caching for all API responses, not just IRIS
// const API_CACHE = new Map();
// const API_CACHE_TTL = 30000; // 30 seconds

const cachedFetch = async (key: string, fetchFn: CallableFunction) => {
  // const cached = API_CACHE.get(key);
  // if (cached && Date.now() - cached.timestamp < API_CACHE_TTL) {
  //   return cached.data;
  // }
  const data = await fetchFn();
  // API_CACHE.set(key, {
  //   timestamp: Date.now(),
  //   data,
  // });
  return data;
};

const fetchIrisDepartures = async (eva: string) => {
  // const cacheKey = `iris_${eva}`;
  // const cached = IRIS_CACHE.get(cacheKey);
  // if (cached && Date.now() - cached.timestamp < IRIS_CACHE_TTL) {
  //   return cached.data;
  // }

  const now = moment();
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
    parsedFchg
  );

  // IRIS_CACHE.set(cacheKey, {
  //   timestamp: Date.now(),
  //   data: converted,
  // });

  return converted;
};

const mergeStationData = (
  arrivals: WebAPIResult,
  departures: WebAPIResult,
  irisData: IrisResult
): StationData => {
  if (!arrivals || !departures || !irisData) {
    return {
      evaNo: "",
      stationName: "",
      stationNames: [],
      stopGroups: [],
    };
  }
  console.log("before merge", arrivals.items, departures.items, irisData.stops);

  const irisStopsIndex = new Map<number, IrisStop>(
    irisData.stops
      .map((stop) => [parseInt(stop.line.fahrtNr), stop] as [number, IrisStop])
  );

  const now = moment().tz("Europe/Berlin");
  const cutoffTimestamp = now.subtract(10, "minutes").valueOf();

  function calculateDelay(timeString: string, plannedTimestring: string) {
    const time = moment(timeString);
    const plannedTime = moment(plannedTimestring);
    return time.diff(plannedTime, "minutes");
  }
  const mergedData: StationData = {
    evaNo: arrivals.evaNo,
    stationName: arrivals.stationName,
    stationNames: [],
    stopGroups: [],
  };

  // Process all items in a single iteration
  const processedItems = new Map<string, Stop>();

  function processItems(items: WebAPIStop[], isArrival: boolean) {
    for (const item of items) {
      const key = `${item.train.category + " " + item.train.lineName}-${
        item.train.no
      }`;
      const irisItem = irisStopsIndex.get(item.train.no);
      const existing = processedItems.get(key);

      if (isArrival) {
        if (existing) {
          processedItems.set(key, {
            ...existing,
            arrival: {
              ...item,
              path: irisItem?.arrivalPath || [],
              origin: item.origin || { name: "" },
            },
          });
        } else {
          processedItems.set(key, {
            irisOverride: false,
            train: { ...item.train, id: key },
            irisId: irisItem ? irisItem.tripId : "",
            wing: irisItem && irisItem.wing ? irisItem.wing : null,
            arrival: {
              ...item,
              path: irisItem?.arrivalPath || [],
              origin: item.origin || { name: "" },
            },
            departure: null,
            isEarlyTerminated:(irisItem?.departurePath && irisItem?.departurePath.length > 0) || false,
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
              destination: item.destination || { name: "" },
            },
            isEarlyTerminated: (irisItem && irisItem.departurePath[irisItem?.departurePath.length - 1].name !== item.destination?.name )|| false,
          });
        } else {
          processedItems.set(key, {
            irisOverride: false,
            train: { ...item.train, id: key },
            irisId: irisItem ? irisItem.tripId : "",
            wing: irisItem && irisItem.wing ? irisItem.wing : null,
            arrival: null,
            departure: {
              ...item,
              path: irisItem?.departurePath || [],
              destination: item.destination || { name: "" },
            },
            isEarlyTerminated: (irisItem && irisItem.departurePath[irisItem?.departurePath.length - 1].name !== item.destination?.name )|| false,
            delayMessages: irisItem?.delayMessages || [],
            qualityChanges: irisItem?.qualityChanges || [],
            canceled: irisItem?.canceled || item.canceled,
          });
        }
      }
    }
  }

  processItems(arrivals.items, true);
  processItems(departures.items, false);
  // Process IRIS data
  irisData.stops.forEach((irisItem) => {
    const key = irisItem.line.name + "-" + irisItem.line.fahrtNr;
    const existing = processedItems.get(key);
    if (
      !existing &&
      cutoffTimestamp < moment(irisItem.when.arrival).valueOf()
    ) {
      console.log("IRIS Override: creating entry for ", key, existing, processedItems.size);
      // If no existing data, create new entry with IRIS data
      processedItems.set(key, {
        irisOverride: true,
        train: {
          id: key,
          journeyId: null,
          category: irisItem.line.productName || "",
          type: memoizedGetTrainType(irisItem.line.productName || ""),
          no: parseInt(irisItem.line.fahrtNr),
          lineName: irisItem.line.name.split(" ")[1],
        },
        irisId: irisItem.tripId,
        wing: irisItem.wing || null,
        delayMessages: irisItem.delayMessages,
        canceled: irisItem.canceled,
        arrival: irisItem.hasArrival
          ? {
            train: {
              journeyId: null,
              category: irisItem.line.productName || "",
              type: memoizedGetTrainType(irisItem.line.productName || ""),
              no: parseInt(irisItem.line.fahrtNr),
              lineName: irisItem.line.name.split(" ")[1],
            },
            category: irisItem.line.productName || "",
            canceled: irisItem.canceled,
            time: irisItem.plannedWhen.arrival,
            timePredicted: irisItem.when.arrival,
            diff: calculateDelay(
              irisItem.when.arrival,
              irisItem.plannedWhen.arrival
            ),
            timeType: irisItem.onlyPlanData
              ? "IRIS_PLANNED"
              : "IRIS_PREDICTED",
            platform: irisItem.plannedPlatform || "",
            platformPredicted: irisItem.platform || "",
            administration: {
              id: "", // Add appropriate value
              operatorCode: "", // Add appropriate value
              operatorName: irisItem.line.operator || "",
            },
            origin: {
              name: irisItem.from,
            },
            path: irisItem.arrivalPath || [], // Add the missing path property
          }
          : null,
        departure: irisItem.hasDeparture
          ? {
            train: {
              journeyId: null,
              category: irisItem.line.productName || "",
              type: memoizedGetTrainType(irisItem.line.productName || ""),
              no: parseInt(irisItem.line.fahrtNr),
              lineName: irisItem.line.name.split(" ")[1],
            },
            category: irisItem.line.productName || "",
            canceled: irisItem.canceled,
            time: irisItem.plannedWhen.departure,
            timePredicted: irisItem.when.departure,
            diff: calculateDelay(
              irisItem.when.departure,
              irisItem.plannedWhen.departure
            ),
            timeType: irisItem.onlyPlanData
              ? "IRIS_PLANNED"
              : "IRIS_PREDICTED",
            platform: irisItem.plannedPlatform || "",
            platformPredicted: irisItem.platform || "",
            administration: {
              id: "", // Add appropriate value
              operatorCode: "", // Add appropriate value
              operatorName: irisItem.line.operator || "",
            },
            destination: {
              name: irisItem.to,
            },
            path: irisItem.departurePath || [],
          }
          : null,
          isEarlyTerminated: false,
        qualityChanges: irisItem.qualityChanges
      });
    }
  });
  const wingGroups = new Map<string, Stop[]>();

  function extractId(idString: string) {
    const parts = idString.split("-");
    return parts[0] === "" ? `-${parts[1]}` : parts[0];
  }

  for (const [key, value] of processedItems.entries()) {
    let groupId;
    if (value.wing?.wing) {
      groupId = extractId(value.wing?.wing);
    } else if (value.irisId) {
      groupId = extractId(value.irisId);
    }
    if (!groupId) continue;
    if (!wingGroups.has(groupId)) {
      wingGroups.set(groupId, [value]);
    } else {
      const group = wingGroups.get(groupId);
      if (group) {
        group.push(value);
      }
    }
  }
  mergedData.stopGroups = Array.from(wingGroups.values());

  // Sort using numeric timestamps
  mergedData.stopGroups.sort((a, b) => {
    const aDepartureTime =
      a[0].departure && a[0].departure.time
        ? moment(a[0].departure.time)
        : a[0].arrival && a[0].arrival.time
        ? moment(a[0].arrival.time)
        : moment();
    const bDepartureTime = b[0].departure
      ? moment(b[0].departure.time)
      : b[0].arrival && b[0].arrival.time
      ? moment(b[0].arrival.time)
      : moment();
    const now = moment();
    const aHasLeft =
      aDepartureTime && aDepartureTime.isBefore(now.subtract(10, "minutes"));
    const bHasLeft =
      bDepartureTime && bDepartureTime.isBefore(now.subtract(10, "minutes"));

    if (aHasLeft && bHasLeft) {
      return aDepartureTime.diff(bDepartureTime);
    }
    if (aHasLeft) return -1;
    if (bHasLeft) return 1;

    return aDepartureTime.diff(bDepartureTime);
  });
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
  evaIds: string[]
): Promise<StationData | null> => {
  // Handle multiple evaIds
  const results: { [key: string]: StationData | null } = {};
  const allStopGroups: Stop[][] = []; // Array to hold all stops

  // Check if there are any EVA IDs provided
  if (!evaIds || evaIds.length === 0) return null;

  // Cache the time frame calculations
  const timeFrame = {
    start: moment().tz("Europe/Berlin").subtract(10, "minutes").toISOString(),
    end: moment().tz("Europe/Berlin").add(2, "hour").toISOString(),
  };

  // Create an array of fetch promises for arrivals and departures
  const fetchPromises = evaIds.map((eva) => {
    return Promise.allSettled([
      cachedFetch(`arrivals-${eva}`, () =>
        stationBoard.arrivals(eva, timeFrame)
      ),
      cachedFetch(`departures-${eva}`, () =>
        stationBoard.departures(eva, timeFrame)
      ),
      fetchIrisDepartures(eva),
    ]).then(([arrivalsResult, departuresResult, irisData]) => {
      return {
        eva,
        arrivals:
          arrivalsResult.status === "fulfilled" ? arrivalsResult.value : null,
        departures:
          departuresResult.status === "fulfilled"
            ? departuresResult.value
            : null,
        irisData: irisData.status === "fulfilled" ? irisData.value : null, // Assuming fetchIrisDepartures is already handled
      };
    });
  });

  // Wait for all fetch promises to settle
  const fetchResults = await Promise.all(fetchPromises);

  // Merge results into a single object
  for (const { eva, arrivals, departures, irisData } of fetchResults) {
    // Check if irisData is valid before merging
    if (!irisData) {
      continue; // Skip this iteration if irisData is invalid
    }

    const result = mergeStationData(arrivals, departures, irisData);

    // Store the result in the results object using eva as the key
    results[eva] = result;

    // If the result is valid, add the stops to the allStops array
    if (result && result.stopGroups) {
      allStopGroups.push(...result.stopGroups); // Merge all stops into a single array
    }
  }
  console.log("after merge:", allStopGroups);

  return {
    evaNo: evaIds[0],
    stationName:
      results[evaIds[0]]?.stationName ||
      results[Object.keys(results)[0]]?.stationName ||
      "",
    stationNames: Object.keys(results).map(
      (eva) => results[eva]?.stationName || ""
    ),
    stopGroups: allStopGroups,
  };
};
