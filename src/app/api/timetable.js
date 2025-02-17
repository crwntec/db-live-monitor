import moment from "moment-timezone";
import { makeRequest } from "@/util/request/makeRequest";
import { convertTimetable } from "@/util/iris/convertTimetable";
import { stationBoard } from "../../lib/db-web-api";
import { performance } from 'perf_hooks';

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
    data
  });
  return data;
};

const fetchIrisDepartures = async (ibnr) => {
  const startTime = performance.now();
  const cacheKey = `iris_${ibnr}`;
  const cached = IRIS_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < IRIS_CACHE_TTL) {
    console.log('IRIS cache hit!');
    return cached.data;
  }

  const requestStart = performance.now();
  const now = moment().tz("Europe/Berlin");
  const currentDate = now.format("YYMMDD");
  const currentHour = now.format("HH");
  const nextDate = now.add(1, "hour").format("YYMMDD");
  const nextHour = now.format("HH");

  const urls = {
    currentTimetable: `https://iris.noncd.db.de/iris-tts/timetable/plan/${ibnr}/${currentDate}/${currentHour}`,
    nextTimetable: `https://iris.noncd.db.de/iris-tts/timetable/plan/${ibnr}/${nextDate}/${nextHour}`,
    fchg: `https://iris.noncd.db.de/iris-tts/timetable/fchg/${ibnr}/`,
  };

  const [parsedCurrentTimetable, parsedNextTimetable, parsedFchg] =
    await Promise.all([
      makeRequest(urls.currentTimetable),
      makeRequest(urls.nextTimetable),
      makeRequest(urls.fchg),
    ]);
  const requestEnd = performance.now();

  if (!parsedCurrentTimetable) return null;

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
    data: converted
  });
  
  const endTime = performance.now();
  console.log({
    totalIrisTime: `${endTime - startTime}ms`,
    requestTime: `${requestEnd - requestStart}ms`,
    convertTime: `${convertEnd - convertStart}ms`,
    cacheStatus: 'miss'
  });
  return converted;
};

const mergeStationData = (arrivals, departures, irisData) => {
  const startTime = performance.now();
  if (!arrivals || !departures || !irisData) return null;
  
  const indexStart = performance.now();
  const irisStopsIndex = new Map(
    irisData.stops.map(stop => [stop.line.fahrtNr, stop])
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
      const key = `${item.train.category + " " + item.train.lineName}-${item.train.no}`;
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
          processedItems.set(key, {...existing, departure: item});
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
  const processEnd = performance.now();

  const irisProcessStart = performance.now();
  // Process IRIS data
  irisData.stops.forEach(irisItem => {
    const key = irisItem.line.name + "-" + irisItem.line.fahrtNr;
    const existing = processedItems.get(key);
    if (existing) {
      // Only update wing data and add delay messages
      processedItems.set(key, {
        ...existing,
        delayMessages: irisItem.delayMessages,
        wing: irisItem.wing,
        // Only override canceled status if it's true
        canceled: irisItem.canceled || existing.canceled,
        // Keep existing arrival/departure data
        arrival: existing.arrival || (irisItem.hasArrival ? {
          time: irisItem.plannedWhen.arrival,
          timePredicted: irisItem.when.arrival,
          diff: calculateDelay(
            irisItem.when.arrival,
            irisItem.plannedWhen.arrival
          ),
          timeType: "IRIS_" + irisItem.onlyPlanData ? "PLANNED" : "PREDICTED",
          platform: irisItem.plannedPlatform,
          platformPredicted: irisItem.platform,
          administration: {
            operator: irisItem.line.operator,
          },
          origin: {
            name: irisItem.from,
          },
        } : null),
        departure: existing.departure || (irisItem.hasDeparture ? {
          time: irisItem.plannedWhen.departure,
          timePredicted: irisItem.when.departure,
          diff: calculateDelay(
            irisItem.when.departure,
            irisItem.plannedWhen.departure
          ),
          timeType: "IRIS_" + irisItem.onlyPlanData ? "PLANNED" : "PREDICTED",
          platform: irisItem.plannedPlatform,
          platformPredicted: irisItem.platform,
          administration: {
            operator: irisItem.line.operator,
          },
          destination: {
            name: irisItem.to,
          },
        } : null),
      });
    } else {
      // If no existing data, create new entry with IRIS data
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
        arrival: irisItem.hasArrival ? {
          time: irisItem.plannedWhen.arrival,
          timePredicted: irisItem.when.arrival,
          diff: calculateDelay(
            irisItem.when.arrival,
            irisItem.plannedWhen.arrival
          ),
          timeType: "IRIS_" + irisItem.onlyPlanData ? "PLANNED" : "PREDICTED",
          platform: irisItem.plannedPlatform,
          platformPredicted: irisItem.platform,
          administration: {
            operator: irisItem.line.operator,
          },
          origin: {
            name: irisItem.from,
          },
        } : null,
        departure: irisItem.hasDeparture ? {
          time: irisItem.plannedWhen.departure,
          timePredicted: irisItem.when.departure,
          diff: calculateDelay(
            irisItem.when.departure,
            irisItem.plannedWhen.departure
          ),
          timeType: "IRIS_" + irisItem.onlyPlanData ? "PLANNED" : "PREDICTED",
          platform: irisItem.plannedPlatform,
          platformPredicted: irisItem.platform,
          administration: {
            operator: irisItem.line.operator,
          },
          destination: {
            name: irisItem.to,
          },
        } : null,
      });
    }
  });
  const irisProcessEnd = performance.now();

  // Create index for wing lookups
  const wingProcessStart = performance.now();
  const wingIndex = new Map();
  
  // First pass: build wing index
  for (const [key, value] of processedItems.entries()) {
    if (value.wing?.wing) {
      wingIndex.set(value.wing.wing, value.train.journeyId);
    }
  }
  
  // Second pass: update wings using index
  for (const [key, value] of processedItems.entries()) {
    if (value.wing) {
      value.wing.origin = value.train.journeyId;
      value.wing.wing = wingIndex.get(value.wing.wing) || "";
      value.wing.isLeading = !!value.wing.wing;
      
      // Update follower directly from index
      if (value.wing.isLeading) {
        const followerKey = `${value.train.category + value.train.lineName}-${value.train.no}`;
        const follower = processedItems.get(followerKey);
        if (follower) {
          processedItems.set(followerKey, {
            ...follower,
            wing: {
              origin: value.wing.origin,
              wing: value.wing.wing,
              isLeading: false,
            },
          });
        }
      }
    }
  }
  const wingProcessEnd = performance.now();

  const sortStart = performance.now();

  // Convert Map to array and add timestamps for sorting
  mergedData.items = Array.from(processedItems.values()).map(item => {
    const timestamp = item.departure?.timePredicted || item.arrival?.timePredicted;
    return {
      ...item,
      _sortTimestamp: moment(timestamp).valueOf()
    };
  });

  // Sort using cached timestamps
  mergedData.items.sort((a, b) => {
    // Optimize wing check
    const aIsLeader = a.wing?.isLeading;
    const bIsLeader = b.wing?.isLeading;
    
    if (aIsLeader || bIsLeader) {
      if (aIsLeader && b.wing?.origin === a.train.journeyId && !b.wing?.isLeading) return -1;
      if (bIsLeader && a.wing?.origin === b.train.journeyId && !a.wing?.isLeading) return 1;
    }

    return a._sortTimestamp - b._sortTimestamp;
  });

  // Clean up in same pass as final filtering
  mergedData.items = mergedData.items.map(({ _sortTimestamp, ...item }) => item);

  const sortEnd = performance.now();

  const filterStart = performance.now();
  const filterEnd = performance.now();

  const endTime = performance.now();
  console.log({
    totalMergeTime: `${endTime - startTime}ms`,
    indexingTime: `${indexEnd - indexStart}ms`,
    processingTime: `${processEnd - processStart}ms`,
    irisProcessingTime: `${irisProcessEnd - irisProcessStart}ms`,
    wingProcessingTime: `${wingProcessEnd - wingProcessStart}ms`,
    sortingTime: `${sortEnd - sortStart}ms`,
    filteringTime: `${filterEnd - filterStart}ms`,
    itemCount: mergedData.items.length,
    irisStopsCount: irisData.stops.length,
    arrivalsCount: arrivals.items.length,
    departuresCount: departures.items.length
  });
  

  return mergedData;
};

// Memoize frequently called pure functions
const memoizedGetTrainType = (() => {
  const cache = new Map();
  return (cat) => {
    if (cache.has(cat)) return cache.get(cat);
    const result = (() => {
      switch (cat) {
        case "S": return "CITY_TRAIN";
        case "RB":
        case "RE": return "REGIONAL_TRAIN";
        case "ICE":
        case "IC": return "LONG_DISTANCE_TRAIN";
        default: return "UNKNOWN";
      }
    })();
    cache.set(cat, result);
    return result;
  };
})();

export const getTimetableForStation = async (ibnr) => {
  const startTime = performance.now();
  if (!ibnr) return null;
  const timeFrame = {
    start: moment().tz("Europe/Berlin").subtract(10, "minutes").toISOString(),
    end: moment().tz("Europe/Berlin").add(2, "hour").toISOString(),
  };

  const fetchStart = performance.now();
  const [arrivals, departures, irisData] = await Promise.all([
    cachedFetch(`arrivals-${ibnr}`, () => stationBoard.arrivals(ibnr, timeFrame)),
    cachedFetch(`departures-${ibnr}`, () => stationBoard.departures(ibnr, timeFrame)),
    fetchIrisDepartures(ibnr)
  ]);
  const fetchEnd = performance.now();

  const mergeStart = performance.now();
  const result = mergeStationData(arrivals, departures, irisData);
  const mergeEnd = performance.now();
  
  const endTime = performance.now();
  console.log({
    totalTime: `${endTime - startTime}ms`,
    fetchTime: `${fetchEnd - fetchStart}ms`,
    mergeTime: `${mergeEnd - mergeStart}ms`,
    success: result !== null
  });
  return result;
};
