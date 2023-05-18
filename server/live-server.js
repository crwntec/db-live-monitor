import { WebSocketServer } from 'ws';
import { xml2json } from 'xml-js'
import fs from 'fs'
import moment from 'moment/moment.js';
import https from 'https';
import { log } from 'console';

const server = new WebSocketServer({ port: 8080 });

const ds100Pattern = /^[abdefhklmnrstuw]{1}[a-z]|[A-Z]{1,4}$/;
let rawdata = fs.readFileSync('stations.json');
let parsed = JSON.parse(rawdata)

let rawCats = fs.readFileSync('messageCategorys.json')
let parsedCats = JSON.parse(rawCats)

var lastChanges = {}

const assignChanges = (changes) => lastChanges = changes

const messageLookup = (cat) => {
    return parsedCats.find(e=>e.cat==cat)
}

const convertTimetable = (data1, data2, changes) => {
    //log(data1)
    let dataTimetable = {};
    if (data2) {
        dataTimetable = {attributes:data1.elements[0].attributes,elements:data1.elements[0].elements}
        data2.elements[0].elements.forEach(e=>dataTimetable.elements.push(e))
    } else {
        dataTimetable = data1
    }
    const changesTimetable = changes.elements[0];
    if(dataTimetable.attributes == undefined || changesTimetable.elements == undefined){
        return
    }let newJSON = {"station": dataTimetable.attributes.station,"stops": []};
    let i = 0
    dataTimetable.elements = dataTimetable.elements.filter((element)=> {
        return element !== undefined;
    });
    changesTimetable.elements = changesTimetable.elements.filter((element)=> {
        return element !== undefined;
    });
    dataTimetable.elements.forEach(e => {
        if (e.attributes == undefined){log(e)}
        //i++

        const changes = changesTimetable.elements.find(o=>o.attributes.id == e.attributes.id) == undefined ? lastChanges.elements[0].elements.find(o=>o.attributes.id == e.attributes.id) : changesTimetable.elements.find(o=>o.attributes.id == e.attributes.id)
        const himMessages = changes !== undefined ? changes.elements.filter(o=>o.name == 'm') : []
        
        let convertedMessages = []
        let delayCauses = []
        let qualityChanges = []

        himMessages.forEach(e=>{
            const attr = e.attributes
            convertedMessages.push({
                id: attr.id,
                t: attr.t,
                from: attr.from,
                to: attr.to,
                cat: attr.cat,
                ts: attr.ts
            })
        })

        const newArr = changes !== undefined ? changes.elements.find(o=>o.name == 'ar') : undefined
        let hasNewArr = newArr !== undefined
        let hasNewArrTime = newArr !== undefined && newArr.attributes !== undefined ? newArr.attributes.ct !== undefined : false

        const newDep = changes !== undefined ? changes.elements.find(o=>o.name == 'dp') : undefined
        let hasNewDep = newDep !== undefined
        let hasNewDepTime = newDep !== undefined ? newDep.attributes !== undefined : false

        let currentStatus = ""
        let hasNewArrPlatform = false
        let currentArrPlatform = ""
        let hasNewDepPlatform = false
        let currentDepPlatform = ""
        
        if(hasNewArr && newArr.elements !== undefined){
            newArr.elements.filter(e=>e!==undefined).forEach(e=>{
                if(e.attributes.t=='d'){
                    var category = messageLookup(e.attributes.c)
                    category !== undefined ? delayCauses.push({id:e.attributes.id,cat:category.cat,text:category.text,timestamp:e.attributes.ts}) : {}
                } else if(e.attributes.t=='q'){
                    qualityChanges.push(e.attributes)
                }
            })
            currentStatus = newArr.attributes.cs !== undefined ? newArr.attributes.cs : ""
            hasNewArrPlatform = newArr.attributes.cp !== undefined
            currentArrPlatform = hasNewArrPlatform ? newArr.attributes.cp : ""
            
        }
        if(hasNewDep && newDep.attributes !== undefined){
            hasNewDepPlatform = newDep.attributes.cp !== undefined
            currentDepPlatform = hasNewDepPlatform ? newDep.attributes.cp : ""
            
        }

        const line = e.elements.find(o => o.name == 'tl');

        const arrival = e.elements.find(o => o.name == 'ar');
        let hasArrival = arrival !== undefined

        const departure = e.elements.find(o => o.name == 'dp');
        let hasDeparture = departure !==undefined

        const arrString = hasArrival ? arrival.attributes.pt : "-"
        const depString = hasDeparture ? departure.attributes.pt : "-"

        const newArrString = hasNewArr && hasNewArrTime ? newArr.attributes.ct : arrString
        const newDepString = hasNewDep && hasNewDepTime ? newDep.attributes.ct : depString

        const arPath = hasArrival ? arrival.attributes.ppth.split('|') : ""
        const plannedPath = hasDeparture ? departure.attributes.ppth.split('|') : [];
        let currentPath = hasNewDep && newDep.attributes !== undefined ? departure.attributes.ppth != undefined ?  departure.attributes.ppth.split('|') : [] : [];

        const removedStops = plannedPath.filter(stop=>!currentPath.includes(stop))
        const additionalStops = currentPath.filter(stop=>!plannedPath.includes(stop))

        const cat = line.attributes.f

        const lineString = cat=='F' ? line.attributes.n : hasArrival ? arrival.attributes.l : departure.attributes.l;

        delayCauses = delayCauses.sort((a,b)=> parseInt(a.timestamp) - parseInt(b.timestamp))
        qualityChanges = qualityChanges.sort((a,b)=> parseInt(a.timestamp) - parseInt(b.timestamp))

        

        newJSON.stops.push({
            "tripId": e.attributes.id,
            "himMessages": convertedMessages,
            "qualityChanges": qualityChanges,
            "hasArrival": hasArrival,
            "hasDeparture": hasDeparture,
            "hasNewArr": hasNewArr,
            "hasNewTime": hasNewArrTime ? newArr.attributes.ct != arrString : false,
            "when": newArrString  + "|" + newDepString,
            "plannedWhen": arrString + "|" + depString,
            "cancelled": currentStatus == "c",
            "causesOfDelay": delayCauses,
            "hasNewPlatform": hasNewArrPlatform || hasNewDepPlatform,
            "platform": hasArrival ? hasNewArrPlatform ? currentArrPlatform : arrival.attributes.pp : hasNewDepPlatform ? currentDepPlatform : departure.attributes.pp,
            "plannedPlatform": hasArrival ? arrival.attributes.pp : departure.attributes.pp,
            "plannedPath": plannedPath,
            "currentPath": currentPath,
            "removedStops": removedStops,
            "additionalStops": additionalStops,
            "direction": hasDeparture ? plannedPath.at(-1) : hasArrival ? "von " + arPath.at([0]) : {},
            "isEnding": !hasDeparture,
            "line": {
                "fahrtNr": line.attributes.n,
                "name": line.attributes.c + lineString,
                "productName": line.attributes.c,
                "operator": line.attributes.o
    
            }
        })
    })
    const timestamp = moment(Date.now()).utcOffset(120).format("YYMMDD") + moment(Date.now()).utcOffset(120).format("HHmm")
    newJSON.stops= newJSON.stops.filter(e=>parseInt(e.hasDeparture ? e.when.split('|')[1] : e.when.split('|')[0]) - parseInt(timestamp) > 0)
    newJSON.stops = newJSON.stops.sort((a,b)=> parseInt(a.hasDeparture ? a.plannedWhen.split('|')[1]: a.plannedWhen.split('|')[0]) - parseInt(b.hasDeparture ? b.plannedWhen.split('|')[1]: b.plannedWhen.split('|')[0]))
    //lastChanges = changesTimetable;
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
            let converted = convertTimetable(parsedCurrentTimetable, parsedNextTimetable, parsedFchg)
            socket.send(JSON.stringify(converted))
            const currentTimetableStops = parsedCurrentTimetable.elements[0].elements;
            const nextTimetableStops = parsedNextTimetable.elements[0].elements;
            currentTimetableStops.push(nextTimetableStops.elements)
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
        flag = true
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
            // log(timetable)
            let converted = convertTimetable(timetable, null, parsedRchg)
            socket.send(JSON.stringify(converted))
            setTimeout(fetchChanges, 3000)
        } else {
            socket.send(404)
        }
    }


    setTimeout(fetchChanges, 3000)

    socket.on('message', (message) => {
        console.log('Received message:', message);
      });
    
      // Event handler for when a client disconnects from the WebSocket server
      socket.on('close', () => {
        timetable = {}
        lastChanges = {}
        console.log('Client disconnected');
      });
})