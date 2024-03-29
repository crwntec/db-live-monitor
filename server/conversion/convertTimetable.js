import moment from "moment-timezone";
import fs from "fs";
import { log } from "console";
import { makeRequest } from "../request/makeRequest.js";

let rawCats = fs.readFileSync("./data/messageCategorys.json");
let parsedCats = JSON.parse(rawCats);


const getWings = (tripId, wings) =>
  makeRequest(
    `https://iris.noncd.db.de/iris-tts/timetable/wingdef/${tripId}/${wings}`
  );

function convertISOTime(timestamp) {
  const date = new Date(timestamp);

  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  const formattedTime = `${hours}:${minutes}`;
  return formattedTime;
}

const hasLeft = (when, hasDeparture) => {
  const timestamp = moment().tz("Europe/Berlin").format("YYMMDDHHmm");
  return (parseInt(hasDeparture ? when.split("|")[1] : when.split("|")[0]) -
    parseInt(timestamp) < 0);
}

const messageLookup = (cat) => {
  return parsedCats.find((e) => e.cat == cat);
};
export const convertTimetable = (data1, data2, changes, fullChanges) => {
  return new Promise(async (resolve) => {
    let dataTimetable = {};
    let wingsCache = [];
    if (data2) {
      dataTimetable = {
        attributes: data1.attributes,
        elements: data1.elements,
      };
      data2.elements[0].elements.forEach((e) => dataTimetable.elements.push(e));
    } else {
      dataTimetable = data1;
    }
    const changesTimetable = changes.elements[0];
    if (
      dataTimetable.attributes == undefined ||
      changesTimetable.elements == undefined
    ) {
      return;
    }
    let newJSON = { station: dataTimetable.attributes.station, stops: [] };
    dataTimetable.elements = dataTimetable.elements.filter((element) => {
      return element !== undefined;
    });
    changesTimetable.elements = changesTimetable.elements.filter((element) => {
      return element !== undefined;
    });
    async function processStop(e) {
      if (e.attributes == undefined || e.elements == undefined) {
        console.log(e)
      }
      if (fullChanges.elements[0].elements == undefined) {
        console.log(fullChanges)
      }
      const changes =
        changesTimetable.elements.find(
          (o) => o.attributes.id == e.attributes.id
        ) == undefined
          ? fullChanges.elements[0].elements.find(
              (o) => o.attributes.id == e.attributes.id
            )
          : changesTimetable.elements.find(
              (o) => o.attributes.id == e.attributes.id
            );
      let delayCauses = [];
      let qualityChanges = [];

      const newArr =
        changes !== undefined
          ? changes.elements.find((o) => o.name == "ar")
          : undefined;
      let hasNewArr = newArr !== undefined;
      let hasNewArrTime =
        newArr !== undefined && newArr.attributes !== undefined
          ? newArr.attributes.ct !== undefined
          : false;

      const newDep =
        changes !== undefined
          ? changes.elements.find((o) => o.name == "dp")
          : undefined;
      let hasNewDep = newDep !== undefined;
      let hasNewDepTime =
        newDep !== undefined ? newDep.attributes !== undefined : false;

      let currentStatus = "";
      let hasNewArrPlatform = false;
      let currentArrPlatform = "";
      let hasNewDepPlatform = false;
      let currentDepPlatform = "";

      if (hasNewArr && newArr.elements !== undefined) {
        newArr.elements
          .filter((e) => e !== undefined)
          .forEach((e) => {
            var category = messageLookup(e.attributes.c);
            var messageObj = {
              id: e.attributes.id,
              cat: category ? category.cat : e.attributes.c,
              text: category ? category.text : "Unbekannt",
              timestamp: e.attributes.ts,
            };
            if (e.attributes.t == "d") {
              category !== undefined ? delayCauses.push(messageObj) : {};
            } else if (e.attributes.t == "q") {
              var category = messageLookup(e.attributes.c);
              category !== undefined ? qualityChanges.push(messageObj) : {};
            }
          });
        if (newArr.attributes !== undefined) {
          currentStatus =
            newArr.attributes.cs !== undefined ? newArr.attributes.cs : "";
          hasNewArrPlatform = newArr.attributes.cp !== undefined;
          currentArrPlatform = hasNewArrPlatform ? newArr.attributes.cp : "";
        }
      }
      if (hasNewDep && newDep.attributes !== undefined) {
        hasNewDepPlatform = newDep.attributes.cp !== undefined;
        currentDepPlatform = hasNewDepPlatform ? newDep.attributes.cp : "";
      }

      const line = e.elements.find((o) => o.name == "tl");

      const arrival = e.elements.find((o) => o.name == "ar");
      let hasArrival = arrival !== undefined;

      const departure = e.elements.find((o) => o.name == "dp");
      let hasDeparture = departure !== undefined;

      const arrString = hasArrival ? arrival.attributes.pt : "-";
      const depString = hasDeparture ? departure.attributes.pt : "-";

      const newArrString =
        hasNewArr && hasNewArrTime ? newArr.attributes.ct : arrString;
      const newDepString =
        hasNewDep && hasNewDepTime ? newDep.attributes.ct : depString;

      const irisArPath = hasArrival ? arrival.attributes.ppth.split("|") : "";
      const plannedPath = hasDeparture
        ? departure.attributes.ppth.split("|")
        : [];
      let irisDpPath =
        hasNewDep && newDep.attributes !== undefined && hasDeparture
          ? departure.attributes.ppth != undefined
            ? departure.attributes.ppth.split("|")
            : []
          : [];
      const onlyPlanData = irisDpPath.length == 0 && hasDeparture;

      let hasWings = hasArrival
        ? arrival.attributes.wings !== undefined
        : departure.attributes.wings !== undefined;
      const wings = hasWings
        ? hasArrival
          ? arrival.attributes.wings
          : departure.attributes.wings
        : [];
      let wing = {};
      if (hasWings) {
        let _ = await getWings(e.attributes.id, wings);
        let wingDef = _.elements[0].elements;
        if (wingDef) {
          const start = wingDef.find((e) => e.name == "start");
          const end = wingDef.find((e) => e.name == "end");
          wing = {
            origin: e.attributes.id,
            wing: wings,
            start: {
              station: start.attributes["st-name"],
              pt: start.attributes.pt,
            },
            end: {
              station: end.attributes["st-name"],
              pt: end.attributes.pt,
            },
          };
          let wing2 = {
            origin: wings,
            wing: e.attributes.id,
            start: {
              station: start.attributes["st-name"],
              pt: start.attributes.pt,
            },
            end: {
              station: end.attributes["st-name"],
              pt: end.attributes.pt,
            },
          };
          wingsCache.push(wing2);
        } else {
          hasWings = false
        }
      } else {
        wing = wingsCache.find((o) => e.attributes.id.includes(o.origin));
        if (wing) {
          hasWings = true;
        }
      }
      const cat = line.attributes.f;

      const hasLineName =
        (hasArrival ? arrival.attributes.l : departure.attributes.l) !=
        undefined;
      const lineString =
        cat == "F" || !hasLineName
          ? line.attributes.n
          : hasArrival
          ? arrival.attributes.l
          : departure.attributes.l;

      delayCauses = delayCauses.sort(
        (a, b) => parseInt(a.timestamp) - parseInt(b.timestamp)
      );
      qualityChanges = qualityChanges.sort(
        (a, b) => parseInt(a.timestamp) - parseInt(b.timestamp)
      );
      const stopObj = {
        tripId: e.attributes.id,
        qualityChanges: qualityChanges,
        hasArrival: hasArrival,
        hasDeparture: hasDeparture,
        hasNewArr: hasNewArr,
        hasNewTime: hasNewArrTime ? newArr.attributes.ct != arrString : false,
        when: newArrString + "|" + newDepString,
        plannedWhen: arrString + "|" + depString,
        cancelled: currentStatus == "c",
        hasLeft: hasLeft(newArrString + "|" + newDepString, hasDeparture),
        onlyPlanData: onlyPlanData,
        causesOfDelay: delayCauses,
        hasNewPlatform: hasNewArrPlatform || hasNewDepPlatform,
        platform: hasArrival
          ? hasNewArrPlatform
            ? currentArrPlatform
            : arrival.attributes.pp
          : hasNewDepPlatform
          ? currentDepPlatform
          : departure.attributes.pp,
        plannedPlatform: hasArrival
          ? arrival.attributes.pp
          : departure.attributes.pp,
        arrivalPath: hasArrival ? irisArPath : [],
        plannedPath: plannedPath,
        currentPath: irisDpPath,
        hasWings: hasWings,
        wing: wing,
        from: hasArrival
          ? irisArPath.at([0])
          : dataTimetable.attributes.station,
        to: hasDeparture
          ? plannedPath.at(-1)
          : dataTimetable.attributes.station,
        isEnding: !hasDeparture,
        line: {
          fahrtNr: line.attributes.n,
          name: line.attributes.c + " " + lineString,
          productName: line.attributes.c,
          operator: line.attributes.o,
        },
      };
      return stopObj;
    }
    const processedStopsPromises = dataTimetable.elements.map(processStop);

    let processedStops = await Promise.all(processedStopsPromises);
    

    const isDuplicate = (item, index, array) => {
      const { tripId, line: { fahrtNr } } = item;
      return (
        array.findIndex(
          (el) => el.tripId === tripId || el.line.fahrtNr === fahrtNr
        ) !== index
      );
    };

    const uniqueProcessedStops = processedStops.filter((item, index, array) => !isDuplicate(item, index, array));
    processedStops = uniqueProcessedStops;

    const timestamp = moment().tz("Europe/Berlin").format("YYMMDDHHmm");
    newJSON.stops = processedStops.filter(
      (e) =>
        (parseInt(
          e.hasDeparture
            ? e.when.split("|")[1]
            : e.when.split("|")[0]
        ) -
          parseInt(timestamp)) >
        - 3
    );
    resolve(newJSON);
  });
};
