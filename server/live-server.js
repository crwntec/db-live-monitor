import { WebSocketServer } from "ws";
import moment from "moment-timezone";
import axios from "axios";
import http from "http";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import stations from "./data/stations.json" assert { type: "json" };
import pjson from "./package.json" assert { type: "json" };

import { convertTimetable } from "./conversion/convertTimetable.js";
import { stationRequest } from "./request/stationRequest.js";
import { getTrainOrder } from "./conversion/getTrainOrder.js";
import { makeRequest } from "./request/makeRequest.js";
import { parseRemarks } from "./util/parseRemarks.js";
import parsePolyline from "./util/parsePolyline.js";
import {
  getTrip,
  getCachedDepartures,
  getCachedArrivals,
} from "./cache/cache.js";
import initHafas from "./util/initHafas.js";
import { risApiRequest } from "./request/risApiRequest.js";

const app = express();
app.use(cors());
const server = http.createServer(app);
const PORT = process.env.PORT || 8080;

server.listen(PORT, () => console.log("running"));

let refreshRate = 15000;

const wss = new WebSocketServer({ server: server });

const ds100Pattern = /^[abdefhklmnrstuw]{1}[a-z]|[A-Z]{1,4}$/;

const hafas = initHafas();

let fullChanges = {};
const assignChanges = (changes) => (fullChanges = changes);
let ibnr;
const assignIBNR = (x) => (ibnr = x);

const stationSearch = (req, res) => {
  stationRequest(req.params.string).then((data) => {
    data = data.suggestions.filter(
      (o) => parseInt(o.weight) > 2000 && parseInt(o.extId) > 8000000
    );
    res.send(data);
  });
};
app.get("/", (req, res) => {
  res.redirect("/info");
});
app.get("/verify/:string", (req, res) => {
  if (ds100Pattern.test(req.params.string)) {
    res.send(stations.find((s) => s.DS100 == req.params.string) !== undefined);
  }
});
app.get("/search/:string", (req, res) => stationSearch(req, res));
app.get("/info", (req, res) => {
  res.send(`
              Backend version: ${pjson.version}
              Client Ip: ${req.ip}</br>
              Client Info: ${req.get("User-Agent")}</br>
              Time: ${Date.now().toString()}  
            `);
});
app.get("/wr/:nr/:ts", async (req, response) => {
  const trainNumber = req.params.nr;
  const timestamp = "20" + req.params.ts;
  const isICE = req.query.type == "ICE";
  try {
    const res = await axios.get(
      `https://ist-wr.noncd.db.de/wagenreihung/1.0/${trainNumber}/${timestamp}`
    );

    const trainOrderObj = getTrainOrder(res.data, isICE);
    response.send(trainOrderObj);
  } catch (error) {
    if ((error.code = "ERR_BAD_REQUEST")) {
      response.sendStatus(204);
    } else {
      response.sendStatus(500);
    }
  }
});

app.get("/details/:fahrtNr", async (req, res) => {
  let hafasRef = null;
  let possibleTrips = await hafas
    .tripsByName(req.params.fahrtNr, {
      results: 5,
      products: {
        suburban: true,
        subway: false,
        tram: false,
        bus: req.query.isBus,
        ferry: false,
        regional: true,
        taxi: false,
      },
      language: req.query.language || "de",
    })
    .catch(() => {
      return;
    });
  possibleTrips =
    possibleTrips !== undefined
      ? possibleTrips.trips.filter((t) => t.line.name == req.query.line)
      : [];
  if (possibleTrips.length == 0) {
    let stops = req.query.isDeparture
      ? await getCachedDepartures(hafas, req.query.ibnr)
      : await getCachedArrivals(hafas, req.query.ibnr);
    stops = stops.filter((s) => s.line.fahrtNr == req.params.fahrtNr);
    if (stops.length == 0) {
      res.sendStatus(204);
      return;
    }
    else {
      hafasRef = stops[0].tripId;
    }
  } else {
    hafasRef = possibleTrips[0].id;
  }
  if (hafasRef !== undefined) {
    const tripData = await getTrip(hafas, hafasRef);
    let [hints, remarks] = parseRemarks(tripData.remarks);
    let [polyline, stops] = parsePolyline(tripData.polyline);
    const hafasTrip = {
      ...tripData,
      hints: hints,
      remarks: remarks,
      polyline: polyline,
      stops: stops,
    };
    res.send(hafasTrip);
  } else {
    res.sendStatus(204);
  }
});

wss.on("connection", async (socket, req) => {
  let url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname == "/wss") {
    let stationStr = url.searchParams.get("station");
    handleMonitorReq(url, socket, stationStr);
  }

  socket.on("message", (message) => {
    console.log("Received message:", message);
  });
});

async function handleMonitorReq(url, socket, stationStr) {
  const getIBNR = (stationStr) =>
    stationRequest(stationStr).then((data) =>
      assignIBNR(parseInt(data.suggestions[0].extId))
    );

  refreshRate = url.searchParams.get("refreshRate") || 15000;
  if (ds100Pattern.test(stationStr)) {
    var station = stations.find((s) => s.DS100 == stationStr);
    if (station) {
      assignIBNR(parseInt(station.EVA_NR));
    } else {
      ibnr = null;
    }
  } else {
    await getIBNR(stationStr);
  }

  const fetchIRISDepartures = async () => {
    if (ibnr) {
      const currentDate = moment().tz("Europe/Berlin").format("YYMMDD");
      const currentHour = moment().tz("Europe/Berlin").format("HH");
      const nextDate = moment()
        .tz("Europe/Berlin")
        .add(1, "hour")
        .format("YYMMDD");
      const nextHour = moment().tz("Europe/Berlin").add(1, "hour").format("HH");
      const currentTimetableUrl = `https://iris.noncd.db.de/iris-tts/timetable/plan/${ibnr}/${currentDate}/${currentHour}`;
      const nextTimetableUrl = `https://iris.noncd.db.de/iris-tts/timetable/plan/${ibnr}/${nextDate}/${nextHour}`;
      const fchgUrl = `https://iris.noncd.db.de/iris-tts/timetable/fchg/${ibnr}/`;
      const parsedCurrentTimetable = await makeRequest(currentTimetableUrl);
      const parsedNextTimetable = await makeRequest(nextTimetableUrl);
      const parsedFchg = await makeRequest(fchgUrl);
      assignChanges(parsedFchg);
      // Fetch related ibnrs
      const relatedIbnrsUrl = `https://apis.deutschebahn.com/db-api-marketplace/apis/ris-stations/v1/stop-places/${ibnr}/groups`;
      const relatedIbnrsResponse = await risApiRequest(relatedIbnrsUrl, {
        headers: {
          "DB-Api-Key": process.env.NODE_ENV == "production" ? process.env.DB_API_KEY : dotenv.config().parsed.DB_API_KEY,
          "DB-Client-Id": process.env.NODE_ENV == "production" ? process.env.DB_CLIENT_ID : dotenv.config().parsed.DB_CLIENT_ID,
          accept: "application/vnd.de.db.ris+json",
        },
      });
      const relatedIbnrs = relatedIbnrsResponse.groups[1].members;

      // Fetch timetable, fchg, and rchg for each related ibnr
      const timetablePromises = relatedIbnrs.map(async (relatedIbnr) => {
        const relatedCurrentTimetableUrl = `https://iris.noncd.db.de/iris-tts/timetable/plan/${relatedIbnr}/${currentDate}/${currentHour}`;
        const relatedNextTimetableUrl = `https://iris.noncd.db.de/iris-tts/timetable/plan/${relatedIbnr}/${nextDate}/${nextHour}`;
        const relatedFchgUrl = `https://iris.noncd.db.de/iris-tts/timetable/fchg/${relatedIbnr}/`;
        const relatedParsedCurrentTimetable =
          (await makeRequest(relatedCurrentTimetableUrl)) || null;
        const relatedParsedNextTimetable =
          (await makeRequest(relatedNextTimetableUrl)) || null;
        const relatedParsedFchg = (await makeRequest(relatedFchgUrl)) || null;
        if (
          !relatedParsedCurrentTimetable ||
          !relatedParsedNextTimetable ||
          !relatedParsedFchg
        ) {
          return;
        }
        assignChanges(relatedParsedFchg);

        return {
          currentTimetable: relatedParsedCurrentTimetable,
          nextTimetable: relatedParsedNextTimetable,
          fchg: relatedParsedFchg,
        };
      });

      let relatedTimetables = await Promise.all(timetablePromises);
      relatedTimetables = relatedTimetables.filter(
        (relatedTimetable) => relatedTimetable !== undefined
      );

      // Combine the parts together
      let combinedTimetable = {
        attributes: parsedCurrentTimetable.elements[0].attributes,
        elements: parsedCurrentTimetable.elements[0].elements,
      };

      if (relatedTimetables) {
        relatedTimetables.forEach(({ currentTimetable, nextTimetable }) => {
          if (currentTimetable && currentTimetable.elements[0].elements) {
            combinedTimetable.elements.push(
              ...currentTimetable.elements[0].elements
            );
          }
          if (nextTimetable && nextTimetable.elements[0].elements) {
            combinedTimetable.elements.push(
              ...nextTimetable.elements[0].elements
            );
          }
        });
      }

      let hasNextTimetable =
        parsedNextTimetable.elements[0].elements != undefined;
      let converted = await convertTimetable(
        combinedTimetable,
        hasNextTimetable ? parsedNextTimetable : null,
        parsedFchg,
        fullChanges
      );
      if (!converted) {
        socket.send(404);
        return null;
      }
      socket.send(JSON.stringify(converted));
      const currentTimetableStops = parsedCurrentTimetable.elements[0].elements;
      const nextTimetableStops = parsedNextTimetable.elements[0].elements;
      hasNextTimetable
        ? currentTimetableStops.push(nextTimetableStops.elements)
        : {};
      return {
        attributes: parsedCurrentTimetable.elements[0].attributes,
        elements: currentTimetableStops,
      };
    } else {
      socket.send(404);
      return null;
    }
  };
  var timetable = {};
  let flag = false;
  fetchIRISDepartures().then((res) => {
    timetable = res;
    flag = timetable != null;
  });
  const fetchChanges = async () => {
    if (ibnr && flag) {
      const rchgUrl = `https://iris.noncd.db.de/iris-tts/timetable/rchg/${ibnr}/`;
      let parsedRchg = await makeRequest(rchgUrl);
      if (fullChanges == {}) {
        socket.send(500);
      } else {
        let converted = await convertTimetable(
          timetable,
          null,
          parsedRchg,
          fullChanges
        );
        if (!converted) {
          socket.send(404);
          return null;
        }
        socket.send(JSON.stringify(converted));
        setTimeout(fetchChanges, refreshRate);
      }
    } else {
      socket.send(404);
    }
  };

  setTimeout(fetchChanges, refreshRate);
  socket.on("close", () => {
    timetable = {};
    fullChanges = {};
  });
}
