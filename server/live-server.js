import { WebSocketServer } from 'ws';
import { createClient } from "hafas-client";
import { xml2json } from 'xml-js'
import { profile as dbProfile} from "hafas-client/p/db/index.js";
import fs from 'fs'
import moment from 'moment/moment.js';
import https from 'https';
import { log } from 'console';
const userAgent = "hafas-test";
const client = createClient(dbProfile, userAgent);

const server = new WebSocketServer({ port: 8080 });

const ds100Pattern = /^[abdefhklmnrstuw]{1}[a-z]|[A-Z]{1,4}$/;
let rawdata = fs.readFileSync('stations.json');
let parsed = JSON.parse(rawdata)



const convertTimetable = (data, changes) => {
    const dataTimetable = data.elements[0];
    const changesTimetable = changes.elements[0];
    let newJSON = {"station": dataTimetable.attributes.station,"stops": []};
    let i = 0
    dataTimetable.elements = dataTimetable.elements.filter((element)=> {
        return element !== undefined;
    });
    changesTimetable.elements = changesTimetable.elements.filter((element)=> {
        return element !== undefined;
    });


    dataTimetable.elements.forEach(e => {
        i++
        const changes = changesTimetable.elements.find(o=>o.attributes.id == e.attributes.id)
        const messages = changes !== undefined ? changes.elements.filter(o=>o.name == 'm') : []
        const newArr = changes.elements.find(o=>o.name == 'ar')
        let hasNewArr = newArr !== undefined
        const newDep = changes.elements.find(o=>o.name == 'dp')
        let hasNewDep = newDep !== undefined
        const line = e.elements.find(o => o.name == 'tl');
        const arrival = e.elements.find(o => o.name == 'ar');
        let hasArrival = arrival !== undefined
        const departure = e.elements.find(o => o.name == 'dp');
        let hasDeparture = departure !==undefined
        const arrString = hasArrival ? arrival.attributes.pt : "-"
        const depString = hasDeparture ? departure.attributes.pt : "-"
        const newArrString = hasNewArr ? newArr.attributes.ct : arrString
        const newDepString = hasNewDep ? newDep.attributes.ct : depString
        const cat = line.attributes.f
        const lineString = cat=='F' ? line.attributes.n : hasArrival ? arrival.attributes.l : departure.attributes.l;
        newJSON.stops.push({
            "tripId": e.attributes.id,
            "hasArrival": hasArrival,
            "hasDeparture": hasDeparture,
            "when": newArrString  + "|" + newDepString,
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

    const fetchIRISDepartures = async () => {
        if (ibnr) {
            const date = moment(Date.now()).utcOffset(120).format("YYMMDD")
            const hour = moment(Date.now()).utcOffset(120).format("HH")
            const timetableUrl = `https://iris.noncd.db.de/iris-tts/timetable/plan/${ibnr}/${date}/${hour}`;
            const fchgUrl = `https://iris.noncd.db.de/iris-tts/timetable/fchg/${ibnr}/`;
            //log(timetableUrl)
            let parsedTimetable = await new Promise((resolve, reject) => {
                https.get(timetableUrl, (res)=>{
                    let data = '';
                    if (res.statusCode >= 200 && res.statusCode < 400) {
                        res.on('data', async function(data_) { data += data_.toString();});
                        return res.on('end', async function() {
                            resolve(JSON.parse(xml2json(data.toString())))
                        
                        });
                }
                })
            })
            let parsedFchg = await new Promise((resolve, reject) => {
                https.get(fchgUrl, (res)=>{
                    let data = '';
                    if (res.statusCode >= 200 && res.statusCode < 400) {
                        res.on('data', async function(data_) { data += data_.toString();});
                        return res.on('end', async function() {
                            resolve(JSON.parse(xml2json(data.toString())))
                        
                        });
                }
                })
            })
            let converted = convertTimetable(parsedTimetable, parsedFchg)
            socket.send(JSON.stringify(converted))
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