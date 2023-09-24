import { WebSocketServer } from "ws";
import stations from "./stations.json" assert { type: "json" };
import moment from "moment/moment.js";
import axios from "axios";
import http from "http";
import express from "express";
import cors from "cors";
import { convertTimetable } from "./convertTimetable.js";
import { stationRequest } from "./stationRequest.js";
import { getTrainOrder } from "./getTrainOrder.js";
import { makeRequest } from "./makeRequest.js";
import { createDbHafas } from "db-hafas";
import { parseRemarks } from "./parseRemarks.js";
import { getCache, updateCache } from "./cache.js";
import pjson from "./package.json" assert { type: "json" };

const app = express();
app.use(cors());
const server = http.createServer(app);
const PORT = process.env.PORT || 8080

server.listen(PORT, () => console.log("running"));

let refreshRate = 15000;

const wss = new WebSocketServer({ server: server, path: "/wss" });

const ds100Pattern = /^[abdefhklmnrstuw]{1}[a-z]|[A-Z]{1,4}$/;

const hafas = createDbHafas("dbm");

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

  try {
    const res = await axios.get(
      `https://ist-wr.noncd.db.de/wagenreihung/1.0/${trainNumber}/${timestamp}`
    );
    const trainOrderObj = getTrainOrder(res.data);
    response.send(trainOrderObj);
  } catch (error) {
    response.sendStatus(204);
  }
});
app.get("/details/:fahrtNr", async (req, res) => {
  let hafasRef = null;
  try {
    let possibleTrips = getCache();
    if (possibleTrips.length == 0) {
      await updateCache(ibnr, hafas);
      possibleTrips = getCache();
    }
    const trip = possibleTrips.find((o) => o.line.name == req.query.line && o.line.fahrtNr == req.params.fahrtNr);
    if (trip !== undefined) hafasRef = trip;
    let stopovers = null;
    if (hafasRef !== null) {
      const tripData = await hafas.trip(hafasRef.tripId, {
        onlyCurrentlyRunning: false,
        language: "de",
      });
      stopovers = tripData.trip.stopovers;
      let [hints, remarks] = await parseRemarks(tripData.trip.remarks);
      const hafasTrip = { ...tripData.trip, hints: hints, remarks: remarks };
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
  const getIBNR = (stationStr) =>
    stationRequest(stationStr).then((data) =>
      assignIBNR(parseInt(data.suggestions[0].extId))
    );

  let url = new URL(req.url, `http://${req.headers.host}`);
  let stationStr = url.searchParams.get("station");
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
      const currentDate = moment(Date.now()).utcOffset(120).format("YYMMDD");
      const currentHour = moment(Date.now()).utcOffset(120).format("HH");
      const nextDate = moment(Date.now()).utcOffset(180).format("YYMMDD");
      const nextHour = moment(Date.now()).utcOffset(180).format("HH");
      const currentTimetableUrl = `https://iris.noncd.db.de/iris-tts/timetable/plan/${ibnr}/${currentDate}/${currentHour}`;
      const nextTimetableUrl = `https://iris.noncd.db.de/iris-tts/timetable/plan/${ibnr}/${nextDate}/${nextHour}`;
      const fchgUrl = `https://iris.noncd.db.de/iris-tts/timetable/fchg/${ibnr}/`;
      const parsedCurrentTimetable = await makeRequest(currentTimetableUrl);
      const parsedNextTimetable = await makeRequest(nextTimetableUrl);
      const parsedFchg = await makeRequest(fchgUrl);
      assignChanges(parsedFchg);
      updateCache(ibnr, hafas);
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
      updateCache(ibnr, hafas);
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

  socket.on("message", (message) => {
    console.log("Received message:", message);
  });

  socket.on("close", () => {
    timetable = {};
    fullChanges = {};
  });
});
