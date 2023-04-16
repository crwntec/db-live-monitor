import {readFullStations} from 'db-stations'
import fs from 'fs';
import lodash from 'lodash';
var stations =[]

for await (const station of readFullStations()) {
    let newStation = lodash.pick(station, 'id', 'ril100', 'name', 'location', 'weight')
	stations.push(newStation)
}
var json = JSON.stringify(stations);
fs.writeFile('stations.json', json, 'utf8', ()=>{});