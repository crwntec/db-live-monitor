import { createClient } from "hafas-client";
import { profile as dbProfile} from "hafas-client/p/db/index.js"
import moment from "moment/moment.js";

const userAgent = "hafas-test"

const client = createClient(dbProfile, userAgent)

const {departures,	realtimeDataUpdatedAt} = await client.departures('8000207');

departures.forEach(e => {
    const line = e.line.name;
    const dest = e.destination.name;
    const time = moment(Date.parse(e.when)).format('HH:mm');
    const delay = e.delay;
    console.log(line," nach ",dest,", Abfahrt:", time,"(+",delay / 60,")" );
});