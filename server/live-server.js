import { WebSocketServer } from 'ws';
import { createClient } from "hafas-client";
import { xml2json } from 'xml-js'
import { profile as dbProfile} from "hafas-client/p/db/index.js";
import fs from 'fs'
import moment from 'moment/moment.js';
import https from 'https';
const userAgent = "hafas-test";
const client = createClient(dbProfile, userAgent);

const server = new WebSocketServer({ port: 8080 });

const ds100Pattern = /^[abdefhklmnrstuw]{1}[a-z]|[A-Z]{1,4}$/;
let rawdata = fs.readFileSync('stations.json');
let parsed = JSON.parse(rawdata)



const convertTimetable = (data) => {
    const timetable = data.elements[0];
    let newJSON = {"station": timetable.attributes.station,"stops": []};
    let i = 0
    timetable.elements = timetable.elements.filter((element)=> {
        return element !== undefined;
     });

    timetable.elements.forEach(e => {
        i++
        const line = e.elements.find(o => o.name == 'tl');
        const arrival = e.elements.find(o => o.name == 'ar');
        let hasArrival = true
        const departure = e.elements.find(o => o.name == 'dp');
        let hasDeparture = true
        if (arrival == undefined) {
            hasArrival = false
        } else if (departure ==undefined){
            hasDeparture = false
        }
        const depString = hasDeparture ? departure.attributes.pt : "-"
        const arrString = hasArrival ? arrival.attributes.pt : "-"
        const cat = line.attributes.f
        const lineString = cat=='F' ? line.attributes.n : hasArrival ? arrival.attributes.l : departure.attributes.l;
        newJSON.stops.push({
            "tripId": e.attributes.id,
            "hasArrival": hasArrival,
            "hasDeparture": hasDeparture,
            "when": arrString + "|" + depString,
            "plannedWhen": arrString + "|" + depString ,
            "platform": hasArrival ? arrival.attributes.pp : departure.attributes.pp,
            "plannedPlatform": hasArrival ? arrival.attributes.pp : departure.attributes.pp,
            "direction": hasDeparture ? departure.attributes.ppth.split('|').at(-1) : "ending here",
            "line": {
                "fahrtNr": line.attributes.n,
                "name": line.attributes.c + lineString,
                "productName": line.attributes.c,
                "operator": line.attributes.o
    
            }
        })
    })
    return(newJSON)
    }

server.on('connection', (socket, req)=>{
    console.log("Client connected to")
    let url = new URL(req.url, `http://${req.headers.host}`);
    let stationStr = url.pathname.replace(/^./, "");
    var ibnr = '';
    if(ds100Pattern.test(stationStr)){
        var station = parsed.find(s => s.ril100 == stationStr)
        if (station){
            ibnr = station.id
        } else {
            ibnr = null
        }
    } else {
        var stations = parsed.filter(s => s.name.includes(decodeURI(stationStr)))
        var station = stations.find(o=>o.name.includes('Hauptbahnhof'))
        console.log(stations)
        if(!station){
            var maxWeight = Math.max(...stations.map(o=>o.weight))
            station = parsed.find(s => s.weight==maxWeight)
            //console.log(station)
        }
        if (station){
            ibnr = station.id
        } else {
            ibnr = null
        }

    }

    const fetchIRISDepartures = () => {
        if (ibnr) {
            const date = moment(Date.now()).format("YYMMDD")
            const hour = moment(Date.now()).format("HH")
            const url = `https://iris.noncd.db.de/iris-tts/timetable/plan/${ibnr}/${date}/${hour}`;
            var data = '';
            https.get(url, (res)=>{
                if (res.statusCode >= 200 && res.statusCode < 400) {
                    res.on('data', function(data_) { data += data_.toString(); });
                    res.on('end', function() {
                      let parsedXML = JSON.parse(xml2json(data))
                      let converted = convertTimetable(parsedXML)
                      //console.log(converted);
                      socket.send(JSON.stringify(converted))
                    });
                  }
            })  
        } else {
            socket.send(404)
        }
    }
    /*const fetchDeparturesHAFAS = () => {
        if(ibnr){
            client.departures(ibnr, {duration: 30})
            .then((dep)=>{
                socket.send(JSON.stringify(dep))
            })
            .catch((err)=>{
                socket.send(err)
            });
        } else{
            socket.send(404)
        }
    };*/

    fetchIRISDepartures();

    const interval = setInterval(fetchIRISDepartures, 3000)

    socket.on('message', (message) => {
        console.log('Received message:', message);
      });
    
      // Event handler for when a client disconnects from the WebSocket server
      socket.on('close', () => {
        console.log('Client disconnected');
        clearInterval(interval); // Clear the interval when client disconnects
      });
})