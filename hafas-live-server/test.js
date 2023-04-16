import fs from 'fs'
let rawdata = fs.readFileSync('stations.json');
let parsed = JSON.parse(rawdata)

let selected = parsed.find(s => s.id == '8012273')
console.log(selected);