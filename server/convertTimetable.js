import moment from 'moment/moment.js';
import fs from 'fs';
import { log } from 'console';

let rawCats = fs.readFileSync('messageCategorys.json')
let parsedCats = JSON.parse(rawCats)



const messageLookup = (cat) => {
    return parsedCats.find(e=>e.cat==cat)
}
export const convertTimetable = (data1, data2, changes, fullChanges) => {
    //log(data1)
    let dataTimetable = {};
    if (data2) {
        dataTimetable = { attributes: data1.elements[0].attributes, elements: data1.elements[0].elements };
        data2.elements[0].elements.forEach(e => dataTimetable.elements.push(e));
    } else {
        dataTimetable = data1;
    }
    const changesTimetable = changes.elements[0];
    if (dataTimetable.attributes == undefined || changesTimetable.elements == undefined) {
        return;
    } let newJSON = { "station": dataTimetable.attributes.station, "stops": [] };
    let i = 0;
    dataTimetable.elements = dataTimetable.elements.filter((element) => {
        return element !== undefined;
    });
    changesTimetable.elements = changesTimetable.elements.filter((element) => {
        return element !== undefined;
    });
    dataTimetable.elements.forEach(e => {
        if (e.attributes == undefined) { log(e); }
        //i++
        const changes = changesTimetable.elements.find(o => o.attributes.id == e.attributes.id) == undefined ? fullChanges.elements[0].elements.find(o => o.attributes.id == e.attributes.id) : changesTimetable.elements.find(o => o.attributes.id == e.attributes.id);
        const himMessages = changes !== undefined ? changes.elements.filter(o => o.name == 'm') : [];

        let convertedMessages = [];
        let delayCauses = [];
        let qualityChanges = [];

        himMessages.forEach(e => {
            const attr = e.attributes;
            convertedMessages.push({
                id: attr.id,
                t: attr.t,
                from: attr.from,
                to: attr.to,
                cat: attr.cat,
                ts: attr.ts
            });
        });

        const newArr = changes !== undefined ? changes.elements.find(o => o.name == 'ar') : undefined;
        let hasNewArr = newArr !== undefined;
        let hasNewArrTime = newArr !== undefined && newArr.attributes !== undefined ? newArr.attributes.ct !== undefined : false;

        const newDep = changes !== undefined ? changes.elements.find(o => o.name == 'dp') : undefined;
        let hasNewDep = newDep !== undefined;
        let hasNewDepTime = newDep !== undefined ? newDep.attributes !== undefined : false;

        let currentStatus = "";
        let hasNewArrPlatform = false;
        let currentArrPlatform = "";
        let hasNewDepPlatform = false;
        let currentDepPlatform = "";

        if (hasNewArr && newArr.elements !== undefined) {
            newArr.elements.filter(e => e !== undefined).forEach(e => {
                var category = messageLookup(e.attributes.c);
                var messageObj = {
                    id: e.attributes.id,
                    cat: category ? category.cat : e.attributes.c, 
                    text: category ? category.text : "Unbekannt", 
                    timestamp: e.attributes.ts
                }
                if (e.attributes.t == 'd') {
                    category !== undefined ? delayCauses.push(messageObj) : {};
                } else if (e.attributes.t == 'q') {
                    var category = messageLookup(e.attributes.c);
                    category !== undefined ? qualityChanges.push(messageObj) : {}
                }
            });
            if (newArr.attributes !== undefined) {
                currentStatus = newArr.attributes.cs !== undefined ? newArr.attributes.cs : "";
                hasNewArrPlatform = newArr.attributes.cp !== undefined;
                currentArrPlatform = hasNewArrPlatform ? newArr.attributes.cp : "";
            }

        }
        if (hasNewDep && newDep.attributes !== undefined) {
            hasNewDepPlatform = newDep.attributes.cp !== undefined;
            currentDepPlatform = hasNewDepPlatform ? newDep.attributes.cp : "";

        }

        const line = e.elements.find(o => o.name == 'tl');

        const arrival = e.elements.find(o => o.name == 'ar');
        let hasArrival = arrival !== undefined;

        const departure = e.elements.find(o => o.name == 'dp');
        let hasDeparture = departure !== undefined;

        const arrString = hasArrival ? arrival.attributes.pt : "-";
        const depString = hasDeparture ? departure.attributes.pt : "-";

        const newArrString = hasNewArr && hasNewArrTime ? newArr.attributes.ct : arrString;
        const newDepString = hasNewDep && hasNewDepTime ? newDep.attributes.ct : depString;

        const arPath = hasArrival ? arrival.attributes.ppth.split('|') : "";
        const plannedPath = hasDeparture ? departure.attributes.ppth.split('|') : [];
        let currentPath = hasNewDep && newDep.attributes !== undefined && hasDeparture ? departure.attributes.ppth != undefined ? departure.attributes.ppth.split('|') : [] : [];

        const onlyPlanData = currentPath.length == 0 && hasDeparture;

        const removedStops = onlyPlanData ? [] : plannedPath.filter(stop => !currentPath.includes(stop));
        const additionalStops = onlyPlanData ? [] : currentPath.filter(stop => !plannedPath.includes(stop));

        const cat = line.attributes.f;

        const hasLineName = (hasArrival ? arrival.attributes.l : departure.attributes.l) != undefined
        const lineString = cat == 'F' || !hasLineName ? line.attributes.n : hasArrival ? arrival.attributes.l : departure.attributes.l;

        delayCauses = delayCauses.sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp));
        qualityChanges = qualityChanges.sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp));
        


        newJSON.stops.push({
            "tripId": e.attributes.id,
            "himMessages": convertedMessages,
            "qualityChanges": qualityChanges,
            "hasArrival": hasArrival,
            "hasDeparture": hasDeparture,
            "hasNewArr": hasNewArr,
            "hasNewTime": hasNewArrTime ? newArr.attributes.ct != arrString : false,
            "when": newArrString + "|" + newDepString,
            "plannedWhen": arrString + "|" + depString,
            "cancelled": currentStatus == "c",
            "onlyPlanData": onlyPlanData,
            "causesOfDelay": delayCauses,
            "hasNewPlatform": hasNewArrPlatform || hasNewDepPlatform,
            "platform": hasArrival ? hasNewArrPlatform ? currentArrPlatform : arrival.attributes.pp : hasNewDepPlatform ? currentDepPlatform : departure.attributes.pp,
            "plannedPlatform": hasArrival ? arrival.attributes.pp : departure.attributes.pp,
            "arrivalPath": hasArrival ? arPath : [],
            "plannedPath": plannedPath,
            "currentPath": currentPath,
            "removedStops": removedStops,
            "additionalStops": additionalStops,
            "from":  hasArrival ? arPath.at([0]) : dataTimetable.attributes.station,
            "to": hasDeparture ? plannedPath.at(-1) : dataTimetable.attributes.station,
            "isEnding": !hasDeparture,
            "line": {
                "fahrtNr": line.attributes.n,
                "name": line.attributes.c + " " + lineString,
                "productName": line.attributes.c,
                "operator": line.attributes.o
            }
        });
    });
    const timestamp = moment(Date.now()).utcOffset(120).format("YYMMDD") + moment(Date.now()).utcOffset(120).format("HHmm");
    newJSON.stops = newJSON.stops.filter(e => parseInt(e.hasDeparture ? e.when.split('|')[1] : e.when.split('|')[0]) - parseInt(timestamp) > 0);
    newJSON.stops = newJSON.stops.sort((a, b) => parseInt(a.hasDeparture ? a.when.split('|')[1] : a.when.split('|')[0]) - parseInt(b.hasDeparture ? b.when.split('|')[1] : b.when.split('|')[0]));
    //fullChanges = changesTimetable;
    return (newJSON);
};
