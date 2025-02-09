import moment from "moment-timezone";
import { makeRequest } from "@/util/request/makeRequest";
import { convertTimetable } from "@/util/timetable/convertTimetable";
import { stationBoard } from "../../lib/db-web-api";

const fetchIrisDepartures = async (ibnr) => {
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

  if (!parsedCurrentTimetable) return null;

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

  return converted;
};

const mergeStationData = (arrivals, departures, irisData) => {
  if (!arrivals || !departures || !irisData) return null;
  function calculateDelay(timeString, plannedTimestring) {
    const time = moment(timeString);
    const plannedTime = moment(plannedTimestring);
    return time.diff(plannedTime, "minutes");
  }
  function hasLeft(item, lookBack) {
    const now = moment();
    const time = moment(item.arrival ? item.arrival.timePredicted : item.departure.timePredicted);
    return now.isAfter(time.add(lookBack, "minutes"));
  }
  function getTrainType(cat) {
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
  }
  const mergedData = {
    evaNo: arrivals.evaNo,
    stationName: arrivals.stationName,
    availableTransports: arrivals.availableTransports,
    items: [],
  };

  const itemsMap = new Map();
  function processItems(items, isArrival) {
    for (const item of items) {
      const key = `${item.train.category + " " + item.train.lineName}-${
        item.train.no
      }`;
      const irisItem = irisData.stops.find(
        (irisItem) => irisItem.line.fahrtNr == item.train.no
      );
      if (!itemsMap.has(key)) {
        itemsMap.set(key, {
          irisOverride: false,
          train: { ...item.train, id: key },
          irisId: irisItem ? irisItem.tripId : null,
          wing: irisItem ? irisItem.wing : null,
          arrival: null,
          departure: null,
          canceled: false,
        });
      }
      if (isArrival) {
        itemsMap.get(key).arrival = item;
        if(itemsMap.get(key).arrival.canceled) itemsMap.get(key).canceled = true
      } else {
        itemsMap.get(key).departure = item;
        if(itemsMap.get(key).departure.canceled) itemsMap.get(key).canceled = true
      }
    }
  }
  processItems(arrivals.items, true);
  processItems(departures.items, false);

  irisData.stops.map((irisItem) => {
    const key = irisItem.line.name + "-" + irisItem.line.fahrtNr;
    if (!itemsMap.has(key)) {
      itemsMap.set(key, {
        irisOverride: true,
        train: {
          id: key,
          journeyId: null,
          category: irisItem.line.productName,
          type: getTrainType(irisItem.line.productName),
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
    } else {
      itemsMap.set(key, {
        ...itemsMap.get(key),
        delayMessages: irisItem.delayMessages
    });
    }
  });
  // Iterate over the items in itemsMap to update wing.origin and wing.wing
  for (const [key, value] of itemsMap.entries()) {
    if (value.wing) {
      value.wing.origin = value.train.journeyId;
      const wingItems = Array.from(itemsMap.values()).filter((item) =>
        item.irisId?.includes(value.wing.wing)
      );
      value.wing.wing =
        wingItems.length > 0 ? wingItems[0].train.journeyId : "";
      if (!wingItems.length) continue;
      value.wing.isLeading = true;
      itemsMap.set(
        `${wingItems[0].train.category + wingItems[0].train.lineName}-${
          wingItems[0].train.no
        }`,
        {
          ...wingItems[0],
          wing: {
            origin: value.wing.origin,
            wing: value.wing.wing,
            isLeading: false,
          },
        }
      );
    }
  }

  mergedData.items = Array.from(itemsMap.values());
  mergedData.items.sort((a, b) => {
    const timeA = new Date(
      a.departure ? a.departure.timePredicted : a.arrival.timePredicted
    ).getTime();
    const timeB = new Date(
      b.departure ? b.departure.timePredicted : b.arrival.timePredicted
    ).getTime();

    if (
      a.wing?.isLeading &&
      b.wing?.origin === a.train.journeyId &&
      !b.wing?.isLeading
    )
      return -1; // Leader first
    if (
      b.wing?.isLeading &&
      a.wing?.origin === b.train.journeyId &&
      !a.wing?.isLeading
    )
      return 1; // Leader first

    return timeA - timeB;
  })
  mergedData.items = mergedData.items.filter((item) => !hasLeft(item, 10));
  return mergedData;
};

export const getTimetableForStation = async (ibnr) => {
  if (!ibnr) return null;
  const timeFrame = {
    start: moment().tz("Europe/Berlin").subtract(10, "minutes").toISOString(),
    end: moment().tz("Europe/Berlin").add(2, "hour").toISOString(),
  };
  const arrivals = stationBoard
    .arrivals(ibnr, timeFrame)
  const departures = stationBoard.departures(ibnr, timeFrame);
  const irisData = await fetchIrisDepartures(ibnr);
  
  return await Promise.all([arrivals, departures, irisData]).then((values) => {
    const [arrivals, departures, irisData] = values;
    return mergeStationData(arrivals, departures, irisData);
  });

};
