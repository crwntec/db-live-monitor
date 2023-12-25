import { WebSocketServer } from "ws";
import moment from "moment-timezone";
import axios from "axios";
import http from "http";
import express from "express";
import cors from "cors";

import stations from "./data/stations.json" assert { type: "json" };
import pjson from "./package.json" assert { type: "json" };

import { convertTimetable } from "./conversion/convertTimetable.js";
import { stationRequest } from "./request/stationRequest.js";
import { getTrainOrder } from "./conversion/getTrainOrder.js";
import { makeRequest } from "./request/makeRequest.js";
import { parseRemarks } from "./util/parseRemarks.js";
import parsePolyline from "./util/parsePolyline.js";
import { getTrip } from "./cache/cache.js";
import initHafas from "./util/initHafas.js";

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
  try {
    let possibleTrips = await hafas.tripsByName(req.params.fahrtNr, {
      results: 1,
      products: {
        suburban: true,
        subway: false,
        tram: false,
        bus: req.query.bus || false,
        ferry: false,
        regional: true,
      },
      language: req.query.language || "de",
    });
    //console.log(possibleTrips.trips)
    hafasRef = possibleTrips.trips[0];
    if (hafasRef !== undefined) {
      const tripData = getTrip(hafas, hafasRef.id);
      let [hints, remarks] = parseRemarks(tripData.trip.remarks);
      let [polyline, stops] = parsePolyline(tripData.trip.polyline);
      const hafasTrip = {
        ...tripData.trip,
        hints: hints,
        remarks: remarks,
        polyline: polyline,
        stops: stops,
      };
      res.send(hafasTrip);
    } else {
      res.sendStatus(204);
    }
  } catch (error) {
    console.error(error);
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
      let hasNextTimetable =
        parsedNextTimetable.elements[0].elements != undefined;
      let converted = await convertTimetable(
        parsedCurrentTimetable,
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
