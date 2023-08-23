import { createDbHafas } from "db-hafas";
import {inspect} from 'util'

const hafas = createDbHafas("dbm");

const journeys = await hafas.departures("8000207", {
  remarks: true,
  duration: 60,
  products: {
    suburban: true,
    subway: false,
    tram: false,
    bus: false,
    ferry: false,
    express: false,
    regional: true,
  },
});
const leg = journeys.departures.find(o=>o.line.fahrtNr=='10810');
const trip = await hafas.trip(leg.tripId);
console.log(leg.tripId)