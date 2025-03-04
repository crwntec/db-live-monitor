import moment from "moment-timezone";
import { makeRequest } from "@/util/request/makeRequest";
import { convertTimetable } from "@/util/iris/convertTimetable";
import { stationBoard } from "../../lib/db-web-api";
import { performance } from "perf_hooks";

// Add caching for IRIS data with a short TTL (e.g., 30 seconds)
const IRIS_CACHE = new Map();
const IRIS_CACHE_TTL = 30000; // 30 seconds

// Add caching for all API responses, not just IRIS
const API_CACHE = new Map();
const API_CACHE_TTL = 30000; // 30 seconds

const cachedFetch = async (key, fetchFn) => {
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

const fetchIrisDepartures = async (eva) => {
  const startTime = performance.now();
  const cacheKey = `iris_${eva}`;
  const cached = IRIS_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < IRIS_CACHE_TTL) {
    return cached.data;
  }

  const requestStart = performance.now();
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
      makeRequest(urls.currentTimetable),
      makeRequest(urls.nextTimetable),
      makeRequest(urls.fchg),
    ]);
  const requestEnd = performance.now();
  if (!parsedCurrentTimetable.elements[0].elements) return null;

  const convertStart = performance.now();
  const combinedTimetable = {
    attributes: parsedCurrentTimetable.elements[0].attributes,
    elements: parsedCurrentTimetable.elements[0].elements,
  };

  const hasNextTimetable =
    parsedNextTimetable.elements[0].elements != undefined;
  const converted = await convertTimetable(
    combinedTimetable,
    hasNextTimetable ? parsedNextTimetable : null,
    parsedFchg
  );
  const convertEnd = performance.now();

  IRIS_CACHE.set(cacheKey, {
    timestamp: Date.now(),
    data: converted,
  });

  const endTime = performance.now();
  // console.log({
  //   totalIrisTime: `${endTime - startTime}ms`,
  //   requestTime: `${requestEnd - requestStart}ms`,
  //   convertTime: `${convertEnd - convertStart}ms`,
  //   cacheStatus: "miss",
  // });
  return converted;
};

const mergeStationData = (arrivals, departures, irisData) => {
  const startTime = performance.now();
  if (!arrivals || !departures || !irisData) return null;

  const indexStart = performance.now();
  const irisStopsIndex = new Map(
    irisData.stops.map((stop) => [stop.line.fahrtNr, stop])
  );
  const indexEnd = performance.now();

  const processStart = performance.now();
  const now = moment().tz("Europe/Berlin");
  const nowTimestamp = now.valueOf();
  const cutoffTimestamp = now.subtract(10, "minutes").valueOf();

  function calculateDelay(timeString, plannedTimestring) {
    const time = moment(timeString);
    const plannedTime = moment(plannedTimestring);
    return time.diff(plannedTime, "minutes");
  }
  const mergedData = {
    evaNo: arrivals.evaNo,
    stationName: arrivals.stationName,
    availableTransports: arrivals.availableTransports,
    items: [],
  };

  // Process all items in a single iteration
  const processedItems = new Map();

  function processItems(items, isArrival) {
    for (const item of items) {
      const key = `${item.train.category + " " + item.train.lineName}-${
        item.train.no
      }`;
      const irisItem = irisStopsIndex.get(item.train.no);

      if (isArrival) {
        processedItems.set(key, {
          irisOverride: false,
          train: { ...item.train, id: key },
          irisId: irisItem ? irisItem.tripId : null,
          wing: irisItem ? irisItem.wing : null,
          arrival: item,
          departure: null,
          canceled: false,
        });
      } else {
        const existing = processedItems.get(key);
        if (existing) {
          processedItems.set(key, { ...existing, departure: item });
        } else {
          processedItems.set(key, {
            irisOverride: false,
            train: { ...item.train, id: key },
            irisId: null,
            wing: null,
            arrival: null,
            departure: item,
            canceled: false,
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
    if (existing) {
      // Only update wing data and add delay messages
      processedItems.set(key, {
        ...existing,
        delayMessages: irisItem.delayMessages,
        qualityChanges: irisItem.qualityChanges,
        wing: irisItem.wing,
        irisId: irisItem.tripId,
        canceled: irisItem.canceled || existing.canceled,
        arrival: {
          ...existing.arrival,
          path: irisItem.arrivalPath.length > 0 ? irisItem.arrivalPath : null
        },
        departure: {
          ...existing.departure,
          path: irisItem.departurePath.length > 0 ? irisItem.departurePath : null
        }
      });
    } else if (cutoffTimestamp < irisItem.when.arrival ) {
      // If no existing data, create new entry with IRIS data
      console.log("Triggered edge case trap with line: " + key +", " + existing + "| Object: " + irisItem)
      processedItems.set(key, {
        irisOverride: true,
        train: {
          id: key,
          journeyId: null,
          category: irisItem.line.productName,
          type: memoizedGetTrainType(irisItem.line.productName),
          no: irisItem.line.fahrtNr,
          lineName: irisItem.line.name.split(" ")[1],
        },
        irisId: irisItem.tripId,
        wing: irisItem.wing,
        delayMessages: irisItem.delayMessages,
        canceled: irisItem.canceled,
        arrival: irisItem.hasArrival
          ? {
              time: irisItem.plannedWhen.arrival,
              timePredicted: irisItem.when.arrival,
              diff: calculateDelay(
                irisItem.when.arrival,
                irisItem.plannedWhen.arrival
              ),
              timeType:
                "IRIS_" + irisItem.onlyPlanData ? "PLANNED" : "PREDICTED",
              platform: irisItem.plannedPlatform,
              platformPredicted: irisItem.platform,
              administration: {
                operator: irisItem.line.operator,
              },
              origin: {
                name: irisItem.from,
              },
            }
          : null,
        departure: irisItem.hasDeparture
          ? {
              time: irisItem.plannedWhen.departure,
              timePredicted: irisItem.when.departure,
              diff: calculateDelay(
                irisItem.when.departure,
                irisItem.plannedWhen.departure
              ),
              timeType:
                "IRIS_" + irisItem.onlyPlanData ? "PLANNED" : "PREDICTED",
              platform: irisItem.plannedPlatform,
              platformPredicted: irisItem.platform,
              administration: {
                operator: irisItem.line.operator,
              },
              destination: {
                name: irisItem.to,
              },
            }
          : null,
      });
    }
  });
  const wingGroups = new Map();

  function extractId(idString) {
    const parts = idString.split("-");
    return parts[0] === "" ? `-${parts[1]}` : parts[0];
  }

  for (const [key, value] of processedItems.entries()) {
    let groupId;
    if (value.wing?.wing && typeof value.wing.wing === 'string') {
      groupId = extractId(value.wing.wing);
    } else if (value.irisId) {
      groupId = extractId(value.irisId);
    }
    if (!groupId) continue;
    if (!wingGroups.has(groupId)) {
      wingGroups.set(groupId, [value]);
    } else {
      wingGroups.get(groupId).push(value);
    }
  }
  mergedData.items = Array.from(wingGroups.values()).map(group => {
    const departureTime = group[0].departure?.time;
    const arrivalTime = group[0].arrival?.time;
    const timestampStr = departureTime || arrivalTime;
    
    // Parse the timestamp string into a Unix timestamp
    const timestampMoment = moment(timestampStr);
    const unixTimestamp = timestampMoment.isValid() ? timestampMoment.valueOf() : 0;
    
    return [...group, { _sortTimestamp: unixTimestamp }];
  });
  
  // Sort using numeric timestamps
  mergedData.items.sort((a, b) => {
    const aDepartureTime = a[0].departure?.time ? moment(a[0].departure.time) : moment(a[0].arrival.time);
    const bDepartureTime = b[0].departure?.time ? moment(b[0].departure.time) : moment(b[0].arrival.time);
    const now = moment();
    const aHasLeft = aDepartureTime && aDepartureTime.isBefore(now.subtract(10, 'minutes'));
    const bHasLeft = bDepartureTime && bDepartureTime.isBefore(now.subtract(10, 'minutes'));

    if (aHasLeft && bHasLeft) {
      return aDepartureTime - bDepartureTime;
    }
    if (aHasLeft) return -1;
    if (bHasLeft) return 1;
    
    return aDepartureTime - bDepartureTime;
  });

  // Clean up in same pass as final filtering
  mergedData.items = mergedData.items.map(group => group.slice(0, -1));
  return mergedData;
};

// Memoize frequently called pure functions
const memoizedGetTrainType = (() => {
  const cache = new Map();
  return (cat) => {
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

export const getTimetableForStation = async (evaIds) => {
  // Handle multiple evaIds
  const results = {};
  const allStops = []; // Array to hold all stops
  
  // Check if there are any EVA IDs provided
  if (!evaIds || evaIds.length === 0) return null;

  // Cache the time frame calculations
  const timeFrame = {
    start: moment().tz("Europe/Berlin").subtract(10, "minutes").toISOString(),
    end: moment().tz("Europe/Berlin").add(2, "hour").toISOString(),
  };

  // Create an array of fetch promises for arrivals and departures
  const fetchPromises = evaIds.map(eva => {
    
    return Promise.allSettled([
      cachedFetch(`arrivals-${eva}`, () => stationBoard.arrivals(eva, timeFrame)),
      cachedFetch(`departures-${eva}`, () => stationBoard.departures(eva, timeFrame)),
      fetchIrisDepartures(eva),
    ]).then(([arrivalsResult, departuresResult, irisData]) => {
      return {
        eva,
        arrivals: arrivalsResult.status === 'fulfilled' ? arrivalsResult.value : null,
        departures: departuresResult.status === 'fulfilled' ? departuresResult.value : null,
        irisData: irisData.value, // Assuming fetchIrisDepartures is already handled
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
    if (result && result.items) {
      allStops.push(...result.items); // Merge all stops into a single array
    }
  }


  return {
    stationName: (results[evaIds[0]] || results[Object.keys(results)[0]]).stationName,
    stationNames: Object.keys(results).map(eva => results[eva].stationName), // Assuming you want to list the evas as station names
    items: allStops,
  };
};
