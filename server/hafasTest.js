import { createDbHafas } from "db-hafas";
import {inspect} from 'util'

const hafas = createDbHafas("dbm");

console.log(await hafas.tripsByName('89720'))

