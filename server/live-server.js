import { WebSocketServer } from 'ws';
import { xml2json } from 'xml-js'
import stations from './stations.json' assert {type: 'json'};
import moment from 'moment/moment.js';
import https from 'https';
import http from 'http';
import express from 'express'
import cors from 'cors'
import { convertTimetable } from './convertTimetable.js';
import { stationRequest } from './stationRequest.js';

const app = express()
app.use(cors())
const server = http.createServer(app)

server.listen(8080,()=>console.log("running"))

const wss = new WebSocketServer({server: server, path:"/wss" });

const ds100Pattern = /^[abdefhklmnrstuw]{1}[a-z]|[A-Z]{1,4}$/;

let fullChanges = {}
const assignChanges = (changes) => fullChanges = changes

const stationSearch = (req, res) => {
    stationRequest(req.params.string).then(data=>{
        data = data.suggestions.filter(o=>parseInt(o.weight)>2000&&parseInt(o.extId)>8000000)
        res.send(data)
    })
}
app.get("/",(req,res)=>{
    res.redirect("/info")
})
app.get("/search/:string",(req,res)=> stationSearch(req,res))
app.get("/info", (req,res)=>{
    res.send(`Client Ip: ${req.ip}</br>
              Client Info: ${req.get('User-Agent')}</br>
              Time: ${Date.now().toString()}  
            `)
})

wss.on('connection', async (socket, req)=>{
    let ibnr;
    const assignIBNR = x => ibnr = x
    const getIBNR = stationStr => stationRequest(stationStr).then(data=> assignIBNR(parseInt(data.suggestions[0].extId)))

    let url = new URL(req.url, `http://${req.headers.host}`);
    let stationStr = url.searchParams.get("station");
    if(ds100Pattern.test(stationStr)){
        var station = stations.find(s => s.DS100 == stationStr)
        if (station){
            ibnr = station.EVA_NR
        } else {
            ibnr = null
        }
    } else {
        await getIBNR(stationStr)
    }

    const fetchIRISDepartures = async () => {
        if (ibnr) {
            const currentDate = moment(Date.now()).utcOffset(120).format("YYMMDD")
            const currentHour = moment(Date.now()).utcOffset(120).format("HH")
            const nextDate = moment(Date.now()).utcOffset(180).format("YYMMDD")
            const nextHour = moment(Date.now()).utcOffset(180).format("HH")
            const currentTimetableUrl = `https://iris.noncd.db.de/iris-tts/timetable/plan/${ibnr}/${currentDate}/${currentHour}`;
            const nextTimetableUrl = `https://iris.noncd.db.de/iris-tts/timetable/plan/${ibnr}/${nextDate}/${nextHour}`;
            const fchgUrl = `https://iris.noncd.db.de/iris-tts/timetable/fchg/${ibnr}/`;
            let parsedCurrentTimetable = await new Promise((resolve, reject) => {
                https.get(currentTimetableUrl, (res)=>{
                    let data = '';
                    if (res.statusCode >= 200 && res.statusCode < 400) {
                        res.on('data', async function(data_) { data += data_.toString();});
                        return res.on('end', async function() {
                            resolve(JSON.parse(xml2json(data.toString())))
                        
                        });
                }
                })
            })
            let parsedNextTimetable = await new Promise((resolve, reject) => {
                https.get(nextTimetableUrl, (res)=>{
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
            assignChanges(parsedFchg)
            let hasNextTimetable = parsedNextTimetable.elements[0].elements != undefined
            let converted = convertTimetable(parsedCurrentTimetable, hasNextTimetable ? parsedNextTimetable : null, parsedFchg, fullChanges)
            if(!converted){
                socket.send(404)
                return null
            }
            socket.send(JSON.stringify(converted))
            const currentTimetableStops = parsedCurrentTimetable.elements[0].elements;
            const nextTimetableStops = parsedNextTimetable.elements[0].elements;
            hasNextTimetable ? currentTimetableStops.push(nextTimetableStops.elements): {}
            return {attributes:parsedCurrentTimetable.elements[0].attributes,elements:currentTimetableStops}
        } else {
            socket.send(404)
            return null
        }
    }
    var timetable = {}
    let flag = false
    fetchIRISDepartures().then((res)=>{
        timetable = res
        flag = timetable!=null
    })
    const fetchChanges = async () => {
        if (ibnr && flag) {
            const rchgUrl = `https://iris.noncd.db.de/iris-tts/timetable/rchg/${ibnr}/`;
            let parsedRchg = await new Promise((resolve, reject) => {
                https.get(rchgUrl, (res)=>{
                    let data = '';
                    if (res.statusCode >= 200 && res.statusCode < 400) {
                        res.on('data', async function(data_) { data += data_.toString();});
                        return res.on('end', async function() {
                            resolve(JSON.parse(xml2json(data.toString())))
                        
                        });
                }
                })
            })
            if(fullChanges == {}){
                socket.send(500)
            } else {
                let converted = convertTimetable(timetable, null, parsedRchg, fullChanges)
                socket.send(JSON.stringify(converted))
                setTimeout(fetchChanges, 3000)
            }
        } else {
            socket.send(404)
        }
    }


    setTimeout(fetchChanges, 3000)

    socket.on('message', (message) => {
        console.log('Received message:', message);
      });
    
      socket.on('close', () => {
        timetable = {}
        fullChanges = {}
      });
})