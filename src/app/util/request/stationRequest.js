import axios from 'axios';
import customURLEncode from '../util/customDecoding.js';
import iconv from 'iconv-lite'
import he from 'he'

export const stationRequest = (str) => new Promise((resolve) => {
    str = customURLEncode(decodeURIComponent(str));
    const reqURL = `https://reiseauskunft.bahn.de/bin/ajax-getstop.exe/dn?REQ0JourneyStopsS0A=7&REQ0JourneyStopsB=12&REQ0JourneyStopsS0G=${str}?&REQ0JourneyStopsS0a=131072&REQ0JourneyStopsS0o=8&js=true`;
    //log(reqURL)
    axios.get(reqURL, (res) => {
        const chunks = []
        if (res.statusCode >= 200 && res.statusCode < 400) {
            res.on('data', async function (data_) { chunks.push(data_) });
            return res.on('end', () => {
                const buffer = Buffer.concat(chunks)
                const body = iconv.decode(buffer, 'iso-8859-1')
                const utf8Body = iconv.encode(body, 'utf-8').toString();
                let convertedData = utf8Body.match('\{(.*?)\]}')[0];
                let decoded = he.decode(convertedData)
                resolve(JSON.parse(decoded));
            });
        }
    });

});