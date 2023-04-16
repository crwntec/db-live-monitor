import WebSocket from 'ws';
import { createClient } from "hafas-client";
import { profile as dbProfile} from "hafas-client/p/db/index.js";
import fs from 'fs'
const userAgent = "hafas-test";
const client = createClient(dbProfile, userAgent);

const server = new WebSocket.Server({port: 8080});

const ds100Pattern = /^[abdefhklmnrstuw]{1}[a-z]|[A-Z]{1,4}$/;
let rawdata = fs.readFileSync('stations.json');
let parsed = JSON.parse(rawdata)

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
    

    const fetchDepartures = () => {
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
    };

    fetchDepartures(ibnr);

    const interval = setInterval(fetchDepartures, 3000)

    socket.on('message', (message) => {
        console.log('Received message:', message);
      });
    
      // Event handler for when a client disconnects from the WebSocket server
      socket.on('close', () => {
        console.log('Client disconnected');
        clearInterval(interval); // Clear the interval when client disconnects
      });
})